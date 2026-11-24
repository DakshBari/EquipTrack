import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SAMPLE_FAULT_PHOTO } from '../../data/seedData';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { MobileOperatorLayout } from '../../layouts/MobileOperatorLayout';
import { ChecklistResponse, FaultRecord, PreStartInspection } from '../../types';
import { formatDateTime, getSiteName } from '../../utils/formatters';

interface ItemDraft {
  status?: 'Pass' | 'Fail';
  notes: string;
  photos: string[];
}

export function PreStartChecklistPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { state, currentUser, submitInspection } = useEquipTrack();
  const navigate = useNavigate();

  const equipment = state.equipment.find(
    (eq) => eq.id.toUpperCase() === (equipmentId || '').toUpperCase()
  );

  const template = equipment ? state.templates[equipment.type] : undefined;

  const [hourMeter, setHourMeter] = useState<string>(
    equipment ? String(equipment.hourMeter) : '0'
  );
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    inspection: PreStartInspection;
    createdFaults: FaultRecord[];
  } | null>(null);

  const items = template?.items || [];

  const completedCount = useMemo(
    () => items.filter((item) => drafts[item.id]?.status === 'Pass' || drafts[item.id]?.status === 'Fail').length,
    [items, drafts]
  );

  const failedCount = useMemo(
    () => items.filter((item) => drafts[item.id]?.status === 'Fail').length,
    [items, drafts]
  );

  if (!equipment || !template) {
    return (
      <MobileOperatorLayout title="Pre-Start Checklist" showBack backTo="/operator">
        <div className="p-6 text-center text-sm text-slate-600">
          Equipment or checklist template not found.
        </div>
      </MobileOperatorLayout>
    );
  }

  if (equipment.status === 'On Hold' && !submissionResult) {
    return (
      <MobileOperatorLayout
        title={`Pre-Start · ${equipment.id}`}
        showBack
        backTo={`/equipment/${equipment.id}`}
      >
        <div className="p-4">
          <div className="rounded-2xl bg-red-50 border border-red-300 p-5 space-y-3">
            <h2 className="text-base font-bold text-red-800">ON HOLD — DO NOT OPERATE</h2>
            <p className="text-sm text-red-700">
              {equipment.name} ({equipment.id}) is currently on safety hold. Operators cannot start a
              pre-start inspection until maintenance is completed and return-to-service is approved.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/equipment/${equipment.id}`)}
              className="min-h-[44px] px-4 rounded-xl bg-red-700 text-white text-sm font-semibold"
            >
              Return to Equipment Page
            </button>
          </div>
        </div>
      </MobileOperatorLayout>
    );
  }

  const updateDraft = (itemId: string, patch: Partial<ItemDraft>) => {
    setValidationError(null);
    setDrafts((prev) => ({
      ...prev,
      [itemId]: {
        status: prev[itemId]?.status,
        notes: prev[itemId]?.notes || '',
        photos: prev[itemId]?.photos || [],
        ...patch,
      },
    }));
  };

  const handlePhotoUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDrafts((prev) => {
            const current = prev[itemId] || { notes: '', photos: [] };
            return {
              ...prev,
              [itemId]: {
                ...current,
                photos: [...current.photos, reader.result as string],
              },
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAttachSamplePhoto = (itemId: string) => {
    setValidationError(null);
    setDrafts((prev) => {
      const current = prev[itemId] || { notes: '', photos: [] };
      return {
        ...prev,
        [itemId]: {
          ...current,
          photos: [...current.photos, SAMPLE_FAULT_PHOTO],
        },
      };
    });
  };

  const handleRemovePhoto = (itemId: string, index: number) => {
    setDrafts((prev) => {
      const current = prev[itemId] || { notes: '', photos: [] };
      return {
        ...prev,
        [itemId]: {
          ...current,
          photos: current.photos.filter((_, i) => i !== index),
        },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const unansweredMandatory = items.filter(
      (item) => item.mandatory && !drafts[item.id]?.status
    );
    if (unansweredMandatory.length > 0) {
      setValidationError(
        `${unansweredMandatory.length} mandatory check(s) still require a Pass or Fail answer (e.g. "${unansweredMandatory[0].label}").`
      );
      return;
    }

    const missingNotes = items.find(
      (item) =>
        drafts[item.id]?.status === 'Fail' &&
        item.requireNotesOnFail &&
        !drafts[item.id]?.notes.trim()
    );
    if (missingNotes) {
      setValidationError(`Please add fault notes for failed check "${missingNotes.label}".`);
      return;
    }

    const responses: ChecklistResponse[] = items
      .filter((item) => drafts[item.id]?.status)
      .map((item) => ({
        itemId: item.id,
        label: item.label,
        category: item.category,
        status: drafts[item.id].status as 'Pass' | 'Fail',
        notes: drafts[item.id].notes.trim() || undefined,
        photos: drafts[item.id].photos || [],
      }));

    const res = submitInspection({
      equipmentId: equipment.id,
      hourMeterReading: Number(hourMeter) || equipment.hourMeter,
      responses,
    });

    setSubmissionResult(res);
  };

  if (submissionResult) {
    const { inspection, createdFaults } = submissionResult;
    const isFail = inspection.result === 'Fail';
    return (
      <MobileOperatorLayout title="Inspection Submitted" hideBottomNav>
        <div className="p-4 max-w-lg mx-auto space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center space-y-3">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                isFail ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isFail ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="text-xs font-mono text-slate-500">{inspection.id}</div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {isFail
                  ? 'Pre-Start Submitted — Fault Reported'
                  : 'Pre-Start Inspection Passed'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {inspection.equipmentName} ({inspection.equipmentId}) · {getSiteName(inspection.siteId)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-600 space-y-1 text-left">
              <div className="flex justify-between">
                <span>Operator:</span>
                <span className="font-semibold text-slate-900">{inspection.operatorName}</span>
              </div>
              <div className="flex justify-between">
                <span>Submitted:</span>
                <span className="font-mono tabular-nums text-slate-900">
                  {formatDateTime(inspection.submittedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Checks Completed:</span>
                <span className="font-mono tabular-nums text-slate-900">
                  {inspection.responses.length} / {items.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Failed Items:</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    isFail ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {inspection.failedCount}
                </span>
              </div>
            </div>

            {createdFaults.length > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-left space-y-1.5">
                <div className="text-xs font-bold text-red-800">
                  Automatic Fault Report Created & Sent to Supervisor
                </div>
                {createdFaults.map((f) => (
                  <div key={f.id} className="text-xs text-red-700">
                    <span className="font-mono font-bold">{f.id}</span> · {f.failedItem}:{' '}
                    {f.description}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                to="/operator"
                className="min-h-[46px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold flex items-center justify-center"
              >
                Back to Home
              </Link>
              <Link
                to={`/operator/history/${inspection.id}`}
                className="min-h-[46px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center justify-center"
              >
                View Submission
              </Link>
            </div>
          </div>
        </div>
      </MobileOperatorLayout>
    );
  }

  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <MobileOperatorLayout
      title={`${equipment.id} Pre-Start`}
      showBack
      backTo={`/equipment/${equipment.id}`}
      hideBottomNav
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Sticky Progress Header */}
        <div className="sticky top-12 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-900 tabular-nums">
              {completedCount} of {items.length} checks completed
            </span>
            <span className="text-slate-500 font-mono tabular-nums">
              {failedCount > 0 ? (
                <span className="text-red-700 font-semibold">{failedCount} failed</span>
              ) : (
                `${progressPct}%`
              )}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                failedCount > 0 ? 'bg-amber-500' : 'bg-blue-700'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Machine & Hour Meter Context */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">
                {equipment.type} · {getSiteName(equipment.siteId)} · {currentUser?.name}
              </div>
              <div className="text-base font-bold text-slate-900">
                {equipment.name} ({equipment.id})
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="hour-meter" className="text-xs font-semibold text-slate-600">
                Hour Meter
              </label>
              <input
                id="hour-meter"
                type="number"
                value={hourMeter}
                onChange={(e) => setHourMeter(e.target.value)}
                className="w-24 min-h-[38px] px-2.5 rounded-xl border border-slate-200 text-sm font-mono tabular-nums text-slate-900 text-right"
              />
            </div>
          </div>

          {/* Checklist Items */}
          {items.map((item, idx) => {
            const draft = drafts[item.id] || { notes: '', photos: [] };
            const isFail = draft.status === 'Fail';
            const isPass = draft.status === 'Pass';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition-colors space-y-3 ${
                  isFail
                    ? 'bg-red-50/40 border-red-300'
                    : isPass
                    ? 'bg-emerald-50/20 border-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      {String(idx + 1).padStart(2, '0')} · {item.category}
                      {item.mandatory ? ' · Mandatory' : ''}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{item.label}</h3>
                  </div>

                  {isFail && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Fault
                    </span>
                  )}
                </div>

                {/* Large Touch Pass / Fail Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => updateDraft(item.id, { status: 'Pass' })}
                    className={`min-h-[46px] rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      isPass
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Pass
                  </button>

                  <button
                    type="button"
                    onClick={() => updateDraft(item.id, { status: 'Fail' })}
                    className={`min-h-[46px] rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      isFail
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Fail
                  </button>
                </div>

                {/* Expandable Fault Notes & Photos when Failed */}
                {isFail && (
                  <div className="pt-2 border-t border-red-200/70 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-red-900 mb-1">
                        Fault Description / Operator Notes
                        {item.requireNotesOnFail ? ' (Required)' : ' (Optional)'}
                      </label>
                      <textarea
                        rows={2}
                        value={draft.notes}
                        onChange={(e) => updateDraft(item.id, { notes: e.target.value })}
                        placeholder="Describe the defect, leak, noise, or safety concern..."
                        className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-red-900">
                        Fault Photographs ({draft.photos.length} attached)
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <label className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-2 cursor-pointer">
                          <Camera className="w-4 h-4 text-blue-700" />
                          <span>Capture / Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={(e) => handlePhotoUpload(item.id, e)}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleAttachSamplePhoto(item.id)}
                          className="min-h-[42px] px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 flex items-center gap-2"
                        >
                          <ImagePlus className="w-4 h-4" />
                          <span>Attach Demo Fault Photo</span>
                        </button>
                      </div>

                      {draft.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {draft.photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white"
                            >
                              <img
                                src={photo}
                                alt={`Fault evidence ${pIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(item.id, pIdx)}
                                aria-label="Remove photo"
                                className="absolute top-1 right-1 w-6 h-6 rounded-md bg-slate-900/75 text-white flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {validationError && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-800"
            >
              {validationError}
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2 pb-4">
            <button
              type="submit"
              className="w-full min-h-[50px] rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold shadow-sm transition-colors"
            >
              Submit Pre-Start Inspection ({completedCount}/{items.length})
            </button>
          </div>
        </div>
      </form>
    </MobileOperatorLayout>
  );
}
