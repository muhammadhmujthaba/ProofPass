import type { AppState, JourneyStageState } from './types';
import { evaluateJourney, type JourneyEvaluation } from './journey';

export interface JourneyIntelligence {
  evaluation: JourneyEvaluation;
  readinessPercent: number;
  readyCount: number;
  attentionCount: number;
  reusableCount: number;
  awaitingConsent: boolean;
  currentStageIndex: number;
  stepsRemaining: number;
  nextMoveKey: string;
  nextMoveView: 'housing' | 'proofkey' | 'receipt';
}

export function getJourneyIntelligence(state: AppState, journeyId: 'housing_registration'): JourneyIntelligence | null {
  const evaluation = evaluateJourney(state, journeyId);
  if (!evaluation) return null;

  const readyCount = evaluation.requirements.filter((requirement) => requirement.match.status === 'satisfied').length;
  const attentionCount = evaluation.requirements.filter((requirement) => requirement.match.status !== 'satisfied').length;
  const reusableCount = evaluation.requirements.filter((requirement) => requirement.match.status === 'satisfied' && requirement.match.reason === 'matched').length;
  const proofKey = state.proofKeys.find((key) => key.journeyId === journeyId && ['awaiting', 'approved'].includes(key.state));
  const awaitingConsent = Boolean(proofKey && proofKey.state === 'awaiting');
  const approved = proofKey?.state === 'approved';
  const readinessPercent = evaluation.isComplete
    ? 100
    : Math.round((readyCount / evaluation.totalRequirements) * 70 + (approved ? 20 : 0));

  let currentStageIndex = 0;
  let nextMoveKey = 'intelligence.next.resolve';
  let nextMoveView: JourneyIntelligence['nextMoveView'] = 'housing';
  let stepsRemaining = attentionCount + 2;

  if (evaluation.isComplete) {
    currentStageIndex = 6;
    nextMoveKey = 'intelligence.next.complete';
    nextMoveView = 'receipt';
    stepsRemaining = 0;
  } else if (attentionCount === 0 && !approved) {
    currentStageIndex = 4;
    nextMoveKey = awaitingConsent ? 'intelligence.next.awaitingConsent' : 'intelligence.next.authorize';
    nextMoveView = awaitingConsent ? 'proofkey' : 'housing';
    stepsRemaining = awaitingConsent ? 2 : 2;
  } else if (attentionCount === 0 && approved) {
    currentStageIndex = 5;
    nextMoveKey = 'intelligence.next.submit';
    nextMoveView = 'housing';
    stepsRemaining = 1;
  } else if (readyCount > 0) {
    currentStageIndex = 2;
    nextMoveKey = 'intelligence.next.resolve';
    nextMoveView = 'housing';
  } else {
    currentStageIndex = 1;
  }

  return {
    evaluation,
    readinessPercent,
    readyCount,
    attentionCount,
    reusableCount,
    awaitingConsent,
    currentStageIndex,
    stepsRemaining,
    nextMoveKey,
    nextMoveView,
  };
}

export function getBlueprintStageState(intelligence: JourneyIntelligence, index: number): JourneyStageState {
  const { evaluation, currentStageIndex } = intelligence;
  if (evaluation.isComplete) return 'completed';
  if (index < currentStageIndex) return 'completed';
  if (index > currentStageIndex) return index === currentStageIndex + 1 ? 'upcoming' : 'locked';
  if (index === 2) return 'in_progress';
  if (index === 4) return intelligence.awaitingConsent ? 'awaiting_consent' : 'permission_required';
  if (index === 3) return 'prepared';
  return evaluation.stages[index]?.state || 'in_progress';
}
