import type { LucideIcon } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return <img src="/images/proofpass-logo.png" alt="" className={`object-contain ${className}`} aria-hidden="true" />;
}

export function StageIcon({ icon: Icon, state, size = 22 }: { icon: LucideIcon; state: string; size?: number }) {
  const color =
    state === 'completed'
      ? 'text-mint-500 bg-mint-500/10'
      : state === 'satisfied' || state === 'prepared'
        ? 'text-royal-500 bg-royal-500/10'
        : state === 'needs_input' || state === 'expired'
          ? 'text-gold-500 bg-gold-500/10'
          : state === 'permission_required'
            ? 'text-cyan-600 bg-cyan-500/10'
            : 'text-gray-400 bg-gray-400/10';
  return (
    <div className={`flex items-center justify-center rounded-xl shrink-0 ${color}`} style={{ width: size + 16, height: size + 16 }}>
      <Icon size={size} strokeWidth={2} />
    </div>
  );
}

export function StateBadge({ state, t }: { state: string; t: (k: string) => string }) {
  const map: Record<string, { cls: string; key: string }> = {
    satisfied: { cls: 'bg-royal-500/10 text-royal-600 dark:text-royal-300', key: 'journey.states.satisfied' },
    prepared: { cls: 'bg-royal-500/10 text-royal-600 dark:text-royal-300', key: 'journey.states.prepared' },
    needs_input: { cls: 'bg-gold-500/10 text-gold-600 dark:text-gold-400', key: 'journey.states.needs_input' },
    permission_required: { cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', key: 'journey.states.permission_required' },
    waiting: { cls: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400', key: 'journey.states.waiting' },
    expired: { cls: 'bg-red-500/10 text-red-500', key: 'journey.states.expired' },
    completed: { cls: 'bg-mint-500/10 text-mint-600 dark:text-mint-400', key: 'journey.states.completed' },
    in_progress: { cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', key: 'journey.states.in_progress' },
    locked: { cls: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400', key: 'journey.states.locked' },
    upcoming: { cls: 'bg-royal-500/10 text-royal-600 dark:text-royal-300', key: 'journey.states.upcoming' },
    awaiting_consent: { cls: 'bg-gold-500/10 text-gold-600 dark:text-gold-400', key: 'journey.states.awaiting_consent' },
  };
  const entry = map[state] || map.waiting;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${entry.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(entry.key)}
    </span>
  );
}
