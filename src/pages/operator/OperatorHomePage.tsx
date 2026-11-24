import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  QrCode,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EquipmentImage } from '../../components/EquipmentImage';
import { EquipmentStatusLabel } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { MobileOperatorLayout } from '../../layouts/MobileOperatorLayout';
import { formatRelativeTime, getSiteName, isToday } from '../../utils/formatters';

export function OperatorHomePage() {
  const { state, currentUser, selectedSite, setSelectedSite } = useEquipTrack();
  const navigate = useNavigate();

  const activeSite = selectedSite === 'all' ? currentUser?.siteId || 'canning-vale' : selectedSite;
  const siteEquipment = state.equipment.filter((eq) => eq.siteId === activeSite);

  const assignedEquipment = currentUser
    ? siteEquipment.filter((eq) => eq.assignedOperatorId === currentUser.id)
    : [];

  const displayEquipment = assignedEquipment.length > 0 ? assignedEquipment : siteEquipment.slice(0, 4);

  const completedTodayCount = displayEquipment.filter((eq) => isToday(eq.lastInspectionAt)).length;
  const pendingTodayCount = displayEquipment.filter(
    (eq) => !isToday(eq.lastInspectionAt) && eq.status === 'Operational'
  ).length;
  const openFaultsCount = state.faults.filter(
    (f) => f.siteId === activeSite && f.status !== 'Resolved'
  ).length;

  return (
    <MobileOperatorLayout title="Operator Home">
      <div className="p-4 space-y-5">
        {/* Operator Header Summary */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {currentUser?.roleTitle || 'Equipment Operator'} · {getSiteName(activeSite)}
              </p>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {currentUser?.name || 'James Wilson'}
              </h2>
            </div>

            <select
              aria-label="Switch active site"
              value={activeSite}
              onChange={(e) => setSelectedSite(e.target.value as 'canning-vale' | 'jandakot')}
              className="min-h-[38px] px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="canning-vale">Canning Vale</option>
              <option value="jandakot">Jandakot</option>
            </select>
          </div>

          {/* 4-Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Assigned</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {displayEquipment.length}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3">
              <div className="text-xs text-emerald-700">Completed Today</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                {completedTodayCount}
              </div>
            </div>
            <div className="rounded-xl bg-amber-50/70 p-3">
              <div className="text-xs text-amber-800">Pending Pre-Start</div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-0.5">
                {pendingTodayCount}
              </div>
            </div>
            <div className="rounded-xl bg-red-50/70 p-3">
              <div className="text-xs text-red-700">Site Open Faults</div>
              <div className="text-xl font-bold font-mono tabular-nums text-red-700 mt-0.5">
                {openFaultsCount}
              </div>
            </div>
          </div>
        </section>

        {/* Prominent Primary QR Scan Action */}
        <button
          type="button"
          onClick={() => navigate('/operator/scan')}
          className="w-full min-h-[54px] rounded-2xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white px-5 py-3.5 flex items-center justify-between transition-all shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Scan QR Code</div>
              <div className="text-xs text-blue-100">
                Scan machine asset tag to begin pre-start
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-100 shrink-0" />
        </button>

        {/* Assigned Equipment Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Your Assigned Equipment ({getSiteName(activeSite)})
            </h3>
            <Link
              to="/operator/equipment"
              className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              View All ({siteEquipment.length})
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayEquipment.map((eq) => {
              const doneToday = isToday(eq.lastInspectionAt);
              const isOnHold = eq.status === 'On Hold';
              return (
                <Link
                  key={eq.id}
                  to={`/equipment/${eq.id}`}
                  className={`rounded-2xl bg-white border p-3.5 transition-colors flex flex-col gap-3 ${
                    isOnHold
                      ? 'border-red-300 bg-red-50/20'
                      : 'border-slate-200 hover:border-blue-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <EquipmentImage
                      src={eq.imageUrl}
                      alt={eq.name}
                      type={eq.type}
                      className="w-20 h-16 rounded-xl shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{eq.name}</h4>
                          <p className="text-xs text-slate-500 font-mono tabular-nums">
                            {eq.id} · {eq.type} · {getSiteName(eq.siteId)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <EquipmentStatusLabel status={eq.status} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isOnHold ? (
                      <span className="font-semibold text-red-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ON HOLD — DO NOT OPERATE
                      </span>
                    ) : doneToday ? (
                      <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Pre-start completed today
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Pre-start pending today
                      </span>
                    )}
                    <span className="text-slate-500 font-mono tabular-nums">
                      {formatRelativeTime(eq.lastInspectionAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </MobileOperatorLayout>
  );
}
