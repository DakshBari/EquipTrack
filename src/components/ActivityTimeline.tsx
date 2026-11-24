import { ActivityEvent } from '../types';
import { formatDateTime } from '../utils/formatters';

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No activity history recorded yet.
      </div>
    );
  }

  return (
    <ol className="relative border-l border-slate-200 ml-2.5 space-y-5 py-1">
      {events.map((event) => (
        <li key={event.id} className="pl-5 relative">
          <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-sm bg-blue-700 border-2 border-white" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{event.action}</p>
            <time className="text-xs font-mono tabular-nums text-slate-500">
              {formatDateTime(event.timestamp)}
            </time>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">{event.details}</p>
          <p className="mt-1 text-xs text-slate-500">
            {event.actorName} · {event.actorRole}
          </p>
        </li>
      ))}
    </ol>
  );
}
