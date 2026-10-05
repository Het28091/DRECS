import { Response } from 'express';
import { Incident } from '../models/Incident';
import { VolunteerRequest } from '../models/VolunteerRequest';
import { Assignment } from '../models/Assignment';
import { Shelter } from '../models/Shelter';
import { Resource } from '../models/Resource';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * @desc    Get high-level overview metrics across the entire platform
 * @route   GET /api/analytics/overview
 * @access  Authenticated
 */
export const getOverviewStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const visibility = { approvalStatus: 'APPROVED' };
  const [
    totalIncidents,
    activeIncidents,
    criticalIncidents,
    resolvedIncidents,
    totalShelters,
    shelterAgg,
    totalResources,
    resourceAgg,
    totalVolunteers,
    activeAssignments,
  ] = await Promise.all([
    Incident.countDocuments(visibility),
    Incident.countDocuments({ ...visibility, status: { $in: ['REPORTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] } }),
    Incident.countDocuments({ ...visibility, severity: 'CRITICAL', status: { $ne: 'CLOSED' } }),
    Incident.countDocuments({ ...visibility, status: { $in: ['RESOLVED', 'CLOSED'] } }),
    Shelter.countDocuments({ status: { $in: ['ACTIVE', 'FULL'] } }),
    Shelter.aggregate([
      { $match: { status: { $in: ['ACTIVE', 'FULL'] } } },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          totalOccupancy: { $sum: '$currentOccupancy' },
        },
      },
    ]),
    Resource.countDocuments(),
    Resource.aggregate([
      {
        $group: {
          _id: null,
          totalInventory: { $sum: '$quantity' },
          totalAvailable: { $sum: '$availableQuantity' },
        },
      },
    ]),
    User.countDocuments({ role: { $in: ['volunteer', 'citizen'] } }),
    Assignment.countDocuments({ status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } }),
  ]);

  const shelterStats = shelterAgg[0] ?? { totalCapacity: 0, totalOccupancy: 0 };
  const resourceStats = resourceAgg[0] ?? { totalInventory: 0, totalAvailable: 0 };

  const shelterOccupancyRate =
    shelterStats.totalCapacity > 0
      ? Math.floor((shelterStats.totalOccupancy / shelterStats.totalCapacity) * 100)
      : 0;

  res.status(200).json({
    success: true,
    overview: {
      totalIncidents,
      activeIncidents,
      criticalIncidents,
      resolvedIncidents,
      totalShelters,
      totalShelterCapacity: shelterStats.totalCapacity,
      totalShelterOccupancy: shelterStats.totalOccupancy,
      shelterOccupancyRate,
      totalResources,
      totalResourceInventory: resourceStats.totalInventory,
      availableResourceInventory: resourceStats.totalAvailable,
      allocatedResourceInventory: resourceStats.totalInventory - resourceStats.totalAvailable,
      totalVolunteers,
      activeAssignments,
    },
  });
});

/**
 * @desc    Get incident breakdown by status, category, and severity
 * @route   GET /api/analytics/incidents
 * @access  Authenticated
 */
export const getIncidentTrends = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [byStatus, byCategory, bySeverity] = await Promise.all([
    Incident.aggregate([
      { $match: { approvalStatus: 'APPROVED' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Incident.aggregate([
      { $match: { approvalStatus: 'APPROVED' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Incident.aggregate([
      { $match: { approvalStatus: 'APPROVED' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    byStatus: byStatus.map((item) => ({ status: item._id, count: item.count })),
    byCategory: byCategory.map((item) => ({ category: item._id, count: item.count })),
    bySeverity: bySeverity.map((item) => ({ severity: item._id, count: item.count })),
  });
});

/**
 * @desc    Get volunteer participation and assignment distribution stats
 * @route   GET /api/analytics/volunteers
 * @access  Authenticated
 */
export const getVolunteerActivity = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [requestsByStatus, assignmentsByStatus] = await Promise.all([
    VolunteerRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Assignment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    requestsByStatus: requestsByStatus.map((item) => ({ status: item._id, count: item.count })),
    assignmentsByStatus: assignmentsByStatus.map((item) => ({ status: item._id, count: item.count })),
  });
});

/**
 * @desc    Get resource inventory breakdown and allocation statistics
 * @route   GET /api/analytics/resources
 * @access  Authenticated
 */
export const getResourceUtilization = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [byCategory, byStatus] = await Promise.all([
    Resource.aggregate([
      {
        $group: {
          _id: '$category',
          totalQuantity: { $sum: '$quantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]),
    Resource.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    byCategory: byCategory.map((item) => ({
      category: item._id,
      totalQuantity: item.totalQuantity,
      availableQuantity: item.availableQuantity,
      allocatedQuantity: item.totalQuantity - item.availableQuantity,
      itemCount: item.count,
    })),
    byStatus: byStatus.map((item) => ({ status: item._id, count: item.count })),
  });
});
