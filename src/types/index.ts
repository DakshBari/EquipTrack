export type UserRole = 'operator' | 'supervisor' | 'admin';

export type SiteId = 'canning-vale' | 'jandakot';

export type EquipmentType = 'Forklift' | 'Baler' | 'Loader' | 'Truck';

export type EquipmentStatus =
  | 'Operational'
  | 'On Hold'
  | 'Under Maintenance'
  | 'Awaiting Return-to-Service';

export type FaultStatus =
  | 'Awaiting Review'
  | 'Scheduled'
  | 'Urgent'
  | 'Acknowledged'
  | 'In Progress'
  | 'Maintenance Completed'
  | 'Awaiting Return-to-Service Approval'
  | 'Resolved';

export type FaultSeverity = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Site {
  id: SiteId;
  name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  managerName: string;
  phone: string;
  bayCount: number;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  siteId: SiteId;
  phone: string;
  active: boolean;
  initials: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  siteId: SiteId;
  manufacturer: string;
  model: string;
  serialNumber: string;
  year: number;
  hourMeter: number;
  status: EquipmentStatus;
  assignedOperatorId: string;
  lastInspectionAt: string;
  lastInspectionResult?: 'Pass' | 'Fail';
  imageUrl: string;
}

export interface ChecklistItemTemplate {
  id: string;
  label: string;
  category: string;
  mandatory: boolean;
  requireNotesOnFail: boolean;
  requirePhotoOnFail: boolean;
}

export interface ChecklistTemplate {
  equipmentType: EquipmentType;
  updatedAt: string;
  items: ChecklistItemTemplate[];
}

export interface ChecklistResponse {
  itemId: string;
  label: string;
  category: string;
  status: 'Pass' | 'Fail';
  notes?: string;
  photos: string[];
}

export interface PreStartInspection {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: EquipmentType;
  operatorId: string;
  operatorName: string;
  siteId: SiteId;
  submittedAt: string;
  hourMeterReading: number;
  result: 'Pass' | 'Fail';
  failedCount: number;
  reviewStatus: 'Reviewed' | 'Pending Review' | 'Fault Raised';
  responses: ChecklistResponse[];
}

export interface MaintenanceContact {
  id: string;
  name: string;
  company: string;
  specialty: string;
  phone: string;
  email: string;
}

export interface ShareRecord {
  id: string;
  contactId: string;
  contactName: string;
  channels: ('SMS' | 'Email')[];
  message: string;
  sentAt: string;
  sentBy: string;
}

export interface MaintenanceUpdate {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: string;
  statusChangedTo?: FaultStatus;
  note: string;
  photos: string[];
}

export interface FaultRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: EquipmentType;
  siteId: SiteId;
  inspectionId: string;
  failedItem: string;
  description: string;
  severity: FaultSeverity;
  status: FaultStatus;
  reportedById: string;
  reportedByName: string;
  reportedAt: string;
  photos: string[];
  supervisorInstructions?: string;
  supervisorComments?: string;
  assignedContactId?: string;
  plannedDate?: string;
  acknowledgedAt?: string;
  startedAt?: string;
  completedAt?: string;
  completionSummary?: string;
  completionPhotos: string[];
  rtsApprovedBy?: string;
  rtsApprovedAt?: string;
  rtsDecisionNotes?: string;
  shareHistory: ShareRecord[];
  maintenanceUpdates: MaintenanceUpdate[];
}

export interface ActivityEvent {
  id: string;
  equipmentId: string;
  faultId?: string;
  inspectionId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'fault' | 'urgent' | 'hold' | 'maintenance' | 'rts' | 'info';
  equipmentId?: string;
  faultId?: string;
  timestamp: string;
  read: boolean;
  targetRoles: UserRole[];
}

export interface EquipTrackState {
  sites: Site[];
  users: User[];
  equipment: Equipment[];
  templates: Record<EquipmentType, ChecklistTemplate>;
  inspections: PreStartInspection[];
  faults: FaultRecord[];
  maintenanceContacts: MaintenanceContact[];
  activities: ActivityEvent[];
  notifications: AppNotification[];
}
