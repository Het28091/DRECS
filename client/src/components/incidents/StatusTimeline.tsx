import { StatusBadge } from '@/components/incidents/IncidentBadges';
import { formatDate } from '@/lib/utils';
import { StatusHistoryEntry } from '@/types';

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
  /** Show who changed status (authority/admin only) */
  showActor?: boolean;
}

function actorLabel(entry: StatusHistoryEntry): string | null {
  if (!entry.changedBy) return null;
  if (typeof entry.changedBy === 'object') return entry.changedBy.name;
  return null;
}

export function StatusTimeline({ history, showActor = false }: StatusTimelineProps) {
  const entries = [...history].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">No status history available yet.</p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const actor = showActor ? actorLabel(entry) : null;

        return (
          <li key={`${entry.status}-${entry.changedAt}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full border-2 shrink-0 mt-1.5 ${
                  isLast
                    ? 'bg-orange-500 border-orange-400'
                    : 'bg-slate-700 border-slate-500'
                }`}
              />
              {!isLast && <div className="w-px flex-1 bg-slate-700 my-1 min-h-[28px]" />}
            </div>

            <div className={`pb-6 ${isLast ? '' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={entry.status} />
                {isLast && (
                  <span className="text-[10px] uppercase tracking-wider text-orange-400/80">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{formatDate(entry.changedAt)}</p>
              {actor && (
                <p className="text-xs text-slate-600 mt-0.5">Updated by {actor}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
