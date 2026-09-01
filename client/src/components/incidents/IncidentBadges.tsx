import { Badge } from '@/components/ui/Badge';
import { IncidentSeverity, IncidentStatus } from '@/types';

const statusVariant: Record<
  IncidentStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange'
> = {
  REPORTED: 'orange',
  UNDER_REVIEW: 'info',
  ASSIGNED: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const severityVariant: Record<
  IncidentSeverity,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange'
> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <Badge variant={statusVariant[status] ?? 'default'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return (
    <Badge variant={severityVariant[severity] ?? 'default'}>{severity}</Badge>
  );
}
