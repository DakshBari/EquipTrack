import { EquipmentStatus, FaultSeverity, FaultStatus, SiteId } from '../types';

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatShortDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function getSiteName(siteId: SiteId | 'all'): string {
  if (siteId === 'all') return 'All Sites';
  return siteId === 'canning-vale' ? 'Canning Vale' : 'Jandakot';
}

export function getEquipmentStatusStyle(status: EquipmentStatus): {
  text: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case 'Operational':
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      };
    case 'On Hold':
      return {
        text: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
      };
    case 'Under Maintenance':
      return {
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      };
    case 'Awaiting Return-to-Service':
      return {
        text: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      };
  }
}

export function getFaultStatusStyle(status: FaultStatus): {
  text: string;
  bg: string;
} {
  switch (status) {
    case 'Urgent':
      return { text: 'text-red-700', bg: 'bg-red-50' };
    case 'Awaiting Review':
      return { text: 'text-amber-700', bg: 'bg-amber-50' };
    case 'Scheduled':
    case 'Acknowledged':
    case 'In Progress':
      return { text: 'text-blue-700', bg: 'bg-blue-50' };
    case 'Maintenance Completed':
    case 'Awaiting Return-to-Service Approval':
      return { text: 'text-amber-800', bg: 'bg-amber-100' };
    case 'Resolved':
      return { text: 'text-emerald-700', bg: 'bg-emerald-50' };
  }
}

export function getSeverityStyle(severity: FaultSeverity): string {
  switch (severity) {
    case 'Urgent':
      return 'text-red-700 font-semibold';
    case 'High':
      return 'text-amber-700 font-semibold';
    case 'Medium':
      return 'text-blue-700 font-medium';
    case 'Low':
      return 'text-slate-600 font-medium';
  }
}

export function buildFaultShareMessage(params: {
  equipmentName: string;
  equipmentId: string;
  siteName: string;
  faultDescription: string;
  priority: string;
  instructions?: string;
  faultUrl: string;
}): string {
  const header =
    params.priority.toUpperCase() === 'URGENT'
      ? 'Maintenance request — URGENT'
      : `Maintenance request — ${params.priority}`;

  const lines = [
    header,
    '',
    `Equipment: ${params.equipmentName} (${params.equipmentId})`,
    `Site: ${params.siteName}`,
    `Fault: ${params.faultDescription}`,
    `Priority: ${params.priority}`,
  ];

  if (params.instructions && params.instructions.trim()) {
    lines.push(`Instructions: ${params.instructions.trim()}`);
  } else {
    lines.push('Please inspect the reported issue and update the maintenance record.');
  }

  lines.push('', 'View fault report:', params.faultUrl);
  return lines.join('\n');
}

/** YYYY-MM-DD for the user's local date, optionally offset by whole days (for date inputs). */
export function localDateISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Hours remaining before a service is considered "due soon". */
export const SERVICE_DUE_SOON_HOURS = 25;

export type ServiceState = 'ok' | 'soon' | 'overdue';

export function getServiceStatus(eq: { hourMeter: number; nextServiceDueHours?: number }): {
  dueAt: number | null;
  remaining: number;
  state: ServiceState;
} {
  if (typeof eq.nextServiceDueHours !== 'number') return { dueAt: null, remaining: Infinity, state: 'ok' };
  const remaining = eq.nextServiceDueHours - eq.hourMeter;
  return {
    dueAt: eq.nextServiceDueHours,
    remaining,
    state: remaining <= 0 ? 'overdue' : remaining <= SERVICE_DUE_SOON_HOURS ? 'soon' : 'ok',
  };
}

/** Today's shift start for an "HH:MM" string, plus a short human label. */
export function describeShiftStart(shiftStart = '06:00'): { started: boolean; label: string } {
  const [h, m] = shiftStart.split(':').map(Number);
  const start = new Date();
  start.setHours(h || 0, m || 0, 0, 0);
  const diffMins = Math.round((Date.now() - start.getTime()) / 60000);
  if (diffMins < 0) return { started: false, label: `Shift starts ${shiftStart}` };
  if (diffMins > 12 * 60) return { started: true, label: `Shift started ${shiftStart}` };
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const ago = hrs > 0 ? `${hrs}h ${mins}m ago` : `${mins}m ago`;
  return { started: true, label: `Shift started ${shiftStart} (${ago})` };
}
