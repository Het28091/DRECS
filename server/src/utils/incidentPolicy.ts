export const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  REPORTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
  ASSIGNED: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

export const canOfferHelp = (incident: { approvalStatus?: string; status: string } | null | undefined) =>
  incident?.approvalStatus === 'APPROVED' &&
  ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes(incident.status);

// All users share the same calendar-day boundary, regardless of server timezone.
export const incidentReportDay = (now = new Date()) =>
  new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export const DAILY_INCIDENT_LIMIT = 5;
