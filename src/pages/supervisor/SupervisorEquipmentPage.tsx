import { useState } from 'react';
import { ArrowLeft, ChevronRight, QrCode, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { EquipmentImage } from '../../components/EquipmentImage';
import { QrCodeModal } from '../../components/QrCodeModal';
import { EquipmentStatusLabel, FaultStatusLabel } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Equipment, EquipmentStatus, EquipmentType } from '../../types';
import { formatDateTime, getSiteName } from '../../utils/formatters';

export function SupervisorEquipmentPage() {
  const { equipmentId } = useParams<{ equipmentId?: string }>();
  const { state, selectedSite, setEquipmentStatusManual } = useEquipTrack();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [qrEquipment, setQrEquipment] = useState<Equipment | null>(null);

  if (equipmentId) {
    const eq = state.equipment.find((e) => e.id === equipmentId);
    if (!eq) {
      return (
        <DashboardLayout mode="supervisor" title="Equipment Not Found">
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
            <Link to="/supervisor/equipment" className="text-blue-700 font-semibold text-sm">
              ← Back to Equipment List
            </Link>
          </div>
        </DashboardLayout>
      );
    }

    const eqFaults = state.faults.filter((f) => f.equipmentId === eq.id);
    const eqInspections = state.inspections.filter((i) => i.equipmentId === eq.id);
    const eqHistory = state.activities.filter((a) => a.equipmentId === eq.id);
    const assignedOp = state.users.find((u) => u.id === eq.assignedOperatorId);

    return (
      <DashboardLayout mode="supervisor" title={`${eq.name} (${eq.id})`}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/supervisor/equipment"
              className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Fleet
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQrEquipment(eq)}
                className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                View / Print QR Tag
              </button>
              <select
                aria-label="Update machine status"
                value={eq.status}
                onChange={(e) => setEquipmentStatusManual(eq.id, e.target.value as EquipmentStatus)}
                className="min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="Operational">Operational</option>
                <option value="On Hold">On Hold</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Awaiting Return-to-Service">Awaiting Return-to-Service</option>
              </select>
            </div>
          </div>

          <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-3 items-stretch">
            <EquipmentImage
              src={eq.imageUrl}
              alt={eq.name}
              type={eq.type}
              className="w-full h-56 md:h-full"
            />
            <div className="md:col-span-2 p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    {eq.id} · {eq.type} · {getSiteName(eq.siteId)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">{eq.name}</h2>
                  <p className="text-sm text-slate-600">
                    {eq.manufacturer} {eq.model} ({eq.year})
                  </p>
                </div>
                <EquipmentStatusLabel status={eq.status} />
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <dt className="text-slate-500">Serial Number</dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-0.5">{eq.serialNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Hour Meter</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                    {eq.hourMeter.toLocaleString()} hrs
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Assigned Operator</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {assignedOp?.name || 'Pool'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Last Inspection</dt>
                  <dd className="font-mono text-slate-900 mt-0.5">
                    {formatDateTime(eq.lastInspectionAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Total Inspections</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                    {eqInspections.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Recorded Faults</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                    {eqFaults.length}
                  </dd>
                </div>
              </dl>

              {eq.notes && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
                  <div className="font-semibold text-slate-500">Description / Notes</div>
                  <p className="text-slate-800 mt-0.5 whitespace-pre-line">{eq.notes}</p>
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Faults ({eqFaults.length})</h3>
              {eqFaults.length === 0 ? (
                <p className="text-xs text-slate-500">No faults recorded for this asset.</p>
              ) : (
                <div className="space-y-2.5">
                  {eqFaults.map((f) => (
                    <Link
                      key={f.id}
                      to={`/supervisor/faults/${f.id}`}
                      className="block rounded-xl border border-slate-200 hover:border-blue-700 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {f.id} · {f.failedItem}
                        </span>
                        <FaultStatusLabel status={f.status} />
                      </div>
                      <p className="text-xs text-slate-600">{f.description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Equipment Timeline</h3>
              <ActivityTimeline events={eqHistory} />
            </section>
          </div>
        </div>

        {qrEquipment && (
          <QrCodeModal equipment={qrEquipment} onClose={() => setQrEquipment(null)} />
        )}
      </DashboardLayout>
    );
  }

  const filtered = state.equipment.filter((eq) => {
    if (selectedSite !== 'all' && eq.siteId !== selectedSite) return false;
    if (typeFilter !== 'all' && eq.type !== typeFilter) return false;
    if (statusFilter !== 'all' && eq.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        eq.id.toLowerCase().includes(q) ||
        eq.name.toLowerCase().includes(q) ||
        eq.manufacturer.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout mode="supervisor" title="Equipment Management">
      <div className="space-y-5">
        <section className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, name, manufacturer..."
                className="w-full min-h-[42px] pl-10 pr-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <select
              aria-label="Filter equipment type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EquipmentType | 'all')}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Types</option>
              <option value="Forklift">Forklifts</option>
              <option value="Baler">Balers</option>
              <option value="Loader">Loaders</option>
              <option value="Truck">Trucks</option>
            </select>

            <select
              aria-label="Filter equipment status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Operational">Operational</option>
              <option value="On Hold">On Hold</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Awaiting Return-to-Service">Awaiting Return-to-Service</option>
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <ul className="md:hidden divide-y divide-slate-100">
            {filtered.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-500">No equipment matches these filters.</li>
            )}
            {filtered.map((eq) => {
              const openFaults = state.faults.filter(
                (f) => f.equipmentId === eq.id && f.status !== 'Resolved'
              ).length;
              return (
                <li key={eq.id}>
                  <Link
                    to={`/supervisor/equipment/${eq.id}`}
                    className="p-4 flex items-center gap-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {eq.name} <span className="text-xs font-mono text-slate-500">({eq.id})</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {eq.type} · {getSiteName(eq.siteId)} · Last pre-start{' '}
                        {formatDateTime(eq.lastInspectionAt)}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <EquipmentStatusLabel status={eq.status} />
                        {openFaults > 0 && (
                          <span className="text-xs font-semibold text-red-700">
                            {openFaults} open fault{openFaults === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Pre-Start</th>
                  <th className="py-3 px-4 text-right">Open Faults</th>
                  <th className="py-3 px-4">Assigned Operator</th>
                  <th className="py-3 px-4 text-right">QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((eq) => {
                  const openFaults = state.faults.filter(
                    (f) => f.equipmentId === eq.id && f.status !== 'Resolved'
                  ).length;
                  const op = state.users.find((u) => u.id === eq.assignedOperatorId);

                  return (
                    <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Link
                          to={`/supervisor/equipment/${eq.id}`}
                          className="font-semibold text-blue-700 hover:underline flex items-center gap-1.5"
                        >
                          <span>{eq.name}</span>
                          <span className="text-xs font-mono text-slate-500">({eq.id})</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{eq.type}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {getSiteName(eq.siteId)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <EquipmentStatusLabel status={eq.status} />
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {formatDateTime(eq.lastInspectionAt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {openFaults}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {op?.name || 'Pool'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setQrEquipment(eq)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          QR
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {qrEquipment && (
        <QrCodeModal equipment={qrEquipment} onClose={() => setQrEquipment(null)} />
      )}
    </DashboardLayout>
  );
}
