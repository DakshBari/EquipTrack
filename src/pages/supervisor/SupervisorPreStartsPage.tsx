import { useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Eye, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EquipmentType, PreStartInspection } from '../../types';
import { formatDateTime, getSiteName } from '../../utils/formatters';

export function SupervisorPreStartsPage() {
  const { state, selectedSite } = useEquipTrack();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'Pass' | 'Fail'>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<PreStartInspection | null>(null);

  const operators = state.users.filter((u) => u.role === 'operator');

  const filtered = state.inspections.filter((insp) => {
    if (selectedSite !== 'all' && insp.siteId !== selectedSite) return false;
    if (typeFilter !== 'all' && insp.equipmentType !== typeFilter) return false;
    if (resultFilter !== 'all' && insp.result !== resultFilter) return false;
    if (operatorFilter !== 'all' && insp.operatorId !== operatorFilter) return false;
    if (dateFrom && insp.submittedAt.slice(0, 10) < dateFrom) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        insp.id.toLowerCase().includes(q) ||
        insp.equipmentId.toLowerCase().includes(q) ||
        insp.equipmentName.toLowerCase().includes(q) ||
        insp.operatorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout mode="supervisor" title="Pre-Start Inspections">
      <div className="space-y-5">
        {/* Filters */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, equipment ID, operator..."
                className="w-full min-h-[42px] pl-10 pr-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <select
              aria-label="Filter by equipment type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EquipmentType | 'all')}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Types</option>
              <option value="Forklift">Forklift</option>
              <option value="Baler">Baler</option>
              <option value="Loader">Loader</option>
              <option value="Truck">Truck</option>
            </select>

            <select
              aria-label="Filter by operator"
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Operators</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                aria-label="Filter by result"
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value as 'all' | 'Pass' | 'Fail')}
                className="flex-1 min-h-[42px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="all">All Results</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
              <input
                type="date"
                aria-label="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="min-h-[42px] px-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              />
            </div>
          </div>
        </section>

        {/* Submissions: cards on mobile, table on desktop */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">
              Inspection Records ({filtered.length})
            </h2>
            <Link
              to="/supervisor/reports"
              className="min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-blue-700 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4" />
              Reports & Export
            </Link>
          </div>

          <ul className="md:hidden divide-y divide-slate-100">
            {filtered.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-500">No inspections match these filters.</li>
            )}
            {filtered.map((insp) => (
              <li key={insp.id}>
                <button
                  type="button"
                  onClick={() => setSelectedInspection(insp)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {insp.equipmentName}{' '}
                      <span className="font-mono text-xs text-slate-500">({insp.equipmentId})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {insp.operatorName} · {getSiteName(insp.siteId)}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                      {formatDateTime(insp.submittedAt)} · {insp.id}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 ${
                      insp.result === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {insp.result === 'Pass' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {insp.result === 'Pass' ? 'Pass' : `${insp.failedCount} failed`}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Failed</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((insp) => (
                  <tr
                    key={insp.id}
                    onClick={() => setSelectedInspection(insp)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {insp.id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{insp.equipmentName}</div>
                      <div className="text-xs font-mono text-slate-500">
                        {insp.equipmentId} · {insp.equipmentType}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {insp.operatorName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {getSiteName(insp.siteId)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                      {formatDateTime(insp.submittedAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                          insp.result === 'Pass'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {insp.result === 'Pass' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {insp.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-semibold text-slate-900">
                      {insp.failedCount}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {insp.reviewStatus}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInspection(insp);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-slate-500">{selectedInspection.id}</div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedInspection.equipmentName} ({selectedInspection.equipmentId})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs">
                <div>
                  <span className="text-slate-500 block">Operator</span>
                  <span className="font-semibold text-slate-900">
                    {selectedInspection.operatorName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Site</span>
                  <span className="font-semibold text-slate-900">
                    {getSiteName(selectedInspection.siteId)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submitted</span>
                  <span className="font-mono text-slate-900">
                    {formatDateTime(selectedInspection.submittedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hour Meter</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {selectedInspection.hourMeterReading.toLocaleString()} hrs
                  </span>
                </div>
              </div>

              {selectedInspection.notes && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs">
                  <div className="font-semibold text-blue-900">Operator observations</div>
                  <p className="text-blue-900 mt-0.5 whitespace-pre-line">{selectedInspection.notes}</p>
                </div>
              )}

              <div className="space-y-2.5">
                {selectedInspection.responses.map((resp, idx) => (
                  <div
                    key={resp.itemId}
                    className={`rounded-xl border p-3.5 space-y-2 ${
                      resp.status === 'Fail'
                        ? 'bg-red-50/40 border-red-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {idx + 1}. {resp.label}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          resp.status === 'Pass' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {resp.status}
                      </span>
                    </div>
                    {resp.notes && <p className="text-xs text-red-800">{resp.notes}</p>}
                    {resp.status === 'Fail' &&
                      (() => {
                        const linkedFault = state.faults.find(
                          (f) =>
                            f.inspectionId === selectedInspection.id && f.failedItem === resp.label
                        );
                        return linkedFault ? (
                          <Link
                            to={`/supervisor/faults/${linkedFault.id}`}
                            className="inline-flex min-h-[36px] items-center gap-1.5 px-3 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            Open fault {linkedFault.id} · {linkedFault.status}
                          </Link>
                        ) : null;
                      })()}
                    {resp.photos && resp.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {resp.photos.map((p, pIdx) => (
                          <img
                            key={pIdx}
                            src={p}
                            alt="Inspection evidence"
                            className="w-24 h-20 rounded-xl object-cover border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
