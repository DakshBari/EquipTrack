import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Share2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { ContactPicker } from '../../components/ContactPicker';
import { EquipmentImage } from '../../components/EquipmentImage';
import { ShareFaultModal } from '../../components/ShareFaultModal';
import { Sheet } from '../../components/Sheet';
import { EquipmentStatusLabel, FaultStatusLabel, SeverityText } from '../../components/StatusBadge';
import { VoiceTextInput } from '../../components/VoiceTextInput';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { FaultSeverity } from '../../types';
import { formatDateTime, getSiteName, localDateISO } from '../../utils/formatters';

const SEVERITIES: { value: FaultSeverity; className: string }[] = [
  { value: 'Urgent', className: 'border-red-600 bg-red-600 text-white' },
  { value: 'High', className: 'border-red-300 bg-red-50 text-red-800' },
  { value: 'Medium', className: 'border-amber-300 bg-amber-50 text-amber-900' },
  { value: 'Low', className: 'border-slate-300 bg-slate-100 text-slate-800' },
];

const HOLD_INSTRUCTION_PHRASES = [
  'Isolate and tag out before work',
  'Replace faulty component',
  'Inspect and report findings',
  'Functional test before sign-off',
];

const ESCALATION_PHRASES = [
  'Safety-critical fault',
  'Machine required for production',
  'Attend site today',
  'Call supervisor on arrival',
];

const RTS_APPROVE_PHRASES = ['Repair verified on site', 'Functional test passed', 'Photos reviewed'];
const RTS_REJECT_PHRASES = ['Fault still present', 'Further testing required', 'Photos missing'];

export function SupervisorFaultDetailPage() {
  const { faultId } = useParams<{ faultId: string }>();
  const {
    state,
    holdAndScheduleFault,
    escalateFault,
    approveReturnToService,
    rejectReturnToService,
    saveSupervisorComment,
  } = useEquipTrack();

  const fault = state.faults.find((f) => f.id === faultId);
  const equipment = fault ? state.equipment.find((e) => e.id === fault.equipmentId) : undefined;
  const inspection = fault
    ? state.inspections.find((i) => i.id === fault.inspectionId)
    : undefined;
  const assignedContact = fault?.assignedContactId
    ? state.maintenanceContacts.find((c) => c.id === fault.assignedContactId)
    : undefined;

  // Sheets
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [rtsModalAction, setRtsModalAction] = useState<'approve' | 'reject' | null>(null);

  // Hold & Schedule Form State
  const [holdContactId, setHoldContactId] = useState(
    fault?.assignedContactId || state.maintenanceContacts[0]?.id || ''
  );
  const [holdSeverity, setHoldSeverity] = useState<FaultSeverity>(fault?.severity || 'High');
  const [holdDate, setHoldDate] = useState(fault?.plannedDate || localDateISO());
  const [holdInstructions, setHoldInstructions] = useState(fault?.supervisorInstructions || '');

  // Escalate Form State
  const [escContactId, setEscContactId] = useState(
    fault?.assignedContactId || state.maintenanceContacts[0]?.id || ''
  );
  const [escInstructions, setEscInstructions] = useState(
    fault?.supervisorInstructions || 'Urgent safety fault — inspect and rectify immediately.'
  );

  // Return-to-Service Form State
  const [rtsNotes, setRtsNotes] = useState('');

  // Review comment
  const [commentDraft, setCommentDraft] = useState(fault?.supervisorComments || '');

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  if (!fault || !equipment) {
    return (
      <DashboardLayout mode="supervisor" title="Fault Not Found">
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-3">
          <h2 className="text-base font-bold text-slate-900">Fault record not found</h2>
          <Link
            to="/supervisor/faults"
            className="inline-flex min-h-[42px] items-center px-4 rounded-xl bg-blue-700 text-white text-sm font-semibold"
          >
            Back to Faults
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const notify = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleHoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    holdAndScheduleFault({
      faultId: fault.id,
      contactId: holdContactId,
      severity: holdSeverity,
      plannedDate: holdDate,
      instructions: holdInstructions,
    });
    setShowHoldModal(false);
    notify(`${equipment.id} placed ON HOLD and maintenance scheduled.`);
  };

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    escalateFault({
      faultId: fault.id,
      contactId: escContactId,
      instructions: escInstructions,
    });
    setShowEscalateModal(false);
    notify(`Fault ${fault.id} escalated to Urgent.`);
  };

  const handleRtsConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (rtsModalAction === 'approve') {
      approveReturnToService(fault.id, rtsNotes);
      notify(`${equipment.id} approved for return to service and marked Operational.`);
    } else if (rtsModalAction === 'reject') {
      rejectReturnToService(fault.id, rtsNotes);
      notify(`Return-to-service rejected. ${fault.id} returned to maintenance.`);
    }
    setRtsModalAction(null);
    setRtsNotes('');
  };

  const canReviewRts =
    fault.status === 'Maintenance Completed' ||
    fault.status === 'Awaiting Return-to-Service Approval';

  const priorFaults = state.faults.filter(
    (f) => f.equipmentId === equipment.id && f.id !== fault.id
  );
  const timelineEvents = state.activities.filter(
    (a) => a.faultId === fault.id || a.equipmentId === equipment.id
  );

  const commentDirty = commentDraft.trim() !== (fault.supervisorComments || '').trim();

  // The two primary triage decisions. Rendered once: above the evidence on phones,
  // in the sidebar on desktop.
  const actionsPanel =
    fault.status !== 'Resolved' ? (
      <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-2.5">
        <h3 className="text-sm font-bold text-slate-900">Supervisor Decision</h3>

        <button
          type="button"
          onClick={() => setShowHoldModal(true)}
          className="w-full min-h-[52px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Hold and Schedule Maintenance
        </button>

        <button
          type="button"
          onClick={() => setShowEscalateModal(true)}
          className="w-full min-h-[52px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Escalate for Immediate Attention
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-blue-700 hover:bg-blue-50 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Send to Maintenance (SMS / Email)
        </button>
      </section>
    ) : null;

  return (
    <DashboardLayout mode="supervisor" title={`Fault ${fault.id}`}>
      <div className="space-y-4 sm:space-y-5">
        <Link
          to="/supervisor/faults"
          className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fault Queue
        </Link>

        {bannerMessage && (
          <div
            role="status"
            className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800"
          >
            {bannerMessage}
          </div>
        )}

        {/* Equipment ON HOLD Banner */}
        {equipment.status === 'On Hold' && (
          <div className="rounded-2xl bg-red-600 text-white px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <span>
                ON HOLD — DO NOT OPERATE ({equipment.name} · {equipment.id})
              </span>
            </div>
            <span className="text-xs text-red-100">
              Requires maintenance completion & supervisor return-to-service sign-off
            </span>
          </div>
        )}

        {/* Return-to-Service Approval Panel */}
        {canReviewRts && (
          <section className="rounded-2xl bg-amber-50 border border-amber-300 p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-amber-950">
                  Return-to-Service Approval Required
                </h2>
                <p className="text-xs text-amber-900 mt-0.5">
                  Maintenance work was completed on {formatDateTime(fault.completedAt || '')}.
                  Verify repair summary and photos before lifting equipment restrictions.
                </p>
              </div>
            </div>

            {fault.completionSummary && (
              <div className="rounded-xl bg-white border border-amber-200 p-3.5 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Contractor Work Summary</div>
                <p className="text-sm text-slate-900">{fault.completionSummary}</p>
                {fault.completionPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {fault.completionPhotos.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt={`Completion evidence ${idx + 1}`}
                        className="w-28 h-22 rounded-xl object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setRtsModalAction('approve')}
                className="min-h-[48px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Return to Service
              </button>
              <button
                type="button"
                onClick={() => setRtsModalAction('reject')}
                className="min-h-[48px] px-5 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-700 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject & Send Back to Maintenance
              </button>
            </div>
          </section>
        )}

        {/* On phones the decision buttons come straight after the status banners */}
        {actionsPanel && <div className="lg:hidden">{actionsPanel}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
          {/* Left 2 Columns: Fault Evidence & Updates */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-900">{fault.id}</span>
                    <span>·</span>
                    <span>
                      {equipment.name} ({equipment.id})
                    </span>
                    <span>·</span>
                    <span>{getSiteName(fault.siteId)}</span>
                    <span>·</span>
                    <SeverityText severity={fault.severity} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {fault.failedItem}
                  </h2>
                </div>
                <FaultStatusLabel status={fault.status} />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Operator Fault Notes</div>
                <p className="text-sm text-slate-900">{fault.description}</p>
                <div className="text-xs text-slate-500 pt-1">
                  Reported by <span className="font-semibold text-slate-800">{fault.reportedByName}</span> on{' '}
                  {formatDateTime(fault.reportedAt)} · Inspection{' '}
                  <span className="font-mono">{fault.inspectionId}</span>
                  {inspection && (
                    <> · Hour meter {inspection.hourMeterReading.toLocaleString()} hrs</>
                  )}
                </div>
                {inspection?.notes && (
                  <div className="text-xs text-slate-700 pt-2 border-t border-slate-200">
                    <span className="font-semibold">Operator observations:</span> {inspection.notes}
                  </div>
                )}
              </div>

              {fault.photos.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Fault Photographs ({fault.photos.length})
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {fault.photos.map((photo, idx) => (
                      <a key={idx} href={photo} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photo}
                          alt={`Fault photo ${idx + 1}`}
                          className="w-36 h-28 sm:w-40 sm:h-32 rounded-xl object-cover border border-slate-200"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {fault.supervisorInstructions && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="text-xs font-bold text-blue-900">Supervisor Instructions</div>
                  <p className="text-sm text-blue-900 mt-1">{fault.supervisorInstructions}</p>
                </div>
              )}

              {fault.status === 'Resolved' && fault.rtsApprovedBy && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1">
                  <div className="text-xs font-bold text-emerald-900">
                    Return-to-Service Approved by {fault.rtsApprovedBy}
                  </div>
                  <div className="text-xs text-emerald-800">
                    {formatDateTime(fault.rtsApprovedAt || '')} · {fault.rtsDecisionNotes}
                  </div>
                </div>
              )}

              {/* Supervisor review comment */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <VoiceTextInput
                  id="supervisor-review-comment"
                  label="Supervisor Review Comments"
                  value={commentDraft}
                  onChange={setCommentDraft}
                  rows={2}
                  placeholder="Internal review notes about this fault (speak or type)…"
                />
                {commentDirty && (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCommentDraft(fault.supervisorComments || '')}
                      className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saveSupervisorComment(fault.id, commentDraft);
                        notify('Review comment saved.');
                      }}
                      className="min-h-[40px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                    >
                      Save Comment
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Maintenance Updates */}
            <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Maintenance Updates ({fault.maintenanceUpdates.length})
              </h3>
              {fault.maintenanceUpdates.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No updates submitted by maintenance personnel yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {fault.maintenanceUpdates.map((upd) => (
                    <div
                      key={upd.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-900">
                          {upd.authorName} · {upd.authorRole}
                        </span>
                        <span className="font-mono text-slate-500">
                          {formatDateTime(upd.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800">{upd.note}</p>
                      {upd.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {upd.photos.map((p, idx) => (
                            <img
                              key={idx}
                              src={p}
                              alt="Maintenance work"
                              className="w-24 h-20 rounded-xl object-cover border border-slate-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Activity Timeline */}
            <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Audit & Activity Timeline</h3>
              <ActivityTimeline events={timelineEvents} />
            </section>
          </div>

          {/* Right Column: Actions, Equipment & Assignment */}
          <div className="space-y-4 sm:space-y-5">
            {actionsPanel && <div className="hidden lg:block">{actionsPanel}</div>}

            {/* Machine Card */}
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <EquipmentImage
                src={equipment.imageUrl}
                alt={equipment.name}
                type={equipment.type}
                className="w-full h-36"
              />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      {equipment.id} · {getSiteName(equipment.siteId)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{equipment.name}</h3>
                  </div>
                  <EquipmentStatusLabel status={equipment.status} />
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div>
                    Model: {equipment.manufacturer} {equipment.model}
                  </div>
                  <div>Hour Meter: {equipment.hourMeter.toLocaleString()} hrs</div>
                </div>

                <Link
                  to={`/supervisor/equipment/${equipment.id}`}
                  className="flex items-center justify-center min-h-[42px] rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-blue-700"
                >
                  View Equipment Profile
                </Link>
              </div>
            </section>

            {/* Assigned Maintenance Contact */}
            <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700">Assigned Maintenance Contact</h3>
              {assignedContact ? (
                <div className="text-sm space-y-1">
                  <div className="font-bold text-slate-900">{assignedContact.name}</div>
                  <div className="text-xs text-slate-600">{assignedContact.company}</div>
                  <div className="text-xs font-mono text-slate-600">{assignedContact.phone}</div>
                  <div className="text-xs text-slate-600 break-all">{assignedContact.email}</div>
                  {fault.plannedDate && (
                    <div className="text-xs font-semibold text-blue-700 pt-1">
                      Planned Date: {fault.plannedDate}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No maintenance contact assigned yet. Hold & Schedule or Escalate to assign one.
                </p>
              )}

              {fault.shareHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  Last shared: {fault.shareHistory[0].channels.join(' & ')} to{' '}
                  {fault.shareHistory[0].contactName} ({formatDateTime(fault.shareHistory[0].sentAt)})
                </div>
              )}

              <Link
                to={`/maintenance/fault/${fault.id}`}
                className="flex items-center justify-center gap-1.5 min-h-[40px] rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Preview Maintenance Link
              </Link>
            </section>

            {/* Previous Fault History on Machine */}
            {priorFaults.length > 0 && (
              <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-700">
                  Prior Machine Faults ({priorFaults.length})
                </h3>
                <div className="space-y-2">
                  {priorFaults.map((pf) => (
                    <Link
                      key={pf.id}
                      to={`/supervisor/faults/${pf.id}`}
                      className="block rounded-xl border border-slate-100 hover:border-blue-700 p-2.5 text-xs"
                    >
                      <div className="flex justify-between gap-2 font-semibold text-slate-900">
                        <span>{pf.id}</span>
                        <span className="text-right">{pf.status}</span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{pf.failedItem}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Hold & Schedule Maintenance */}
      {showHoldModal && (
        <Sheet
          title="Hold & Schedule Maintenance"
          subtitle={`${fault.id} · ${equipment.name} (${equipment.id})`}
          onClose={() => setShowHoldModal(false)}
          onSubmit={handleHoldSubmit}
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowHoldModal(false)}
                className="min-h-[46px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!holdContactId || !holdInstructions.trim()}
                className="min-h-[46px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-bold"
              >
                Place On Hold & Schedule
              </button>
            </>
          }
        >
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
            Confirming will place <strong>{equipment.name}</strong> <strong>ON HOLD — DO NOT OPERATE</strong>{' '}
            and set fault {fault.id} to Scheduled.
          </div>

          <ContactPicker
            contacts={state.maintenanceContacts}
            value={holdContactId}
            onChange={setHoldContactId}
          />

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Priority</div>
            <div role="radiogroup" aria-label="Priority" className="grid grid-cols-4 gap-1.5">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={holdSeverity === s.value}
                  onClick={() => setHoldSeverity(s.value)}
                  className={`min-h-[44px] rounded-xl border text-xs font-bold transition-colors ${
                    holdSeverity === s.value
                      ? `${s.className} ring-2 ring-offset-1 ring-slate-900`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="hold-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Planned Date
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: 'Today', offset: 0 },
                { label: 'Tomorrow', offset: 1 },
                { label: 'In 3 days', offset: 3 },
                { label: 'Next week', offset: 7 },
              ].map((opt) => {
                const iso = localDateISO(opt.offset);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setHoldDate(iso)}
                    className={`min-h-[38px] px-3 rounded-lg border text-xs font-semibold ${
                      holdDate === iso
                        ? 'border-blue-700 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <input
              id="hold-date"
              type="date"
              required
              value={holdDate}
              min={localDateISO()}
              onChange={(e) => setHoldDate(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <VoiceTextInput
            id="hold-instructions"
            label="Maintenance Instructions"
            value={holdInstructions}
            onChange={setHoldInstructions}
            required
            rows={3}
            placeholder="Lock-out location, parts, or safety notes. Tap the mic to dictate."
            suggestions={HOLD_INSTRUCTION_PHRASES}
          />
        </Sheet>
      )}

      {/* Escalate Fault */}
      {showEscalateModal && (
        <Sheet
          title="Escalate for Immediate Attention"
          subtitle={`${fault.id} · ${equipment.name} (${equipment.id})`}
          onClose={() => setShowEscalateModal(false)}
          onSubmit={handleEscalateSubmit}
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="min-h-[46px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!escInstructions.trim()}
                className="min-h-[46px] px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold"
              >
                Confirm Urgent Escalation
              </button>
            </>
          }
        >
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
            Fault {fault.id} will be marked <strong>Urgent</strong> and assigned to the selected
            contact.
          </div>

          <ContactPicker
            contacts={state.maintenanceContacts}
            value={escContactId}
            onChange={setEscContactId}
            label="Assign Maintenance Contact"
          />

          <VoiceTextInput
            id="escalation-reason"
            label="Escalation Reason & Instructions"
            value={escInstructions}
            onChange={setEscInstructions}
            required
            rows={3}
            tone="danger"
            suggestions={ESCALATION_PHRASES}
          />
        </Sheet>
      )}

      {/* Return-to-Service Confirmation */}
      {rtsModalAction && (
        <Sheet
          title={
            rtsModalAction === 'approve'
              ? 'Confirm Return-to-Service Approval'
              : 'Reject Return-to-Service'
          }
          onClose={() => setRtsModalAction(null)}
          onSubmit={handleRtsConfirm}
          footer={
            <>
              <button
                type="button"
                onClick={() => setRtsModalAction(null)}
                className="min-h-[46px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`min-h-[46px] px-4 rounded-xl text-white text-sm font-bold ${
                  rtsModalAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {rtsModalAction === 'approve' ? 'Approve & Return Operational' : 'Reject & Return'}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700">
            {rtsModalAction === 'approve'
              ? `Approving will mark fault ${fault.id} as Resolved and return ${equipment.name} (${equipment.id}) to Operational status.`
              : `Rejecting will keep ${equipment.name} (${equipment.id}) restricted On Hold and send fault ${fault.id} back to maintenance.`}
          </p>
          <VoiceTextInput
            id="rts-notes"
            label="Supervisor Verification Notes"
            value={rtsNotes}
            onChange={setRtsNotes}
            rows={3}
            tone={rtsModalAction === 'approve' ? 'success' : 'danger'}
            placeholder={
              rtsModalAction === 'approve'
                ? 'Verified repair test and physical safety check...'
                : 'Specify what further repair or verification is required...'
            }
            suggestions={rtsModalAction === 'approve' ? RTS_APPROVE_PHRASES : RTS_REJECT_PHRASES}
          />
        </Sheet>
      )}

      {showShareModal && (
        <ShareFaultModal fault={fault} onClose={() => setShowShareModal(false)} />
      )}
    </DashboardLayout>
  );
}
