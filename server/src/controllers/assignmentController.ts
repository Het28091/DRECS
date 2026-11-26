import { canOfferHelp } from '../utils/incidentPolicy';
import { Response } from 'express';
import { Types } from 'mongoose';
import { Assignment, ASSIGNMENT_STATUSES, IAssignmentDocument } from '../models/Assignment';
import { Incident } from '../models/Incident';
import { VolunteerRequest } from '../models/VolunteerRequest';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { dispatchNotification, dispatchNotificationToRoles } from '../socket';

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
    .populate({ path: 'incidentId', select: 'title category severity status location description', match: { approvalStatus: 'APPROVED' } });

  res.status(200).json({
    success: true,
    count: assignments.filter(a => a.incidentId).length,
    assignments: assignments.filter(a => a.incidentId).map(formatAssignment),
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
