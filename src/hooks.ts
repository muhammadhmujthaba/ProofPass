import type { Lang } from './types';
import { translate } from './i18n';
import { useStore } from './store';

export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export function useLang(): Lang {
  return useStore((s) => s.lang);
}

export function relativeTime(ts: number, lang: Lang): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return translate(lang, 'common.justNow');
  if (mins < 60) return translate(lang, 'common.minutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return translate(lang, 'common.hoursAgo', { count: hrs });
  const days = Math.floor(hrs / 24);
  return translate(lang, 'common.daysAgo', { count: days });
}

export function useRelativeTime(ts: number): string {
  const lang = useStore((s) => s.lang);
  return relativeTime(ts, lang);
}

export function formatDate(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function useFormatDate(): (ts: number) => string {
  const lang = useStore((s) => s.lang);
  return (ts: number) => formatDate(ts, lang);
}
