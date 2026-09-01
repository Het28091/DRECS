import { Response } from 'express';
import { Types } from 'mongoose';
import { Resource, IResourceDocument, RESOURCE_CATEGORIES, RESOURCE_STATUSES } from '../models/Resource';
import { Incident } from '../models/Incident';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { dispatchNotificationToRoles } from '../socket';

export const formatResource = (resource: IResourceDocument) => ({
  id: resource._id.toString(),
  name: resource.name,
  category: resource.category,
  quantity: resource.quantity,
  availableQuantity: resource.availableQuantity,
  unit: resource.unit,
  location: resource.location ?? null,
  status: resource.status,
  allocations: (resource.allocations ?? []).map((alloc) => {
    const incRef = alloc.incidentId as any;
    const isPopulated = incRef && typeof incRef === 'object' && '_id' in incRef;
    return {
      incidentId: isPopulated ? incRef._id.toString() : String(incRef ?? ''),
      incidentTitle: isPopulated ? incRef.title : undefined,
      quantity: alloc.quantity,
      allocatedAt: alloc.allocatedAt,
      notes: alloc.notes ?? '',
    };
  }),
  createdAt: resource.createdAt,
  updatedAt: resource.updatedAt,
});

/**
 * @desc    Get all resources
 * @route   GET /api/resources
 * @access  Authenticated
 */
export const getAllResources = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, unknown> = {};

  if (typeof req.query.category === 'string' && req.query.category) {
    filter.category = req.query.category;
  }
  if (typeof req.query.status === 'string' && req.query.status) {
    filter.status = req.query.status;
  }

  const resources = await Resource.find(filter)
    .sort({ name: 1 })
    .populate('allocations.incidentId', 'title category severity status');

  res.status(200).json({
    success: true,
    count: resources.length,
    resources: resources.map(formatResource),
  });
});

/**
 * @desc    Get resource by ID
 * @route   GET /api/resources/:id
 * @access  Authenticated
 */
export const getResourceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid resource ID', 400);
  }

  const resource = await Resource.findById(req.params.id)
    .populate('allocations.incidentId', 'title category severity status');

  if (!resource) {
    throw createError('Resource not found', 404);
  }

  res.status(200).json({
    success: true,
    resource: formatResource(resource),
  });
});

/**
 * @desc    Create new resource item
 * @route   POST /api/resources
 * @access  Authority / Admin
 */
export const createResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, category, quantity, unit = 'units', location, status = 'AVAILABLE' } = req.body;

  if (!name || !category || quantity === undefined) {
    throw createError('Name, category, and quantity are required', 400);
  }

  if (!RESOURCE_CATEGORIES.includes(category)) {
    throw createError('Invalid resource category', 400);
  }

  const numQuantity = Number(quantity);
  if (isNaN(numQuantity) || numQuantity < 0) {
    throw createError('Quantity must be a positive number', 400);
  }

  const resource = await Resource.create({
    name,
    category,
    quantity: numQuantity,
    availableQuantity: numQuantity,
    unit,
    location,
    status,
    allocations: [],
  });

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    resource: formatResource(resource),
  });
});

/**
 * @desc    Update resource details
 * @route   PATCH /api/resources/:id
 * @access  Authority / Admin
 */
export const updateResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid resource ID', 400);
  }

  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw createError('Resource not found', 404);
  }

  const { name, category, quantity, unit, location, status } = req.body;

  if (name !== undefined) resource.name = name;
  if (category !== undefined) {
    if (!RESOURCE_CATEGORIES.includes(category)) {
      throw createError('Invalid resource category', 400);
    }
    resource.category = category;
  }
  if (quantity !== undefined) {
    const newQuantity = Number(quantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      throw createError('Quantity must be a non-negative number', 400);
    }
    // Calculate total currently allocated
    const currentlyAllocated = resource.allocations.reduce((sum, a) => sum + a.quantity, 0);
    if (newQuantity < currentlyAllocated) {
      throw createError(
        `Total quantity cannot be less than currently allocated quantity (${currentlyAllocated})`,
        400,
      );
    }
    resource.quantity = newQuantity;
    resource.availableQuantity = newQuantity - currentlyAllocated;
  }

  if (unit !== undefined) resource.unit = unit;
  if (location !== undefined) resource.location = location;
  if (status !== undefined) {
    if (!RESOURCE_STATUSES.includes(status)) {
      throw createError('Invalid resource status', 400);
    }
    resource.status = status;
  }

  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Resource updated successfully',
    resource: formatResource(resource),
  });
});

/**
 * @desc    Delete a resource
 * @route   DELETE /api/resources/:id
 * @access  Authority / Admin
 */
export const deleteResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid resource ID', 400);
  }

  const resource = await Resource.findByIdAndDelete(req.params.id);
  if (!resource) {
    throw createError('Resource not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Resource deleted successfully',
  });
});

/**
 * @desc    Allocate resource to an incident
 * @route   POST /api/resources/:id/allocate
 * @access  Authority / Admin
 */
export const allocateResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid resource ID', 400);
  }

  const { incidentId, quantity, notes } = req.body;

  if (!Types.ObjectId.isValid(incidentId)) {
    throw createError('Invalid incident ID', 400);
  }

  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw createError('Incident not found', 404);
  }

  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw createError('Resource not found', 404);
  }

  const allocQty = Number(quantity);
  if (isNaN(allocQty) || allocQty <= 0) {
    throw createError('Allocation quantity must be greater than 0', 400);
  }

  if (allocQty > resource.availableQuantity) {
    throw createError(
      `Insufficient inventory. Requested: ${allocQty}, Available: ${resource.availableQuantity}`,
      400,
    );
  }

  resource.availableQuantity -= allocQty;
  resource.allocations.push({
    incidentId: new Types.ObjectId(incidentId),
    quantity: allocQty,
    allocatedAt: new Date(),
    notes: notes ?? '',
  });

  await resource.save();

  // Trigger notification
  await dispatchNotificationToRoles({
    roles: ['authority', 'admin'],
    title: 'Resource Allocated',
    message: `${allocQty} ${resource.unit} of ${resource.name} allocated to incident: ${incident.title}`,
    type: 'RESOURCE_UPDATE',
    link: `/incidents/${incidentId}`,
  });

  await resource.populate('allocations.incidentId', 'title category severity status');

  res.status(200).json({
    success: true,
    message: 'Resource allocated successfully',
    resource: formatResource(resource),
  });
});

/**
 * @desc    Release resource allocation from an incident
 * @route   POST /api/resources/:id/release
 * @access  Authority / Admin
 */
export const releaseResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid resource ID', 400);
  }

  const { incidentId } = req.body;

  if (!Types.ObjectId.isValid(incidentId)) {
    throw createError('Invalid incident ID', 400);
  }

  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw createError('Resource not found', 404);
  }

  const allocIndex = resource.allocations.findIndex(
    (a) => a.incidentId.toString() === incidentId,
  );

  if (allocIndex === -1) {
    throw createError('No allocation found for this incident', 404);
  }

  const releasedQty = resource.allocations[allocIndex].quantity;
  resource.allocations.splice(allocIndex, 1);
  resource.availableQuantity = Math.min(resource.quantity, resource.availableQuantity + releasedQty);

  await resource.save();

  res.status(200).json({
    success: true,
    message: `Released ${releasedQty} ${resource.unit} back to available stock`,
    resource: formatResource(resource),
  });
});
