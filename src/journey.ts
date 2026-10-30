import type { AppState, JourneyId, SavedRecord, JourneyStageState } from './types';

// ---------------------------------------------------------------------------
// Journey specifications — deterministic, testable business logic.
// Each requirement is matched against the resident's saved records.
// Where official sources are unavailable, assumptions are labeled as such.
// ---------------------------------------------------------------------------

export interface RequirementSpec {
  id: string;
  kind: 'address' | 'contact';
  labelKey: string; // path into i18n (resolved by caller)
  recordType: 'address' | 'contact';
  /** Returns a completeness check on a candidate record's fields. */
  isComplete: (record: SavedRecord) => boolean;
  /** Whether an expiry date matters and the record is considered expired. */
  isExpired: (record: SavedRecord) => boolean;
}

export interface JourneySpec {
  id: JourneyId;
  outcomeKey: string;
  /** Recognizer phrases (lowercased) — returns true if the goal text matches. */
  phrases: string[];
  requirements: RequirementSpec[];
  /** Requirements that depend on other requirements being resolved first. */
  dependencies: Record<string, string[]>; // reqId -> dependsOn[]
}

export const HOUSING_JOURNEY: JourneySpec = {
  id: 'housing_registration',
  outcomeKey: 'housing.title',
  phrases: ['register my new home', 'register new home', 'new home', 'housing registration', 'سجّل منزلي', 'تسجيل السكن', 'منزل جديد'],
  requirements: [
    {
      id: 'address',
      kind: 'address',
      labelKey: 'housing.field.address',
      recordType: 'address',
      isComplete: (r) => Boolean(r.fields.street && r.fields.city && r.fields.emirate),
      isExpired: () => false, // addresses do not expire
    },
    {
      id: 'contact',
      kind: 'contact',
      labelKey: 'housing.field.contact',
      recordType: 'contact',
      isComplete: (r) => Boolean(r.fields.method),
      isExpired: () => false,
    },
  ],
  dependencies: {}, // contact does not depend on address in this prototype
};

export const JOURNEYS: Record<JourneyId, JourneySpec> = {
  housing_registration: HOUSING_JOURNEY,
};

// Fuzzy matching: normalizes text by removing duplicate letters and common
// misspellings so "redister hose" still matches "register house".
function normalizeText(s: string): string {
  // Remove non-alphanumeric except spaces, collapse spaces
  s = s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Collapse repeated characters (e.g. "reeegister" -> "regiter") — keep at most 2
  s = s.replace(/(.)\1{2,}/g, '$1$1');
  return s;
}

// Levenshtein distance for short strings — used to match keywords with typos.
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[m][n];
}

// Keyword sets per journey — if ANY keyword fuzzy-matches, the journey is recognized.
const JOURNEY_KEYWORDS: Record<JourneyId, { en: string[]; ar: string[] }> = {
  housing_registration: {
    en: ['register', 'house', 'home', 'housing', 'residence', 'residential', 'apartment', 'villa', 'address', 'move', 'relocate', 'property', 'dwelling'],
    ar: ['سجّل', 'تسجيل', 'منزل', 'سكن', 'بيت', 'شقة', 'سكني', 'عنوان', 'انتقال', 'عقار'],
  },
};

export function recognizeGoal(text: string): JourneyId | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;

  for (const spec of Object.values(JOURNEYS)) {
    // First try exact phrase match (fast path)
    if (spec.phrases.some((p) => normalized.includes(normalizeText(p)))) return spec.id;
  }

  // Fuzzy keyword matching — score each journey by how many keywords match
  let bestJourney: JourneyId | null = null;
  let bestScore = 0;

  for (const [jid, kws] of Object.entries(JOURNEY_KEYWORDS)) {
    const words = normalized.split(' ');
    let score = 0;
    const allKws = [...kws.en, ...kws.ar];
    for (const word of words) {
      for (const kw of allKws) {
        const nkw = normalizeText(kw);
        // Exact word match
        if (word === nkw) { score += 2; break; }
        // Prefix match (handles "redister" vs "register" partially)
        if (word.length >= 4 && nkw.startsWith(word.slice(0, 3))) { score += 1.5; break; }
        // Fuzzy: Levenshtein distance <= 2 for words of length >= 4
        if (word.length >= 4 && nkw.length >= 4) {
          const dist = levenshtein(word, nkw);
          if (dist <= 2) { score += 1; break; }
          // Allow transposition of adjacent chars (common typo)
          if (dist === 2 && word.length === nkw.length) { score += 1; break; }
        }
      }
    }
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestJourney = jid as JourneyId;
    }
  }

  return bestJourney;
}

// ---------------------------------------------------------------------------
// Requirement evaluation — deterministic matching against saved records.
// ---------------------------------------------------------------------------

export type MatchResult =
  | { status: 'satisfied'; record: SavedRecord; reason: 'matched' }
  | { status: 'expired'; record: SavedRecord; reason: 'expired' }
  | { status: 'not_authorized'; record: SavedRecord; reason: 'not_authorized' }
  | { status: 'needs_input'; reason: 'no_record' | 'incomplete' };

export function evaluateRequirement(
  spec: RequirementSpec,
  records: SavedRecord[],
): MatchResult {
  const candidates = records.filter((r) => r.type === spec.recordType);
  if (candidates.length === 0) return { status: 'needs_input', reason: 'no_record' };

  // Prefer authorized + complete + not expired, in that order of priority.
  const ranked = candidates
    .filter((r) => spec.isComplete(r))
    .sort((a, b) => {
      const aAuth = a.authorizedFor.includes('housing_registration') ? 1 : 0;
      const bAuth = b.authorizedFor.includes('housing_registration') ? 1 : 0;
      if (aAuth !== bAuth) return bAuth - aAuth;
      return b.updatedAt - a.updatedAt;
    });

  const authorized = ranked.find((r) => r.authorizedFor.includes('housing_registration'));
  const unauthorized = ranked.find((r) => !r.authorizedFor.includes('housing_registration'));

  if (authorized) {
    if (spec.isExpired(authorized)) return { status: 'expired', record: authorized, reason: 'expired' };
    return { status: 'satisfied', record: authorized, reason: 'matched' };
  }
  if (unauthorized) {
    if (spec.isExpired(unauthorized)) return { status: 'expired', record: unauthorized, reason: 'expired' };
    return { status: 'not_authorized', record: unauthorized, reason: 'not_authorized' };
  }
  // Candidates exist but none complete.
  const incomplete = candidates[0];
  if (spec.isExpired(incomplete)) return { status: 'expired', record: incomplete, reason: 'expired' };
  return { status: 'needs_input', reason: 'incomplete' };
}

export interface JourneyEvaluation {
  spec: JourneySpec;
  requirements: {
    spec: RequirementSpec;
    match: MatchResult;
    stageState: JourneyStageState;
    explanationKey: string;
    explanationVars: Record<string, string>;
  }[];
  stages: { key: string; state: JourneyStageState; explanation: string }[];
  resolvedCount: number;
  totalRequirements: number;
  nextAction: string | null;
  isComplete: boolean;
}

export function evaluateJourney(state: AppState, journeyId: JourneyId): JourneyEvaluation | null {
  const spec = JOURNEYS[journeyId];
  if (!spec) return null;
  const journey = state.journeys[journeyId];

  const reqs = spec.requirements.map((rspec) => {
    const match = evaluateRequirement(rspec, state.records);
    let stageState: JourneyStageState;
    let explanationKey: string;
    const explanationVars: Record<string, string> = {};

    switch (match.status) {
      case 'satisfied':
        stageState = 'satisfied';
        explanationKey = 'prooflens.matchedFrom';
        explanationVars.record = match.record.title;
        break;
      case 'expired':
        stageState = 'expired';
        explanationKey = 'prooflens.expired';
        explanationVars.record = match.record.title;
        break;
      case 'not_authorized':
        stageState = 'permission_required';
        explanationKey = 'prooflens.notAuthorized';
        explanationVars.record = match.record.title;
        break;
      case 'needs_input':
        stageState = 'needs_input';
        explanationKey = match.reason === 'incomplete' ? 'prooflens.needsInput' : 'prooflens.missing';
        break;
    }
    return { spec: rspec, match, stageState, explanationKey, explanationVars };
  });

  const resolvedCount = reqs.filter((r) => r.stageState === 'satisfied').length;
  const totalRequirements = spec.requirements.length;
  const allResolved = resolvedCount === totalRequirements;

  // Stage computation
  const hasProofKey = state.proofKeys.find((k) => k.journeyId === journeyId);
  const submitted = Boolean(journey?.receiptId);

  function stageState(reqState: JourneyStageState): JourneyStageState {
    if (submitted) return 'completed';
    return reqState;
  }

  const understandState: JourneyStageState = submitted ? 'completed' : 'satisfied';
  const matchState: JourneyStageState = submitted ? 'completed' : allResolved ? 'satisfied' : reqs.some((r) => r.stageState !== 'satisfied') ? 'needs_input' : 'satisfied';
  const resolveState: JourneyStageState = submitted ? 'completed' : allResolved ? 'completed' : 'needs_input';
  const prepareState: JourneyStageState = submitted ? 'completed' : allResolved ? 'prepared' : 'waiting';
  const reviewState: JourneyStageState = submitted ? 'completed' : allResolved ? (hasProofKey?.state === 'approved' ? 'satisfied' : 'permission_required') : 'waiting';
  const completeState: JourneyStageState = submitted ? 'completed' : 'waiting';
  const receiptState: JourneyStageState = submitted ? 'completed' : 'waiting';

  void stageState;

  const stages = [
    { key: 'understand', state: understandState, explanation: '' },
    { key: 'match', state: matchState, explanation: '' },
    { key: 'resolve', state: resolveState, explanation: '' },
    { key: 'prepare', state: prepareState, explanation: '' },
    { key: 'review', state: reviewState, explanation: '' },
    { key: 'complete', state: completeState, explanation: '' },
    { key: 'receipt', state: receiptState, explanation: '' },
  ];

  // Next action determination
  let nextAction: string | null = null;
  if (submitted) {
    nextAction = null;
  } else if (!allResolved) {
    nextAction = 'housing.resolveGaps';
  } else if (!hasProofKey || hasProofKey.state === 'awaiting') {
    nextAction = 'housing.authorize';
  } else if (hasProofKey.state === 'approved') {
    nextAction = 'housing.authorize';
  } else if (hasProofKey.state === 'cancelled' || hasProofKey.state === 'expired') {
    nextAction = 'proofkey.requestNew';
  } else if (hasProofKey.state === 'used') {
    nextAction = null;
  }

  return {
    spec,
    requirements: reqs,
    stages,
    resolvedCount,
    totalRequirements,
    nextAction,
    isComplete: submitted,
  };
}

// Prepared fields for the housing form — reuse matched records automatically.
export function getPreparedFields(state: AppState, journeyId: JourneyId): { labelKey: string; value: string; recordTitle?: string }[] {
  const spec = JOURNEYS[journeyId];
  if (!spec) return [];
  const out: { labelKey: string; value: string; recordTitle?: string }[] = [];
  for (const rspec of spec.requirements) {
    const match = evaluateRequirement(rspec, state.records);
    if (match.status === 'satisfied') {
      const r = match.record;
      let value = '';
      if (rspec.kind === 'address') {
        value = [r.fields.street, r.fields.city, r.fields.emirate, r.fields.postalCode].filter(Boolean).join(', ');
      } else {
        value = r.fields.value ? `${r.fields.method}: ${r.fields.value}` : r.fields.method;
      }
      out.push({ labelKey: rspec.labelKey, value, recordTitle: r.title });
    }
  }
  return out;
}

export function getMissingRequirements(state: AppState, journeyId: JourneyId): { spec: RequirementSpec; match: MatchResult }[] {
  const spec = JOURNEYS[journeyId];
  if (!spec) return [];
  return spec.requirements
    .map((rspec) => ({ spec: rspec, match: evaluateRequirement(rspec, state.records) }))
    .filter((r) => r.match.status !== 'satisfied');
}
