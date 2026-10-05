import { Response } from 'express';
import { Incident } from '../models/Incident';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * @desc    Lightweight incident list for map markers
 * @route   GET /api/map/incidents
 * @access  Authenticated
 */
export const getMapIncidents = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const incidents = await Incident.find(['authority', 'admin'].includes(_req.user?.role ?? '') ? {} : { approvalStatus: 'APPROVED' })
    .select('title category severity status location')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: incidents.length,
    incidents: incidents.map((incident) => ({
      id: incident._id.toString(),
      title: incident.title,
      category: incident.category,
      severity: incident.severity,
      status: incident.status,
      location: {
        latitude: incident.location.latitude,
        longitude: incident.location.longitude,
        address: incident.location.address,
      },
    })),
  });
});
