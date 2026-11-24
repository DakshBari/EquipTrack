import { useState } from 'react';
import { CalendarClock, CheckCircle2, ExternalLink, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaultStatusLabel, ServiceBadge, SeverityText } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { SERVICE_INTERVAL_HOURS } from '../../data/seedData';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import {
  formatDateTime,
  getServiceStatus,
  getSiteName,
  SERVICE_DUE_SOON_HOURS,
} from '../../utils/formatters';

export function SupervisorMaintenancePage() {
  const { state, selectedSite, recordService } = useEquipTrack();
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);

  // Overdue first, then the ones closest to due.
  const serviceDue = state.equipment
    .filter((eq) => (selectedSite === 'all' ? true : eq.siteId === selectedSite))
    .filter((eq) => getServiceStatus(eq).state !== 'ok')
    .sort((a, b) => getServiceStatus(a).remaining - getServiceStatus(b).remaining);

  const faults = state.faults.filter((f) =>
    selectedSite === 'all' ? true : f.siteId === selectedSite
  );

  const rtsQueue = faults.filter(
    (f) =>
      f.status === 'Maintenance Completed' ||
      f.status === 'Awaiting Return-to-Service Approval'
  );

  const activeMaintenance = faults.filter((f) =>
    ['Scheduled', 'Urgent', 'Acknowledged', 'In Progress'].includes(f.status)
  );

  return (
    <DashboardLayout mode="supervisor" title="Maintenance & Return-to-Service">
      <div className="space-y-6">
        {/* Return-to-Service Approval Queue */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Awaiting Return-to-Service Approval ({rtsQueue.length})
              </h2>
              <p className="text-xs text-slate-500">
                Verify contractor completion notes and photos before lifting equipment holds
              </p>
            </div>
          </div>

          {rtsQueue.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-6 text-center text-sm text-slate-500">
              No equipment currently awaiting return-to-service approval.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {rtsQueue.map((fault) => {
                const contact = state.maintenanceContacts.find(
                  (c) => c.id === fault.assignedContactId
                );
                return (
                  <div
                    key={fault.id}
                    className="rounded-xl border border-amber-300 bg-amber-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {fault.id} · {fault.equipmentName} ({fault.equipmentId})
                      </span>
                      <FaultStatusLabel status={fault.status} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{fault.failedItem}</p>
                    {fault.completionSummary && (
                      <p className="text-xs text-slate-700">{fault.completionSummary}</p>
                    )}
                    <div className="text-xs text-slate-500">
                      {getSiteName(fault.siteId)} · Contractor: {contact?.name || 'Assigned'} ·
                      Completed {formatDateTime(fault.completedAt || fault.reportedAt)}
                    </div>
                    <Link
                      to={`/supervisor/faults/${fault.id}`}
                      className="inline-flex min-h-[40px] px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold items-center justify-center"
                    >
                      Review & Approve Return to Service
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Scheduled (hour-meter based) servicing */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Scheduled Servicing Due ({serviceDue.length})
              </h2>
              <p className="text-xs text-slate-500">
                Machines within {SERVICE_DUE_SOON_HOURS} hrs of, or past, their {SERVICE_INTERVAL_HOURS}-hour service
              </p>
            </div>
          </div>

          {serviceNotice && (
            <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
              {serviceNotice}
            </div>
          )}

          {serviceDue.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-6 text-center text-sm text-slate-500">
              No scheduled services due.
            </div>
          ) : (
            <div className="space-y-2.5">
              {serviceDue.map((eq) => {
                const svc = getServiceStatus(eq);
                return (
                  <div
                    key={eq.id}
                    className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/supervisor/equipment/${eq.id}`}
                          className="text-sm font-bold text-slate-900 hover:text-blue-700"
                        >
                          {eq.name} <span className="text-xs font-mono text-slate-500">({eq.id})</span>
                        </Link>
                        <ServiceBadge equipment={eq} />
                      </div>
                      <div className="text-xs text-slate-500">
                        {getSiteName(eq.siteId)} · Hour meter {eq.hourMeter.toLocaleString()} hrs · Due at{' '}
                        {svc.dueAt?.toLocaleString()} hrs · {eq.status}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        recordService(eq.id);
                        setServiceNotice(
                          `Service recorded for ${eq.id}. Next due at ${(eq.hourMeter + SERVICE_INTERVAL_HOURS).toLocaleString()} hrs.`
                        );
                        setTimeout(() => setServiceNotice(null), 4000);
                      }}
                      className="min-h-[40px] px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Mark Service Done
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Active Maintenance Work Orders */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Active Maintenance Schedule ({activeMaintenance.length})
              </h2>
              <p className="text-xs text-slate-500">
                Monitor contractor acknowledgements, progress notes, and shared links
              </p>
            </div>
          </div>

          {activeMaintenance.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-6 text-center text-sm text-slate-500">
              No active scheduled maintenance jobs.
            </div>
          ) : (
            <div className="space-y-3">
              {activeMaintenance.map((fault) => {
                const contact = state.maintenanceContacts.find(
                  (c) => c.id === fault.assignedContactId
                );
                return (
                  <div
                    key={fault.id}
                    className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {fault.id} · {fault.equipmentId}
                        </span>
                        <FaultStatusLabel status={fault.status} />
                        <SeverityText severity={fault.severity} />
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {fault.equipmentName} — {fault.failedItem}
                      </div>
                      <div className="text-xs text-slate-500">
                        {getSiteName(fault.siteId)} · Assigned: {contact?.name || 'Unassigned'}
                        {fault.plannedDate ? ` · Planned: ${fault.plannedDate}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        to={`/maintenance/fault/${fault.id}`}
                        className="min-h-[38px] px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Contractor View
                      </Link>
                      <Link
                        to={`/supervisor/faults/${fault.id}`}
                        className="min-h-[38px] px-3.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold inline-flex items-center"
                      >
                        Open Fault
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
