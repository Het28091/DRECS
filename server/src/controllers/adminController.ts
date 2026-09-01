import { Response } from 'express';
import { Types } from 'mongoose';
import { User, UserRole } from '../models/User';
import { Incident } from '../models/Incident';
import { VolunteerRequest } from '../models/VolunteerRequest';
import { Assignment } from '../models/Assignment';
import { Shelter } from '../models/Shelter';
import { Resource } from '../models/Resource';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { dispatchNotification } from '../socket';

/**
 * @desc    List all registered users (Admin central management)
 * @route   GET /api/admin/users
 * @access  Admin
 */
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, unknown> = {};

  if (typeof req.query.role === 'string' && req.query.role) {
    filter.role = req.query.role;
  }
  if (typeof req.query.isActive === 'string' && req.query.isActive !== '') {
    filter.isActive = req.query.isActive === 'true';
  }
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const users = await User.find(filter)
    .select('name email role isActive createdAt updatedAt')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
  });
});

/**
 * @desc    Update user role (Admin only)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Admin
 */
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid user ID', 400);
  }

  const { role } = req.body;
  const validRoles: UserRole[] = ['citizen', 'volunteer', 'authority', 'admin'];

  if (!validRoles.includes(role)) {
    throw createError('Invalid role specified', 400);
  }

  // Prevent self-demotion from admin
  if (req.params.id === req.user?.id && role !== 'admin') {
    throw createError('You cannot demote your own admin account', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  // Notify user
  await dispatchNotification({
    recipientId: user._id.toString(),
    title: 'Account Role Updated',
    message: `Your account role has been updated from ${oldRole} to ${role}.`,
    type: 'SYSTEM',
    link: '/dashboard',
  });

  res.status(200).json({
    success: true,
    message: `User role updated from ${oldRole} to ${role}`,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

/**
 * @desc    Activate or Deactivate user account (Admin only)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Admin
 */
export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid user ID', 400);
  }

  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    throw createError('isActive parameter must be a boolean', 400);
  }

  // Prevent self-deactivation
  if (req.params.id === req.user?.id && !isActive) {
    throw createError('You cannot deactivate your own admin account', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  user.isActive = isActive;
  await user.save();

  if (!isActive) {
    // Dispatch notification if possible
    await dispatchNotification({
      recipientId: user._id.toString(),
      title: 'Account Deactivated',
      message: 'Your DRECS account has been deactivated by an administrator.',
      type: 'SYSTEM',
    });
  }

  res.status(200).json({
    success: true,
    message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

/**
 * @desc    Get admin system overview metrics
 * @route   GET /api/admin/overview
 * @access  Admin
 */
export const getAdminOverview = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    citizensCount,
    authoritiesCount,
    adminsCount,
    volunteersCount,
    inactiveUsersCount,
    totalIncidents,
    totalShelters,
    totalResources,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'citizen' }),
    User.countDocuments({ role: 'authority' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'volunteer' }),
    User.countDocuments({ isActive: false }),
    Incident.countDocuments(),
    Shelter.countDocuments(),
    Resource.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    systemStats: {
      users: {
        total: totalUsers,
        citizens: citizensCount,
        authorities: authoritiesCount,
        admins: adminsCount,
        volunteers: volunteersCount,
        inactive: inactiveUsersCount,
      },
      counts: {
        incidents: totalIncidents,
        shelters: totalShelters,
        resources: totalResources,
      },
    },
  });
});
