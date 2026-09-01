import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateAccessToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';

import { validatePasswordSecurity } from '../utils/securityVerifier';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw createError('Name, email, and password are required', 400);
  }

  // Validate password complexity
  const passwordCheck = validatePasswordSecurity(password);
  if (!passwordCheck.isValid) {
    throw createError(
      `Password does not meet security requirements: ${passwordCheck.errors.join('; ')}`,
      400,
    );
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createError('An account with this email address already exists', 400);
  }

  // Public registration always creates citizen accounts.
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: 'citizen',
  });

  // Generate JWT access token
  const token = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw createError(
      'Your account has been deactivated. Please contact an administrator.',
      403,
    );
  }

  const token = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    throw createError('User not found', 404);
  }

  if (!user.isActive) {
    throw createError('Your account has been deactivated.', 403);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export const getMe = getCurrentUser;

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
