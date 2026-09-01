import { Badge } from '@/components/ui/Badge';
import { AssignmentStatus } from '@/types';

const variant: Record<
  AssignmentStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange'
> = {
  ASSIGNED: 'orange',
  ACCEPTED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <Badge variant={variant[status] ?? 'default'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
