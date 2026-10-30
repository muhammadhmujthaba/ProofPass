import {
  Brain, FileSearch, ListChecks, ClipboardEdit, ShieldCheck, Send, Receipt,
  CheckCircle2, ChevronLeft, AlertTriangle, Lock, Hourglass, XCircle,
} from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../hooks';
import { evaluateJourney } from '../journey';
import { getBlueprintStageState, getJourneyIntelligence } from '../intelligence';
import type { View } from '../components/Shell';
import { StateBadge, StageIcon } from '../components/ui';

const STAGE_ICONS = [Brain, FileSearch, ListChecks, ClipboardEdit, ShieldCheck, Send, Receipt];

export function JourneyScreen({ onNavigate }: { onNavigate: (v: View) => void }) {
  const t = useT();
  const state = useStore((s) => s);
  const ev = evaluateJourney(state, 'housing_registration');
  const intelligence = getJourneyIntelligence(state, 'housing_registration');

  if (!ev || !intelligence) return null;

  const stageKeys = ['understand', 'match', 'resolve', 'prepare', 'review', 'complete', 'receipt'];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('journey.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('home.intelligenceSubtitle')}</p>
      </header>

      {/* Outcome banner */}
      <div className="rounded-2xl border border-royal-200 bg-gradient-to-r from-royal-50 to-cyan-50 p-5 dark:border-royal-700/40 dark:from-royal-900/40 dark:to-royal-800/20">
        <div className="text-xs font-bold uppercase tracking-wide text-royal-500">{t('journey.outcome')}</div>
        <div className="mt-1 text-xl font-bold">{t('housing.title')}</div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="font-semibold text-royal-600 dark:text-royal-300">
            {ev.resolvedCount} / {ev.totalRequirements} {t('prooflens.requirementsTotal', { total: ev.totalRequirements })}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/60 dark:bg-royal-800/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${ev.isComplete ? 'bg-mint-500' : 'bg-gradient-to-r from-royal-500 to-cyan-500'}`}
              style={{ width: `${intelligence.readinessPercent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-royal-600 dark:text-royal-200">{intelligence.readinessPercent}%</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PulseCard label={t('home.journeyPulse')} value={`${intelligence.readinessPercent}%`} detail={t('home.readiness')} />
        <PulseCard label={t('prooflens.requirementIntelligence')} value={`${intelligence.readyCount}/${ev.totalRequirements}`} detail={t('prooflens.ready')} />
        <PulseCard label={t('home.nextMove')} value={String(intelligence.stepsRemaining)} detail={t('intelligence.remaining', { count: intelligence.stepsRemaining })} />
      </div>

      {/* Connected stages — vertical timeline */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-gray-200 ltr:left-[27px] rtl:right-[27px] dark:bg-royal-800/60" />

          <ol className="space-y-5">
            {stageKeys.map((key, idx) => {
              const Icon = STAGE_ICONS[idx];
              const isLast = idx === stageKeys.length - 1;
              const s = getBlueprintStageState(intelligence, idx);

              return (
                <li key={key} className="relative flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  {/* Node */}
                  <div className="relative z-10 shrink-0">
                    {s === 'completed' && (
                      <span className="absolute inset-0 animate-pulse-ring rounded-xl bg-mint-500/30" />
                    )}
                    <StageIcon icon={Icon} state={s} size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">{t(`journey.stages.${key}`)}</h3>
                      <StateBadge state={s} t={t} />
                    </div>

                    {/* Stage-specific detail */}
                    {key === 'match' && !ev.isComplete && (
                      <div className="mt-2 space-y-1.5">
                        {ev.requirements.map((r) => (
                          <div key={r.spec.id} className="flex items-center gap-2 text-sm">
                            {r.stageState === 'satisfied' ? (
                              <CheckCircle2 size={15} className="text-mint-500" />
                            ) : r.stageState === 'expired' ? (
                              <XCircle size={15} className="text-red-500" />
                            ) : r.stageState === 'permission_required' ? (
                              <Lock size={15} className="text-cyan-600" />
                            ) : r.stageState === 'needs_input' ? (
                              <AlertTriangle size={15} className="text-gold-500" />
                            ) : (
                              <Hourglass size={15} className="text-gray-400" />
                            )}
                            <span className="text-gray-600 dark:text-gray-300">{t(r.spec.labelKey)}</span>
                            <span className="text-xs text-gray-400">— {t(r.explanationKey, r.explanationVars)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {key === 'resolve' && !ev.isComplete && ev.requirements.some((r) => r.stageState !== 'satisfied') && (
                      <div className="mt-2 rounded-lg bg-gold-500/10 px-3 py-2 text-sm text-gold-700 dark:text-gold-400">
                        {t('prooflens.needsInput')}
                      </div>
                    )}

                    {key === 'review' && !ev.isComplete && ev.requirements.every((r) => r.stageState === 'satisfied') && (
                      <div className="mt-2 rounded-lg bg-cyan-500/10 px-3 py-2 text-sm text-cyan-700 dark:text-cyan-400">
                        {t('proofkey.title')} — {t('proofkey.awaiting')}
                      </div>
                    )}

                    {key === 'receipt' && ev.isComplete && (
                      <div className="mt-2">
                        <button
                          onClick={() => onNavigate('receipt')}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-mint-600 dark:text-mint-400"
                        >
                          {t('housing.openReceipt')}
                          <ChevronLeft size={15} className="rtl:rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>
                  {!isLast && <div className="sr-only">→</div>}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Next action bar */}
        <div className="mt-6 border-t border-gray-100 pt-4 dark:border-royal-800/40">
          {!ev.isComplete ? (
            <button
              onClick={() => onNavigate(intelligence.nextMoveView)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-royal-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-royal-600 sm:w-auto"
            >
              {t(intelligence.nextMoveKey)}
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>
          ) : (
            <p className="text-sm font-medium text-mint-600 dark:text-mint-400">
              <CheckCircle2 size={15} className="me-1.5 inline" />
              {t('journey.noNextAction')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PulseCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-2 text-2xl font-bold text-royal-600 dark:text-royal-200">{value}</div>
      <div className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{detail}</div>
    </div>
  );
}
