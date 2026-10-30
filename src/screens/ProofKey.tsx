import { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Lock, Clock, XCircle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore, requestProofKey, approveProofKey, declineProofKey, completeSubmission } from '../store';
import { useT, useLang, useFormatDate } from '../hooks';
import { getPreparedFields } from '../journey';
import type { View } from '../components/Shell';
import type { ProofKeyState } from '../types';

export function ProofKeyScreen({ onNavigate }: { onNavigate: (v: View) => void }) {
  const t = useT();
  const state = useStore((s) => s);
  const formatDate = useFormatDate();
  const journey = state.journeys.housing_registration;
  const pk = state.proofKeys.find((k) => k.journeyId === 'housing_registration');
  const prepared = getPreparedFields(state, 'housing_registration');

  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (pk?.state === 'approved' && pk.expiresAt) {
      const update = () => setRemaining(Math.max(0, pk.expiresAt! - Date.now()));
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
    setRemaining(null);
  }, [pk?.state, pk?.expiresAt]);

  if (!journey) return null;

  function handleRequest() {
    requestProofKey('housing_registration', t('housing.title'), prepared.map((p) => t(p.labelKey)));
  }

  function handleApprove() {
    if (!pk) return;
    approveProofKey(pk.id);
  }

  function handleDecline() {
    if (!pk) return;
    declineProofKey(pk.id);
  }

  function handleSubmit() {
    const infoSummary = prepared.map((p) => ({ label: t(p.labelKey), value: p.value }));
    completeSubmission('housing_registration', infoSummary);
    onNavigate('receipt');
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <KeyRound size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('proofkey.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('proofkey.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="rounded-xl bg-royal-50 px-4 py-3 text-xs text-royal-600 dark:bg-royal-800/30 dark:text-royal-300">
        {t('proofkey.notReal')}
      </div>

      {!pk ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
          <KeyRound size={32} className="mx-auto text-gray-400" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('proofkey.none')}</p>
          <button
            onClick={handleRequest}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-royal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600"
          >
            <KeyRound size={16} />
            {t('proofkey.requestNew')}
          </button>
        </div>
      ) : (
        <ProofKeyCard pk={pk} t={t} formatDate={formatDate} remaining={remaining} prepared={prepared} onApprove={handleApprove} onDecline={handleDecline} onSubmit={handleSubmit} onRequest={handleRequest} onNavigate={onNavigate} />
      )}
    </div>
  );
}

function ProofKeyCard({
  pk, t, formatDate, remaining, prepared, onApprove, onDecline, onSubmit, onRequest, onNavigate,
}: {
  pk: import('../types').ProofKey;
  t: (k: string) => string;
  formatDate: (ts: number) => string;
  remaining: number | null;
  prepared: { labelKey: string; value: string }[];
  onApprove: () => void;
  onDecline: () => void;
  onSubmit: () => void;
  onRequest: () => void;
  onNavigate: (v: View) => void;
}) {
  const stateColors = stateStyle(pk.state);

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-6 shadow-soft transition ${stateColors.border} ${stateColors.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stateColors.icon}
            <span className={`text-lg font-bold ${stateColors.text}`}>{t(`proofkey.${pk.state}`)}</span>
          </div>
          <StatePill state={pk.state} t={t} />
        </div>

        {/* Purpose & info */}
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-gray-400">{t('proofkey.purpose')}</dt>
            <dd className="text-end font-semibold">{pk.purpose}</dd>
          </div>
          <div>
            <dt className="text-gray-400">{t('proofkey.infoUsed')}</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {pk.infoUsed.map((info, i) => (
                <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-royal-800/40">{info}</span>
              ))}
            </dd>
          </div>
        </dl>

        {/* Countdown */}
        {pk.state === 'approved' && remaining !== null && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-bold text-mint-600 dark:text-mint-400">
              <Clock size={16} />
              {t('proofkey.countdown')}: {Math.floor(remaining / 60000)}:{String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-royal-800/50">
              <div
                className="h-full rounded-full bg-mint-500 transition-all"
                style={{ width: `${(remaining / (10 * 60 * 1000)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-royal-800/40">
          {pk.approvedAt && <div>{t('proofkey.approve')}: {formatDate(pk.approvedAt)}</div>}
          {pk.expiresAt && <div>{t('proofkey.expiresAt')}: {formatDate(pk.expiresAt)}</div>}
          {pk.cancelledAt && <div>{t('proofkey.cancel')}: {formatDate(pk.cancelledAt)}</div>}
          {pk.expiredAt && <div>{t('proofkey.expired')}: {formatDate(pk.expiredAt)}</div>}
          {pk.usedAt && <div>{t('proofkey.used')}: {formatDate(pk.usedAt)}</div>}
        </div>
      </div>

      {/* State-specific notes + actions */}
      {pk.state === 'awaiting' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-4 text-sm text-gold-700 dark:text-gold-400">
            {t('proofkey.awaiting')}
          </div>
          <div className="flex gap-2">
            <button onClick={onApprove} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-mint-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-mint-600">
              <ShieldCheck size={16} />
              {t('proofkey.approve')}
            </button>
            <button onClick={onDecline} className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold dark:bg-royal-800/50">
              {t('proofkey.decline')}
            </button>
          </div>
        </div>
      )}

      {pk.state === 'approved' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-mint-500/30 bg-mint-500/5 p-4">
            <p className="text-sm font-semibold text-mint-700 dark:text-mint-400">{t('proofkey.approved')}</p>
          </div>
          <button onClick={onSubmit} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-royal-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-royal-600">
            {t('housing.submitLabel')}
          </button>
        </div>
      )}

      {pk.state === 'cancelled' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {t('proofkey.cancelledNote')}
          </div>
          <button onClick={onRequest} className="inline-flex items-center gap-2 rounded-xl bg-royal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600">
            <RefreshCw size={16} />
            {t('proofkey.requestNew')}
          </button>
        </div>
      )}

      {pk.state === 'expired' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-700 dark:border-gold-700/30 dark:bg-gold-900/15 dark:text-gold-400">
            <Clock size={18} className="mt-0.5 shrink-0" />
            {t('proofkey.expiredNote')}
          </div>
          <button onClick={onRequest} className="inline-flex items-center gap-2 rounded-xl bg-royal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600">
            <RefreshCw size={16} />
            {t('proofkey.requestNew')}
          </button>
        </div>
      )}

      {pk.state === 'used' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-mint-200 bg-mint-50 p-4 text-sm text-mint-700 dark:border-mint-700/30 dark:bg-mint-900/15 dark:text-mint-400">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            {t('proofkey.usedNote')}
          </div>
          <button onClick={() => onNavigate('receipt')} className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-mint-600">
            {t('housing.openReceipt')}
          </button>
        </div>
      )}
    </div>
  );
}

function stateStyle(state: ProofKeyState) {
  switch (state) {
    case 'awaiting':
      return { border: 'border-gold-500/40', bg: 'bg-gold-500/5', text: 'text-gold-600 dark:text-gold-400', icon: <Clock size={20} className="text-gold-500" /> };
    case 'approved':
      return { border: 'border-mint-500/40', bg: 'bg-mint-500/5', text: 'text-mint-600 dark:text-mint-400', icon: <ShieldCheck size={20} className="text-mint-500" /> };
    case 'cancelled':
      return { border: 'border-red-300', bg: 'bg-red-50 dark:bg-red-900/15', text: 'text-red-600 dark:text-red-400', icon: <XCircle size={20} className="text-red-500" /> };
    case 'expired':
      return { border: 'border-gold-400', bg: 'bg-gold-50 dark:bg-gold-900/15', text: 'text-gold-600 dark:text-gold-400', icon: <Clock size={20} className="text-gold-500" /> };
    case 'used':
      return { border: 'border-mint-400', bg: 'bg-mint-50 dark:bg-mint-900/15', text: 'text-mint-600 dark:text-mint-400', icon: <CheckCircle2 size={20} className="text-mint-500" /> };
    default:
      return { border: 'border-gray-200', bg: 'bg-white dark:bg-royal-900/40', text: 'text-gray-500', icon: <Lock size={20} className="text-gray-400" /> };
  }
}

function StatePill({ state, t }: { state: ProofKeyState; t: (k: string) => string }) {
  const cls =
    state === 'awaiting' ? 'bg-gold-500/10 text-gold-600 dark:text-gold-400' :
    state === 'approved' ? 'bg-mint-500/10 text-mint-600 dark:text-mint-400' :
    state === 'cancelled' ? 'bg-red-500/10 text-red-500' :
    state === 'expired' ? 'bg-gold-500/10 text-gold-600 dark:text-gold-400' :
    'bg-mint-500/10 text-mint-600 dark:text-mint-400';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{t(`proofkey.${state}`)}</span>;
}
