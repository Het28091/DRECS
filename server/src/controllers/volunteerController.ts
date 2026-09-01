import { Response } from 'express';
import { VolunteerRequest } from '../models/VolunteerRequest';
import { Assignment } from '../models/Assignment';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';

const formatUserRef = (value: unknown) => {
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

const formatIncidentRef = (value: unknown) => {
  const ref = value as
    | {
        _id: { toString(): string };
        title?: string;
        severity?: string;
        status?: string;
      }
    | undefined;

  if (ref && typeof ref === 'object' && '_id' in ref && ref.title) {
    return {
      id: ref._id.toString(),
      title: ref.title,
      severity: ref.severity,
      status: ref.status,
    };
  }

  if (ref && typeof ref === 'object' && '_id' in ref) {
    return ref._id.toString();
  }

  return String(value ?? '');
};

/**
 * @desc    List active responders (volunteer capability based on assignments/requests)
 * @route   GET /api/volunteers
 * @access  Authority / Admin
 *
 * This no longer depends on User.role === 'volunteer'. Instead it aggregates:
 *  - Users with APPROVED volunteer requests
 *  - Users with assigned volunteers (active assignments)
 *  - Users participating in incidents as responders
 */
export const getAllVolunteers = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const [approvedRequests, assignments] = await Promise.all([
      VolunteerRequest.find({ status: 'APPROVED' })
        .populate('userId', 'name email role isActive')
        .populate('incidentId', 'title severity status'),
      Assignment.find({ status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } })
        .populate('volunteerId', 'name email role isActive')
        .populate('incidentId', 'title severity status'),
    ]);

    const responderMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
      activeIncidents: Map<string, string>;
      activeAssignments: { id: string; incidentId: string; incidentTitle: string; status: string }[];
    }>();

    // An approved request establishes eligibility, but this screen represents
    // active responders. A responder therefore remains listed only while an
    // active assignment exists; removing an assignment keeps request history
    // intact without leaving a stale active responder behind.
    const activeAssignmentPairs = new Set(
      assignments.map((assignment) =>
        `${assignment.volunteerId.toString()}:${assignment.incidentId.toString()}`,
      ),
    );

    const addUser = (
      user: unknown,
      incidentId: string | undefined,
      incidentTitle: string | undefined,
      assignment?: { id: string; status: string },
    ) => {
      const ref = user as
        | { _id: { toString(): string }; name?: string; email?: string; role?: string; isActive?: boolean }
        | undefined;
      if (!ref || typeof ref !== 'object' || !('_id' in ref)) return;

      const id = ref._id.toString();
      const existing = responderMap.get(id);
      if (existing) {
        if (incidentId && incidentTitle) existing.activeIncidents.set(incidentId, incidentTitle);
        if (assignment && incidentId && !existing.activeAssignments.some((item) => item.id === assignment.id)) {
          existing.activeAssignments.push({
            id: assignment.id,
            incidentId,
            incidentTitle: incidentTitle ?? 'Incident',
            status: assignment.status,
          });
        }
        return;
      }
      responderMap.set(id, {
        id,
        name: ref.name ?? 'Unknown',
        email: ref.email ?? '',
        role: ref.role ?? 'citizen',
        isActive: ref.isActive ?? true,
        activeIncidents: new Map(incidentId && incidentTitle ? [[incidentId, incidentTitle]] : []),
        activeAssignments:
          assignment && incidentId
            ? [{ id: assignment.id, incidentId, incidentTitle: incidentTitle ?? 'Incident', status: assignment.status }]
            : [],
      });
    };

    for (const request of approvedRequests) {
      if (!activeAssignmentPairs.has(`${request.userId.toString()}:${request.incidentId.toString()}`)) {
        continue;
      }
      const incident = formatIncidentRef(request.incidentId);
      const title = typeof incident === 'object' ? incident.title : undefined;
      const incidentId = typeof incident === 'object' ? incident.id : undefined;
      addUser(request.userId, incidentId, title);
    }

    for (const assignment of assignments) {
      const incident = formatIncidentRef(assignment.incidentId);
      const title = typeof incident === 'object' ? incident.title : undefined;
      const incidentId = typeof incident === 'object' ? incident.id : undefined;
      addUser(assignment.volunteerId, incidentId, title, {
        id: assignment._id.toString(),
        status: assignment.status,
      });
    }

    const volunteers = Array.from(responderMap.values())
      .map(({ activeIncidents, ...responder }) => ({
        ...responder,
        activeIncidents: Array.from(activeIncidents, ([id, title]) => ({ id, title })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      count: volunteers.length,
      volunteers,
    });
  },
);

/**
 * @desc    Get a single responder by ID
 * @route   GET /api/volunteers/:id
 * @access  Authority / Admin
 */
export const getVolunteerById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    const volunteer = await Assignment.findOne({
      volunteerId: req.params.id,
    })
      .populate('volunteerId', 'name email role isActive')
      .populate('incidentId', 'title severity status');

    if (!volunteer) {
      throw createError('Volunteer not found', 404);
    }

    res.status(200).json({
      success: true,
      volunteer: {
        id: req.params.id,
        user: formatUserRef(volunteer.volunteerId),
        incident: formatIncidentRef(volunteer.incidentId),
        status: volunteer.status,
      },
    });
  },
);

export const updateAvailability = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }
    res.status(200).json({
      success: true,
      message: 'Availability is managed per incident via volunteer requests.',
    });
  },
);

export const getMyAssignments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    const assignments = await Assignment.find({ volunteerId: req.user.id })
      .sort({ assignedAt: -1 })
      .populate('volunteerId', 'name email role')
      .populate('incidentId', 'title severity status location description');

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments: assignments.map((a) => ({
        id: a._id.toString(),
        volunteerId: formatUserRef(a.volunteerId),
        incidentId: formatIncidentRef(a.incidentId),
        status: a.status,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt ?? null,
      })),
    });
  },
);

export const updateAssignmentStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      throw createError('Unauthorized — Authentication required', 401);
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      throw createError('Assignment not found', 404);
    }
    if (assignment.volunteerId.toString() !== req.user.id) {
      throw createError('Forbidden — You can only update your own assignments', 403);
    }

    const { status } = req.body;
    if (!['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      throw createError('Invalid assignment status', 400);
    }

    assignment.status = status;
    if (status === 'COMPLETED') {
      assignment.completedAt = new Date();
    } else {
      assignment.completedAt = null;
    }
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment status updated successfully',
      assignment: {
        id: assignment._id.toString(),
        status: assignment.status,
        completedAt: assignment.completedAt,
      },
    });
  },
);
