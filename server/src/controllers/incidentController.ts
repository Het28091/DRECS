import { Response } from 'express';
import { Types } from 'mongoose';
import { Incident, INCIDENT_STATUSES, IIncidentDocument } from '../models/Incident';
import { Assignment } from '../models/Assignment';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { dispatchNotification, dispatchNotificationToRoles } from '../socket';

/**
 * Allowed incident status transitions.
 * CLOSED is a terminal state — no transitions out. No other status may jump
 * forward (e.g. REPORTED -> RESOLVED is rejected).
 */
export const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  REPORTED: ['UNDER_REVIEW', 'ASSIGNED'],
  UNDER_REVIEW: ['ASSIGNED', 'IN_PROGRESS'],
  ASSIGNED: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

interface FormatOptions {
  /** When true, include who changed each status (authority/admin only). */
  includeInternal?: boolean;
}

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

const formatIncident = (incident: IIncidentDocument, options: FormatOptions = {}) => {
  const { includeInternal = false } = options;

  const statusHistory = (incident.statusHistory ?? []).map((entry) => {
    const base = {
      status: entry.status,
      changedAt: entry.changedAt,
      note: entry.note ?? '',
    };

    if (!includeInternal) {
      return base;
    }

    return {
      ...base,
      changedBy: formatUserRef(entry.changedBy),
    };
  });

  return {
    id: incident._id.toString(),
    title: incident.title,
    description: incident.description,
    category: incident.category,
    severity: incident.severity,
    userSeverity: incident.userSeverity ?? incident.severity,
    aiSeverity: incident.aiSeverity ?? incident.severity,
    aiSeverityMatch: incident.aiSeverityMatch ?? true,
    aiReasoning: incident.aiReasoning ?? '',
    location: incident.location,
    images: incident.images ?? [],
    status: incident.status,
    reportedBy: formatUserRef(incident.reportedBy),
    statusHistory,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
};

const populateIncidentRelations = async (incident: IIncidentDocument) => {
  await incident.populate([
    { path: 'reportedBy', select: 'name email role' },
    { path: 'statusHistory.changedBy', select: 'name email role' },
  ]);
  return incident;
};

import { verifyIncidentContent } from '../utils/securityVerifier';
import { verifyWithOpenAI } from '../utils/openAiVerifier';

/**
 * @desc    Create a new incident report
 * @route   POST /api/incidents
 * @access  Citizen (also volunteer may report)
 */
export const createIncident = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const { title, description, category, severity, location, images } = req.body;

  // 1. Local Automated Content Verification & Moderation
  const verification = verifyIncidentContent(title, description);
  if (!verification.isValid) {
    throw createError(verification.reason || 'Incident content verification failed.', 400);
  }

  // 2. OpenAI Lore-Accurate Verification & Priority Arbitration
  const userSubmittedSeverity = severity || 'MEDIUM';
  const openAiCheck = await verifyWithOpenAI({
    title,
    description,
    category,
    userSeverity: userSubmittedSeverity,
    location,
  });

  if (!openAiCheck.isValid) {
    throw createError(openAiCheck.reason || 'Incident verification failed.', 400);
  }

  const now = new Date();

  const incident = await Incident.create({
    title,
    description,
    category,
    severity: openAiCheck.finalSeverity,
    userSeverity: userSubmittedSeverity,
    aiSeverity: openAiCheck.aiSeverity,
    aiSeverityMatch: openAiCheck.aiSeverityMatch,
    aiReasoning: openAiCheck.reason,
    location,
    images: images ?? [],
    status: 'REPORTED',
    reportedBy: req.user.id,
    statusHistory: [
      {
        status: 'REPORTED',
        changedBy: req.user.id,
        changedAt: now,
      },
    ],
  });

  await populateIncidentRelations(incident);

  // Notify Authorities & Admins about new incident
  await dispatchNotificationToRoles({
    roles: ['authority', 'admin'],
    title: 'New Incident Reported',
    message: `A new ${incident.category} incident "${incident.title}" has been reported.`,
    type: 'INCIDENT_UPDATE',
    link: `/incidents/${incident._id}`,
  });

  res.status(201).json({
    success: true,
    message: 'Incident reported successfully',
    incident: formatIncident(incident, { includeInternal: false }),
  });
});

/**
 * @desc    Get incidents reported by the logged-in user
 * @route   GET /api/incidents/my
 * @access  Private (citizen / volunteer)
 */
export const getMyIncidents = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const incidents = await Incident.find({ reportedBy: req.user.id })
    .sort({ createdAt: -1 })
    .populate('reportedBy', 'name email role');

  res.status(200).json({
    success: true,
    count: incidents.length,
    incidents: incidents.map((i) => formatIncident(i, { includeInternal: false })),
  });
});

/**
 * @desc    Get all incidents (authority dashboard)
 * @route   GET /api/incidents
 * @access  Authority / Admin
 */
export const getAllIncidents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, string> = {};

  if (typeof req.query.status === 'string' && req.query.status) {
    filter.status = req.query.status;
  }
  if (typeof req.query.category === 'string' && req.query.category) {
    filter.category = req.query.category;
  }
  if (typeof req.query.severity === 'string' && req.query.severity) {
    filter.severity = req.query.severity;
  }

  const incidents = await Incident.find(filter)
    .sort({ createdAt: -1 })
    .populate('reportedBy', 'name email role');

  res.status(200).json({
    success: true,
    count: incidents.length,
    incidents: incidents.map((i) => formatIncident(i, { includeInternal: true })),
  });
});

/**
 * @desc    Get public incidents (citizens can view all active incidents)
 * @route   GET /api/incidents/public
 * @access  Authenticated (citizens, volunteers, authority, admin)
 */
export const getPublicIncidents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filter: Record<string, string> = {};

    if (typeof req.query.status === 'string' && req.query.status) {
      filter.status = req.query.status;
    }
    if (typeof req.query.category === 'string' && req.query.category) {
      filter.category = req.query.category;
    }
    if (typeof req.query.severity === 'string' && req.query.severity) {
      filter.severity = req.query.severity;
    }

    const incidents = await Incident.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email role');

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents: incidents.map((i) =>
        formatIncident(i, { includeInternal: false }),
      ),
    });
  },
);

/**
 * @desc    Get a single incident by ID
 * @route   GET /api/incidents/:id
 * @access  Private — all authenticated users can view public details; internal status actors only for authority/admin
 */
export const getIncidentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    throw createError('Incident not found', 404);
  }

  await populateIncidentRelations(incident);

  const isAuthority = req.user.role === 'authority' || req.user.role === 'admin';

  res.status(200).json({
    success: true,
    incident: formatIncident(incident, { includeInternal: isAuthority }),
  });
});

/**
 * @desc    Update incident status
 * @route   PATCH /api/incidents/:id/status
 * @access  Authority / Admin
 */
export const updateIncidentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const { status } = req.body;

  if (!INCIDENT_STATUSES.includes(status)) {
    throw createError('Invalid incident status', 400);
  }

  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    throw createError('Incident not found', 404);
  }

  if (incident.status === status) {
    throw createError(`Incident is already ${status.replace(/_/g, ' ')}`, 400);
  }

  // Enforce valid business transitions
  const allowed = INCIDENT_TRANSITIONS[incident.status] ?? [];
  if (!allowed.includes(status)) {
    throw createError(
      `Invalid status transition from ${incident.status.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}`,
      400,
    );
  }

  // ASSIGNED requires at least one approved volunteer/assignment
  if (status === 'ASSIGNED') {
    const assignmentCount = await Assignment.countDocuments({
      incidentId: incident._id,
      status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
    });
    if (assignmentCount === 0) {
      throw createError(
        'Cannot move to ASSIGNED — at least one approved volunteer assignment is required',
        400,
      );
    }
  }

  incident.status = status;
  incident.statusHistory.push({
    status,
    changedBy: new Types.ObjectId(req.user.id),
    changedAt: new Date(),
  });
  await incident.save();

  await populateIncidentRelations(incident);

  // Notify reporter about status update
  if (incident.reportedBy) {
    const repRef = incident.reportedBy as any;
    const reporterId =
      repRef && typeof repRef === 'object' && '_id' in repRef
        ? repRef._id.toString()
        : String(repRef ?? '');

    await dispatchNotification({
      recipientId: reporterId,
      title: 'Incident Status Updated',
      message: `Your reported incident "${incident.title}" status has changed to ${status.replace(/_/g, ' ')}.`,
      type: 'INCIDENT_UPDATE',
      link: `/incidents/${incident._id}`,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Incident status updated successfully',
    incident: formatIncident(incident, { includeInternal: true }),
  });
});
