import { Response } from 'express';
import { Types } from 'mongoose';
import { VolunteerRequest, IVolunteerRequestDocument } from '../models/VolunteerRequest';
import { Incident } from '../models/Incident';
import { Assignment } from '../models/Assignment';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { dispatchNotification, dispatchNotificationToRoles } from '../socket';

const formatUserRef = (
  value: unknown,
): { id: string; name: string; email?: string; role?: string } | string => {
  const ref = value as
    | { _id: { toString(): string }; name?: string; email?: string; role?: string }
    | undefined;

  if (ref && typeof ref === 'object' && '_id' in ref && ref.name) {
    return {
      id: ref._id.toString(),
      name: ref.name,
      email: ref.email,
      role: ref.role,
    };
  }

  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }

  return String(value ?? '');
};

const formatIncidentRef = (value: unknown): { id: string; title?: string } | string => {
  const ref = value as
    | { _id: { toString(): string }; title?: string }
    | undefined;

  if (ref && typeof ref === 'object' && '_id' in ref && ref.title) {
    return {
      id: ref._id.toString(),
      title: ref.title,
    };
  }

  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }

  return String(value ?? '');
};

const formatVolunteerRequest = (
  request: IVolunteerRequestDocument,
  options: { includeReviewDetails?: boolean } = {},
) => ({
  id: request._id.toString(),
  userId: formatUserRef(request.userId),
  incidentId: formatIncidentRef(request.incidentId),
  skills: request.skills ?? [],
  experience: request.experience ?? '',
  message: request.message ?? '',
  phoneNumber: request.phoneNumber ?? '',
  status: request.status,
  ...(options.includeReviewDetails && {
    reviewedBy: request.reviewedBy ? formatUserRef(request.reviewedBy) : null,
    reviewedAt: request.reviewedAt ?? null,
  }),
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const populateVolunteerRequest = async (request: IVolunteerRequestDocument) => {
  await request.populate([
    { path: 'userId', select: 'name email role' },
    { path: 'incidentId', select: 'title category severity status' },
    { path: 'reviewedBy', select: 'name email role' },
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
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    const incidentId = req.params.id;
    const { skills, experience, message, phoneNumber } = req.body;

    if (!Types.ObjectId.isValid(incidentId)) {
      throw createError('Invalid incident ID', 400);
    }

    const incident = await Incident.findById(incidentId);
    if (!incident) {
      throw createError('Incident not found', 404);
    }

    if (incident.status !== 'REPORTED' && incident.status !== 'UNDER_REVIEW') {
      throw createError(
        'Volunteer offers are no longer being accepted for this incident',
        400,
      );
    }

    const existing = await VolunteerRequest.findOne({
      incidentId,
      userId: req.user.id,
      status: { $in: ['PENDING', 'APPROVED'] },
    });
    if (existing) {
      throw createError(
        'You already have a pending or approved volunteer request for this incident',
        400,
      );
    }

    const request = await VolunteerRequest.create({
      userId: req.user.id,
      incidentId,
      skills: skills ?? [],
      experience: experience ?? '',
      message: message ?? '',
      phoneNumber: phoneNumber ?? '',
      status: 'PENDING',
    });

    await populateVolunteerRequest(request);

    // Notify Authorities
    await dispatchNotificationToRoles({
      roles: ['authority', 'admin'],
      title: 'New Volunteer Offer',
      message: `A citizen offered to assist on incident "${incident.title}".`,
      type: 'VOLUNTEER_REQUEST',
      link: `/volunteer-requests`,
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer request submitted successfully',
      request: formatVolunteerRequest(request),
    });
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
      throw createError('Invalid incident ID', 400);
    }

    const incident = await Incident.findById(incidentId).select('_id');
    if (!incident) {
      throw createError('Incident not found', 404);
    }

    const requests = await VolunteerRequest.find({ incidentId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role')
      .populate('incidentId', 'title category severity status')
      .populate('reviewedBy', 'name email role');

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

    if (typeof req.query.status === 'string' && req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await VolunteerRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role')
      .populate('incidentId', 'title category severity status')
      .populate('reviewedBy', 'name email role');

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
      throw createError('Unauthorized — Authentication required', 401);
    }

    const filter: Record<string, unknown> = { userId: req.user.id };

    if (typeof req.query.incidentId === 'string' && req.query.incidentId) {
      if (!Types.ObjectId.isValid(req.query.incidentId)) {
        throw createError('Invalid incident ID', 400);
      }
      filter.incidentId = req.query.incidentId;
    }

    const requests = await VolunteerRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role')
      .populate('incidentId', 'title category severity status')
      .populate('reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((request) => formatVolunteerRequest(request)),
    });
  },
);

/**
 * @desc    Review (approve/reject) a volunteer request
 * @route   PATCH /api/volunteer-requests/:id/status
 * @access  Authority / Admin
 */
export const reviewVolunteerRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    const { status } = req.body;

    if (!Types.ObjectId.isValid(req.params.id)) {
      throw createError('Invalid volunteer request ID', 400);
    }

    const request = await VolunteerRequest.findById(req.params.id);
    if (!request) {
      throw createError('Volunteer request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw createError('Only pending requests can be reviewed', 400);
    }

    request.status = status;
    request.reviewedBy = new Types.ObjectId(req.user.id);
    request.reviewedAt = new Date();

    if (status === 'APPROVED') {
      const existingAssignment = await Assignment.findOne({
        incidentId: request.incidentId,
        volunteerId: request.userId,
      });
      if (existingAssignment) {
        throw createError(
          'This citizen is already assigned to this incident',
          400,
        );
      }

      await request.save();

      await Assignment.create({
        incidentId: request.incidentId,
        volunteerId: request.userId,
        volunteerRequestId: request._id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      });

      // Transition incident status to ASSIGNED ONLY if it was in early state
      const incident = await Incident.findById(request.incidentId);
      if (incident) {
        if (incident.status === 'REPORTED' || incident.status === 'UNDER_REVIEW') {
          incident.status = 'ASSIGNED';
          incident.statusHistory.push({
            status: 'ASSIGNED',
            changedBy: new Types.ObjectId(req.user.id),
            changedAt: new Date(),
            note: 'Response team assigned — volunteer offer approved',
          });
          await incident.save();
        }
      }

      // Notify citizen
      await dispatchNotification({
        recipientId: request.userId.toString(),
        title: 'Volunteer Offer Approved',
        message: 'Your volunteer offer has been approved! An assignment task has been created for you.',
        type: 'ASSIGNMENT_UPDATE',
        link: `/volunteers/tasks`,
      });
    } else {
      await request.save();

      // Notify citizen
      await dispatchNotification({
        recipientId: request.userId.toString(),
        title: 'Volunteer Offer Update',
        message: 'Your volunteer offer was reviewed and not accepted at this time.',
        type: 'VOLUNTEER_REQUEST',
        link: `/incidents/${request.incidentId}`,
      });
    }

    await populateVolunteerRequest(request);

    res.status(200).json({
      success: true,
      message:
        status === 'APPROVED'
          ? 'Volunteer request approved and assignment created'
          : 'Volunteer request rejected',
      request: formatVolunteerRequest(request),
    });
  },
);
