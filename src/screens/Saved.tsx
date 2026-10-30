import { useState } from 'react';
import { FolderLock, Plus, ScanLine, Trash2, Pencil, ShieldCheck, Calendar, X } from 'lucide-react';
import { useStore } from '../store';
import { useT, useLang } from '../hooks';
import { saveRecord, deleteRecord, toggleRecordAuthorization } from '../store';
import { DocumentIntake } from './Intake';
import type { SavedRecord, RecordType } from '../types';

export function SavedScreen() {
  const t = useT();
  const state = useStore((s) => s);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'manual' | 'upload' | null>(null);
  const [editing, setEditing] = useState<SavedRecord | null>(null);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('saved.title')}</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">{t('saved.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setAddType('manual'); setShowAdd(true); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-xl bg-royal-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600"
          >
            <Plus size={16} />
            {t('saved.addManual')}
          </button>
          <button
            onClick={() => { setAddType('upload'); setShowAdd(true); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-royal-700/50 dark:bg-royal-900/40 dark:text-gray-200 dark:hover:bg-royal-800/40"
          >
            <ScanLine size={16} />
            {t('saved.uploadId')}
          </button>
        </div>
      </header>

      {/* Records list */}
      {state.records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-royal-700/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-royal-800/40">
            <FolderLock size={26} />
          </div>
          <p className="text-gray-500 dark:text-gray-400">{t('saved.noRecords')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {state.records.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              t={t}
              onEdit={() => { setEditing(r); setAddType('manual'); setShowAdd(true); }}
              onDelete={() => { if (confirm(t('saved.confirmDelete'))) deleteRecord(r.id); }}
              onToggleAuth={() => toggleRecordAuthorization(r.id, 'housing_registration')}
            />
          ))}
        </div>
      )}

      {/* Add/edit modal */}
      {showAdd && (
        <Modal title={addType === 'upload' ? t('saved.uploadId') : t('saved.addManual')} onClose={() => { setShowAdd(false); setEditing(null); setAddType(null); }}>
          {addType === 'upload' ? (
            <DocumentIntake onDone={() => { setShowAdd(false); setAddType(null); }} />
          ) : (
            <ManualRecordForm
              existing={editing}
              onCancel={() => { setShowAdd(false); setEditing(null); setAddType(null); }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function RecordCard({
  record, t, onEdit, onDelete, onToggleAuth,
}: {
  record: SavedRecord;
  t: (k: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAuth: () => void;
}) {
  const lang = useLang();
  const authorized = record.authorizedFor.includes('housing_registration');
  const isExpired = record.expiryDate && new Date(record.expiryDate) < new Date();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft transition hover:shadow-glow dark:border-royal-800/50 dark:bg-royal-900/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-500/10 text-royal-500">
            {record.type === 'identity' ? <ShieldCheck size={20} /> : record.type === 'address' ? <FolderLock size={20} /> : <Calendar size={20} />}
          </div>
          <div>
            <h3 className="font-bold leading-tight">{record.title}</h3>
            <span className="text-xs font-semibold text-gray-400">{t(`saved.types.${record.type}`)}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-royal-500 dark:hover:bg-royal-800/40" aria-label={t('saved.edit')}>
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" aria-label={t('saved.delete')}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <dl className="mt-4 space-y-1.5">
        {Object.entries(record.fields).filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 text-sm">
            <dt className="text-gray-400">{k}</dt>
            <dd className="truncate font-medium text-gray-700 dark:text-gray-200">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-royal-800/40">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${record.source === 'ocr' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'bg-gray-100 text-gray-500 dark:bg-royal-800/40'}`}>
          {record.source === 'ocr' ? t('saved.sourceOcr') : t('saved.sourceManual')}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-royal-800/40">
          {t('saved.uploadDate')}: {new Date(record.createdAt).toLocaleDateString()}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${record.reviewStatus === 'confirmed' ? 'bg-mint-500/10 text-mint-600 dark:text-mint-400' : 'bg-gold-500/10 text-gold-600 dark:text-gold-400'}`}>
          {record.reviewStatus === 'confirmed' ? t('saved.confirmed') : t('saved.unconfirmed')}
        </span>
        {record.expiryDate && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-gray-100 text-gray-500 dark:bg-royal-800/40'}`}>
            {isExpired ? t('saved.expired') : t('saved.expiry')}: {record.expiryDate}
          </span>
        )}
      </div>

      {/* Authorization toggle for housing journey */}
      <button
        onClick={onToggleAuth}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition ${
          authorized
            ? 'border-mint-500/30 bg-mint-500/10 text-mint-600 dark:text-mint-400'
            : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-royal-700/50 dark:hover:bg-royal-800/30'
        }`}
      >
        <ShieldCheck size={14} />
        {authorized ? t('saved.availableForReuse') : t('saved.notForReuse')}
        {authorized && <span className="text-mint-500">✓</span>}
      </button>
    </div>
  );
}

function ManualRecordForm({ existing, onCancel }: { existing: SavedRecord | null; onCancel: () => void }) {
  const t = useT();
  const [type, setType] = useState<RecordType>(existing?.type || 'address');
  const [title, setTitle] = useState(existing?.title || '');
  const [fields, setFields] = useState<Record<string, string>>(existing?.fields || {});
  const [issueDate, setIssueDate] = useState(existing?.issueDate || '');
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate || '');
  const [authorized, setAuthorized] = useState(existing?.authorizedFor.includes('housing_registration') || false);

  function handleSave() {
    saveRecord({
      id: existing?.id,
      type,
      title: title || defaultTitle(type, t),
      fields,
      issueDate,
      expiryDate,
      source: 'manual',
      reviewStatus: 'confirmed',
      authorizedFor: authorized ? ['housing_registration'] : [],
    });
    onCancel();
  }

  const fieldConfig = getFieldsForType(type, t);

  return (
    <div className="space-y-4">
      {/* Type selector */}
      {!existing && (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-gray-500">{t('saved.types.' + type)}</span>
          <div className="flex gap-2">
            {(['address', 'contact', 'identity'] as RecordType[]).map((rt) => (
              <button
                key={rt}
                onClick={() => { setType(rt); setFields({}); }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  type === rt ? 'bg-royal-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-royal-800/40 dark:text-gray-400'
                }`}
              >
                {t(`saved.types.${rt}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <LabeledInput label={type === 'address' ? t('saved.fields.address.label') : t('saved.types.' + type)} value={title} onChange={setTitle} />

      <div className="grid gap-3 sm:grid-cols-2">
        {fieldConfig.map((f) => (
          <LabeledInput
            key={f.key}
            label={f.label}
            value={fields[f.key] || ''}
            onChange={(v) => setFields({ ...fields, [f.key]: v })}
            type={f.type || 'text'}
          />
        ))}
      </div>

      {(type === 'identity') && (
        <div className="grid gap-3 sm:grid-cols-2">
          <LabeledInput type="date" label={t('saved.issueDate')} value={issueDate} onChange={setIssueDate} />
          <LabeledInput type="date" label={t('saved.expiryDate')} value={expiryDate} onChange={setExpiryDate} />
        </div>
      )}

      <label className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-royal-800/30">
        <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="h-4 w-4 rounded accent-royal-500" />
        <span className="text-sm font-semibold">{t('saved.reuseToggle')}</span>
      </label>

      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 rounded-lg bg-royal-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-royal-600">{t('saved.save')}</button>
        <button onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold dark:bg-royal-800/50">{t('saved.cancel')}</button>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-royal-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-royal-700/50 dark:bg-royal-900 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-royal-800/40" aria-label="close">
            <X size={18} />
          </button>
        </div>
        {children}
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

function getFieldsForType(type: RecordType, t: (k: string) => string): { key: string; label: string; type?: string }[] {
  if (type === 'address') return [
    { key: 'street', label: t('saved.fields.address.street') },
    { key: 'city', label: t('saved.fields.address.city') },
    { key: 'emirate', label: t('saved.fields.address.emirate') },
    { key: 'postalCode', label: t('saved.fields.address.postalCode') },
  ];
  if (type === 'contact') return [
    { key: 'method', label: t('saved.fields.contact.method') },
    { key: 'value', label: t('saved.fields.contact.value') },
  ];
  return [
    { key: 'name', label: t('saved.fields.identity.name') },
    { key: 'number', label: t('saved.fields.identity.number') },
  ];
}

function defaultTitle(type: RecordType, t: (k: string) => string): string {
  if (type === 'address') return t('saved.types.address');
  if (type === 'contact') return t('saved.types.contact');
  return t('saved.types.identity');
}
