import { AlertOctagon, AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { EquipmentStatus, FaultSeverity, FaultStatus } from '../types';
import { getEquipmentStatusStyle, getFaultStatusStyle, getSeverityStyle } from '../utils/formatters';

export function EquipmentStatusLabel({ status }: { status: EquipmentStatus }) {
  const style = getEquipmentStatusStyle(status);
  const Icon =
    status === 'Operational'
      ? CheckCircle2
      : status === 'On Hold'
      ? AlertOctagon
      : status === 'Under Maintenance'
      ? Wrench
      : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

export function FaultStatusLabel({ status }: { status: FaultStatus }) {
  const style = getFaultStatusStyle(status);
  const Icon =
    status === 'Urgent'
      ? AlertOctagon
      : status === 'Awaiting Review'
      ? AlertTriangle
      : status === 'Resolved'
      ? CheckCircle2
      : status === 'Maintenance Completed' || status === 'Awaiting Return-to-Service Approval'
      ? Clock
      : Wrench;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 ${style.bg} ${style.text}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

export function SeverityText({ severity }: { severity: FaultSeverity }) {
  return <span className={`text-xs ${getSeverityStyle(severity)}`}>{severity}</span>;
}
