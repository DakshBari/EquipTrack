import React, { createContext, useContext, useEffect, useState } from 'react';
import { createInitialSeedData, defaultServiceDue, SERVICE_INTERVAL_HOURS } from '../data/seedData';
import {
  ActivityEvent,
  AppNotification,
  ChecklistItemTemplate,
  ChecklistResponse,
  EquipTrackState,
  Equipment,
  EquipmentStatus,
  EquipmentType,
  FaultRecord,
  FaultSeverity,
  PreStartInspection,
  Site,
  SiteId,
  User,
  UserRole,
} from '../types';

const STORAGE_KEY = 'equiptrack_demo_state_v1';
const SESSION_KEY = 'equiptrack_session_user_v1';
const FRAME_KEY = 'equiptrack_phone_frame_v1';

interface SubmitInspectionInput {
  equipmentId: string;
  hourMeterReading: number;
  responses: ChecklistResponse[];
  notes?: string;
}

interface HoldScheduleInput {
  faultId: string;
  contactId: string;
  severity: FaultSeverity;
  plannedDate: string;
  instructions: string;
}

interface EscalateFaultInput {
  faultId: string;
  contactId?: string;
  instructions: string;
}

interface ShareFaultInput {
  faultId: string;
  contactId: string;
  contactName: string;
  channels: ('SMS' | 'Email')[];
  message: string;
}

interface EquipTrackContextValue {
  state: EquipTrackState;
  currentUser: User | null;
  selectedSite: SiteId | 'all';
  setSelectedSite: (site: SiteId | 'all') => void;
  phoneFrameMode: boolean;
  setPhoneFrameMode: (val: boolean) => void;
  loginWithCredentials: (email: string, password: string) => { ok: boolean; error?: string; user?: User };
  loginAsRole: (role: UserRole) => User | null;
  logout: () => void;
  resetDemoData: () => void;
  submitInspection: (input: SubmitInspectionInput) => {
    inspection: PreStartInspection;
    createdFaults: FaultRecord[];
  };
  holdAndScheduleFault: (input: HoldScheduleInput) => void;
  escalateFault: (input: EscalateFaultInput) => void;
  recordShareFault: (input: ShareFaultInput) => void;
  saveSupervisorComment: (faultId: string, comment: string) => void;
  acknowledgeFault: (faultId: string, actorName: string, note?: string) => void;
  startMaintenanceWork: (faultId: string, actorName: string, note?: string) => void;
  addMaintenanceUpdate: (faultId: string, actorName: string, note: string, photos: string[]) => void;
  completeMaintenanceWork: (
    faultId: string,
    actorName: string,
    summary: string,
    photos: string[]
  ) => void;
  approveReturnToService: (faultId: string, notes: string) => void;
  rejectReturnToService: (faultId: string, notes: string) => void;
  addEquipment: (eq: Omit<Equipment, 'lastInspectionAt'>) => void;
  updateEquipment: (eq: Equipment) => void;
  setEquipmentStatusManual: (equipmentId: string, status: EquipmentStatus) => void;
  /** Log a completed scheduled service and set the next due point. */
  recordService: (equipmentId: string) => void;
  addUser: (user: Omit<User, 'id' | 'initials'>) => void;
  updateUser: (user: User) => void;
  updateSite: (site: Site) => void;
  updateTemplateItems: (type: EquipmentType, items: ChecklistItemTemplate[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const EquipTrackContext = createContext<EquipTrackContextValue | null>(null);

function loadState(): EquipTrackState {
  const initial = createInitialSeedData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EquipTrackState;
      if (parsed && Array.isArray(parsed.equipment) && Array.isArray(parsed.users)) {
        const hydratedSites = (parsed.sites || initial.sites).map((site) => {
          const fallback = initial.sites.find((s) => s.id === site.id);
          return {
            ...site,
            latitude: typeof site.latitude === 'number' ? site.latitude : fallback?.latitude ?? -32.0669,
            longitude: typeof site.longitude === 'number' ? site.longitude : fallback?.longitude ?? 115.9129,
            shiftStart: site.shiftStart || fallback?.shiftStart || '06:00',
          };
        });
        // Older saved data predates scheduled servicing.
        const hydratedEquipment = parsed.equipment.map((eq) =>
          typeof eq.nextServiceDueHours === 'number'
            ? eq
            : { ...eq, nextServiceDueHours: defaultServiceDue(eq) }
        );
        return { ...parsed, sites: hydratedSites, equipment: hydratedEquipment };
      }
    }
  } catch {
    // Fallback to initial seed
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // Ignore storage quota errors
  }
  return initial;
}

function loadSessionUser(users: User[]): User | null {
  try {
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    return users.find((u) => u.id === userId && u.active) || null;
  } catch {
    return null;
  }
}

export function EquipTrackProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EquipTrackState>(() => loadState());
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadSessionUser(loadState().users));
  const [selectedSite, setSelectedSite] = useState<SiteId | 'all'>('all');
  const [phoneFrameMode, setPhoneFrameMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FRAME_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(FRAME_KEY, String(phoneFrameMode));
    } catch {
      // Ignore
    }
  }, [phoneFrameMode]);

  const persistSession = (user: User | null) => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem(SESSION_KEY, user.id);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore
    }
  };

  const loginWithCredentials = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (password !== 'Demo@123') {
      return { ok: false, error: 'Invalid password. Use Demo@123 for demo accounts.' };
    }
    const matched = state.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.active
    );
    if (!matched) {
      return { ok: false, error: 'No active demo account found for that email.' };
    }
    persistSession(matched);
    if (matched.role === 'operator') {
      setSelectedSite(matched.siteId);
    } else {
      setSelectedSite('all');
    }
    return { ok: true, user: matched };
  };

  const loginAsRole = (role: UserRole) => {
    const demoEmail =
      role === 'operator'
        ? 'operator@demo.com'
        : role === 'supervisor'
        ? 'supervisor@demo.com'
        : 'admin@demo.com';
    const user =
      state.users.find((u) => u.email === demoEmail && u.active) ||
      state.users.find((u) => u.role === role && u.active) ||
      null;
    if (user) {
      persistSession(user);
      setSelectedSite(role === 'operator' ? user.siteId : 'all');
    }
    return user;
  };

  const logout = () => {
    persistSession(null);
  };

  const resetDemoData = () => {
    const fresh = createInitialSeedData();
    setState(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
    if (currentUser) {
      const matchingFreshUser = fresh.users.find((u) => u.email === currentUser.email) || null;
      persistSession(matchingFreshUser);
    }
  };

  const submitInspection = (input: SubmitInspectionInput) => {
    const eq = state.equipment.find((e) => e.id === input.equipmentId);
    const operator = currentUser || state.users[0];
    if (!eq) {
      throw new Error('Equipment not found');
    }

    const now = new Date().toISOString();
    const failedItems = input.responses.filter((r) => r.status === 'Fail');
    const result: 'Pass' | 'Fail' = failedItems.length > 0 ? 'Fail' : 'Pass';

    const nextInspNum = 1033 + state.inspections.length;
    const inspection: PreStartInspection = {
      id: `INSP-2026-${nextInspNum}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      equipmentType: eq.type,
      operatorId: operator.id,
      operatorName: operator.name,
      siteId: eq.siteId,
      submittedAt: now,
      hourMeterReading: input.hourMeterReading,
      result,
      failedCount: failedItems.length,
      reviewStatus: failedItems.length > 0 ? 'Fault Raised' : 'Reviewed',
      responses: input.responses,
      ...(input.notes ? { notes: input.notes } : {}),
    };

    const createdFaults: FaultRecord[] = failedItems.map((item, idx) => {
      const nextFaultNum = 1010 + state.faults.length + idx;
      const isBrakeOrSafety =
        item.label.toLowerCase().includes('brake') ||
        item.label.toLowerCase().includes('emergency') ||
        item.label.toLowerCase().includes('steering');
      return {
        id: `FR-${nextFaultNum}`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        equipmentType: eq.type,
        siteId: eq.siteId,
        inspectionId: inspection.id,
        failedItem: item.label,
        description:
          item.notes && item.notes.trim().length > 0
            ? item.notes.trim()
            : `Failed pre-start check: ${item.label}`,
        severity: isBrakeOrSafety ? 'High' : 'Medium',
        status: 'Awaiting Review',
        reportedById: operator.id,
        reportedByName: operator.name,
        reportedAt: now,
        photos: item.photos,
        completionPhotos: [],
        shareHistory: [],
        maintenanceUpdates: [],
      };
    });

    const newActivities: ActivityEvent[] = [
      {
        id: `act-${Date.now()}-insp`,
        equipmentId: eq.id,
        inspectionId: inspection.id,
        actorName: operator.name,
        actorRole: operator.roleTitle,
        action: result === 'Pass' ? 'Pre-Start Passed' : 'Pre-Start Failed',
        details:
          result === 'Pass'
            ? `Completed ${input.responses.length}/${input.responses.length} checks with no faults.`
            : `${failedItems.length} failed check(s): ${failedItems.map((f) => f.label).join(', ')}.`,
        timestamp: now,
      },
      ...createdFaults.map((fault) => ({
        id: `act-${Date.now()}-${fault.id}`,
        equipmentId: eq.id,
        faultId: fault.id,
        inspectionId: inspection.id,
        actorName: operator.name,
        actorRole: operator.roleTitle,
        action: 'Fault Reported',
        details: `${fault.id}: ${fault.failedItem} — ${fault.description}`,
        timestamp: now,
      })),
    ];

    const newNotifications: AppNotification[] = createdFaults.map((fault) => ({
      id: `notif-${Date.now()}-${fault.id}`,
      title: `New Fault Reported — ${eq.id}`,
      message: `${operator.name} reported a failed check (${fault.failedItem}) on ${eq.name}.`,
      type: 'fault',
      equipmentId: eq.id,
      faultId: fault.id,
      timestamp: now,
      read: false,
      targetRoles: ['supervisor', 'admin'],
    }));

    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((item) =>
        item.id === eq.id
          ? {
              ...item,
              lastInspectionAt: now,
              lastInspectionResult: result,
              hourMeter: Math.max(item.hourMeter, input.hourMeterReading),
            }
          : item
      ),
      inspections: [inspection, ...prev.inspections],
      faults: [...createdFaults, ...prev.faults],
      activities: [...newActivities, ...prev.activities],
      notifications: [...newNotifications, ...prev.notifications],
    }));

    return { inspection, createdFaults };
  };

  const holdAndScheduleFault = (input: HoldScheduleInput) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === input.faultId);
    if (!targetFault) return;
    const contact = state.maintenanceContacts.find((c) => c.id === input.contactId);

    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((eq) =>
        eq.id === targetFault.equipmentId ? { ...eq, status: 'On Hold' } : eq
      ),
      faults: prev.faults.map((f) =>
        f.id === input.faultId
          ? {
              ...f,
              status: 'Scheduled',
              severity: input.severity,
              assignedContactId: input.contactId,
              plannedDate: input.plannedDate,
              supervisorInstructions: input.instructions,
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-hold`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Equipment Placed On Hold',
          details: `Scheduled maintenance with ${contact?.name || 'contractor'} for ${input.plannedDate}.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}-hold`,
          title: `Equipment Placed On Hold — ${targetFault.equipmentId}`,
          message: `${targetFault.equipmentName} is ON HOLD. Maintenance scheduled with ${contact?.name || 'assigned contact'}.`,
          type: 'hold',
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          timestamp: now,
          read: false,
          targetRoles: ['operator', 'supervisor', 'admin'],
        },
        ...prev.notifications,
      ],
    }));
  };

  const escalateFault = (input: EscalateFaultInput) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === input.faultId);
    if (!targetFault) return;
    const contact = input.contactId
      ? state.maintenanceContacts.find((c) => c.id === input.contactId)
      : undefined;

    setState((prev) => ({
      ...prev,
      faults: prev.faults.map((f) =>
        f.id === input.faultId
          ? {
              ...f,
              status: 'Urgent',
              severity: 'Urgent',
              assignedContactId: input.contactId || f.assignedContactId,
              supervisorInstructions: input.instructions || f.supervisorInstructions,
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-esc`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Urgent Fault Escalated',
          details: `Fault ${targetFault.id} escalated for immediate attention${contact ? ` (${contact.name})` : ''}.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}-esc`,
          title: `Urgent Fault Escalated — ${targetFault.equipmentId}`,
          message: `${targetFault.id} (${targetFault.failedItem}) escalated for immediate action.`,
          type: 'urgent',
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          timestamp: now,
          read: false,
          targetRoles: ['supervisor', 'admin'],
        },
        ...prev.notifications,
      ],
    }));
  };

  const recordShareFault = (input: ShareFaultInput) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === input.faultId);
    if (!targetFault) return;

    setState((prev) => ({
      ...prev,
      faults: prev.faults.map((f) =>
        f.id === input.faultId
          ? {
              ...f,
              assignedContactId: input.contactId,
              shareHistory: [
                {
                  id: `sh-${Date.now()}`,
                  contactId: input.contactId,
                  contactName: input.contactName,
                  channels: input.channels,
                  message: input.message,
                  sentAt: now,
                  sentBy: actor.name,
                },
                ...f.shareHistory,
              ],
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-share`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Fault Report Shared',
          details: `Dispatched via ${input.channels.join(' & ')} to ${input.contactName}.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const saveSupervisorComment = (faultId: string, comment: string) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === faultId);
    if (!targetFault) return;
    const trimmed = comment.trim();

    setState((prev) => ({
      ...prev,
      faults: prev.faults.map((f) =>
        f.id === faultId ? { ...f, supervisorComments: trimmed || undefined } : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-comment`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Supervisor Review Comment',
          details: trimmed || 'Review comment cleared.',
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const acknowledgeFault = (faultId: string, actorName: string, note?: string) => {
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === faultId);
    if (!targetFault) return;

    setState((prev) => ({
      ...prev,
      faults: prev.faults.map((f) =>
        f.id === faultId
          ? {
              ...f,
              status: 'Acknowledged',
              acknowledgedAt: now,
              maintenanceUpdates: [
                ...f.maintenanceUpdates,
                {
                  id: `mu-${Date.now()}`,
                  timestamp: now,
                  authorName: actorName,
                  authorRole: 'Maintenance Contractor',
                  statusChangedTo: 'Acknowledged',
                  note: note?.trim() || 'Fault report acknowledged by maintenance contractor.',
                  photos: [],
                },
              ],
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-ack`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName,
          actorRole: 'Maintenance Contractor',
          action: 'Fault Acknowledged',
          details: note?.trim() || `${actorName} acknowledged fault ${faultId}.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}-ack`,
          title: `Maintenance Acknowledged — ${targetFault.equipmentId}`,
          message: `${actorName} acknowledged fault ${faultId}.`,
          type: 'maintenance',
          equipmentId: targetFault.equipmentId,
          faultId,
          timestamp: now,
          read: false,
          targetRoles: ['supervisor', 'admin'],
        },
        ...prev.notifications,
      ],
    }));
  };

  const startMaintenanceWork = (faultId: string, actorName: string, note?: string) => {
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === faultId);
    if (!targetFault) return;

    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((eq) =>
        eq.id === targetFault.equipmentId && eq.status === 'Operational'
          ? { ...eq, status: 'Under Maintenance' }
          : eq
      ),
      faults: prev.faults.map((f) =>
        f.id === faultId
          ? {
              ...f,
              status: 'In Progress',
              startedAt: f.startedAt || now,
              maintenanceUpdates: [
                ...f.maintenanceUpdates,
                {
                  id: `mu-${Date.now()}`,
                  timestamp: now,
                  authorName: actorName,
                  authorRole: 'Maintenance Contractor',
                  statusChangedTo: 'In Progress',
                  note: note?.trim() || 'Maintenance work commenced on site.',
                  photos: [],
                },
              ],
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-start`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName,
          actorRole: 'Maintenance Contractor',
          action: 'Work Started',
          details: note?.trim() || `${actorName} started repair work on ${targetFault.equipmentId}.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const addMaintenanceUpdate = (
    faultId: string,
    actorName: string,
    note: string,
    photos: string[]
  ) => {
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === faultId);
    if (!targetFault) return;

    setState((prev) => ({
      ...prev,
      faults: prev.faults.map((f) =>
        f.id === faultId
          ? {
              ...f,
              maintenanceUpdates: [
                ...f.maintenanceUpdates,
                {
                  id: `mu-${Date.now()}`,
                  timestamp: now,
                  authorName: actorName,
                  authorRole: 'Maintenance Contractor',
                  note,
                  photos,
                },
              ],
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-upd`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName,
          actorRole: 'Maintenance Contractor',
          action: 'Maintenance Update Added',
          details: note,
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const completeMaintenanceWork = (
    faultId: string,
    actorName: string,
    summary: string,
    photos: string[]
  ) => {
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === faultId);
    if (!targetFault) return;
    const eq = state.equipment.find((e) => e.id === targetFault.equipmentId);
    const wasRestricted = eq && (eq.status === 'On Hold' || eq.status === 'Under Maintenance');
    const nextFaultStatus = wasRestricted
      ? 'Awaiting Return-to-Service Approval'
      : 'Maintenance Completed';

    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((item) =>
        item.id === targetFault.equipmentId &&
        (item.status === 'On Hold' || item.status === 'Under Maintenance')
          ? { ...item, status: 'Awaiting Return-to-Service' }
          : item
      ),
      faults: prev.faults.map((f) =>
        f.id === faultId
          ? {
              ...f,
              status: nextFaultStatus,
              completedAt: now,
              completionSummary: summary,
              completionPhotos: [...f.completionPhotos, ...photos],
              maintenanceUpdates: [
                ...f.maintenanceUpdates,
                {
                  id: `mu-${Date.now()}`,
                  timestamp: now,
                  authorName: actorName,
                  authorRole: 'Maintenance Contractor',
                  statusChangedTo: nextFaultStatus,
                  note: summary,
                  photos,
                },
              ],
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-comp`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName,
          actorRole: 'Maintenance Contractor',
          action: 'Maintenance Completed',
          details: `${summary} (${wasRestricted ? 'Moved to Awaiting Return-to-Service Approval' : 'Maintenance Completed'}).`,
          timestamp: now,
        },
        ...prev.activities,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}-comp`,
          title: `Maintenance Completed — ${targetFault.equipmentId}`,
          message: `${actorName} completed work on ${targetFault.equipmentName}. Return-to-service approval required.`,
          type: 'rts',
          equipmentId: targetFault.equipmentId,
          faultId,
          timestamp: now,
          read: false,
          targetRoles: ['supervisor', 'admin'],
        },
        ...prev.notifications,
      ],
    }));
  };

  const approveReturnToService = (faultId: string, notes: string) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === faultId);
    if (!targetFault) return;

    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((eq) =>
        eq.id === targetFault.equipmentId ? { ...eq, status: 'Operational' } : eq
      ),
      faults: prev.faults.map((f) =>
        f.id === faultId
          ? {
              ...f,
              status: 'Resolved',
              rtsApprovedBy: actor.name,
              rtsApprovedAt: now,
              rtsDecisionNotes: notes.trim() || 'Verified maintenance work and cleared for operational service.',
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-rts`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Return-to-Service Approved',
          details: notes.trim() || `${targetFault.equipmentId} returned to Operational status.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}-rts`,
          title: `${targetFault.equipmentId} Returned to Service`,
          message: `${actor.name} approved return-to-service for ${targetFault.equipmentName}. Status is now Operational.`,
          type: 'info',
          equipmentId: targetFault.equipmentId,
          faultId,
          timestamp: now,
          read: false,
          targetRoles: ['operator', 'supervisor', 'admin'],
        },
        ...prev.notifications,
      ],
    }));
  };

  const rejectReturnToService = (faultId: string, notes: string) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    const targetFault = state.faults.find((f) => f.id === faultId);
    if (!targetFault) return;

    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((eq) =>
        eq.id === targetFault.equipmentId ? { ...eq, status: 'On Hold' } : eq
      ),
      faults: prev.faults.map((f) =>
        f.id === faultId
          ? {
              ...f,
              status: 'In Progress',
              rtsDecisionNotes: notes.trim() || 'Return-to-service rejected; further maintenance required.',
              maintenanceUpdates: [
                ...f.maintenanceUpdates,
                {
                  id: `mu-${Date.now()}`,
                  timestamp: now,
                  authorName: actor.name,
                  authorRole: actor.roleTitle,
                  statusChangedTo: 'In Progress',
                  note: `Return-to-service rejected: ${notes.trim() || 'Additional work required.'}`,
                  photos: [],
                },
              ],
            }
          : f
      ),
      activities: [
        {
          id: `act-${Date.now()}-rts-rej`,
          equipmentId: targetFault.equipmentId,
          faultId: targetFault.id,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Return-to-Service Rejected',
          details: notes.trim() || 'Returned to maintenance for additional inspection.',
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const addEquipment = (eq: Omit<Equipment, 'lastInspectionAt'>) => {
    const actor = currentUser || state.users[2];
    const now = new Date().toISOString();
    const newEq: Equipment = {
      ...eq,
      nextServiceDueHours: eq.nextServiceDueHours ?? defaultServiceDue(eq),
      lastInspectionAt: now,
    };
    setState((prev) => ({
      ...prev,
      equipment: [newEq, ...prev.equipment],
      activities: [
        {
          id: `act-${Date.now()}-addeq`,
          equipmentId: newEq.id,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Equipment Added',
          details: `Registered ${newEq.name} (${newEq.type}) to fleet.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const updateEquipment = (eq: Equipment) => {
    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((item) => (item.id === eq.id ? eq : item)),
    }));
  };

  const setEquipmentStatusManual = (equipmentId: string, status: EquipmentStatus) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((eq) => (eq.id === equipmentId ? { ...eq, status } : eq)),
      activities: [
        {
          id: `act-${Date.now()}-status`,
          equipmentId,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: `Status Changed to ${status}`,
          details: `Manual status update by ${actor.name}.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const recordService = (equipmentId: string) => {
    const actor = currentUser || state.users[1];
    const now = new Date().toISOString();
    const eq = state.equipment.find((e) => e.id === equipmentId);
    if (!eq) return;
    const nextDue = eq.hourMeter + SERVICE_INTERVAL_HOURS;
    setState((prev) => ({
      ...prev,
      equipment: prev.equipment.map((e) =>
        e.id === equipmentId ? { ...e, nextServiceDueHours: nextDue } : e
      ),
      activities: [
        {
          id: `act-${Date.now()}-service`,
          equipmentId,
          actorName: actor.name,
          actorRole: actor.roleTitle,
          action: 'Scheduled Service Completed',
          details: `Serviced at ${eq.hourMeter.toLocaleString()} hrs. Next service due at ${nextDue.toLocaleString()} hrs.`,
          timestamp: now,
        },
        ...prev.activities,
      ],
    }));
  };

  const addUser = (user: Omit<User, 'id' | 'initials'>) => {
    const parts = user.name.trim().split(/\s+/);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      initials: initials || 'US',
    };
    setState((prev) => ({
      ...prev,
      users: [newUser, ...prev.users],
    }));
  };

  const updateUser = (user: User) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === user.id ? user : u)),
    }));
  };

  const updateSite = (site: Site) => {
    setState((prev) => ({
      ...prev,
      sites: prev.sites.map((s) => (s.id === site.id ? site : s)),
    }));
  };

  const updateTemplateItems = (type: EquipmentType, items: ChecklistItemTemplate[]) => {
    setState((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [type]: {
          equipmentType: type,
          updatedAt: new Date().toISOString(),
          items,
        },
      },
    }));
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  return (
    <EquipTrackContext.Provider
      value={{
        state,
        currentUser,
        selectedSite,
        setSelectedSite,
        phoneFrameMode,
        setPhoneFrameMode,
        loginWithCredentials,
        loginAsRole,
        logout,
        resetDemoData,
        submitInspection,
        holdAndScheduleFault,
        escalateFault,
        recordShareFault,
        saveSupervisorComment,
        acknowledgeFault,
        startMaintenanceWork,
        addMaintenanceUpdate,
        completeMaintenanceWork,
        approveReturnToService,
        rejectReturnToService,
        addEquipment,
        updateEquipment,
        setEquipmentStatusManual,
        recordService,
        addUser,
        updateUser,
        updateSite,
        updateTemplateItems,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </EquipTrackContext.Provider>
  );
}

export function useEquipTrack() {
  const ctx = useContext(EquipTrackContext);
  if (!ctx) throw new Error('useEquipTrack must be used inside EquipTrackProvider');
  return ctx;
}
