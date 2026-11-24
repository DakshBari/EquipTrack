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
  X,
  XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { EquipmentImage } from '../../components/EquipmentImage';
import { ShareFaultModal } from '../../components/ShareFaultModal';
import { EquipmentStatusLabel, FaultStatusLabel, SeverityText } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { FaultSeverity } from '../../types';
import { formatDateTime, getSiteName } from '../../utils/formatters';

export function SupervisorFaultDetailPage() {
  const { faultId } = useParams<{ faultId: string }>();
  const {
    state,
    holdAndScheduleFault,
    escalateFault,
    approveReturnToService,
    rejectReturnToService,
  } = useEquipTrack();

  const fault = state.faults.find((f) => f.id === faultId);
  const equipment = fault ? state.equipment.find((e) => e.id === fault.equipmentId) : undefined;
  const inspection = fault
    ? state.inspections.find((i) => i.id === fault.inspectionId)
    : undefined;
  const assignedContact = fault?.assignedContactId
    ? state.maintenanceContacts.find((c) => c.id === fault.assignedContactId)
    : undefined;

  // Modals
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [rtsModalAction, setRtsModalAction] = useState<'approve' | 'reject' | null>(null);

  // Hold & Schedule Form State
  const [holdContactId, setHoldContactId] = useState(
    fault?.assignedContactId || state.maintenanceContacts[0]?.id || ''
  );
  const [holdSeverity, setHoldSeverity] = useState<FaultSeverity>(fault?.severity || 'High');
  const [holdDate, setHoldDate] = useState(
    fault?.plannedDate || new Date().toISOString().slice(0, 10)
  );
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

  const handleRtsConfirm = () => {
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

  return (
    <DashboardLayout mode="supervisor" title={`Fault Report · ${fault.id}`}>
      <div className="space-y-5">
        {/* Back Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/supervisor/faults"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fault Queue
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/maintenance/fault/${fault.id}`}
              className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview Contractor Link
            </Link>
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="min-h-[40px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Fault Report
            </button>
          </div>
        </div>

        {bannerMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800">
            {bannerMessage}
          </div>
        )}

        {/* Equipment ON HOLD Banner */}
        {equipment.status === 'On Hold' && (
          <div className="rounded-2xl bg-red-600 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
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
          <section className="rounded-2xl bg-amber-50 border border-amber-300 p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
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

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setRtsModalAction('approve')}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Return to Service
              </button>
              <button
                type="button"
                onClick={() => setRtsModalAction('reject')}
                className="min-h-[44px] px-5 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-700 text-sm font-semibold flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject & Send Back to Maintenance
              </button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left 2 Columns: Fault Evidence & Updates */}
          <div className="lg:col-span-2 space-y-5">
            <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-900">{fault.id}</span>
                    <span>·</span>
                    <span>{getSiteName(fault.siteId)}</span>
                    <span>·</span>
                    <SeverityText severity={fault.severity} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{fault.failedItem}</h2>
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
                </div>
              </div>

              {fault.photos.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Fault Photographs ({fault.photos.length})
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {fault.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Fault photo ${idx + 1}`}
                        className="w-40 h-32 rounded-xl object-cover border border-slate-200"
                      />
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
            </section>

            {/* Maintenance Updates */}
            <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Maintenance Progress & Contractor Updates ({fault.maintenanceUpdates.length})
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
            <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Audit & Activity Timeline</h3>
              <ActivityTimeline events={timelineEvents} />
            </section>
          </div>

          {/* Right Column: Actions, Equipment & Assignment */}
          <div className="space-y-5">
            {/* Two Primary Supervisor Fault Actions */}
            {fault.status !== 'Resolved' && (
              <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Supervisor Actions</h3>

                <button
                  type="button"
                  onClick={() => setShowHoldModal(true)}
                  className="w-full min-h-[46px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Hold and Schedule Maintenance
                </button>

                <button
                  type="button"
                  onClick={() => setShowEscalateModal(true)}
                  className="w-full min-h-[46px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Escalate for Immediate Attention
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-blue-700 text-blue-700 hover:bg-blue-50 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share via SMS / Email
                </button>
              </section>
            )}

            {/* Machine Card */}
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <EquipmentImage
                src={equipment.imageUrl}
                alt={equipment.name}
                type={equipment.type}
                className="w-full h-40"
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
                  {inspection && <div>Original Inspection: {inspection.id}</div>}
                </div>

                <Link
                  to={`/supervisor/equipment/${equipment.id}`}
                  className="block text-center min-h-[40px] leading-[40px] rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-blue-700"
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
                  <div className="text-xs text-slate-600">{assignedContact.email}</div>
                  {fault.plannedDate && (
                    <div className="text-xs font-semibold text-blue-700 pt-1">
                      Planned Date: {fault.plannedDate}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No maintenance contact assigned yet. Use Hold & Schedule or Share to assign.
                </p>
              )}

              {fault.shareHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  Last shared: {fault.shareHistory[0].channels.join(' & ')} to{' '}
                  {fault.shareHistory[0].contactName} ({formatDateTime(fault.shareHistory[0].sentAt)})
                </div>
              )}
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
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>{pf.id}</span>
                        <span>{pf.status}</span>
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

      {/* Hold & Schedule Maintenance Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleHoldSubmit}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Hold & Schedule Maintenance</h3>
              <button
                type="button"
                onClick={() => setShowHoldModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                Confirming will place <strong>{equipment.name} ({equipment.id})</strong> on{' '}
                <strong>ON HOLD — DO NOT OPERATE</strong> and update fault {fault.id} to Scheduled.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maintenance Contact
                </label>
                <select
                  value={holdContactId}
                  onChange={(e) => setHoldContactId(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {state.maintenanceContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={holdSeverity}
                    onChange={(e) => setHoldSeverity(e.target.value as FaultSeverity)}
                    className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Date
                  </label>
                  <input
                    type="date"
                    required
                    value={holdDate}
                    onChange={(e) => setHoldDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervisor Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  value={holdInstructions}
                  onChange={(e) => setHoldInstructions(e.target.value)}
                  placeholder="Provide lock-out location, parts instructions, or safety notes..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHoldModal(false)}
                className="min-h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Place On Hold & Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Escalate Fault Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleEscalateSubmit}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Escalate Fault as Urgent</h3>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Maintenance Contact
                </label>
                <select
                  value={escContactId}
                  onChange={(e) => setEscContactId(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {state.maintenanceContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgent Escalation Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  value={escInstructions}
                  onChange={(e) => setEscInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="min-h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Confirm Urgent Escalation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Return-to-Service Confirmation Modal */}
      {rtsModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {rtsModalAction === 'approve'
                  ? 'Confirm Return-to-Service Approval'
                  : 'Reject Return-to-Service'}
              </h3>
              <button
                type="button"
                onClick={() => setRtsModalAction(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-700">
                {rtsModalAction === 'approve'
                  ? `Approving will mark fault ${fault.id} as Resolved and return ${equipment.name} (${equipment.id}) to Operational status.`
                  : `Rejecting will keep ${equipment.name} (${equipment.id}) restricted On Hold and send fault ${fault.id} back to maintenance.`}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervisor Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={rtsNotes}
                  onChange={(e) => setRtsNotes(e.target.value)}
                  placeholder={
                    rtsModalAction === 'approve'
                      ? 'Verified repair test and physical safety check...'
                      : 'Specify what further repair or verification is required...'
                  }
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRtsModalAction(null)}
                className="min-h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRtsConfirm}
                className={`min-h-[42px] px-4 rounded-xl text-white text-xs font-semibold ${
                  rtsModalAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {rtsModalAction === 'approve' ? 'Approve & Return Operational' : 'Reject & Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareFaultModal fault={fault} onClose={() => setShowShareModal(false)} />
      )}
    </DashboardLayout>
  );
}
