import { Download } from 'lucide-react';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { downloadCsv } from '../../utils/csvExport';
import { formatDateTime, getSiteName } from '../../utils/formatters';

export function ReportsPage({ mode }: { mode: 'supervisor' | 'admin' }) {
  const { state, selectedSite } = useEquipTrack();

  const inspections = state.inspections.filter((i) =>
    selectedSite === 'all' ? true : i.siteId === selectedSite
  );
  const faults = state.faults.filter((f) =>
    selectedSite === 'all' ? true : f.siteId === selectedSite
  );
  const equipment = state.equipment.filter((e) =>
    selectedSite === 'all' ? true : e.siteId === selectedSite
  );

  const exportInspectionsCsv = () => {
    downloadCsv(
      'equiptrack-inspections.csv',
      ['Reference', 'Equipment ID', 'Equipment Name', 'Type', 'Site', 'Operator', 'Result', 'Failed Checks', 'Submitted At'],
      inspections.map((i) => [
        i.id,
        i.equipmentId,
        i.equipmentName,
        i.equipmentType,
        getSiteName(i.siteId),
        i.operatorName,
        i.result,
        i.failedCount,
        formatDateTime(i.submittedAt),
      ])
    );
  };

  const exportFaultsCsv = () => {
    downloadCsv(
      'equiptrack-faults.csv',
      ['Fault ID', 'Equipment ID', 'Site', 'Failed Item', 'Severity', 'Status', 'Reported By', 'Reported At', 'Resolved At'],
      faults.map((f) => [
        f.id,
        f.equipmentId,
        getSiteName(f.siteId),
        f.failedItem,
        f.severity,
        f.status,
        f.reportedByName,
        formatDateTime(f.reportedAt),
        f.rtsApprovedAt ? formatDateTime(f.rtsApprovedAt) : '',
      ])
    );
  };

  const exportFleetCsv = () => {
    downloadCsv(
      'equiptrack-fleet-status.csv',
      ['Equipment ID', 'Name', 'Type', 'Site', 'Manufacturer', 'Model', 'Status', 'Hour Meter', 'Last Inspection'],
      equipment.map((e) => [
        e.id,
        e.name,
        e.type,
        getSiteName(e.siteId),
        e.manufacturer,
        e.model,
        e.status,
        e.hourMeter,
        formatDateTime(e.lastInspectionAt),
      ])
    );
  };

  const passRate =
    inspections.length > 0
      ? Math.round(
          (inspections.filter((i) => i.result === 'Pass').length / inspections.length) * 100
        )
      : 100;

  const siteSummaries = state.sites.map((site) => {
    const siteEq = state.equipment.filter((e) => e.siteId === site.id);
    const siteInsp = state.inspections.filter((i) => i.siteId === site.id);
    const siteFaults = state.faults.filter((f) => f.siteId === site.id);
    return {
      site,
      totalEq: siteEq.length,
      operational: siteEq.filter((e) => e.status === 'Operational').length,
      restricted: siteEq.filter((e) => e.status !== 'Operational').length,
      inspectionsCount: siteInsp.length,
      openFaults: siteFaults.filter((f) => f.status !== 'Resolved').length,
      resolvedFaults: siteFaults.filter((f) => f.status === 'Resolved').length,
    };
  });

  const restrictedEquipment = equipment.filter((e) => e.status !== 'Operational');

  return (
    <DashboardLayout mode={mode} title="Operational Reports & Exports">
      <div className="space-y-6">
        {/* Export Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inspection Compliance Report</h2>
              <p className="text-xs text-slate-500 mt-1">
                {inspections.length} pre-start records · {passRate}% overall pass rate
              </p>
            </div>
            <button
              type="button"
              onClick={exportInspectionsCsv}
              className="min-h-[42px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Inspections CSV
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fault & Maintenance Report</h2>
              <p className="text-xs text-slate-500 mt-1">
                {faults.length} fault records ·{' '}
                {faults.filter((f) => f.status !== 'Resolved').length} open
              </p>
            </div>
            <button
              type="button"
              onClick={exportFaultsCsv}
              className="min-h-[42px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Faults CSV
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Equipment & Downtime Summary</h2>
              <p className="text-xs text-slate-500 mt-1">
                {equipment.length} assets · {restrictedEquipment.length} restricted / offline
              </p>
            </div>
            <button
              type="button"
              onClick={exportFleetCsv}
              className="min-h-[42px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Fleet CSV
            </button>
          </div>
        </section>

        {/* Site-Level Summary Table */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Site-Level Performance Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Supervisor</th>
                  <th className="py-3 px-4 text-right">Fleet Size</th>
                  <th className="py-3 px-4 text-right">Operational</th>
                  <th className="py-3 px-4 text-right">Downtime / Hold</th>
                  <th className="py-3 px-4 text-right">Inspections</th>
                  <th className="py-3 px-4 text-right">Open Faults</th>
                  <th className="py-3 px-4 text-right">Resolved Faults</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {siteSummaries.map((row) => (
                  <tr key={row.site.id}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.site.name}</td>
                    <td className="py-3 px-4 text-slate-600">{row.site.managerName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{row.totalEq}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                      {row.operational}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-red-700 font-semibold">
                      {row.restricted}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {row.inspectionsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700 font-semibold">
                      {row.openFaults}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {row.resolvedFaults}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Maintenance Contractor Performance */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Maintenance Contractor Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Contractor</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Specialty</th>
                  <th className="py-3 px-4 text-right">Assigned Faults</th>
                  <th className="py-3 px-4 text-right">Completed / Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {state.maintenanceContacts.map((mc) => {
                  const assigned = state.faults.filter((f) => f.assignedContactId === mc.id);
                  const completed = assigned.filter((f) =>
                    [
                      'Maintenance Completed',
                      'Awaiting Return-to-Service Approval',
                      'Resolved',
                    ].includes(f.status)
                  );
                  return (
                    <tr key={mc.id}>
                      <td className="py-3 px-4 font-semibold text-slate-900">{mc.name}</td>
                      <td className="py-3 px-4 text-slate-600">{mc.company}</td>
                      <td className="py-3 px-4 text-slate-600">{mc.specialty}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {assigned.length}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {completed.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
