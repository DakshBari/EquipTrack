import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { MobileOperatorLayout } from '../../layouts/MobileOperatorLayout';
import { formatDateTime, getSiteName } from '../../utils/formatters';

export function OperatorHistoryPage() {
  const { inspectionId } = useParams<{ inspectionId?: string }>();
  const { state, currentUser } = useEquipTrack();
  const [filter, setFilter] = useState<'all' | 'Pass' | 'Fail'>('all');

  if (inspectionId) {
    const inspection = state.inspections.find((i) => i.id === inspectionId);
    if (!inspection) {
      return (
        <MobileOperatorLayout title="Inspection Detail" showBack backTo="/operator/history">
          <div className="p-6 text-center text-sm text-slate-500">Inspection record not found.</div>
        </MobileOperatorLayout>
      );
    }

    return (
      <MobileOperatorLayout title={inspection.id} showBack backTo="/operator/history">
        <div className="p-4 space-y-4">
          <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-mono text-slate-500">{inspection.id}</div>
                <h2 className="text-lg font-bold text-slate-900">
                  {inspection.equipmentName} ({inspection.equipmentId})
                </h2>
                <p className="text-xs text-slate-500">
                  {getSiteName(inspection.siteId)} · {inspection.operatorName}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                  inspection.result === 'Pass'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {inspection.result === 'Pass' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                {inspection.result}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-600">
              <span>Submitted: {formatDateTime(inspection.submittedAt)}</span>
              <span className="font-mono tabular-nums">
                {inspection.hourMeterReading.toLocaleString()} hrs
              </span>
            </div>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 px-1">
              Checklist Responses ({inspection.responses.length})
            </h3>
            {inspection.responses.map((resp, idx) => (
              <div
                key={resp.itemId}
                className={`rounded-2xl border p-3.5 space-y-2 ${
                  resp.status === 'Fail'
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {idx + 1}. {resp.label}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      resp.status === 'Pass' ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {resp.status}
                  </span>
                </div>
                {resp.notes && <p className="text-xs text-red-800">{resp.notes}</p>}
                {resp.photos && resp.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {resp.photos.map((photo, pIdx) => (
                      <img
                        key={pIdx}
                        src={photo}
                        alt={`Checklist attachment ${pIdx + 1}`}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>
      </MobileOperatorLayout>
    );
  }

  const operatorInspections = state.inspections.filter((i) =>
    currentUser?.role === 'operator' ? i.operatorId === currentUser.id : true
  );

  const visibleInspections = operatorInspections.filter((i) =>
    filter === 'all' ? true : i.result === filter
  );

  return (
    <MobileOperatorLayout title="Inspection History">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          {(['all', 'Pass', 'Fail'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`flex-1 min-h-[38px] rounded-lg text-xs font-semibold transition-colors ${
                filter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {tab === 'all' ? 'All Submissions' : `${tab}ed`}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {visibleInspections.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
              No inspection history matching this filter.
            </div>
          ) : (
            visibleInspections.map((insp) => (
              <Link
                key={insp.id}
                to={`/operator/history/${insp.id}`}
                className="block rounded-2xl bg-white border border-slate-200 hover:border-blue-700 p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      {insp.id} · {insp.equipmentId}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {insp.equipmentName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(insp.submittedAt)} · {getSiteName(insp.siteId)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        insp.result === 'Pass'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {insp.result === 'Pass' ? 'Passed' : `${insp.failedCount} Fault`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </MobileOperatorLayout>
  );
}
