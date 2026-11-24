import { useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SiteLocationMap } from '../../components/SiteLocationMap';
import { EquipmentStatusLabel, FaultStatusLabel } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import {
  describeShiftStart,
  formatDateTime,
  formatRelativeTime,
  getSiteName,
  isToday,
} from '../../utils/formatters';

export function SupervisorOverviewPage() {
  const { state, selectedSite, setSelectedSite } = useEquipTrack();

  const filteredEquipment = useMemo(
    () =>
      selectedSite === 'all'
        ? state.equipment
        : state.equipment.filter((e) => e.siteId === selectedSite),
    [state.equipment, selectedSite]
  );

  const filteredInspections = useMemo(
    () =>
      selectedSite === 'all'
        ? state.inspections
        : state.inspections.filter((i) => i.siteId === selectedSite),
    [state.inspections, selectedSite]
  );

  const filteredFaults = useMemo(
    () =>
      selectedSite === 'all'
        ? state.faults
        : state.faults.filter((f) => f.siteId === selectedSite),
    [state.faults, selectedSite]
  );

  // 9 Required KPIs
  const totalEquipment = filteredEquipment.length;
  const operationalCount = filteredEquipment.filter((e) => e.status === 'Operational').length;
  const onHoldCount = filteredEquipment.filter((e) => e.status === 'On Hold').length;
  const completedTodayCount = filteredInspections.filter((i) => isToday(i.submittedAt)).length;
  const pendingPreStartsCount = filteredEquipment.filter(
    (e) => e.status === 'Operational' && !isToday(e.lastInspectionAt)
  ).length;
  const awaitingReviewCount = filteredFaults.filter((f) => f.status === 'Awaiting Review').length;
  const urgentFaultsCount = filteredFaults.filter((f) => f.status === 'Urgent').length;
  const scheduledMaintenanceCount = filteredFaults.filter((f) =>
    ['Scheduled', 'Acknowledged', 'In Progress'].includes(f.status)
  ).length;
  const resolvedFaultsCount = filteredFaults.filter((f) => f.status === 'Resolved').length;

  // Chart 1: Pre-start completion over last 7 days
  const completionTrendData = useMemo(() => {
    const days: { dateKey: string; label: string; Passed: number; Failed: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      const dateKey = dt.toISOString().slice(0, 10);
      const label = dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
      days.push({ dateKey, label, Passed: 0, Failed: 0 });
    }

    filteredInspections.forEach((insp) => {
      const key = insp.submittedAt.slice(0, 10);
      const bucket = days.find((b) => b.dateKey === key);
      if (bucket) {
        if (insp.result === 'Pass') bucket.Passed += 1;
        else bucket.Failed += 1;
      }
    });
    return days;
  }, [filteredInspections]);

  // Chart 2: Faults by equipment type
  const faultsByTypeData = useMemo(() => {
    const types = ['Forklift', 'Baler', 'Loader', 'Truck'] as const;
    return types.map((type) => ({
      type,
      Open: filteredFaults.filter((f) => f.equipmentType === type && f.status !== 'Resolved').length,
      Resolved: filteredFaults.filter((f) => f.equipmentType === type && f.status === 'Resolved').length,
    }));
  }, [filteredFaults]);

  // Chart 3: Faults by site (always compare Canning Vale vs Jandakot or highlight active)
  const faultsBySiteData = useMemo(
    () => [
      {
        site: 'Canning Vale',
        Faults: state.faults.filter((f) => f.siteId === 'canning-vale').length,
        Urgent: state.faults.filter((f) => f.siteId === 'canning-vale' && f.status === 'Urgent').length,
      },
      {
        site: 'Jandakot',
        Faults: state.faults.filter((f) => f.siteId === 'jandakot').length,
        Urgent: state.faults.filter((f) => f.siteId === 'jandakot' && f.status === 'Urgent').length,
      },
    ],
    [state.faults]
  );

  // Chart 4: Maintenance status distribution
  const maintenanceDistData = useMemo(() => {
    const groups = [
      {
        name: 'Awaiting Review / Urgent',
        value: filteredFaults.filter((f) =>
          ['Awaiting Review', 'Urgent'].includes(f.status)
        ).length,
        color: '#DC2626',
      },
      {
        name: 'Scheduled / In Progress',
        value: filteredFaults.filter((f) =>
          ['Scheduled', 'Acknowledged', 'In Progress'].includes(f.status)
        ).length,
        color: '#1D4ED8',
      },
      {
        name: 'Awaiting RTS Approval',
        value: filteredFaults.filter((f) =>
          ['Maintenance Completed', 'Awaiting Return-to-Service Approval'].includes(f.status)
        ).length,
        color: '#D97706',
      },
      {
        name: 'Resolved',
        value: filteredFaults.filter((f) => f.status === 'Resolved').length,
        color: '#16A34A',
      },
    ].filter((g) => g.value > 0);
    return groups;
  }, [filteredFaults]);

  const restrictedEquipment = filteredEquipment.filter((e) => e.status !== 'Operational');

  // Same rule as the Pending Pre-Starts KPI, listed so the supervisor can follow up.
  const notCheckedToday = filteredEquipment.filter(
    (e) => e.status === 'Operational' && !isToday(e.lastInspectionAt)
  );
  const notCheckedBySite = state.sites
    .map((site) => ({ site, items: notCheckedToday.filter((e) => e.siteId === site.id) }))
    .filter((g) => g.items.length > 0);

  const urgentAndReviewFaults = filteredFaults.filter((f) =>
    ['Urgent', 'Awaiting Review', 'Awaiting Return-to-Service Approval', 'Maintenance Completed'].includes(
      f.status
    )
  );

  return (
    <DashboardLayout mode="supervisor" title="Supervisor Overview">
      <div className="space-y-6">
        {/* Top Priority Banner if Urgent or RTS Pending */}
        {urgentAndReviewFaults.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Supervisor Action Queue ({urgentAndReviewFaults.length})
                </h2>
              </div>
              <Link
                to="/supervisor/faults"
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
              >
                View All Faults
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {urgentAndReviewFaults.slice(0, 6).map((fault) => (
                <Link
                  key={fault.id}
                  to={`/supervisor/faults/${fault.id}`}
                  className="rounded-xl border border-slate-200 hover:border-blue-700 p-3.5 bg-slate-50/50 transition-colors flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {fault.id} · {fault.equipmentId}
                      </span>
                      <FaultStatusLabel status={fault.status} />
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1.5">
                      {fault.failedItem}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{fault.description}</p>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    {getSiteName(fault.siteId)} · {fault.reportedByName} ·{' '}
                    {formatDateTime(fault.reportedAt)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 9 KPI Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total Equipment</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {totalEquipment}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Operational
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              {operationalCount}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-red-700 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              On Hold
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-1">
              {onHoldCount}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-blue-700">Pre-Starts Today</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
              {completedTodayCount}
            </div>
          </div>
          <a
            href="#not-checked"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('not-checked')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="rounded-2xl bg-white border border-slate-200 hover:border-amber-400 p-4 transition-colors"
          >
            <div className="text-xs text-amber-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending Pre-Starts
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {pendingPreStartsCount}
            </div>
            {pendingPreStartsCount > 0 && (
              <div className="text-[11px] font-semibold text-amber-700 mt-0.5">View list ↓</div>
            )}
          </a>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-amber-800 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Awaiting Review
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {awaitingReviewCount}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-red-700">Urgent Faults</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-1">
              {urgentFaultsCount}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-blue-700 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" />
              Scheduled Maint.
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
              {scheduledMaintenanceCount}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 col-span-2 sm:col-span-1">
            <div className="text-xs text-emerald-700">Resolved Faults</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              {resolvedFaultsCount}
            </div>
          </div>
        </section>

        {/* Machines still waiting for today's pre-start, grouped by site */}
        <section
          id="not-checked"
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 scroll-mt-20"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Not Checked Yet Today ({notCheckedToday.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">Operational machines without a pre-start today</span>
          </div>

          {notCheckedToday.length === 0 ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              All operational equipment has been checked today.
            </div>
          ) : (
            <div className="space-y-4">
              {notCheckedBySite.map(({ site, items }) => {
                const shift = describeShiftStart(site.shiftStart);
                return (
                  <div key={site.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                      <span className="font-bold text-slate-700">{site.name}</span>
                      <span className={shift.started ? 'font-semibold text-amber-700' : 'text-slate-500'}>
                        {shift.label}
                      </span>
                    </div>
                    <ul className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {items.map((eq) => {
                        const operator = state.users.find((u) => u.id === eq.assignedOperatorId);
                        return (
                          <li key={eq.id}>
                            <Link
                              to={`/supervisor/equipment/${eq.id}`}
                              className="px-3.5 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-1 hover:bg-slate-50"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 truncate">
                                  {eq.name}{' '}
                                  <span className="text-xs font-mono text-slate-500">({eq.id})</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  Last pre-start {formatRelativeTime(eq.lastInspectionAt)}
                                </div>
                              </div>
                              <div className="text-xs text-right shrink-0">
                                <div className="font-semibold text-slate-800">
                                  {operator?.name || 'Pool allocation'}
                                </div>
                                {operator?.phone && (
                                  <div className="font-mono text-slate-500">{operator.phone}</div>
                                )}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4 Live Recharts Analytics Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900">Pre-Start Submissions (Last 7 Days)</h3>
            <p className="text-xs text-slate-500 mb-4">Daily pass vs fault-raising inspections</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Passed" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Failed" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900">Faults by Equipment Type</h3>
            <p className="text-xs text-slate-500 mb-4">Open vs resolved faults across fleet categories</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faultsByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Open" fill="#D97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Resolved" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900">Faults by Site</h3>
            <p className="text-xs text-slate-500 mb-4">Canning Vale vs Jandakot fault distribution</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faultsBySiteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Faults" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Urgent" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900">Maintenance Status Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of fault triage and repair stages</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maintenanceDistData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {maintenanceDistData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* WA Site Locations Map */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  WA Site Locations & Live Fault Status
                </h3>
                <p className="text-xs text-slate-500">
                  Canning Vale & Jandakot industrial yards · Tap a site pin, or use the site selector above, to filter
                </p>
              </div>
            </div>
          </div>

          <SiteLocationMap
            sites={state.sites}
            equipment={state.equipment}
            faults={state.faults}
            focusedSiteId={selectedSite}
            onSelectSite={(siteId) => setSelectedSite(siteId)}
            heightClass="h-72"
          />
        </section>

        {/* Restricted equipment only. The full fleet lives on the Equipment page. */}
        {restrictedEquipment.length > 0 && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Equipment Out of Service ({restrictedEquipment.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {restrictedEquipment.map((eq) => (
                <Link
                  key={eq.id}
                  to={`/supervisor/equipment/${eq.id}`}
                  className="rounded-xl border border-slate-200 hover:border-blue-700 p-3 space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{eq.id}</span>
                    <EquipmentStatusLabel status={eq.status} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 truncate">{eq.name}</div>
                  <div className="text-xs text-slate-500">
                    {eq.type} · {getSiteName(eq.siteId)}
                  </div>
                </Link>
              ))}
          </div>
        </section>
        )}
      </div>
    </DashboardLayout>
  );
}
