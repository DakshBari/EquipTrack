import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { formatDateTime } from '../../utils/formatters';

export function SupervisorNotificationsPage() {
  const { state, markNotificationRead, markAllNotificationsRead } = useEquipTrack();

  const items = state.notifications.filter((n) => n.targetRoles.includes('supervisor'));

  return (
    <DashboardLayout mode="supervisor" title="Notifications">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Real-time alerts for reported faults, holds, maintenance updates, and approvals.
          </p>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-blue-700" />
            Mark All Read
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No notifications yet.</div>
          ) : (
            items.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                  notif.read ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      notif.type === 'urgent' || notif.type === 'hold'
                        ? 'bg-red-50 text-red-700'
                        : notif.type === 'rts'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{notif.title}</h3>
                      {!notif.read && (
                        <span className="text-[11px] font-semibold text-blue-700">New</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {formatDateTime(notif.timestamp)}
                    </div>
                  </div>
                </div>

                {notif.faultId && (
                  <Link
                    to={`/supervisor/faults/${notif.faultId}`}
                    className="min-h-[36px] px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-blue-700 inline-flex items-center justify-center shrink-0"
                  >
                    Open {notif.faultId}
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
