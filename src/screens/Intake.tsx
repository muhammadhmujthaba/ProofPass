import { useState, useRef, useCallback } from 'react';
import { FileImage, Loader2, AlertCircle, ScanLine, Eye } from 'lucide-react';
import { useT, useLang } from '../hooks';
import { saveRecord, logActivity } from '../store';
import type { SavedRecord } from '../types';

type IntakeStatus = 'idle' | 'loading-model' | 'processing' | 'unsupported' | 'ocr-fail' | 'empty-result' | 'review';

interface ExtractedFields {
  name: string;
  number: string;
  issueDate: string;
  expiryDate: string;
}

// Lightweight OCR using tesseract.js, loaded on demand.
// We attempt real extraction; if unavailable we fall back to manual entry honestly.
export function DocumentIntake({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const lang = useLang();
  const [status, setStatus] = useState<IntakeStatus>('idle');
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [fields, setFields] = useState<ExtractedFields>({ name: '', number: '', issueDate: '', expiryDate: '' });
  const [demoBadge] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tesseractRef = useRef<any>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus('unsupported');
      setError(t('intake.unsupported'));
      return;
    }

    setStatus('loading-model');
    setError('');

    try {
      let recognize: any;
      try {
        // Dynamic import — @vite-ignore prevents Vite from trying to statically
        // bundle this heavy WASM dependency during dev server analysis.
        const mod = await import(/* @vite-ignore */ 'tesseract.js');
        recognize = mod.recognize || mod.default?.recognize;
        if (!recognize) throw new Error('recognize not found');
      } catch {
        // OCR dependency unavailable — honest manual fallback
        setStatus('ocr-fail');
        return;
      }

      const worker = await recognize(file, lang === 'ar' ? 'ara+eng' : 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') setStatus('processing');
          else if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract' || m.status === 'loading language traineddata') {
            setStatus('loading-model');
          }
        },
      });
      tesseractRef.current = worker;

      const text = worker?.data?.text ?? '';
      setExtractedText(text);

      if (!text.trim()) {
        setStatus('empty-result');
        return;
      }

      // Parse candidate fields from extracted text
      const parsed = parseIdFields(text);
      setFields(parsed);
      setStatus('review');
    } catch {
      setStatus('ocr-fail');
      setError(t('intake.ocrFail'));
    }
  }, [lang, t]);

  function handleSave() {
    const record: Omit<SavedRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      type: 'identity',
      title: fields.name || 'Identity document',
      fields: {
        name: fields.name,
        number: fields.number,
      },
      issueDate: fields.issueDate,
      expiryDate: fields.expiryDate,
      source: 'ocr',
      reviewStatus: 'confirmed',
      authorizedFor: [],
    };
    saveRecord(record);
    logActivity('document_uploaded', `Uploaded ID: ${record.title}`);
    setStatus('idle');
    setFields({ name: '', number: '', issueDate: '', expiryDate: '' });
    setExtractedText('');
    onDone?.();
  }

  function reset() {
    setStatus('idle');
    setError('');
    setExtractedText('');
    setFields({ name: '', number: '', issueDate: '', expiryDate: '' });
  }

  return (
    <div className="space-y-5">
      {status === 'idle' && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-royal-400 dark:border-royal-700/50 dark:hover:border-royal-500">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-royal-500/10 text-royal-500">
            <ScanLine size={26} />
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{t('intake.subtitle')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-royal-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-royal-600"
          >
            <FileImage size={18} />
            {t('intake.choose')}
          </button>
        </div>
      )}

      {(status === 'loading-model' || status === 'processing') && (
        <div className="flex flex-col items-center py-12 text-center">
          <Loader2 size={32} className="animate-spin text-royal-500" />
          <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {status === 'loading-model' ? t('intake.loadingModel') : t('intake.processing')}
          </p>
        </div>
      )}

      {status === 'unsupported' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/40 dark:bg-red-900/20">
          <AlertCircle size={28} className="mx-auto text-red-500" />
          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          <button onClick={reset} className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold dark:bg-royal-800/50">{t('intake.tryAgain')}</button>
        </div>
      )}

      {status === 'ocr-fail' && (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6 dark:border-gold-700/30 dark:bg-gold-900/15">
          <div className="flex items-center gap-2 text-gold-600 dark:text-gold-400">
            <AlertCircle size={20} />
            <span className="text-sm font-semibold">{t('intake.ocrFail')}</span>
          </div>
          <ManualFields fields={fields} setFields={setFields} demoBadge={demoBadge} onSave={handleSave} onCancel={reset} t={t} />
        </div>
      )}

      {status === 'empty-result' && (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6 dark:border-gold-700/30 dark:bg-gold-900/15">
          <div className="flex items-center gap-2 text-gold-600 dark:text-gold-400">
            <AlertCircle size={20} />
            <span className="text-sm font-semibold">{t('intake.emptyResult')}</span>
          </div>
          <ManualFields fields={fields} setFields={setFields} demoBadge={demoBadge} onSave={handleSave} onCancel={reset} t={t} />
        </div>
      )}

      {status === 'review' && (
        <div className="rounded-2xl border border-royal-200 bg-royal-50/50 p-6 dark:border-royal-700/40 dark:bg-royal-900/30">
          <div className="mb-4 flex items-center gap-2">
            <Eye size={18} className="text-royal-500" />
            <h3 className="font-bold">{t('intake.review')}</h3>
          </div>
          {extractedText && (
            <details className="mb-4 rounded-lg bg-white p-3 text-xs dark:bg-royal-800/30">
              <summary className="cursor-pointer font-semibold text-gray-500">Extracted text ({extractedText.length} chars)</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-gray-500">{extractedText}</pre>
            </details>
          )}
          <ManualFields fields={fields} setFields={setFields} demoBadge={demoBadge} onSave={handleSave} onCancel={reset} t={t} />
        </div>
      )}
    </div>
  );
}

function ManualFields({
  fields, setFields, demoBadge, onSave, onCancel, t,
}: {
  fields: ExtractedFields;
  setFields: (f: ExtractedFields) => void;
  demoBadge: boolean;
  onSave: () => void;
  onCancel: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="mt-4 space-y-3">
      {demoBadge && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-red-500">
          {t('saved.demoIdBadge')}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledInput label={t('saved.fields.identity.name')} value={fields.name} onChange={(v) => setFields({ ...fields, name: v })} />
        <LabeledInput label={t('saved.fields.identity.number')} value={fields.number} onChange={(v) => setFields({ ...fields, number: v })} />
        <LabeledInput type="date" label={t('saved.issueDate')} value={fields.issueDate} onChange={(v) => setFields({ ...fields, issueDate: v })} />
        <LabeledInput type="date" label={t('saved.expiryDate')} value={fields.expiryDate} onChange={(v) => setFields({ ...fields, expiryDate: v })} />
      </div>
      <p className="text-xs text-gray-400">{t('intake.demoNote')}</p>
      <div className="flex gap-2">
        <button onClick={onSave} className="flex-1 rounded-lg bg-royal-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600">{t('intake.submit')}</button>
        <button onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold dark:bg-royal-800/50">{t('saved.cancel')}</button>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-royal-400 dark:border-royal-700/50 dark:bg-royal-800/30"
      />
    </label>
  );
}

// Parse candidate fields from OCR text using heuristics.
function parseIdFields(text: string): ExtractedFields {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = '';
  let number = '';
  let issueDate = '';
  let expiryDate = '';

  // Name: look for "Name:" or longest line with letters
  for (const line of lines) {
    const m = line.match(/(?:name|name)\s*[:/]?\s*(.+)/i);
    if (m) { name = m[1].trim(); break; }
  }
  if (!name) {
    const alphaLines = lines.filter((l) => /[a-zA-Z\u0600-\u06FF]{4,}/.test(l) && l.length < 40 && !/\d{4,}/.test(l));
    if (alphaLines.length > 0) name = alphaLines[0];
  }

  // Number: digits with length >= 5
  for (const line of lines) {
    const m = line.match(/(?:id|number|no|identity|card|number)\s*[:/]?\s*([0-9-]{5,})/i);
    if (m) { number = m[1].replace(/-/g, ''); break; }
  }
  if (!number) {
    const numMatch = text.match(/\b(\d{6,})\b/);
    if (numMatch) number = numMatch[1];
  }

  // Dates: YYYY-MM-DD or DD/MM/YYYY
  const dates = [...text.matchAll(/(\d{2,4}[/\-.]\d{1,2}[/\-.]\d{2,4})/g)].map((m) => m[1]);
  if (dates.length >= 1) issueDate = dates[0];
  if (dates.length >= 2) expiryDate = dates[1];

  // Also try expiry/exp keywords
  const expMatch = text.match(/(?:exp|expiry|expires|valid|until|valid)\s*[:/]?\s*(\d{2,4}[/\-.]\d{1,2}[/\-.]\d{2,4})/i);
  if (expMatch) expiryDate = expMatch[1];
  const issueMatch = text.match(/(?:issue|issued|date of birth|dob)\s*[:/]?\s*(\d{2,4}[/\-.]\d{1,2}[/\-.]\d{2,4})/i);
  if (issueMatch) issueDate = issueMatch[1];

  return { name, number, issueDate, expiryDate };
}
