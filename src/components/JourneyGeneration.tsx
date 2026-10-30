import { CheckCircle2, Circle, Cpu, Sparkles } from 'lucide-react';
import type { JourneyIntelligence } from '../intelligence';

const STAGES = ['understanding', 'mapping', 'scanning', 'detecting', 'calculating', 'constructing', 'finalising'] as const;

type StageKey = typeof STAGES[number];

export function JourneyGeneration({
  t,
  phase,
  complete,
  intelligence,
  onOpen,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  phase: number;
  complete: boolean;
  intelligence: JourneyIntelligence | null;
  onOpen: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-royal-950/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-royal-900">
        <div className="relative overflow-hidden bg-gradient-to-br from-royal-800 via-royal-900 to-royal-950 p-6 text-white sm:p-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
              <Cpu size={25} />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                <Sparkles size={12} />
                {t('home.intentBridge')}
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{t('intelligence.preparingTitle')}</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-royal-100/80">{t('intelligence.preparingSubtitle')}</p>
            </div>
          </div>
          <div className="relative mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-mint-300 transition-all duration-300" style={{ width: `${complete ? 100 : Math.min(96, ((phase + 1) / STAGES.length) * 100)}%` }} />
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <ol className="grid gap-3 sm:grid-cols-2">
            {STAGES.map((stage, index) => {
              const done = complete || index < phase;
              const active = !complete && index === phase;
              return (
                <li key={stage} className={`flex items-start gap-3 rounded-xl p-3 transition ${active ? 'bg-cyan-500/10' : done ? 'bg-mint-500/5' : 'bg-gray-50 dark:bg-royal-800/30'}`}>
                  {done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mint-500" /> : active ? <span className="mt-0.5 h-[18px] w-[18px] shrink-0 animate-pulse rounded-full border-2 border-cyan-500" /> : <Circle size={18} className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600" />}
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-cyan-600 dark:text-cyan-400' : done ? 'text-mint-600 dark:text-mint-400' : 'text-gray-400'}`}>
                      {t(`intelligence.stages.${stage as StageKey}`)}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{t(`intelligence.stageDescriptions.${stage as StageKey}`)}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {complete && intelligence && (
            <div className="mt-6 rounded-2xl border border-mint-500/30 bg-mint-500/5 p-4 animate-scale-in">
              <div className="flex items-center gap-2 text-sm font-bold text-mint-700 dark:text-mint-300">
                <CheckCircle2 size={18} />
                {t('home.blueprintReady')}
              </div>
              <p className="mt-1 text-sm font-bold">{t('intelligence.journeyIdentified')}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('intelligence.matchExplanation')}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label={t('home.readiness')} value={`${intelligence.readinessPercent}%`} />
                <Metric label={t('prooflens.ready')} value={`${intelligence.readyCount}/${intelligence.evaluation.totalRequirements}`} />
                <Metric label={t('home.stepsRemaining', { count: intelligence.stepsRemaining })} value={String(intelligence.stepsRemaining)} />
              </div>
              <button onClick={onOpen} className="mt-4 w-full rounded-xl bg-royal-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-royal-600">
                {t('home.openBlueprint')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/70 px-2 py-2 dark:bg-royal-800/50">
      <div className="text-lg font-bold text-royal-600 dark:text-royal-200">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold leading-4 text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
