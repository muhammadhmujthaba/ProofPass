import { Receipt as ReceiptIcon, Printer, Download, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { useT, useLang, useFormatDate } from '../hooks';
import type { View } from '../components/Shell';
import { Logo } from '../components/ui';

export function ReceiptScreen({ onNavigate }: { onNavigate: (v: View) => void }) {
  const t = useT();
  const state = useStore((s) => s);
  const formatDate = useFormatDate();
  const lang = useLang();

  const journey = state.journeys.housing_registration;
  const receipt = state.receipts.find((r) => r.id === journey?.receiptId);

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t('receipt.noReceipt')}</p>
        <button onClick={() => onNavigate('home')} className="mt-4 rounded-lg bg-royal-500 px-4 py-2 text-sm font-bold text-white">
          {t('nav.home')}
        </button>
      </div>
    );
  }

  const handleDownload = () => {
    const text = [
      `${t('brand')} — ${t('receipt.title')}`,
      `${t('receipt.reference')}: ${receipt.reference}`,
      `${t('receipt.timestamp')}: ${formatDate(receipt.timestamp)}`,
      `${t('receipt.outcome')}: ${receipt.outcome}`,
      '',
      t('receipt.infoSummary') + ':',
      ...receipt.infoSummary.map((i) => `  ${i.label}: ${i.value}`),
      '',
      t('receipt.simulated'),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proofpass-receipt-${receipt.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('receipt.title')}</h1>
      </header>

      <div id="receipt-print" className="rounded-2xl border border-gray-200 bg-white p-8 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-5 dark:border-royal-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal-500/10 text-royal-500">
              <Logo className="h-10 w-10" />
            </div>
            <div>
              <div className="text-lg font-bold">{t('brand')}</div>
              <div className="text-xs text-gray-400">{t('team')} · {t('slogan')}</div>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint-500/10 text-mint-500">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Status banner */}
        <div className="mt-5 rounded-xl bg-mint-500/10 px-4 py-3 text-center">
          <span className="text-sm font-bold text-mint-600 dark:text-mint-400">{t('receipt.journeyComplete')}</span>
        </div>

        {/* Details */}
        <dl className="mt-5 space-y-3">
          <div className="flex justify-between gap-2 text-sm">
            <dt className="text-gray-400">{t('receipt.reference')}</dt>
            <dd className="font-mono font-bold">{receipt.reference}</dd>
          </div>
          <div className="flex justify-between gap-2 text-sm">
            <dt className="text-gray-400">{t('receipt.timestamp')}</dt>
            <dd className="font-semibold">{formatDate(receipt.timestamp)}</dd>
          </div>
          <div className="flex justify-between gap-2 text-sm">
            <dt className="text-gray-400">{t('receipt.outcome')}</dt>
            <dd className="text-end font-semibold">{receipt.outcome}</dd>
          </div>
        </dl>

        {/* Info summary */}
        <div className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{t('receipt.infoSummary')}</h2>
          <div className="space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-royal-800/30">
            {receipt.infoSummary.map((info, i) => (
              <div key={i} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-500">{info.label}</span>
                <span className="text-end font-medium">{info.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ProofTrail */}
        <div className="mt-5 border-t border-gray-100 pt-5 dark:border-royal-800/40">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">{t('activity.title')}</h2>
          <div className="space-y-2">
            {[...state.activity].filter((event) => ['goal_recognized', 'journey_started', 'blueprint_created', 'reuse_detected', 'permission_requested', 'permission_approved', 'submission_completed', 'receipt_generated'].includes(event.kind)).sort((a, b) => a.timestamp - b.timestamp).map((event) => (
              <div key={event.id} className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-mint-500" />
                <span className="text-gray-600 dark:text-gray-300">{event.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-gold-500/5 px-3 py-2.5 text-xs text-gold-700 dark:text-gold-400">
          <ReceiptIcon size={14} className="mt-0.5 shrink-0" />
          {t('receipt.simulated')} · {t('housing.demoSubmitNote')}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 no-print">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-royal-700/50 dark:bg-royal-900/40 dark:text-gray-200"
        >
          <Printer size={16} />
          {t('receipt.print')}
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-royal-700/50 dark:bg-royal-900/40 dark:text-gray-200"
        >
          <Download size={16} />
          {t('receipt.download')}
        </button>
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 rounded-xl bg-royal-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600"
        >
          {t('receipt.back')}
        </button>
      </div>
    </div>
  );
}
