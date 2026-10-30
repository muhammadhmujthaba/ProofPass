// ProofPass core data model — single source of truth for the application state.

export type Lang = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export type RecordType = 'address' | 'contact' | 'identity';

export interface SavedRecord {
  id: string;
  type: RecordType;
  title: string;
  fields: Record<string, string>;
  issueDate?: string;
  expiryDate?: string;
  source: 'manual' | 'ocr';
  reviewStatus: 'confirmed' | 'unconfirmed';
  authorizedFor: string[]; // journey ids this record may be reused for
  createdAt: number;
  updatedAt: number;
}

export type JourneyStageState =
  | 'satisfied'
  | 'prepared'
  | 'needs_input'
  | 'in_progress'
  | 'locked'
  | 'upcoming'
  | 'awaiting_consent'
  | 'permission_required'
  | 'waiting'
  | 'expired'
  | 'completed';

export type ProofKeyState = 'awaiting' | 'approved' | 'cancelled' | 'expired' | 'used';

export interface ProofKey {
  id: string;
  journeyId: string;
  purpose: string;
  infoUsed: string[];
  state: ProofKeyState;
  approvedAt?: number;
  expiresAt?: number; // 10 minutes after approval
  usedAt?: number;
  cancelledAt?: number;
  expiredAt?: number;
}

export interface SubmissionReceipt {
  id: string;
  journeyId: string;
  reference: string;
  timestamp: number;
  outcome: string;
  infoSummary: { label: string; value: string }[];
}

export type ActivityKind =
  | 'journey_started'
  | 'blueprint_created'
  | 'reuse_detected'
  | 'info_matched'
  | 'gap_resolved'
  | 'record_saved'
  | 'document_uploaded'
  | 'record_deleted'
  | 'permission_requested'
  | 'permission_approved'
  | 'permission_declined'
  | 'permission_expired'
  | 'submission_completed'
  | 'receipt_generated'
  | 'reset'
  | 'goal_recognized';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  timestamp: number;
}

export type JourneyId = 'housing_registration';

export interface Journey {
  id: JourneyId;
  startedAt: number;
  completedAt?: number;
  receiptId?: string;
  proofKeyId?: string;
  formValues: Record<string, string>;
}

export interface AppState {
  lang: Lang;
  theme: Theme;
  records: SavedRecord[];
  journeys: Partial<Record<JourneyId, Journey>>;
  proofKeys: ProofKey[];
  receipts: SubmissionReceipt[];
  activity: ActivityEvent[];
}
