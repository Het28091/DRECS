import { Response } from 'express';
import { Types } from 'mongoose';
import { Assignment, ASSIGNMENT_STATUSES, IAssignmentDocument } from '../models/Assignment';
import { Incident } from '../models/Incident';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { dispatchNotificationToRoles } from '../socket';

const formatUser = (value: unknown) => {
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

const formatIncidentSummary = (value: unknown) => {
  const ref = value as
    | {
        _id: { toString(): string };
        title?: string;
        category?: string;
        severity?: string;
        status?: string;
        location?: { latitude: number; longitude: number; address?: string };
      }
    | undefined;

  if (ref && typeof ref === 'object' && '_id' in ref && ref.title) {
    return {
      id: ref._id.toString(),
      title: ref.title,
      category: ref.category,
      severity: ref.severity,
      status: ref.status,
      location: ref.location,
    };
  }

  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }

  return String(value ?? '');
};

export const formatAssignment = (assignment: IAssignmentDocument) => ({
  id: assignment._id.toString(),
  incidentId: formatIncidentSummary(assignment.incidentId),
  volunteerId: formatUser(assignment.volunteerId),
  status: assignment.status,

  assignedAt: assignment.assignedAt,
  completedAt: assignment.completedAt ?? null,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt,
});

const populateAssignment = async (assignment: IAssignmentDocument) => {
  await assignment.populate([
    { path: 'volunteerId', select: 'name email role' },
    {
      path: 'incidentId',
      select: 'title category severity status location description',
    },
  ]);
  return assignment;
};

/**
 * @desc    Assign a volunteer to an incident
 * @route   POST /api/incidents/:id/assign
 * @access  Authority / Admin
 */
export const assignVolunteerToIncident = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    const incidentId = req.params.id;
    const { volunteerId } = req.body;

    if (!Types.ObjectId.isValid(incidentId)) {
      throw createError('Invalid incident ID', 400);
    }
    if (!Types.ObjectId.isValid(volunteerId)) {
      throw createError('Invalid volunteer ID', 400);
    }

    const incident = await Incident.findById(incidentId);
    if (!incident) {
      throw createError('Incident not found', 404);
    }

    const volunteer = await User.findById(volunteerId);
    if (!volunteer) {
      throw createError('User not found', 400);
    }
    if (!volunteer.isActive) {
      throw createError('Cannot assign an inactive user', 400);
    }

    const existing = await Assignment.findOne({ incidentId, volunteerId });
    if (existing) {
      throw createError('This volunteer is already assigned to this incident', 400);
    }

    const assignment = await Assignment.create({
      incidentId,
      volunteerId,
      status: 'ASSIGNED',
      assignedAt: new Date(),
    });

    // Move incident into ASSIGNED if still in REPORTED or UNDER_REVIEW
    if (incident.status === 'REPORTED' || incident.status === 'UNDER_REVIEW') {
      incident.status = 'ASSIGNED';
      incident.statusHistory.push({
        status: 'ASSIGNED',
        changedBy: new Types.ObjectId(req.user.id),
        changedAt: new Date(),
        note: 'Response team assigned',
      });
      await incident.save();
    }

    await populateAssignment(assignment);

    res.status(201).json({
      success: true,
      message: 'Volunteer assigned successfully',
      assignment: formatAssignment(assignment),
    });
  },
);

/**
 * @desc    List assignments for an incident
 * @route   GET /api/assignments/incident/:incidentId
 * @access  Authority / Admin
 */
export const getAssignmentsByIncident = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { incidentId } = req.params;

    if (!Types.ObjectId.isValid(incidentId)) {
      throw createError('Invalid incident ID', 400);
    }

    const incident = await Incident.findById(incidentId).select('_id');
    if (!incident) {
      throw createError('Incident not found', 404);
    }

    const assignments = await Assignment.find({ incidentId })
      .sort({ assignedAt: -1 })
      .populate('volunteerId', 'name email role')
      .populate('incidentId', 'title category severity status location description');

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments: assignments.map(formatAssignment),
    });
  },
);

/**
 * @desc    List assignments for the logged-in volunteer
 * @route   GET /api/assignments/my
 * @access  Volunteer / Citizen assigned to task
 */
export const getMyAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const assignments = await Assignment.find({ volunteerId: req.user.id })
    .sort({ assignedAt: -1 })
    .populate('volunteerId', 'name email role')
    .populate('incidentId', 'title category severity status location description');

  res.status(200).json({
    success: true,
    count: assignments.length,
    assignments: assignments.map(formatAssignment),
  });
});

/**
 * @desc    Volunteer capability check — does the current user have volunteer access?
 *          A user has volunteer capability if their role is 'volunteer' OR they have
 *          at least one assignment.
 * @route   GET /api/assignments/my/access
 * @access  Authenticated
 */
export const getMyVolunteerAccess = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const pendingAssignmentCount = await Assignment.countDocuments({
    volunteerId: req.user.id,
    status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
  });

  const totalAssignmentCount = await Assignment.countDocuments({
    volunteerId: req.user.id,
  });

  const hasVolunteerCapability =
    req.user.role === 'volunteer' || totalAssignmentCount > 0;

  res.status(200).json({
    success: true,
    hasVolunteerCapability,
    activeAssignmentCount: pendingAssignmentCount,
    totalAssignmentCount,
  });
});

/**
 * @desc    Update assignment status (own assignment only)
 * @route   PATCH /api/assignments/:id/status
 * @access  Authenticated (assignment owner)
 */
export const updateAssignmentStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    const { status } = req.body;

    if (!ASSIGNMENT_STATUSES.includes(status)) {
      throw createError('Invalid assignment status', 400);
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      throw createError('Invalid assignment ID', 400);
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    if (assignment.volunteerId.toString() !== req.user.id) {
      throw createError('Forbidden — You can only update your own assignments', 403);
    }

    // Enforce sequential lifecycle: ASSIGNED -> ACCEPTED -> IN_PROGRESS -> COMPLETED
    const SEQUENCE: Record<string, string[]> = {
      ASSIGNED: ['ACCEPTED'],
      ACCEPTED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: [],
    };
    const allowedNext = SEQUENCE[assignment.status] ?? [];
    if (!allowedNext.includes(status)) {
      throw createError(
        `Invalid assignment transition from ${assignment.status} to ${status}`,
        400,
      );
    }

    // Completing an assignment must NOT auto-resolve the incident.
    // The authority decides when the incident becomes RESOLVED.
    assignment.status = status;
    if (status === 'COMPLETED') {
      assignment.completedAt = new Date();
    } else {
      assignment.completedAt = null;
    }

    await assignment.save();
    await populateAssignment(assignment);

    // Notify authorities about responder status updates
    const volunteerName =
      typeof assignment.volunteerId === 'object' && 'name' in assignment.volunteerId
        ? (assignment.volunteerId as any).name
        : 'Responder';

    const incidentTitle =
      typeof assignment.incidentId === 'object' && 'title' in assignment.incidentId
        ? (assignment.incidentId as any).title
        : 'Incident';

    await dispatchNotificationToRoles({
      roles: ['authority', 'admin'],
      title: 'Responder Task Update',
      message: `${volunteerName} updated assignment task status to ${status.replace(/_/g, ' ')} for "${incidentTitle}".`,
      type: 'ASSIGNMENT_UPDATE',
      link: `/incidents/${typeof assignment.incidentId === 'object' ? (assignment.incidentId as any)._id : assignment.incidentId}`,
    });

    res.status(200).json({
      success: true,
      message: 'Assignment status updated successfully',
      assignment: formatAssignment(assignment),
    });
  },
);

/**
 * @desc    Remove an assignment for an incident
 * @route   DELETE /api/assignments/:id
 * @access  Authority / Admin
 *
 * Removes the Assignment document but does NOT delete the associated
 * VolunteerRequest (preserving request history).
 */
export const removeAssignment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      throw createError('Invalid assignment ID', 400);
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment removed successfully',
    });
  },
);

/**
 * @desc    List volunteer users (for assignment dropdown)
 * @route   GET /api/volunteers
 * @access  Authority / Admin
 */
export const getAllVolunteers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const volunteers = await User.find({ isActive: true })
    .select('name email role isActive createdAt')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: volunteers.length,
    volunteers: volunteers.map((v) => ({
      id: v._id.toString(),
      name: v.name,
      email: v.email,
      role: v.role,
      isActive: v.isActive,
      createdAt: v.createdAt,
    })),
  });
});
