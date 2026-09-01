export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const USER_ROLES = {
  CITIZEN: 'citizen',
  VOLUNTEER: 'volunteer',
  AUTHORITY: 'authority',
  ADMIN: 'admin',
} as const;

export const INCIDENT_STATUS = {
  REPORTED: 'REPORTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export const INCIDENT_STATUSES = [
  'REPORTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export const ASSIGNMENT_STATUSES = [
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export const SHELTER_STATUSES = ['ACTIVE', 'FULL', 'INACTIVE'] as const;

export const RESOURCE_CATEGORIES = [
  'Medical',
  'Food & Water',
  'Shelter Supplies',
  'Rescue Gear',
  'Power & Generators',
  'Vehicles',
  'Other',
] as const;

export const RESOURCE_STATUSES = [
  'AVAILABLE',
  'LOW_STOCK',
  'DEPLETED',
  'MAINTENANCE',
] as const;

export const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const INCIDENT_CATEGORIES = [
  'Flood',
  'Earthquake',
  'Fire',
  'Cyclone',
  'Building Collapse',
  'Landslide',
  'Medical',
  'Other',
] as const;
