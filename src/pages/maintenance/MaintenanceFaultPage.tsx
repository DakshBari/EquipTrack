import { useState } from 'react';
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Lock,
  MapPin,
  Monitor,
  Play,
  Plus,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EquipmentImage } from '../../components/EquipmentImage';
import { PhotoAttachField } from '../../components/PhotoAttachField';
import { SiteLocationMap } from '../../components/SiteLocationMap';
import { EquipmentStatusLabel, FaultStatusLabel, SeverityText } from '../../components/StatusBadge';
import { VoiceTextInput } from '../../components/VoiceTextInput';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { SAMPLE_FAULT_PHOTO } from '../../data/seedData';
import { formatDateTime, getSiteName } from '../../utils/formatters';

const WORK_NOTE_PHRASES = ['Parts ordered', 'Part replaced', 'Diagnosed fault', 'Awaiting parts', 'Tested OK'];
const COMPLETION_PHRASES = ['Repair completed', 'Functional test passed', 'Area cleaned up', 'Safe to return to service'];

export function MaintenanceFaultPage() {
  const { faultId } = useParams<{ faultId: string }>();
  const {
    state,
    currentUser,
    phoneFrameMode,
    setPhoneFrameMode,
    acknowledgeFault,
    startMaintenanceWork,
    addMaintenanceUpdate,
    completeMaintenanceWork,
    loginAsRole,
  } = useEquipTrack();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const showFrame = phoneFrameMode && isDesktop;

  const fault = state.faults.find(
    (f) => f.id.toUpperCase() === (faultId || '').toUpperCase()
  );
  const equipment = fault
    ? state.equipment.find((e) => e.id === fault.equipmentId)
    : undefined;
  const assignedContact = fault?.assignedContactId
    ? state.maintenanceContacts.find((c) => c.id === fault.assignedContactId)
    : undefined;
  const faultSite = fault ? state.sites.find((s) => s.id === fault.siteId) : undefined;

  const [contractorName, setContractorName] = useState(
    assignedContact?.name || state.maintenanceContacts[0]?.name || 'Michael Brown'
  );
  const [updateNote, setUpdateNote] = useState('');
  const [updatePhotos, setUpdatePhotos] = useState<string[]>([]);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completionSummary, setCompletionSummary] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  if (!fault || !equipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 text-center space-y-3">
          <h1 className="text-lg font-bold text-slate-900">Fault Report Not Found</h1>
          <p className="text-sm text-slate-600">
            The fault link <span className="font-mono">{faultId}</span> does not match an active or
            archived fault record.
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center px-4 rounded-xl bg-blue-700 text-white text-sm font-semibold"
          >
            Return to EquipTrack Login
          </Link>
        </div>
      </div>
    );
  }

  const isCompletedOrResolved =
    fault.status === 'Maintenance Completed' ||
    fault.status === 'Awaiting Return-to-Service Approval' ||
    fault.status === 'Resolved';
  const isAcknowledged = Boolean(fault.acknowledgedAt) || fault.status === 'Acknowledged' || fault.status === 'In Progress';
  const isInProgress = fault.status === 'In Progress';

  const steps = [
    { label: 'Acknowledge', done: isAcknowledged || isCompletedOrResolved },
    { label: 'Start work', done: isInProgress || isCompletedOrResolved || Boolean(fault.startedAt) },
    { label: 'Complete', done: isCompletedOrResolved },
  ];

  const priorFaults = state.faults.filter(
    (f) => f.equipmentId === equipment.id && f.id !== fault.id
  );

  const mobileContent = (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900">
      {/* Compact Sticky Contractor Header */}
      <header className="sticky top-0 z-30 h-12 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Wrench className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="text-sm font-bold text-slate-900 truncate">EquipTrack Maintenance</span>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-600 shrink-0">{fault.id}</span>
      </header>

      <div className="p-4 space-y-4 pb-10">
        {feedbackMsg && (
          <div
            role="status"
            className="sticky top-14 z-20 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 shadow-sm"
          >
            {feedbackMsg}
          </div>
        )}

        {/* Equipment & Fault */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <EquipmentImage
              src={equipment.imageUrl}
              alt={equipment.name}
              type={equipment.type}
              className="w-20 h-16 rounded-xl shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-xs font-mono text-slate-500">
                  {equipment.id} · {getSiteName(fault.siteId)}
                </span>
                <SeverityText severity={fault.severity} />
              </div>
              <h1 className="text-base font-bold text-slate-900 mt-0.5">{equipment.name}</h1>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <FaultStatusLabel status={fault.status} />
                <EquipmentStatusLabel status={equipment.status} />
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Failed Checklist Item</div>
              <div className="font-bold text-slate-900 mt-0.5">{fault.failedItem}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Operator Fault Notes</div>
              <p className="text-slate-800 mt-0.5">{fault.description}</p>
              <div className="text-xs text-slate-500 mt-1">
                Reported by {fault.reportedByName} · {formatDateTime(fault.reportedAt)}
              </div>
            </div>

            {fault.supervisorInstructions && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <div className="text-xs font-bold text-amber-900">Supervisor Instructions</div>
                <p className="text-xs text-amber-800 mt-0.5">{fault.supervisorInstructions}</p>
                {fault.plannedDate && (
                  <p className="text-xs font-semibold text-amber-900 mt-1">Planned: {fault.plannedDate}</p>
                )}
              </div>
            )}

            {fault.photos.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1.5">
                  Fault Photographs ({fault.photos.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {fault.photos.map((photo, idx) => (
                    <a key={idx} href={photo} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photo}
                        alt={`Fault evidence ${idx + 1}`}
                        className="w-28 h-24 rounded-xl object-cover border border-slate-200"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Work actions */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-4">
          {/* Progress steps */}
          <ol className="grid grid-cols-3 gap-1.5" aria-label="Maintenance progress">
            {steps.map((step, idx) => (
              <li
                key={step.label}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1 text-center ${
                  step.done ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step.done ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <span className="font-mono">{idx + 1}</span>
                )}
                {step.label}
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-between gap-2">
            <label htmlFor="contractor-select" className="text-xs font-semibold text-slate-600">
              Technician
            </label>
            <select
              id="contractor-select"
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              className="min-h-[44px] max-w-[70%] px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900"
            >
              {state.maintenanceContacts.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          {!isCompletedOrResolved ? (
            <div className="space-y-4">
              {/* Next step */}
              {!isAcknowledged && (
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      acknowledgeFault(fault.id, contractorName);
                      notify(`Fault ${fault.id} acknowledged by ${contractorName}.`);
                    }}
                    className="min-h-[52px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck className="w-5 h-5" />
                    Acknowledge Fault
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startMaintenanceWork(fault.id, contractorName);
                      notify(`Work started on ${equipment.id}.`);
                    }}
                    className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Work Now
                  </button>
                </div>
              )}

              {isAcknowledged && !isInProgress && (
                <button
                  type="button"
                  onClick={() => {
                    startMaintenanceWork(fault.id, contractorName);
                    notify(`Work started on ${equipment.id}.`);
                  }}
                  className="w-full min-h-[52px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Work
                </button>
              )}

              {/* Work notes */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <VoiceTextInput
                  id="work-note"
                  label="Work notes"
                  value={updateNote}
                  onChange={setUpdateNote}
                  rows={3}
                  placeholder="Work performed, findings, parts used. Tap the mic to dictate."
                  suggestions={WORK_NOTE_PHRASES}
                />

                <PhotoAttachField
                  photos={updatePhotos}
                  onChange={setUpdatePhotos}
                  label="Work photos"
                  demoPhoto={equipment.imageUrl}
                  demoLabel="Use demo photo"
                />

                <button
                  type="button"
                  disabled={!updateNote.trim() && updatePhotos.length === 0}
                  onClick={() => {
                    addMaintenanceUpdate(
                      fault.id,
                      contractorName,
                      updateNote.trim() || 'Uploaded work progress photos.',
                      updatePhotos
                    );
                    setUpdateNote('');
                    setUpdatePhotos([]);
                    notify('Update saved and visible to the supervisor.');
                  }}
                  className="w-full min-h-[48px] rounded-xl border border-blue-700 text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-40 disabled:border-slate-300 disabled:text-slate-500 text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Save Update
                </button>
              </div>

              {/* Completion */}
              <div className="pt-3 border-t border-slate-100">
                {!showCompleteForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompleteForm(true);
                      if (!completionSummary && updateNote.trim()) setCompletionSummary(updateNote.trim());
                    }}
                    className="w-full min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Mark Maintenance Completed
                  </button>
                ) : (
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 space-y-3">
                    <VoiceTextInput
                      id="completion-summary"
                      label="Completion summary (required)"
                      value={completionSummary}
                      onChange={setCompletionSummary}
                      rows={3}
                      tone="success"
                      placeholder="Repairs completed, parts replaced, test results…"
                      suggestions={COMPLETION_PHRASES}
                    />
                    <PhotoAttachField
                      photos={completionPhotos}
                      onChange={setCompletionPhotos}
                      label="Completion photos"
                      demoPhoto={equipment.imageUrl || SAMPLE_FAULT_PHOTO}
                      demoLabel="Use demo photo"
                      tone="success"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCompleteForm(false)}
                        className="min-h-[48px] rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!completionSummary.trim()}
                        onClick={() => {
                          completeMaintenanceWork(
                            fault.id,
                            contractorName,
                            completionSummary.trim(),
                            completionPhotos
                          );
                          setShowCompleteForm(false);
                          notify(
                            'Maintenance marked completed. Equipment stays restricted until the supervisor approves return to service.'
                          );
                        }}
                        className="min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-bold"
                      >
                        Submit Completion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-1.5">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                {fault.status === 'Resolved' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-amber-700" />
                )}
                <span>
                  {fault.status === 'Resolved'
                    ? 'Maintenance Completed & Returned to Service'
                    : 'Maintenance Completed — Awaiting Supervisor Approval'}
                </span>
              </div>
              {fault.completionSummary && (
                <p className="text-xs text-slate-700">{fault.completionSummary}</p>
              )}
              <p className="text-[11px] text-amber-800">
                Note: Supervisor verification is required before the equipment hold is lifted.
              </p>
            </div>
          )}
        </section>

        {/* Maintenance Progress Log */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Maintenance Updates ({fault.maintenanceUpdates.length})
          </h2>
          {fault.maintenanceUpdates.length === 0 ? (
            <p className="text-xs text-slate-500">No maintenance updates logged yet.</p>
          ) : (
            <div className="space-y-3">
              {fault.maintenanceUpdates.map((upd) => (
                <div key={upd.id} className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-900">{upd.authorName}</span>
                    <span className="font-mono text-slate-500">{formatDateTime(upd.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-700">{upd.note}</p>
                  {upd.photos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {upd.photos.map((p, idx) => (
                        <img
                          key={idx}
                          src={p}
                          alt="Update attachment"
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Site location & directions */}
        {faultSite && (
          <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900">{faultSite.name} Site</h2>
                  <p className="text-xs text-slate-500">
                    {faultSite.address}, {faultSite.suburb} {faultSite.state} {faultSite.postcode}
                  </p>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${faultSite.latitude},${faultSite.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-blue-700 inline-flex items-center gap-1 shrink-0"
              >
                <span>Directions</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <SiteLocationMap
              sites={state.sites}
              equipment={state.equipment}
              faults={state.faults}
              onlyShowSiteId={faultSite.id}
              focusedSiteId={faultSite.id}
              heightClass="h-48"
            />
          </section>
        )}

        {/* Previous Fault History */}
        {priorFaults.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              Previous Machine Faults ({priorFaults.length})
            </h2>
            {priorFaults.map((pf) => (
              <div key={pf.id} className="text-xs border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
                <div className="flex justify-between gap-2 font-semibold text-slate-800">
                  <span>
                    {pf.id} · {pf.failedItem}
                  </span>
                  <span className="text-right">{pf.status}</span>
                </div>
                <div className="text-slate-500 mt-0.5">{pf.description}</div>
              </div>
            ))}
          </section>
        )}

        {/* Prototype scoped link notice */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2.5 text-[11px] text-blue-900 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
          <span>
            Direct contractor link preview ({fault.id}). Production deployments enforce
            authenticated, time-limited, revocable access tokens.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Presenter Utility Bar on Desktop */}
      <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-white">Contractor Mobile Portal</span>
          <span className="text-slate-400">·</span>
          <span className="font-mono text-slate-300">/maintenance/fault/{fault.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setPhoneFrameMode(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                !phoneFrameMode ? 'bg-blue-700 text-white' : 'text-slate-300'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Responsive Full
            </button>
            <button
              type="button"
              onClick={() => setPhoneFrameMode(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                phoneFrameMode ? 'bg-blue-700 text-white' : 'text-slate-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Frame (390px)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!currentUser || currentUser.role !== 'supervisor') {
                loginAsRole('supervisor');
              }
              navigate(`/supervisor/faults/${fault.id}`);
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white"
          >
            Review in Supervisor Dashboard
          </button>
        </div>
      </div>

      {showFrame ? (
        <div className="flex flex-1 items-center justify-center py-6 px-4 bg-slate-200/80">
          <div className="w-[390px] h-[780px] rounded-[36px] border-[8px] border-slate-900 bg-slate-50 shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col">
            {mobileContent}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col bg-slate-50 md:border-x md:border-slate-200">
            {mobileContent}
          </div>
        </div>
      )}
    </div>
  );
}
