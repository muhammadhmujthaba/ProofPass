import { useEffect, useSyncExternalStore } from 'react';
import type { AppState, Lang, Theme } from './types';

const STORAGE_KEY = 'proofpass-state-v1';

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function seedState(): AppState {
  return {
    lang: 'en',
    theme: 'dark',
    records: [
      {
        id: 'seed-address-1',
        type: 'address',
        title: 'Al Nahda home',
        fields: {
          label: 'Al Nahda home',
          street: 'Al Nahda, Building 14, Apartment 602',
          city: 'Sharjah',
          emirate: 'Sharjah',
          postalCode: '',
        },
        issueDate: '',
        expiryDate: '',
        source: 'manual',
        reviewStatus: 'confirmed',
        authorizedFor: ['housing_registration'],
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 3,
      },
      {
        id: 'seed-id-1',
        type: 'identity',
        title: 'Ahmed Demo ID',
        fields: {
          name: 'Ahmed Al Nahda',
          number: '784-1989-1234567',
        },
        issueDate: '2022-01-15',
        expiryDate: '2027-01-14',
        source: 'ocr',
        reviewStatus: 'confirmed',
        authorizedFor: [],
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
    ],
    journeys: {},
    proofKeys: [],
    receipts: [],
    activity: [
      {
        id: 'seed-act-1',
        kind: 'record_saved',
        message: 'Saved record: Al Nahda home',
        timestamp: Date.now() - 86400000 * 3,
      },
    ],
  };
}

function load(): AppState {
  if (typeof localStorage === 'undefined') return seedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.records || !parsed.journeys) return seedState();
    return parsed;
  } catch {
    return seedState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage may be full or unavailable; ignore gracefully
  }
}

function emit() {
  persist();
  for (const l of listeners) l();
}

function setState(next: Partial<AppState> | ((prev: AppState) => AppState)) {
  if (typeof next === 'function') {
    state = next(state);
  } else {
    state = { ...state, ...next };
  }
  emit();
}

export function getState(): AppState {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// React hook for reading the store
export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function useAppState(): AppState {
  return useStore((s) => s);
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function logActivity(kind: AppState['activity'][number]['kind'], message: string) {
  setState((prev) => ({
    ...prev,
    activity: [{ id: uid('act'), kind, message, timestamp: Date.now() }, ...prev.activity],
  }));
}

export function setLang(lang: Lang) {
  setState((prev) => ({ ...prev, lang }));
}

export function setTheme(theme: Theme) {
  setState((prev) => ({ ...prev, theme }));
}

export function startJourney(journeyId: import('./types').JourneyId) {
  if (state.journeys[journeyId]) {
    // already exists; don't restart a completed journey
    return;
  }
  setState((prev) => ({
    ...prev,
    journeys: { ...prev.journeys, [journeyId]: { id: journeyId, startedAt: Date.now(), formValues: {} } },
  }));
}

export function saveRecord(record: Omit<import('./types').SavedRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = Date.now();
  if (record.id) {
    const existing = state.records.find((r) => r.id === record.id);
    if (existing) {
      setState((prev) => ({
        ...prev,
        records: prev.records.map((r) => (r.id === record.id ? { ...r, ...record, id: record.id, updatedAt: now } : r)),
      }));
      logActivity('record_saved', `Updated record: ${record.title}`);
      return record.id;
    }
  }
  const id = record.id || uid('rec');
  const full = { ...record, id, createdAt: now, updatedAt: now } as import('./types').SavedRecord;
  setState((prev) => ({ ...prev, records: [...prev.records, full] }));
  logActivity('record_saved', `Saved record: ${record.title}`);
  return id;
}

export function deleteRecord(id: string) {
  const rec = state.records.find((r) => r.id === id);
  setState((prev) => ({ ...prev, records: prev.records.filter((r) => r.id !== id) }));
  if (rec) logActivity('record_deleted', `Deleted record: ${rec.title}`);
}

export function toggleRecordAuthorization(recordId: string, journeyId: string) {
  const rec = state.records.find((r) => r.id === recordId);
  if (!rec) return;
  const authorized = rec.authorizedFor.includes(journeyId);
  const nextAuth = authorized
    ? rec.authorizedFor.filter((j) => j !== journeyId)
    : [...rec.authorizedFor, journeyId];
  setState((prev) => ({
    ...prev,
    records: prev.records.map((r) =>
      r.id === recordId ? { ...r, authorizedFor: nextAuth, updatedAt: Date.now() } : r,
    ),
  }));
  logActivity(authorized ? 'permission_declined' : 'permission_approved', `${authorized ? 'Revoked' : 'Granted'} reuse for ${rec.title}`);
}

export function setFormValue(journeyId: string, key: string, value: string) {
  setState((prev) => {
    const j = prev.journeys[journeyId as keyof typeof prev.journeys];
    if (!j) return prev;
    return {
      ...prev,
      journeys: {
        ...prev.journeys,
        [journeyId]: { ...j, formValues: { ...j.formValues, [key]: value } },
      },
    };
  });
}

export function requestProofKey(journeyId: string, purpose: string, infoUsed: string[]) {
  // Remove any existing non-used/cancelled/expired key for this journey
  const existing = state.proofKeys.find((k) => k.journeyId === journeyId && (k.state === 'awaiting' || k.state === 'approved'));
  if (existing) return existing.id;
  const id = uid('pk');
  const key = {
    id,
    journeyId,
    purpose,
    infoUsed,
    state: 'awaiting' as const,
  };
  setState((prev) => ({ ...prev, proofKeys: [...prev.proofKeys, key] }));
  logActivity('permission_requested', `Requested authorization: ${purpose}`);
  return id;
}

export function approveProofKey(id: string) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  setState((prev) => ({
    ...prev,
    proofKeys: prev.proofKeys.map((k) =>
      k.id === id ? { ...k, state: 'approved' as const, approvedAt: Date.now(), expiresAt } : k,
    ),
  }));
  const k = state.proofKeys.find((x) => x.id === id);
  logActivity('permission_approved', `Approved authorization: ${k?.purpose || ''}`);
}

export function declineProofKey(id: string) {
  setState((prev) => ({
    ...prev,
    proofKeys: prev.proofKeys.map((k) =>
      k.id === id ? { ...k, state: 'cancelled' as const, cancelledAt: Date.now() } : k,
    ),
  }));
  logActivity('permission_declined', 'Declined authorization');
}

export function expireProofKey(id: string) {
  setState((prev) => ({
    ...prev,
    proofKeys: prev.proofKeys.map((k) =>
      k.id === id ? { ...k, state: 'expired' as const, expiredAt: Date.now() } : k,
    ),
  }));
  logActivity('permission_expired', 'Authorization expired');
}

export function completeSubmission(journeyId: string, infoSummary: { label: string; value: string }[]) {
  const journey = state.journeys[journeyId as keyof typeof state.journeys];
  if (!journey) return;
  if (journey.receiptId) return; // prevent duplicate submissions

  const proofKey = state.proofKeys.find((k) => k.journeyId === journeyId && k.state === 'approved');
  const receiptId = uid('recpt');
  const reference = `PP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const receipt = {
    id: receiptId,
    journeyId,
    reference,
    timestamp: Date.now(),
    outcome: 'Housing Registration submitted (simulated)',
    infoSummary,
  };

  setState((prev) => ({
    ...prev,
    journeys: {
      ...prev.journeys,
      [journeyId]: { ...prev.journeys[journeyId as keyof typeof prev.journeys], completedAt: Date.now(), receiptId },
    },
    receipts: [...prev.receipts, receipt],
    proofKeys: proofKey
      ? prev.proofKeys.map((k) => (k.id === proofKey.id ? { ...k, state: 'used' as const, usedAt: Date.now() } : k))
      : prev.proofKeys,
  }));
  logActivity('submission_completed', `Completed submission (ref: ${reference})`);
  logActivity('receipt_generated', `Proof Receipt generated (ref: ${reference})`);
}

export function clearActivity() {
  setState((prev) => ({ ...prev, activity: [] }));
}

export function resetDemo() {
  state = seedState();
  emit();
  logActivity('reset', 'Demo reset to clean starting state');
}

// Tick for ProofKey expiry — called on an interval.
export function tickProofKeys() {
  const now = Date.now();
  const expired = state.proofKeys.filter((k) => k.state === 'approved' && k.expiresAt && k.expiresAt < now);
  if (expired.length === 0) return;
  setState((prev) => ({
    ...prev,
    proofKeys: prev.proofKeys.map((k) =>
      k.state === 'approved' && k.expiresAt && k.expiresAt < now ? { ...k, state: 'expired' as const, expiredAt: now } : k,
    ),
  }));
  logActivity('permission_expired', 'Authorization expired');
}

// Helper to check storage availability
export function storageAvailable(): boolean {
  try {
    const k = '__pp_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

// Apply theme + lang to <html> reactively
export function useApplyDocumentAttrs() {
  const lang = useStore((s) => s.lang);
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }, [lang, theme]);
}

export { todayISO };
