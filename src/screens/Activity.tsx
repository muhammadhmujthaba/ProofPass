import { Clock, Trash2 } from 'lucide-react';
import { useStore, clearActivity } from '../store';
import { useT, useLang, relativeTime } from '../hooks';
import { EmptyState } from '../components/Shell';
import type { ActivityKind } from '../types';

const KIND_ICONS: Record<ActivityKind, string> = {
  journey_started: '🚀',
  blueprint_created: '✦',
  reuse_detected: '◎',
  info_matched: '🔗',
  gap_resolved: '✏️',
  record_saved: '💾',
  record_deleted: '🗑️',
  permission_requested: '🔐',
  permission_approved: '✅',
  permission_declined: '❌',
  permission_expired: '⏰',
  submission_completed: '✓',
  receipt_generated: '▣',
  reset: '↻',
  goal_recognized: '🎯',
  document_uploaded: '🆔',
};

export function ActivityScreen() {
  const t = useT();
  const state = useStore((s) => s);
  const lang = useLang();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('activity.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('activity.subtitle')}</p>
        </div>
        {state.activity.length > 0 && (
          <button
            onClick={() => clearActivity()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 dark:border-royal-700/50 dark:text-gray-400 dark:hover:bg-royal-800/30"
          >
            <Trash2 size={15} />
            {t('activity.clear')}
          </button>
        )}
      </header>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('activity.intelligence')}</p>

      {state.activity.length === 0 ? (
        <EmptyState icon={Clock} title={t('activity.empty')} />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
          <ul className="divide-y divide-gray-100 dark:divide-royal-800/40">
            {state.activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 dark:bg-royal-800/40 text-base">
                    {KIND_ICONS[a.kind]}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{a.message}</span>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{relativeTime(a.timestamp, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
