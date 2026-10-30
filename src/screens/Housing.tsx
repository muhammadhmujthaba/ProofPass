import { useState, useEffect } from 'react';
import {
  CheckCircle2, AlertTriangle, Lock, Send, FileText, ShieldCheck, ChevronLeft, Info,
} from 'lucide-react';
import { useStore, saveRecord, logActivity, setFormValue, requestProofKey, approveProofKey, declineProofKey, completeSubmission } from '../store';
import { useT, useLang } from '../hooks';
import { evaluateJourney, getPreparedFields, getMissingRequirements } from '../journey';
import type { View } from '../components/Shell';
import { Modal } from './Saved';
import { Logo } from '../components/ui';
import type { MatchResult, RequirementSpec } from '../journey';

export function HousingScreen({ onNavigate }: { onNavigate: (v: View) => void }) {
  const t = useT();
  const state = useStore((s) => s);
  const lang = useLang();
  const ev = evaluateJourney(state, 'housing_registration');
  const journey = state.journeys.housing_registration;
  const [showReview, setShowReview] = useState(false);

  if (!ev || !journey) return null;
  const j = journey;

  if (journey.receiptId) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="rounded-2xl border border-mint-500/30 bg-mint-500/5 p-8 text-center">
          <CheckCircle2 size={40} className="mx-auto text-mint-500" />
          <h2 className="mt-3 text-xl font-bold">{t('receipt.journeyComplete')}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('housing.alreadySubmitted')}</p>
          <button
            onClick={() => onNavigate('receipt')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-mint-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-mint-600"
          >
            <FileText size={16} />
            {t('housing.openReceipt')}
          </button>
        </div>
      </div>
    );
  }

  const prepared = getPreparedFields(state, 'housing_registration');
  const missing = getMissingRequirements(state, 'housing_registration');
  const allResolved = missing.length === 0;
  const proofKey = state.proofKeys.find((k) => k.journeyId === 'housing_registration');

  function Header() {
    return (
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal-500/10 text-royal-500">
            <Logo className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('housing.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('housing.subtitle')}</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-royal-50 px-3 py-2 text-xs text-royal-600 dark:bg-royal-800/30 dark:text-royal-300">
          {t('housing.requirementsNote')}
        </div>
      </header>
    );
  }

  function handleAuthorizeAndSubmit() {
    // Ensure a ProofKey exists and is approved
    let pk = state.proofKeys.find((k) => k.journeyId === 'housing_registration' && k.state === 'approved');
    if (!pk) {
      const id = requestProofKey('housing_registration', t('housing.title'), prepared.map((p) => p.labelKey));
      approveProofKey(id);
      pk = state.proofKeys.find((k) => k.id === id);
    }
    // Build info summary for the receipt
    const infoSummary = prepared.map((p) => ({ label: t(p.labelKey), value: p.value }));
    // Add any form-entered values
    for (const m of missing) {
      const val = j.formValues[m.spec.id];
      if (val) infoSummary.push({ label: t(m.spec.labelKey), value: val });
    }
    completeSubmission('housing_registration', infoSummary);
    setShowReview(false);
    onNavigate('receipt');
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Prepared fields */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('housing.preparedFields')}</h2>
        {prepared.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('housing.noPrepared')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {prepared.map((p, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-mint-500/5 p-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mint-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{t(p.labelKey)}</span>
                    <span className="rounded-full bg-mint-500/10 px-2 py-0.5 text-xs font-semibold text-mint-600 dark:text-mint-400">
                      {t('journey.states.satisfied')}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{p.value}</p>
                  {p.recordTitle && (
                    <p className="mt-0.5 text-xs font-semibold text-mint-600 dark:text-mint-400">{t('prooflens.reusedFromProofPass')}: {p.recordTitle}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Missing inputs */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('housing.missingInputs')}</h2>
        {missing.length === 0 ? (
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-mint-600 dark:text-mint-400">
            <CheckCircle2 size={18} />
            {t('housing.noMissing')}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {missing.map((m) => (
              <GapResolver
                key={m.spec.id}
                spec={m.spec}
                match={m.match}
                formValue={journey.formValues[m.spec.id] || ''}
                onResolve={(val) => {
                  // Save the resolved value as a record so it can be reused
                  if (m.spec.kind === 'address') {
                    saveRecord({
                      type: 'address',
                      title: val.slice(0, 30) || t('saved.types.address'),
                      fields: { label: val.slice(0, 30), street: val, city: '', emirate: '', postalCode: '' },
                      source: 'manual',
                      reviewStatus: 'confirmed',
                      authorizedFor: ['housing_registration'],
                    });
                    setFormValue('housing_registration', m.spec.id, val);
                  } else {
                    const [method, value] = val.includes(':') ? val.split(':').map((s) => s.trim()) : [val, ''];
                    saveRecord({
                      type: 'contact',
                      title: method || t('saved.types.contact'),
                      fields: { method: method || val, value: value || '' },
                      source: 'manual',
                      reviewStatus: 'confirmed',
                      authorizedFor: ['housing_registration'],
                    });
                    setFormValue('housing_registration', m.spec.id, val);
                  }
                  logActivity('gap_resolved', `${t(m.spec.labelKey)}: ${val}`);
                }}
                t={t}
                lang={lang}
              />
            ))}
          </div>
        )}
      </section>

      {/* Review & submit */}
      {allResolved && (
        <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="text-cyan-600 dark:text-cyan-400" />
            <div className="flex-1">
              <h2 className="text-lg font-bold">{t('housing.reviewTitle')}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('housing.reviewSubtitle')}</p>

              <button
                onClick={() => setShowReview(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-royal-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-royal-600"
              >
                <Lock size={16} />
                {t('housing.authorize')}
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Review modal with ProofKey */}
      {showReview && (
        <ReviewModal
          prepared={prepared}
          t={t}
          proofKey={proofKey}
          onApprove={() => handleAuthorizeAndSubmit()}
          onCancel={() => {
            if (proofKey) declineProofKey(proofKey.id);
            setShowReview(false);
          }}
          onRequestKey={() => {
            if (!proofKey || proofKey.state === 'expired' || proofKey.state === 'cancelled' || proofKey.state === 'used') {
              requestProofKey('housing_registration', t('housing.title'), prepared.map((p) => t(p.labelKey)));
            }
          }}
        />
      )}

      <p className="text-center text-xs text-gray-400">{t('housing.demoSubmitNote')}</p>
    </div>
  );
}

function GapResolver({
  spec, match, formValue, onResolve, t, lang,
}: {
  spec: RequirementSpec;
  match: MatchResult;
  formValue: string;
  onResolve: (val: string) => void;
  t: (k: string, vars?: Record<string, string>) => string;
  lang: string;
}) {
  const [val, setVal] = useState(formValue);
  const [contactMethod, setContactMethod] = useState<string>('');
  const [contactValue, setContactValue] = useState<string>('');

  useEffect(() => {
    setVal(formValue);
    // If formValue has a method prefix, parse it
    if (formValue.includes(':')) {
      const [m, v] = formValue.split(':').map((s) => s.trim());
      setContactMethod(m);
      setContactValue(v);
    } else {
      setContactMethod('');
      setContactValue(formValue);
    }
  }, [formValue]);

  const isAddress = spec.kind === 'address';
  const label = isAddress ? t('housing.addressLabel') : t('housing.contactLabel');
  const placeholder = isAddress ? t('housing.addressPlaceholder') : t('housing.contactPlaceholder');

  let hint = '';
  if (match.status === 'expired') hint = t('prooflens.expired', { record: match.record.title });
  else if (match.status === 'not_authorized') hint = t('prooflens.notAuthorized', { record: match.record.title });
  else if (match.status === 'needs_input' && match.reason === 'incomplete') hint = t('prooflens.needsInput');

  const contactOptions = [
    { id: 'SMS', label: lang === 'ar' ? 'رسالة نصية' : 'SMS', icon: '✉' },
    { id: 'Email', label: lang === 'ar' ? 'بريد إلكتروني' : 'Email', icon: '✉' },
    { id: 'Phone', label: lang === 'ar' ? 'هاتف' : 'Phone', icon: '☎' },
  ];

  function handleContactResolve() {
    if (!contactMethod.trim()) return;
    const combined = contactValue.trim()
      ? `${contactMethod}: ${contactValue.trim()}`
      : contactMethod;
    onResolve(combined);
  }

  return (
    <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-gold-500" />
        <span className="text-sm font-bold">{label}</span>
        <span className="text-xs font-semibold text-gold-600 dark:text-gold-400">{t('journey.states.needs_input')}</span>
      </div>
      {hint && <p className="mt-1.5 text-xs text-gold-700 dark:text-gold-400">{hint}</p>}

      {isAddress ? (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-royal-400 dark:border-royal-700/50 dark:bg-royal-800/30"
              aria-label={label}
            />
            <button
              onClick={() => { if (val.trim()) onResolve(val.trim()); }}
              disabled={!val.trim()}
              className="rounded-lg bg-royal-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600 disabled:opacity-40"
            >
              {t('housing.saveAndPrepare')}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Contact method MCQ */}
          <div className="mt-3">
            <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {lang === 'ar' ? 'اختر طريقة التواصل:' : 'Choose your contact method:'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {contactOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setContactMethod(opt.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    contactMethod === opt.id
                      ? 'border-royal-500 bg-royal-500 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-royal-300 hover:bg-royal-50 dark:border-royal-700/50 dark:bg-royal-800/30 dark:text-gray-300 dark:hover:bg-royal-800/50'
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Optional detail input for the chosen method */}
            {contactMethod && (
              <input
                type="text"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={lang === 'ar' ? `أدخل ${contactMethod} (اختياري)` : `Enter your ${contactMethod} (optional)`}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-royal-400 dark:border-royal-700/50 dark:bg-royal-800/30"
                aria-label={contactMethod}
              />
            )}
            <button
              onClick={handleContactResolve}
              disabled={!contactMethod.trim()}
              className="mt-2 rounded-lg bg-royal-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600 disabled:opacity-40"
            >
              {t('housing.saveAndPrepare')}
            </button>
          </div>
        </>
      )}

      <p className="mt-2 text-xs text-gray-400">
        <Info size={11} className="inline me-1" />
        {lang === 'ar' ? 'سيُحفظ ك مستند قابل لإعادة الاستخدام للرحلات المستقبلية.' : 'This will be saved as a reusable record for future journeys.'}
      </p>
    </div>
  );
}

function ReviewModal({
  prepared, t, proofKey, onApprove, onCancel, onRequestKey,
}: {
  prepared: { labelKey: string; value: string; recordTitle?: string }[];
  t: (k: string) => string;
  proofKey: import('../types').ProofKey | undefined;
  onApprove: () => void;
  onCancel: () => void;
  onRequestKey: () => void;
}) {
  const state = useStore((s) => s);
  const pk = state.proofKeys.find((k) => k.journeyId === 'housing_registration');
  const canApprove = pk?.state === 'approved' || pk?.state === 'awaiting';

  useEffect(() => {
    if (!pk || pk.state === 'expired' || pk.state === 'cancelled' || pk.state === 'used') {
      onRequestKey();
    }
  }, []);

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

  void proofKey;

  return (
    <Modal title={t('housing.reviewTitle')} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('housing.reviewSubtitle')}</p>

        {/* Info summary */}
        <div className="space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-royal-800/30">
          {prepared.map((p, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-500">{t(p.labelKey)}</span>
                <span className="text-end font-semibold">{p.value}</span>
              </div>
              {p.recordTitle && (
                <div className="text-end text-xs font-semibold text-mint-600 dark:text-mint-400">{t('prooflens.reusedFromProofPass')}</div>
              )}
            </div>
          ))}
        </div>

        {/* ProofKey section */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-bold">{t('proofkey.title')}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('proofkey.subtitle')}</div>

          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">{t('proofkey.purpose')}</span>
              <span className="font-semibold">{t('housing.title')}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-400">{t('proofkey.infoUsed')}</span>
              <span className="text-end">{prepared.map((p) => t(p.labelKey)).join(', ')}</span>
            </div>
          </div>

          {pk?.state === 'approved' && remaining !== null && (
            <div className="mt-3 rounded-lg bg-mint-500/10 px-3 py-2 text-center text-sm font-bold text-mint-600 dark:text-mint-400">
              {t('proofkey.countdown')}: {Math.floor(remaining / 60000)}:{String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}
            </div>
          )}
          {pk?.state === 'awaiting' && (
            <p className="mt-3 text-center text-xs font-semibold text-gold-600 dark:text-gold-400">{t('proofkey.awaiting')}</p>
          )}
        </div>

        <p className="text-xs text-gray-400">{t('proofkey.notReal')}</p>

        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={!canApprove}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-600 disabled:opacity-40"
          >
            <Send size={16} />
            {t('proofkey.approve')}
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold dark:bg-royal-800/50"
          >
            {t('proofkey.cancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
