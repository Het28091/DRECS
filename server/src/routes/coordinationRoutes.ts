import { Assignment } from "../models/Assignment";
import { Router } from "express";
import { Types, ClientSession } from "mongoose";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../middleware/errorHandler";
import { validateBody, plainText, objectIdSchema } from "../utils/validators";
import { Incident } from "../models/Incident";
import { VolunteerRequest } from "../models/VolunteerRequest";
import { CoordinationMessage } from "../models/CoordinationMessage";
import { dispatchNotification, dispatchNotificationToRoles } from "../socket";
const manager = (req: AuthRequest) =>
  ["authority", "admin"].includes(req.user!.role);
async function thread(
  req: AuthRequest,
  person: unknown,
  session?: ClientSession,
) {
  if (!Types.ObjectId.isValid(req.params.id))
    throw createError("Invalid incident ID", 400);
  const incident = await Incident.findById(req.params.id).session(
    session || null,
  );
  if (!incident) throw createError("Incident not found", 404);
  const personId = manager(req)
    ? String(person || incident.reportedBy)
    : req.user!.id;
  if (!Types.ObjectId.isValid(personId))
    throw createError("Invalid contact", 400);
  if (!manager(req) && person && String(person) !== req.user!.id)
    throw createError("This conversation is private", 403);
  const reporter = String(incident.reportedBy) === personId;
  const offer = reporter
    ? null
    : await VolunteerRequest.findOne({
        incidentId: incident._id,
        userId: personId,
      }).session(session || null);
  const legacy =
    !reporter && !offer
      ? await Assignment.exists({
          incidentId: incident._id,
          volunteerId: personId,
        }).session(session || null)
      : null;
  if (!reporter && !offer && !legacy)
    throw createError("No conversation available for this person", 403);
  return { incident, personId };
}
export const listCoordination = asyncHandler(async (req: AuthRequest, res) => {
  const { incident, personId } = await thread(req, req.query.person);
  const messages = await CoordinationMessage.find({
    incidentId: incident._id,
    personId,
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(100)
    .populate("senderId", "name role")
    .lean();
  res.json({
    messages: messages.reverse(),
    readOnly:
      ["RESOLVED", "CLOSED"].includes(incident.status) ||
      incident.approvalStatus === "REJECTED",
  });
});
export const sendCoordination = asyncHandler(async (req: AuthRequest, res) => {
  const { text, requestKey, personId } = req.body;
  const result = await Incident.db.transaction(async (session) => {
    const { incident, personId: owner } = await thread(req, personId, session);
    const old = await CoordinationMessage.findOne({
      senderId: req.user!.id,
      requestKey,
    }).session(session);
    if (old) {
      if (
        String(old.incidentId) !== String(incident._id) ||
        String(old.personId) !== owner ||
        old.text !== text
      )
        throw createError("Retry key already used", 409);
      return { message: old, owner, duplicate: true };
    }
    if (
      ["RESOLVED", "CLOSED"].includes(incident.status) ||
      incident.approvalStatus === "REJECTED"
    )
      throw createError("This conversation is read-only", 409);
    const [message] = await CoordinationMessage.create(
      [
        {
          incidentId: incident._id,
          personId: owner,
          senderId: req.user!.id,
          text,
          requestKey,
        },
      ],
      { session },
    );
    incident.updatedAt = new Date();
    await incident.save({ session });
    return { message, owner, duplicate: false };
  });
  if (!result.duplicate) {
    const data = {
      title: "New coordination message",
      message: "Open your private conversation for an update.",
      type: "INCIDENT_UPDATE" as const,
      link: "/incidents/" + req.params.id,
    };
    if (manager(req))
      await dispatchNotification({ ...data, recipientId: result.owner });
    else
      await dispatchNotificationToRoles({
        ...data,
        roles: ["authority", "admin"],
      });
  }
  res.status(result.duplicate ? 200 : 201).json({ message: result.message });
});
const router = Router({ mergeParams: true });
router.use(authenticate);
router.get("/", listCoordination);
router.post(
  "/",
  validateBody(
    z.object({
      text: plainText(1, 1200),
      requestKey: z.string().uuid(),
      personId: objectIdSchema.optional(),
    }),
  ),
  sendCoordination,
);
export default router;
