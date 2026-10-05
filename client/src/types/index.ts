export type Role = 'citizen' | 'volunteer' | 'authority' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export type IncidentStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IncidentReporter {
  id: string;
  name: string;
  email?: string;
  role?: Role;
}

export interface StatusHistoryEntry {
  status: IncidentStatus;
  changedAt: string;
  note?: string;
  /** Present for authority/admin responses only */
  changedBy?: IncidentReporter | string;
}

export interface Incident {
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  allowedTransitions?: IncidentStatus[];
  id: string;
  title: string;
  description: string;
  category: string;
  severity: IncidentSeverity;
  location: Location;
  images: string[];
  status: IncidentStatus;
  reportedBy: IncidentReporter | string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  category: string;
  severity: IncidentSeverity;
  location: Location;
  images?: string[];
}

export interface IncidentsResponse {
  success: boolean;
  count: number;
  incidents: Incident[];
}

export interface IncidentResponse {
  success: boolean;
  message?: string;
  incident: Incident;
}

export interface MapIncident {
  id: string;
  title: string;
  category: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: Location;
}

export interface MapIncidentsResponse {
  success: boolean;
  count: number;
  incidents: MapIncident[];
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  role?: Role;
  isActive?: boolean;
  userId?: User | string;
  skills?: string[];
  availability?: boolean;
  currentAssignment?: string;
  createdAt?: string;
  activeIncidents?: { id: string; title: string }[];
  activeAssignments?: {
    id: string;
    incidentId: string;
    incidentTitle: string;
    status: AssignmentStatus;
  }[];
}

export interface VolunteerAccessResponse {
  success: boolean;
  hasVolunteerCapability: boolean;
  activeAssignmentCount: number;
}

export type AssignmentStatus = 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface AssignmentIncidentSummary {
  id: string;
  title: string;
  category?: string;
  severity?: string;
  status?: string;
  location?: Location;
  description?: string;
}

export interface Assignment {
  id: string;
  incidentId: AssignmentIncidentSummary | string;
  volunteerId: IncidentReporter | string;
  status: AssignmentStatus;
  assignedAt: string;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentsResponse {
  success: boolean;
  count: number;
  assignments: Assignment[];
}

export interface AssignmentResponse {
  success: boolean;
  message?: string;
  assignment: Assignment;
}

export interface VolunteersResponse {
  success: boolean;
  count: number;
  volunteers: Volunteer[];
}

export interface Shelter {
  id: string;
  name: string;
  location: Location;
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  contactInfo: string;
  status: ShelterStatus;
  isFull?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ShelterStatus = 'ACTIVE' | 'FULL' | 'INACTIVE';

export interface CreateShelterData {
  name: string;
  location: Location;
  capacity: number;
  currentOccupancy?: number;
  facilities?: string[];
  contactInfo: string;
  status?: ShelterStatus;
}

export interface UpdateShelterData {
  name?: string;
  location?: Location;
  capacity?: number;
  currentOccupancy?: number;
  facilities?: string[];
  contactInfo?: string;
  status?: ShelterStatus;
}

export interface SheltersResponse {
  success: boolean;
  count: number;
  shelters: Shelter[];
}

export interface ShelterResponse {
  success: boolean;
  message?: string;
  shelter: Shelter;
}

export interface ResourceAllocation {
  incidentId: string;
  incidentTitle?: string;
  quantity: number;
  allocatedAt: string;
  notes?: string;
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  location?: Location | null;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'DEPLETED' | 'MAINTENANCE';
  allocations?: ResourceAllocation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourcesResponse {
  success: boolean;
  count: number;
  resources: Resource[];
}

export interface ResourceResponse {
  success: boolean;
  message?: string;
  resource: Resource;
}

export interface Notification {
  id: string;
  recipient: string;
  title: string;
  message: string;
  type: 'INCIDENT_UPDATE' | 'VOLUNTEER_REQUEST' | 'ASSIGNMENT_UPDATE' | 'SHELTER_UPDATE' | 'RESOURCE_UPDATE' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  notifications: Notification[];
}

export type VolunteerRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VolunteerRequest {
  canApprove?: boolean;
  id: string;
  userId: IncidentReporter | string;
  incidentId: AssignmentIncidentSummary | string;
  skills: string[];
  experience: string;
  message: string;
  phoneNumber: string;
  status: VolunteerRequestStatus;
  reviewedBy?: IncidentReporter | string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVolunteerRequestData {
  skills: string[];
  experience: string;
  message: string;
  phoneNumber: string;
}

export interface VolunteerRequestResponse {
  success: boolean;
  message?: string;
  request: VolunteerRequest;
}

export interface VolunteerRequestsResponse {
  success: boolean;
  count: number;
  requests: VolunteerRequest[];
}

export interface OverviewAnalytics {
  totalIncidents: number;
  activeIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  totalShelters: number;
  totalShelterCapacity: number;
  totalShelterOccupancy: number;
  shelterOccupancyRate: number;
  totalResources: number;
  totalResourceInventory: number;
  availableResourceInventory: number;
  allocatedResourceInventory: number;
  totalVolunteers: number;
  activeAssignments: number;
}
