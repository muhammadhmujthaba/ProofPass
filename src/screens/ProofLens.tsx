import { useState } from 'react';
import { Eye, CheckCircle2, XCircle, Lock, AlertTriangle, Hourglass, ChevronDown, Info } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../hooks';
import { evaluateJourney } from '../journey';
import { getJourneyIntelligence } from '../intelligence';
import type { View } from '../components/Shell';
import { EmptyState } from '../components/Shell';

export function ProofLensScreen({ onNavigate }: { onNavigate: (v: View) => void }) {
  const t = useT();
  const state = useStore((s) => s);
  const ev = evaluateJourney(state, 'housing_registration');
  const intelligence = getJourneyIntelligence(state, 'housing_registration');
  const [openWhy, setOpenWhy] = useState<string | null>(null);

  if (!ev || !intelligence) return null;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal-500/10 text-royal-500">
            <Eye size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('prooflens.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('prooflens.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Readiness Index */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{t('prooflens.readiness')}</div>
            <div className="mt-1 text-4xl font-bold text-royal-600 dark:text-royal-200">{intelligence.readinessPercent}<span className="text-lg text-gray-400"> / 100</span></div>
          </div>
          <div className="text-end text-sm font-semibold text-gray-500 dark:text-gray-400">{intelligence.readyCount} / {ev.totalRequirements}<br />{t('prooflens.requirementsMet')}</div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-royal-800/60">
          <div className="h-full rounded-full bg-gradient-to-r from-royal-500 via-cyan-500 to-mint-500 transition-all duration-700" style={{ width: `${intelligence.readinessPercent}%` }} />
        </div>
        <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">{t('prooflens.readinessExplain')}</p>
      </div>

      {/* Reuse Radar */}
      <div className="rounded-2xl border border-mint-500/30 bg-mint-500/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-mint-700 dark:text-mint-300">{t('prooflens.reuseRadar')}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('prooflens.reuseRadarSubtitle')}</p>
          </div>
          <span className="rounded-full bg-mint-500/15 px-2.5 py-1 text-xs font-bold text-mint-700 dark:text-mint-300">{intelligence.reusableCount} {t('prooflens.ready')}</span>
        </div>
        {ev.requirements.filter((r) => r.match.status === 'satisfied').map((r) => (
          <div key={r.spec.id} className="mt-3 rounded-xl bg-white/70 p-3 dark:bg-royal-900/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 size={16} className="text-mint-500" />{t(r.spec.labelKey)}</div>
              <span className="rounded-full bg-mint-500/10 px-2 py-0.5 text-xs font-bold text-mint-600 dark:text-mint-400">{t('prooflens.availableForReuse')}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{r.spec.kind === 'address' ? t('prooflens.whyAddress') : t('prooflens.availableForReuseHint')}</p>
            {r.match.status === 'satisfied' && r.match.record && (
              <p className="mt-1 text-xs font-semibold text-mint-600 dark:text-mint-400">{t('prooflens.reusedFromProofPass')} · {r.match.record.title}</p>
            )}
          </div>
        ))}
        {ev.requirements.filter((r) => r.match.status !== 'satisfied').length > 0 && (
          <div className="mt-3 rounded-xl bg-gold-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gold-700 dark:text-gold-400"><AlertTriangle size={16} />{t('prooflens.needsInput')}</div>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{t('prooflens.requirementReview')}</p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatusSummary label={t('prooflens.ready')} value={intelligence.readyCount} className="text-mint-600 dark:text-mint-400" />
        <StatusSummary label={t('prooflens.attention')} value={intelligence.attentionCount} className="text-gold-600 dark:text-gold-400" />
        <StatusSummary label={t('prooflens.awaitingConsent')} value={intelligence.awaitingConsent ? 1 : 0} className="text-cyan-600 dark:text-cyan-400" />
        <StatusSummary label={t('prooflens.completed')} value={ev.isComplete ? 1 : 0} className="text-royal-600 dark:text-royal-300" />
      </div>

      {/* Requirement decisions */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('prooflens.requirementIntelligence')}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('prooflens.requirementReview')}</p>
        </div>
        {ev.requirements.map((r) => {
          const Icon =
            r.stageState === 'satisfied' ? CheckCircle2 :
            r.stageState === 'expired' ? XCircle :
            r.stageState === 'permission_required' ? Lock :
            r.stageState === 'needs_input' ? AlertTriangle :
            Hourglass;
          const iconColor =
            r.stageState === 'satisfied' ? 'text-mint-500' :
            r.stageState === 'expired' ? 'text-red-500' :
            r.stageState === 'permission_required' ? 'text-cyan-600' :
            r.stageState === 'needs_input' ? 'text-gold-500' :
            'text-gray-400';

          return (
            <div key={r.spec.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
              <div className="flex items-start gap-3">
                <Icon size={22} className={`${iconColor} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold">{t(r.spec.labelKey)}</h3>
                    <span className={`text-xs font-semibold ${
                      r.stageState === 'satisfied' ? 'text-mint-600 dark:text-mint-400' :
                      r.stageState === 'expired' ? 'text-red-500' :
                      r.stageState === 'permission_required' ? 'text-cyan-600 dark:text-cyan-400' :
                      'text-gold-600 dark:text-gold-400'
                    }`}>
                      {t(`journey.states.${r.stageState}`)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
                    {t(r.explanationKey, r.explanationVars)}
                  </p>

                  {/* Why interaction */}
                  <button
                    onClick={() => setOpenWhy(openWhy === r.spec.id ? null : r.spec.id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-royal-500 hover:text-royal-600"
                  >
                    {t('prooflens.why')}
                    <ChevronDown size={14} className={`transition ${openWhy === r.spec.id ? 'rotate-180' : ''}`} />
                  </button>

                  {openWhy === r.spec.id && (
                    <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm dark:bg-royal-800/30 animate-fade-in">
                      <div className="flex items-start gap-2">
                        <Info size={15} className="mt-0.5 shrink-0 text-gray-400" />
                        <div className="space-y-1.5">
                          <p>
                            <span className="font-semibold">{t('saved.types.' + r.spec.recordType)}:</span>{' '}
                            {r.match.status === 'satisfied' || r.match.status === 'expired' || r.match.status === 'not_authorized'
                              ? `"${r.match.record.title}"`
                              : '—'}
                          </p>
                          {r.match.status === 'satisfied' && (
                            <p className="text-mint-600 dark:text-mint-400">
                              {t('prooflens.matchedFrom')} · {t('saved.authorizedFor')}: {t('housing.title')}
                            </p>
                          )}
                          {r.match.status === 'needs_input' && (
                            <p className="text-gold-600 dark:text-gold-400">{t('prooflens.needsInput')}</p>
                          )}
                          {r.match.status === 'expired' && (
                            <p className="text-red-500">{t('prooflens.expired', { record: r.match.record.title })}</p>
                          )}
                          {r.match.status === 'not_authorized' && (
                            <p className="text-cyan-600 dark:text-cyan-400">{t('prooflens.notAuthorized', { record: r.match.record.title })}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next steps */}
      {ev.nextAction && !ev.isComplete ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{t('prooflens.nextSteps')}</h3>
          <button
            onClick={() => onNavigate(intelligence.nextMoveView)}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            {t(intelligence.nextMoveKey)}
          </button>
        </div>
      ) : ev.isComplete ? (
        <EmptyState icon={CheckCircle2} title={t('journey.noNextAction')} action={
          <button onClick={() => onNavigate('receipt')} className="rounded-lg bg-mint-500 px-4 py-2 text-sm font-bold text-white">
            {t('housing.openReceipt')}
          </button>
        } />
      ) : null}
    </div>
  );
}

function StatusSummary({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
