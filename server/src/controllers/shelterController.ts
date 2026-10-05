import { Response } from 'express';
import { Types } from 'mongoose';
import { Shelter, SHELTER_STATUSES, IShelterDocument } from '../models/Shelter';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';

export const formatShelter = (shelter: IShelterDocument) => ({
  id: shelter._id.toString(),
  name: shelter.name,
  location: shelter.location,
  capacity: shelter.capacity,
  currentOccupancy: shelter.currentOccupancy,
  facilities: shelter.facilities ?? [],
  contactInfo: shelter.contactInfo,
  status: shelter.status,
  isFull: shelter.currentOccupancy >= shelter.capacity,
  createdAt: shelter.createdAt,
  updatedAt: shelter.updatedAt,
});

/**
 * @desc    List all shelters
 * @route   GET /api/shelters
 * @access  Authenticated
 */
export const getAllShelters = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, string> = {};

  if (typeof req.query.status === 'string' && req.query.status) {
    filter.status = req.query.status;
  }

  const shelters = await Shelter.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: shelters.length,
    shelters: shelters.map(formatShelter),
  });
});

/**
 * @desc    Get shelter by ID
 * @route   GET /api/shelters/:id
 * @access  Authenticated
 */
export const getShelterById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid shelter ID', 400);
  }

  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) {
    throw createError('Shelter not found', 404);
  }

  res.status(200).json({
    success: true,
    shelter: formatShelter(shelter),
  });
});

/**
 * @desc    Create a shelter
 * @route   POST /api/shelters
 * @access  Authority / Admin
 */
export const createShelter = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    location,
    capacity,
    currentOccupancy = 0,
    facilities = [],
    contactInfo,
    status = 'ACTIVE',
  } = req.body;

  if (currentOccupancy > capacity) {
    throw createError('Current occupancy cannot exceed capacity', 400);
  }

  const shelter = await Shelter.create({
    name,
    location,
    capacity,
    currentOccupancy,
    facilities,
    contactInfo,
    status: status === 'INACTIVE' ? 'INACTIVE' : currentOccupancy >= capacity ? 'FULL' : 'ACTIVE',
  });

  res.status(201).json({
    success: true,
    message: 'Shelter created successfully',
    shelter: formatShelter(shelter),
  });
});

/**
 * @desc    Update shelter details
 * @route   PATCH /api/shelters/:id
 * @access  Authority / Admin
 */
export const updateShelter = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid shelter ID', 400);
  }

  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) {
    throw createError('Shelter not found', 404);
  }

  const {
    name,
    location,
    capacity,
    currentOccupancy,
    facilities,
    contactInfo,
    status,
  } = req.body;

  if (name !== undefined) shelter.name = name;
  if (location !== undefined) shelter.location = location;
  if (capacity !== undefined) shelter.capacity = capacity;
  if (currentOccupancy !== undefined) shelter.currentOccupancy = currentOccupancy;
  if (facilities !== undefined) shelter.facilities = facilities;
  if (contactInfo !== undefined) shelter.contactInfo = contactInfo;
  if (status !== undefined) {
    if (!SHELTER_STATUSES.includes(status)) {
      throw createError('Invalid shelter status', 400);
    }
    shelter.status = status;
  }

  if (shelter.currentOccupancy > shelter.capacity) {
    throw createError('Current occupancy cannot exceed capacity', 400);
  }

  // Auto-sync status to FULL if occupancy reaches capacity
  if (shelter.currentOccupancy >= shelter.capacity && shelter.status === 'ACTIVE') {
    shelter.status = 'FULL';
  } else if (shelter.currentOccupancy < shelter.capacity && shelter.status === 'FULL') {
    shelter.status = 'ACTIVE';
  }

  await shelter.save();

  res.status(200).json({
    success: true,
    message: 'Shelter updated successfully',
    shelter: formatShelter(shelter),
  });
});

/**
 * @desc    Delete a shelter
 * @route   DELETE /api/shelters/:id
 * @access  Authority / Admin
 */
export const deleteShelter = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid shelter ID', 400);
  }

  const shelter = await Shelter.findByIdAndDelete(req.params.id);
  if (!shelter) {
    throw createError('Shelter not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Shelter deleted successfully',
  });
});
