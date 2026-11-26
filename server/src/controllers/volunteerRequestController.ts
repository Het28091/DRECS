import { canOfferHelp } from "../utils/incidentPolicy";
import { Response } from "express";
import { Types } from "mongoose";
import {
  VolunteerRequest,
  IVolunteerRequestDocument,
} from "../models/VolunteerRequest";
import { Incident } from "../models/Incident";
import { Assignment } from "../models/Assignment";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { dispatchNotification, dispatchNotificationToRoles } from "../socket";

const formatUserRef = (
  value: unknown,
): { id: string; name: string; email?: string; role?: string } | string => {
  const ref = value as
    | {
        _id: { toString(): string };
        name?: string;
        email?: string;
        role?: string;
      }
    | undefined;

  if (ref && typeof ref === "object" && "_id" in ref && ref.name) {
    return {
      id: ref._id.toString(),
      name: ref.name,
      email: ref.email,
      role: ref.role,
    };
  }

  if (ref && typeof ref === "object" && "_id" in ref) {
    return ref._id.toString();
  }

  return String(value ?? "");
};

const formatIncidentRef = (
  value: unknown,
): { id: string; title?: string } | string => {
  const ref = value as
    | { _id: { toString(): string }; title?: string }
    | undefined;

  if (ref && typeof ref === "object" && "_id" in ref && ref.title) {
    return {
      id: ref._id.toString(),
      title: ref.title,
    };
  }

  if (ref && typeof ref === "object" && "_id" in ref) {
    return ref._id.toString();
  }

  return String(value ?? "");
};

const formatVolunteerRequest = (
  request: IVolunteerRequestDocument,
  options: { includeReviewDetails?: boolean } = {},
) => ({
  id: request._id.toString(),
  userId: formatUserRef(request.userId),
  incidentId: formatIncidentRef(request.incidentId),
  skills: request.skills ?? [],
  experience: request.experience ?? "",
  message: request.message ?? "",
  phoneNumber: request.phoneNumber ?? "",
  status: request.status,
  availability: request.availability || "",
  incidentStatus: (request.incidentId as any).status,
  incidentApproval: (request.incidentId as any).approvalStatus,
  ...(options.includeReviewDetails && {
    reviewedBy: request.reviewedBy ? formatUserRef(request.reviewedBy) : null,
    reviewedAt: request.reviewedAt ?? null,
  }),
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const populateVolunteerRequest = async (request: IVolunteerRequestDocument) => {
  await request.populate([
    { path: "userId", select: "name email role" },
    {
      path: "incidentId",
      select: "title category severity status approvalStatus",
    },
    { path: "reviewedBy", select: "name email role" },
  ]);
  return request;
};

/**
 * @desc    Citizen offers help for a specific incident
 * @route   POST /api/incidents/:id/volunteer-request
 * @access  Authenticated citizen
 */
export const createVolunteerRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id))
      throw createError("Invalid incident ID", 400);
    const request = await Incident.db.transaction(async (session) => {
      const incident = await Incident.findById(req.params.id).session(session);
      if (!canOfferHelp(incident))
        throw createError("This incident is not accepting help offers", 409);
      if (
        await VolunteerRequest.exists({
          incidentId: req.params.id,
          userId: req.user!.id,
          status: { $in: ["PENDING", "APPROVED"] },
        }).session(session)
      )
        throw createError(
          "You already offered help. Update your existing offer instead.",
          409,
        );
      const [offer] = await VolunteerRequest.create(
        [
          {
            ...req.body,
            incidentId: incident!._id,
            userId: req.user!.id,
            status: "APPROVED",
          },
        ],
        { session },
      );
      incident!.updatedAt = new Date();
      await incident!.save({ session });
      return offer;
    });
    await dispatchNotificationToRoles({
      roles: ["authority", "admin"],
      title: "New help offer",
      message: "A person has shared their availability to help.",
      type: "VOLUNTEER_REQUEST",
      link: "/incidents/" + req.params.id,
    });
    await populateVolunteerRequest(request);
    res
      .status(201)
      .json({ success: true, request: formatVolunteerRequest(request) });
  },
);

export const updateOwnOffer = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id))
      throw createError("Invalid offer ID", 400);
    const request = await Incident.db.transaction(async (session) => {
      const offer = await VolunteerRequest.findOne({
        _id: req.params.id,
        userId: req.user!.id,
      }).session(session);
      if (!offer) throw createError("Offer not found", 404);
      if (!["PENDING", "APPROVED"].includes(offer.status))
        throw createError("This offer is no longer active", 409);
      const incident = await Incident.findById(offer.incidentId).session(
        session,
      );
      if (!canOfferHelp(incident))
        throw createError(
          "This incident is no longer accepting offer changes",
          409,
        );
      Object.assign(offer, req.body);
      await offer.save({ session });
      incident!.updatedAt = new Date();
      await incident!.save({ session });
      return offer;
    });
    await dispatchNotificationToRoles({
      roles: ["authority", "admin"],
      title: "Help offer updated",
      message: "Availability or contact details have changed.",
      type: "VOLUNTEER_REQUEST",
      link: "/incidents/" + request.incidentId,
    });
    await populateVolunteerRequest(request);
    res.json({ success: true, request: formatVolunteerRequest(request) });
  },
);

/**
 * @desc    List volunteer requests for an incident (authority review)
 * @route   GET /api/incidents/:id/volunteer-requests
 * @access  Authority / Admin
 */
export const getVolunteerRequestsByIncident = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const incidentId = req.params.id;

    if (!Types.ObjectId.isValid(incidentId)) {
      throw createError("Invalid incident ID", 400);
    }

    const incident = await Incident.findById(incidentId).select("_id");
    if (!incident) {
      throw createError("Incident not found", 404);
    }

    const requests = await VolunteerRequest.find({ incidentId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email role")
      .populate("incidentId", "title category severity status approvalStatus")
      .populate("reviewedBy", "name email role");

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((request) =>
        formatVolunteerRequest(request, { includeReviewDetails: true }),
      ),
    });
  },
);

/**
 * @desc    List all volunteer requests across incidents (centralized management)
 * @route   GET /api/volunteer-requests
 * @access  Authority / Admin
 */
export const getAllVolunteerRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filter: Record<string, unknown> = {};

    if (typeof req.query.status === "string" && req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await VolunteerRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email role")
      .populate("incidentId", "title category severity status approvalStatus")
      .populate("reviewedBy", "name email role");

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((request) =>
        formatVolunteerRequest(request, { includeReviewDetails: true }),
      ),
    });
  },
);

/**
 * @desc    List the current user's own volunteer requests
 * @route   GET /api/volunteer-requests/my?incidentId=
 * @access  Authenticated citizen
 */
export const getMyVolunteerRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError("Unauthorized — Authentication required", 401);
    }

    const filter: Record<string, unknown> = { userId: req.user.id };

    if (typeof req.query.incidentId === "string" && req.query.incidentId) {
      if (!Types.ObjectId.isValid(req.query.incidentId)) {
        throw createError("Invalid incident ID", 400);
      }
      filter.incidentId = req.query.incidentId;
    }

    const requests = await VolunteerRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email role")
      .populate("incidentId", "title category severity status approvalStatus")
      .populate("reviewedBy", "name email role");

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((request) => formatVolunteerRequest(request)),
    });
  },
);
