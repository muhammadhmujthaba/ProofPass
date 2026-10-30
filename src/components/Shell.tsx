import { useEffect } from 'react';
import {
  Home, Route, Eye, FolderLock, Building2, KeyRound, Clock, Settings, Moon, Sun, Globe,
} from 'lucide-react';
import { useStore, useApplyDocumentAttrs, tickProofKeys, setLang, setTheme } from '../store';
import { useT, useLang } from '../hooks';
import { Logo } from './ui';

export type View =
  | 'home' | 'journey' | 'prooflens' | 'saved' | 'housing' | 'proofkey' | 'activity' | 'settings' | 'receipt';

interface NavItem {
  key: View;
  labelKey: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', labelKey: 'nav.home', icon: Home },
  { key: 'journey', labelKey: 'nav.journey', icon: Route },
  { key: 'prooflens', labelKey: 'nav.prooflens', icon: Eye },
  { key: 'saved', labelKey: 'nav.saved', icon: FolderLock },
  { key: 'housing', labelKey: 'nav.housing', icon: Building2 },
  { key: 'proofkey', labelKey: 'nav.proofkey', icon: KeyRound },
  { key: 'activity', labelKey: 'nav.activity', icon: Clock },
  { key: 'settings', labelKey: 'nav.settings', icon: Settings },
];

export function Shell({ view, onNavigate, children }: { view: View; onNavigate: (v: View) => void; children: React.ReactNode }) {
  const t = useT();
  const lang = useLang();
  const theme = useStore((s) => s.theme);
  const hasJourney = useStore((s) => Boolean(s.journeys.housing_registration));
  const journeyComplete = useStore((s) => Boolean(s.journeys.housing_registration?.receiptId));

  useApplyDocumentAttrs();

  useEffect(() => {
    const interval = setInterval(tickProofKeys, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-royal-950 dark:text-gray-100 transition-colors">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/85 backdrop-blur-md dark:border-royal-800/60 dark:bg-royal-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5" aria-label="ProofPass home">
            <Logo className="h-8 w-8" />
            <div className="text-start leading-tight">
              <div className="text-base font-bold tracking-tight">{t('brand')}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('team')}</div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-royal-800/50"
              aria-label="Toggle language"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">{lang === 'en' ? 'EN' : 'ع'}</span>
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-royal-800/50"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="mx-auto hidden max-w-7xl items-center gap-1 px-6 pb-2 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            const complete = item.key === 'journey' && journeyComplete;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-royal-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-royal-800/40'
                }`}
              >
                <Icon size={16} />
                {t(item.labelKey)}
                {complete && <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Mobile nav scroll strip */}
      <nav className="sticky top-16 z-30 flex gap-1 overflow-x-auto border-b border-gray-200/70 bg-white/85 px-3 py-2 backdrop-blur-md md:hidden dark:border-royal-800/60 dark:bg-royal-950/85">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                active ? 'bg-royal-500 text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={14} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      {/* Journey status footer pill */}
      {hasJourney && (
        <div className="pointer-events-none fixed bottom-4 z-30 ltr:right-4 rtl:left-4">
          <button
            onClick={() => onNavigate('journey')}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-royal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-royal-600"
          >
            <Route size={16} />
            {journeyComplete ? t('home.completed') : t('nav.journey')}
          </button>
        </div>
      )}

      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-gray-400">
        {t('brand')} · {t('team')} — {t('slogan')}
      </footer>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, action }: { icon: typeof Home; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-royal-800/40">
        <Icon size={26} />
      </div>
      <p className="mb-4 text-gray-500 dark:text-gray-400">{title}</p>
      {action}
    </div>
  );
}

export { NAV_ITEMS };
export type { NavItem };
