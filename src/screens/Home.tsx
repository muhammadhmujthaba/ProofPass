import { useEffect, useState } from 'react';
import {
  Sparkles, ArrowRight, CheckCircle2, FileText, ChevronLeft, Brain, Radar, Activity, ShieldCheck, Plus,
} from 'lucide-react';
import { useStore, startJourney, logActivity } from '../store';
import { useT, useLang, relativeTime } from '../hooks';
import { translate } from '../i18n';
import { recognizeGoal, evaluateJourney } from '../journey';
import { getJourneyIntelligence } from '../intelligence';
import { JourneyGeneration } from '../components/JourneyGeneration';
import type { View } from '../components/Shell';
import { EmptyState } from '../components/Shell';
import { Modal } from './Saved';
import { DocumentIntake } from './Intake';
import { Logo } from '../components/ui';

export function HomeScreen({ onNavigate }: { onNavigate: (v: View) => void }) {
  const t = useT();
  const lang = useLang();
  const state = useStore((s) => s);
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState<{ phase: number; complete: boolean } | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const journey = state.journeys.housing_registration;
  const ev = journey ? evaluateJourney(state, 'housing_registration') : null;
  const intelligence = journey ? getJourneyIntelligence(state, 'housing_registration') : null;
  const recent = state.activity.slice(0, 3);
  const hasId = state.records.some((r) => r.type === 'identity');

  useEffect(() => {
    if (!generation || generation.complete) return;
    if (generation.phase >= 6) {
      setGeneration((current) => current ? { ...current, complete: true } : current);
      logActivity('blueprint_created', translate(lang, 'home.blueprintReady'));
      if (intelligence?.reusableCount) logActivity('reuse_detected', `${intelligence.reusableCount} reusable information item(s) detected`);
      const nav = window.setTimeout(() => {
        setGeneration((current) => {
          if (current?.complete) onNavigate('journey');
          return null;
        });
      }, 1400);
      return () => window.clearTimeout(nav);
    }
    const timer = window.setTimeout(() => setGeneration((current) => current ? { ...current, phase: current.phase + 1 } : current), 180);
    return () => window.clearTimeout(timer);
  }, [generation?.phase, generation?.complete, intelligence?.reusableCount, lang]);

  function handlePrepare() {
    const id = recognizeGoal(goal);
    if (!id) {
      setError(t('home.notRecognized'));
      return;
    }
    setError('');
    logActivity('goal_recognized', t('home.recognizeSuccess'));
    startJourney(id);
    logActivity('journey_started', t('nav.housing'));
    setGeneration({ phase: 0, complete: false });
  }

  function quickStart() {
    setGoal(lang === 'ar' ? 'سجّل منزلي الجديد' : 'Register my new home');
  }

  return (
    <div className="space-y-8">
      {/* Hero / goal input */}
      <section className="relative overflow-hidden rounded-3xl border border-royal-700/30 bg-gradient-to-br from-royal-800 via-royal-900 to-royal-950 p-6 text-white shadow-soft sm:p-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-royal-500/20 blur-3xl" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles size={13} className="text-cyan-400" />
            {t('home.demoBadge')} · {t('team')}
          </div>
          <h1 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            {t('home.title')}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-royal-100/80 sm:text-base">{t('home.intelligenceSubtitle')}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={goal}
                onChange={(e) => { setGoal(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePrepare(); }}
                placeholder={t('home.placeholder')}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-base text-white placeholder-white/40 outline-none backdrop-blur transition focus:border-cyan-400/60 focus:bg-white/15"
                aria-label={t('home.title')}
              />
            </div>
            <button
              onClick={handlePrepare}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-base font-bold text-royal-950 shadow-lg transition hover:bg-cyan-300 active:scale-95"
            >
              {t('home.prepare')}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm font-medium text-gold-300">{error}</p>
          )}

          <button
            onClick={quickStart}
            className="mt-3 text-xs font-medium text-royal-100/60 underline-offset-2 hover:text-cyan-300 hover:underline"
          >
            {lang === 'ar' ? 'سجّل منزلي الجديد' : 'Register my new home'} →
          </button>
        </div>
      </section>

      {/* Current journey + next action */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('home.currentJourney')}</h2>
            {ev?.isComplete && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-500/10 px-2.5 py-0.5 text-xs font-semibold text-mint-600 dark:text-mint-400">
                <CheckCircle2 size={13} />
                {t('home.completed')}
              </span>
            )}
          </div>

          {!journey ? (
            <div className="mt-6">
              <p className="text-gray-500 dark:text-gray-400">{t('home.noJourney')}</p>
            </div>
          ) : (
            <div className="mt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal-500/10 text-royal-500">
                  <Logo className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{t('housing.title')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('housing.subtitle')}</p>

                  {/* Progress */}
                  {ev && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <span>{t('home.journeyPulse')}: {intelligence?.readinessPercent ?? 0}%</span>
                        <span>{ev.isComplete ? t('home.completed') : t('journey.needsYou')}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-royal-800/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${ev.isComplete ? 'bg-mint-500' : 'bg-royal-500'}`}
                          style={{ width: `${intelligence?.readinessPercent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {intelligence && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400"><Brain size={14} />{t('home.nextMove')}</div>
                        <p className="mt-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{t(intelligence.nextMoveKey)}</p>
                        <button onClick={() => onNavigate(intelligence.nextMoveView)} className="mt-2 text-sm font-bold text-cyan-600 dark:text-cyan-400">{t('home.startJourney')} <ChevronLeft size={14} className="inline rtl:rotate-180" /></button>
                      </div>
                      <div className="rounded-xl border border-royal-200 bg-royal-50/70 p-3 dark:border-royal-800/50 dark:bg-royal-800/20">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-royal-600 dark:text-royal-300"><Activity size={14} />{t('home.journeyPulse')}</div>
                        <div className="mt-2 flex items-end justify-between"><span className="text-2xl font-bold">{intelligence.readinessPercent}%</span><span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('home.stepsRemaining', { count: intelligence.stepsRemaining })}</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-royal-900/60"><div className="h-full rounded-full bg-gradient-to-r from-royal-500 to-cyan-400 transition-all duration-500" style={{ width: `${intelligence.readinessPercent}%` }} /></div>
                      </div>
                    </div>
                  )}

                  {ev?.isComplete && journey.receiptId && (
                    <button
                      onClick={() => onNavigate('receipt')}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-mint-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-mint-600"
                    >
                      <FileText size={15} />
                      {t('housing.openReceipt')}
                    </button>
                  )}

                  {!ev?.isComplete && (
                    <button
                      onClick={() => onNavigate('journey')}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-royal-500 hover:text-royal-600"
                    >
                      {t('home.startJourney')}
                      <ChevronLeft size={15} className="rtl:rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved info summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('home.savedSummary')}</h2>
            <button onClick={() => onNavigate('saved')} className="text-xs font-bold text-royal-500 hover:text-royal-600">{t('home.viewAll')}</button>
          </div>
          {state.records.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t('home.noSaved')}</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {state.records.slice(0, 3).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-royal-800/30">
                  <span className="truncate text-sm font-medium">{r.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">{t(`saved.types.${r.type}`)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-gray-400">
            {t(`home.recordsCount_${state.records.length === 1 ? 'one' : 'other'}`, { count: state.records.length })}
          </p>
        </div>
      </section>

      {/* ProofVault card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-500/10 text-royal-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('saved.proofVaultCard')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('saved.proofVaultSubtitle')}</p>
            </div>
          </div>
          <button onClick={() => onNavigate('saved')} className="text-xs font-bold text-royal-500 hover:text-royal-600">{t('home.viewAll')}</button>
        </div>

        <div className="mt-4">
          {hasId ? (
            <div className="flex items-center gap-3 rounded-xl bg-mint-500/5 p-4">
              <CheckCircle2 size={20} className="shrink-0 text-mint-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-mint-700 dark:text-mint-300">{t('saved.hasId')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('saved.hasIdSubtitle')}</p>
              </div>
              <span className="rounded-full bg-mint-500/10 px-2.5 py-1 text-xs font-bold text-mint-600 dark:text-mint-400">{t('saved.availableForReuse')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-gold-500/5 p-4">
              <Plus size={20} className="shrink-0 text-gold-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-gold-700 dark:text-gold-400">{t('saved.noId')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('saved.noIdSubtitle')}</p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-royal-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-royal-600"
              >
                <ShieldCheck size={15} />
                {t('saved.uploadId')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recent activity */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('home.recentActivity')}</h2>
          <button onClick={() => onNavigate('activity')} className="text-xs font-bold text-royal-500 hover:text-royal-600">{t('home.viewAll')}</button>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon={FileText} title={t('home.noActivity')} />
        ) : (
          <ul className="mt-4 space-y-2">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 last:border-0 dark:border-royal-800/40">
                <span className="text-sm text-gray-700 dark:text-gray-200">{a.message}</span>
                <span className="shrink-0 text-xs text-gray-400">{relativeTime(a.timestamp, lang)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {intelligence && intelligence.reusableCount > 0 && (
        <section className="rounded-2xl border border-mint-500/30 bg-mint-500/5 p-5">
          <div className="flex items-start gap-3">
            <Radar size={22} className="mt-0.5 text-mint-600 dark:text-mint-400" />
            <div>
              <h2 className="font-bold">{t('prooflens.reuseRadar')}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('prooflens.reuseRadarSubtitle')}</p>
              <p className="mt-2 text-sm font-semibold text-mint-700 dark:text-mint-300">{t('prooflens.availableForReuse')}</p>
            </div>
          </div>
        </section>
      )}

      {showUpload && (
        <Modal title={t('saved.uploadId')} onClose={() => setShowUpload(false)}>
          <DocumentIntake onDone={() => setShowUpload(false)} />
        </Modal>
      )}

      {generation && intelligence && (
        <JourneyGeneration
          t={t}
          phase={generation.phase}
          complete={generation.complete}
          intelligence={intelligence}
          onOpen={() => { setGeneration(null); onNavigate('journey'); }}
        />
      )}
    </div>
  );
}
