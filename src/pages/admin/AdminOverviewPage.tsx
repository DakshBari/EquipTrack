import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';

export function AdminOverviewPage() {
  const { state } = useEquipTrack();

  const totalOperators = state.users.filter((u) => u.role === 'operator' && u.active).length;
  const totalSupervisors = state.users.filter((u) => u.role === 'supervisor' && u.active).length;
  const openFaults = state.faults.filter((f) => f.status !== 'Resolved').length;

  const canningValeCount = state.equipment.filter((e) => e.siteId === 'canning-vale').length;
  const jandakotCount = state.equipment.filter((e) => e.siteId === 'jandakot').length;

  // Simulated storage usage based on records + photos
  const photoCount = useMemo(() => {
    let count = 0;
    state.inspections.forEach((i) =>
      i.responses.forEach((r) => {
        count += r.photos.length;
      })
    );
    state.faults.forEach((f) => {
      count += f.photos.length + f.completionPhotos.length;
    });
    return count;
  }, [state.inspections, state.faults]);

  const simulatedMb = (14.2 + photoCount * 1.4).toFixed(1);

  const siteFleetData = [
    {
      site: 'Canning Vale',
      Forklifts: state.equipment.filter((e) => e.siteId === 'canning-vale' && e.type === 'Forklift').length,
      Balers: state.equipment.filter((e) => e.siteId === 'canning-vale' && e.type === 'Baler').length,
      Loaders: state.equipment.filter((e) => e.siteId === 'canning-vale' && e.type === 'Loader').length,
      Trucks: state.equipment.filter((e) => e.siteId === 'canning-vale' && e.type === 'Truck').length,
    },
    {
      site: 'Jandakot',
      Forklifts: state.equipment.filter((e) => e.siteId === 'jandakot' && e.type === 'Forklift').length,
      Balers: state.equipment.filter((e) => e.siteId === 'jandakot' && e.type === 'Baler').length,
      Loaders: state.equipment.filter((e) => e.siteId === 'jandakot' && e.type === 'Loader').length,
      Trucks: state.equipment.filter((e) => e.siteId === 'jandakot' && e.type === 'Truck').length,
    },
  ];

  return (
    <DashboardLayout mode="admin" title="Organisation Overview">
      <div className="space-y-6">
        {/* Organisation Metrics */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total Equipment</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {state.equipment.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              CV: {canningValeCount} · JAN: {jandakotCount}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Active Operators</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {totalOperators}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across 2 WA sites</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Supervisors</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {totalSupervisors}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Shift & site leads</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total Inspections</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
              {state.inspections.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Historical & live</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Open Faults</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {openFaults}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Active triage queue</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Storage Used (Sim.)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {simulatedMb} MB
            </div>
            <div className="text-[11px] text-slate-500 mt-1">of 500 MB quota</div>
          </div>
        </section>

        {/* Fleet Chart + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-900">Fleet Distribution by Site & Type</h2>
            <p className="text-xs text-slate-500 mb-4">
              Registered industrial machinery across Canning Vale and Jandakot
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={siteFleetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="Forklifts" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Balers" fill="#0F172A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Loaders" fill="#D97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Trucks" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Administration Shortcuts</h2>
            <div className="space-y-2">
              <Link
                to="/admin/equipment"
                className="block rounded-xl border border-slate-200 hover:border-blue-700 p-3 transition-colors"
              >
                <div className="text-sm font-semibold text-slate-900">Manage Equipment & QR Tags</div>
                <div className="text-xs text-slate-500">Add assets and print yard QR stickers</div>
              </Link>
              <Link
                to="/admin/templates"
                className="block rounded-xl border border-slate-200 hover:border-blue-700 p-3 transition-colors"
              >
                <div className="text-sm font-semibold text-slate-900">Checklist Templates</div>
                <div className="text-xs text-slate-500">
                  Configure mandatory checks & photo rules
                </div>
              </Link>
              <Link
                to="/admin/users"
                className="block rounded-xl border border-slate-200 hover:border-blue-700 p-3 transition-colors"
              >
                <div className="text-sm font-semibold text-slate-900">Users & Roles</div>
                <div className="text-xs text-slate-500">
                  Manage {state.users.length} operator, supervisor & admin accounts
                </div>
              </Link>
              <Link
                to="/admin/reports"
                className="block rounded-xl border border-slate-200 hover:border-blue-700 p-3 transition-colors"
              >
                <div className="text-sm font-semibold text-slate-900">Export Compliance CSVs</div>
                <div className="text-xs text-slate-500">Inspections, faults & downtime reports</div>
              </Link>
            </div>
          </section>
        </div>

        {/* Recent Organisation Activity */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Recent Organisation Activity</h2>
          <ActivityTimeline events={state.activities.slice(0, 8)} />
        </section>
      </div>
    </DashboardLayout>
  );
}
