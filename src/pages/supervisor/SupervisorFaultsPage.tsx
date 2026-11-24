import { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaultStatusLabel, SeverityText } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EquipmentType, FaultSeverity, FaultStatus } from '../../types';
import { formatDateTime, getSiteName } from '../../utils/formatters';

const ALL_FAULT_STATUSES: FaultStatus[] = [
  'Awaiting Review',
  'Urgent',
  'Scheduled',
  'Acknowledged',
  'In Progress',
  'Maintenance Completed',
  'Awaiting Return-to-Service Approval',
  'Resolved',
];

export function SupervisorFaultsPage() {
  const { state, selectedSite } = useEquipTrack();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FaultStatus | 'all' | 'open'>('open');
  const [severityFilter, setSeverityFilter] = useState<FaultSeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');

  const filtered = state.faults.filter((f) => {
    if (selectedSite !== 'all' && f.siteId !== selectedSite) return false;
    if (statusFilter === 'open' && f.status === 'Resolved') return false;
    if (statusFilter !== 'all' && statusFilter !== 'open' && f.status !== statusFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && f.equipmentType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.id.toLowerCase().includes(q) ||
        f.equipmentId.toLowerCase().includes(q) ||
        f.equipmentName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.failedItem.toLowerCase().includes(q) ||
        f.reportedByName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout mode="supervisor" title="Fault Management">
      <div className="space-y-5">
        {/* Filters */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fault ID, machine, description..."
                className="w-full min-h-[42px] pl-10 pr-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <select
              aria-label="Filter by fault status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FaultStatus | 'all' | 'open')}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="open">All Open Faults</option>
              <option value="all">All Statuses (Incl. Resolved)</option>
              {ALL_FAULT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as FaultSeverity | 'all')}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Severities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              aria-label="Filter by equipment type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EquipmentType | 'all')}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Equipment Types</option>
              <option value="Forklift">Forklift</option>
              <option value="Baler">Baler</option>
              <option value="Loader">Loader</option>
              <option value="Truck">Truck</option>
            </select>
          </div>
        </section>

        {/* Fault Cards / Table */}
        <section className="space-y-3">
          <div className="text-xs font-semibold text-slate-500">
            Showing {filtered.length} fault record{filtered.length === 1 ? '' : 's'}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
              No faults match your selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((fault) => {
                const contact = state.maintenanceContacts.find(
                  (c) => c.id === fault.assignedContactId
                );
                const detailPath = `/supervisor/faults/${fault.id}`;

                return (
                  <Link
                    key={fault.id}
                    to={detailPath}
                    className="rounded-2xl bg-white border border-slate-200 hover:border-blue-700 p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {fault.id}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {fault.equipmentName} ({fault.equipmentId})
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-600">{getSiteName(fault.siteId)}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <SeverityText severity={fault.severity} />
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{fault.failedItem}</h3>
                      <p className="text-xs text-slate-600">{fault.description}</p>

                      <div className="text-xs text-slate-500 pt-1">
                        Reported by {fault.reportedByName} · {formatDateTime(fault.reportedAt)}
                        {contact ? ` · Assigned: ${contact.name}` : ' · Unassigned'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <FaultStatusLabel status={fault.status} />
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
