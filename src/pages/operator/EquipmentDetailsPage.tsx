import { useRef, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Info,
  QrCode,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { EquipmentImage } from '../../components/EquipmentImage';
import { QrCodeModal } from '../../components/QrCodeModal';
import { EquipmentStatusLabel, FaultStatusLabel } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { MobileOperatorLayout } from '../../layouts/MobileOperatorLayout';
import { formatDateTime, getSiteName } from '../../utils/formatters';

export function EquipmentDetailsPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { state } = useEquipTrack();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'specs' | 'faults' | 'history'>('specs');
  const [showQrModal, setShowQrModal] = useState(false);
  const detailsSectionRef = useRef<HTMLDivElement | null>(null);

  const equipment = state.equipment.find(
    (eq) => eq.id.toUpperCase() === (equipmentId || '').toUpperCase()
  );

  if (!equipment) {
    return (
      <MobileOperatorLayout title="Equipment Not Found" showBack backTo="/operator">
        <div className="p-6 text-center space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900">Unknown Equipment ID</h2>
            <p className="text-sm text-slate-500 mt-1">
              No asset matching <span className="font-mono">{equipmentId}</span> was found.
            </p>
            <Link
              to="/operator/equipment"
              className="mt-4 inline-flex min-h-[44px] items-center px-4 rounded-xl bg-blue-700 text-white text-sm font-semibold"
            >
              Browse Equipment
            </Link>
          </div>
        </div>
      </MobileOperatorLayout>
    );
  }

  const isOnHold = equipment.status === 'On Hold';
  const isRestricted =
    isOnHold ||
    equipment.status === 'Under Maintenance' ||
    equipment.status === 'Awaiting Return-to-Service';

  const equipmentFaults = state.faults.filter((f) => f.equipmentId === equipment.id);
  const equipmentHistory = state.activities.filter((a) => a.equipmentId === equipment.id);
  const assignedOperator = state.users.find((u) => u.id === equipment.assignedOperatorId);

  const handleViewDetailsClick = () => {
    setActiveTab('specs');
    detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <MobileOperatorLayout title={equipment.id} showBack backTo="/operator">
      <div className="p-4 space-y-4">
        {/* Hazard Hold / Restriction Warning */}
        {isOnHold && (
          <div
            role="alert"
            className="rounded-2xl bg-red-600 text-white p-4 space-y-1.5 shadow-sm"
          >
            <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <span>ON HOLD — DO NOT OPERATE</span>
            </div>
            <p className="text-xs text-red-50 leading-relaxed">
              This equipment has been placed on safety hold by a supervisor. Pre-start checks are
              disabled until maintenance is completed and return-to-service is formally approved.
            </p>
          </div>
        )}

        {!isOnHold && isRestricted && (
          <div
            role="alert"
            className="rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 p-4 space-y-1"
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{equipment.status} — Pre-Start Restricted</span>
            </div>
            <p className="text-xs text-amber-800">
              Machine cannot enter normal operation until supervisor return-to-service sign-off.
            </p>
          </div>
        )}

        {/* Primary Equipment Hero Card */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <EquipmentImage
            src={equipment.imageUrl}
            alt={equipment.name}
            type={equipment.type}
            className="w-full h-48 sm:h-56"
          />

          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-xs font-mono tabular-nums text-slate-500">
                  {equipment.id} · {equipment.type} · {getSiteName(equipment.siteId)}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{equipment.name}</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {equipment.manufacturer} {equipment.model}
                </p>
              </div>
              <EquipmentStatusLabel status={equipment.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Last Inspection</span>
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {formatDateTime(equipment.lastInspectionAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Hour Meter</span>
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {equipment.hourMeter.toLocaleString()} hrs
                </span>
              </div>
            </div>

            {/* Two Large Primary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={isRestricted}
                onClick={() => navigate(`/equipment/${equipment.id}/prestart`)}
                className={`min-h-[48px] px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  isRestricted
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 shrink-0" />
                <span>{isRestricted ? 'Pre-Start Locked' : 'Start Pre-Start'}</span>
              </button>

              <button
                type="button"
                onClick={handleViewDetailsClick}
                className="min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>View Equipment Details</span>
              </button>
            </div>
          </div>
        </section>

        {/* Detailed Tabs Section */}
        <section
          ref={detailsSectionRef}
          className="rounded-2xl bg-white border border-slate-200 overflow-hidden"
        >
          <div className="flex items-center border-b border-slate-200 px-2 pt-2 gap-1">
            {[
              { id: 'specs', label: 'Details' },
              { id: 'faults', label: `Faults (${equipmentFaults.length})` },
              { id: 'history', label: `History (${equipmentHistory.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'specs' | 'faults' | 'history')}
                className={`min-h-[42px] px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="ml-auto min-h-[36px] px-2.5 py-1.5 mr-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR Tag
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'specs' && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                <div className="pb-2.5 border-b border-slate-100">
                  <dt className="text-xs text-slate-500">Asset ID</dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-0.5">{equipment.id}</dd>
                </div>
                <div className="pb-2.5 border-b border-slate-100">
                  <dt className="text-xs text-slate-500">Site Location</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {getSiteName(equipment.siteId)}
                  </dd>
                </div>
                <div className="pb-2.5 border-b border-slate-100">
                  <dt className="text-xs text-slate-500">Manufacturer / Model</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {equipment.manufacturer} · {equipment.model}
                  </dd>
                </div>
                <div className="pb-2.5 border-b border-slate-100">
                  <dt className="text-xs text-slate-500">Serial Number</dt>
                  <dd className="font-mono text-slate-900 mt-0.5">{equipment.serialNumber}</dd>
                </div>
                <div className="pb-2.5 border-b border-slate-100 sm:border-b-0">
                  <dt className="text-xs text-slate-500">Year & Hour Meter</dt>
                  <dd className="font-mono tabular-nums text-slate-900 mt-0.5">
                    {equipment.year} · {equipment.hourMeter.toLocaleString()} hrs
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Assigned Operator</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {assignedOperator?.name || 'Pool Allocation'}
                  </dd>
                </div>
              </dl>
            )}

            {activeTab === 'faults' && (
              <div className="space-y-3">
                {equipmentFaults.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-500 flex flex-col items-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>No previous faults recorded for {equipment.id}.</span>
                  </div>
                ) : (
                  equipmentFaults.map((fault) => (
                    <div
                      key={fault.id}
                      className="rounded-xl border border-slate-200 p-3.5 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {fault.id} · {fault.failedItem}
                        </span>
                        <FaultStatusLabel status={fault.status} />
                      </div>
                      <p className="text-sm text-slate-700">{fault.description}</p>
                      <div className="text-xs text-slate-500">
                        Reported by {fault.reportedByName} · {formatDateTime(fault.reportedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'history' && <ActivityTimeline events={equipmentHistory} />}
          </div>
        </section>
      </div>

      {showQrModal && <QrCodeModal equipment={equipment} onClose={() => setShowQrModal(false)} />}
    </MobileOperatorLayout>
  );
}
