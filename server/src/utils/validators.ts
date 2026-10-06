import { z, ZodSchema } from 'zod';
import { isValidMobile } from './phone';
import { RESOURCE_CATEGORIES, RESOURCE_STATUSES } from '../models/Resource';
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with field-level errors if validation fails.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
};

/**
 * XSS & HTML Sanitization Helper
 */
export const sanitizeInputText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .trim();
};

// ─── Auth Validation Schemas ──────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must be at most 100 characters')
      .transform(sanitizeInputText),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Invalid email address format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  })
  .strip();

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─── Incident Validation Schemas ──────────────────────────────────────────────

const INCIDENT_CATEGORIES = [
  'Flood',
  'Earthquake',
  'Fire',
  'Cyclone',
  'Building Collapse',
  'Landslide',
  'Medical',
  'Other',
] as const;

const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const INCIDENT_STATUSES = [
  'REPORTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export const createIncidentSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters long')
      .max(120, 'Title must be at most 120 characters')
      .transform(sanitizeInputText)
      .refine((val) => val.trim().length >= 3, {
        message: 'Title cannot consist only of whitespace or special tags',
      }),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters long')
      .max(2000, 'Description must be at most 2000 characters')
      .transform(sanitizeInputText)
      .refine((val) => val.trim().length >= 10, {
        message: 'Description cannot consist only of whitespace or special tags',
      }),
    category: z.enum(INCIDENT_CATEGORIES, {
      errorMap: () => ({ message: 'Invalid incident category' }),
    }),
    severity: z.enum(INCIDENT_SEVERITIES, {
      errorMap: () => ({ message: 'Invalid severity level' }),
    }),
    location: z.object({
      latitude: z
        .number({ required_error: 'Latitude is required' })
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
      longitude: z
        .number({ required_error: 'Longitude is required' })
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),
      address: z
        .string()
        .trim()
        .max(300, 'Address must be at most 300 characters')
        .transform(sanitizeInputText)
        .optional()
        .or(z.literal('')),
    }),
    images: z.array(z.string().url('Each image must be a valid URL')).optional(),
  })
  .refine((data) => data.title.toLowerCase() !== data.description.toLowerCase(), {
    message: 'Title and description cannot be identical',
    path: ['description'],
  });

export const updateIncidentStatusSchema = z.object({
  status: z.enum(INCIDENT_STATUSES, {
    errorMap: () => ({ message: 'Invalid incident status' }),
  }),
});

export const assignVolunteerSchema = z.object({
  volunteerId: z
    .string({ required_error: 'Volunteer ID is required' })
    .regex(/^[a-f\d]{24}$/i, 'Invalid volunteer ID'),
});

export const updateAssignmentStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'], {
    errorMap: () => ({ message: 'Invalid assignment status' }),
  }),
});

// ─── Volunteer Request Validation Schemas ─────────────────────────────────────

export const createVolunteerRequestSchema = z.object({
  skills: z.array(z.string().trim().transform(sanitizeInputText).pipe(z.string().min(2).max(80))).min(1, 'Enter at least one skill').max(10, 'Enter at most 10 skills'),
  experience: z.string().trim().transform(sanitizeInputText).pipe(z.string().min(10, 'Describe your experience in at least 10 characters').max(2000)),
  message: z.string().trim().transform(sanitizeInputText).pipe(z.string().min(10, 'Describe how you can help in at least 10 characters').max(1000)),
  phoneNumber: z.string().trim().refine(isValidMobile, 'Enter a plausible Indian mobile number: 10 digits starting with 6–9; no repeated or sequential placeholders'),
});

export const reviewVolunteerRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be APPROVED or REJECTED' }),
  }),
});

// ─── Shelter Validation Schemas ───────────────────────────────────────────────

const SHELTER_STATUSES = ['ACTIVE', 'FULL', 'INACTIVE'] as const;

const shelterLocationSchema = z.object({
  latitude: z.coerce
    .number({ required_error: 'Latitude is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number({ required_error: 'Longitude is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: z
    .string()
    .trim()
    .max(300, 'Address must be at most 300 characters')
    .transform(sanitizeInputText)
    .optional()
    .or(z.literal('')),
});

export const createShelterSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(120, 'Name must be at most 120 characters')
    .transform(sanitizeInputText),
  location: shelterLocationSchema,
  capacity: z.coerce
    .number({ required_error: 'Capacity is required' })
    .int()
    .min(1, 'Capacity must be at least 1'),
  currentOccupancy: z.coerce.number().int().min(0).optional().default(0),
  facilities: z.array(z.string().trim().min(1).transform(sanitizeInputText)).optional().default([]),
  contactInfo: z
    .string({ required_error: 'Contact information is required' })
    .trim()
    .min(3, 'Contact information is required')
    .max(200, 'Contact info must be at most 200 characters')
    .transform(sanitizeInputText),
  status: z.enum(SHELTER_STATUSES).optional().default('ACTIVE'),
});

export const updateShelterSchema = z
  .object({
    name: z.string().trim().min(2).max(120).transform(sanitizeInputText).optional(),
    location: shelterLocationSchema.optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    currentOccupancy: z.coerce.number().int().min(0).optional(),
    facilities: z.array(z.string().trim().min(1).transform(sanitizeInputText)).optional(),
    contactInfo: z.string().trim().min(3).max(200).transform(sanitizeInputText).optional(),
    status: z.enum(SHELTER_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update',
  });

// ─── Shared reusable schemas ──────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId');

// Resource quantities use whole units; choose an appropriate unit (bottles, boxes, etc.).
export const createResourceSchema = z.object({
  name: z.string().trim().transform(sanitizeInputText).pipe(z.string().min(2, 'Resource name must contain at least 2 characters').max(120)),
  category: z.enum(RESOURCE_CATEGORIES, { errorMap: () => ({ message: 'Choose a valid resource category' }) }),
  quantity: z.number().finite().int().min(0),
  unit: z.string().trim().min(1, 'Unit is required').max(40).default('units'),
  location: z.object({
    latitude: z.number().finite().min(-90).max(90).optional(),
    longitude: z.number().finite().min(-180).max(180).optional(),
    address: z.string().trim().max(300).optional(),
  }).optional(),
  status: z.enum(RESOURCE_STATUSES).default('AVAILABLE'),
});
export const updateResourceSchema = createResourceSchema.partial().refine(data => Object.keys(data).length > 0, 'At least one field is required');
export const allocateResourceSchema = z.object({
  incidentId: objectIdSchema,
  quantity: z.number().finite().int().min(1),
  notes: z.string().trim().max(300).optional(),
});
export const releaseResourceSchema = z.object({ incidentId: objectIdSchema });
