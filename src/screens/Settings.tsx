import { Settings as SettingsIcon, Globe, Moon, Sun, ShieldCheck, Trash2, Info } from 'lucide-react';
import { useStore, setLang, setTheme, resetDemo, storageAvailable } from '../store';
import { useT } from '../hooks';
import type { Lang, Theme } from '../types';

export function SettingsScreen() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const theme = useStore((s) => s.theme);

  function handleReset() {
    if (confirm(t('settings.resetConfirm'))) {
      resetDemo();
      alert(t('settings.resetDone'));
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal-500/10 text-royal-500">
            <SettingsIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('settings.title')}</h1>
        </div>
      </header>

      {/* Language */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-gray-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('settings.language')}</h2>
        </div>
        <div className="mt-3 flex gap-2">
          {(['en', 'ar'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                lang === l
                  ? 'border-royal-500 bg-royal-500 text-white'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-royal-700/50 dark:bg-royal-900/40 dark:text-gray-400'
              }`}
            >
              {l === 'en' ? 'English' : 'العربية'}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="flex items-center gap-2">
          {theme === 'dark' ? <Moon size={18} className="text-gray-400" /> : <Sun size={18} className="text-gray-400" />}
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('settings.theme')}</h2>
        </div>
        <div className="mt-3 flex gap-2">
          {(['light', 'dark'] as Theme[]).map((th) => (
            <button
              key={th}
              onClick={() => setTheme(th)}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                theme === th
                  ? 'border-royal-500 bg-royal-500 text-white'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-royal-700/50 dark:bg-royal-900/40 dark:text-gray-400'
              }`}
            >
              {t(`settings.${th}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-gray-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('settings.privacy')}</h2>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('settings.privacyNote')}</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold dark:bg-royal-800/30">
          <span className={`h-2 w-2 rounded-full ${storageAvailable() ? 'bg-mint-500' : 'bg-red-500'}`} />
          {storageAvailable() ? 'localStorage available' : 'localStorage unavailable'}
        </div>
      </section>

      {/* About */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft dark:border-royal-800/50 dark:bg-royal-900/40">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-gray-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('settings.about')}</h2>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('settings.aboutText')}</p>
      </section>

      {/* Demo reset */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800/40 dark:bg-red-900/15">
        <div className="flex items-center gap-2">
          <Trash2 size={18} className="text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-red-500">{t('settings.demo')}</h2>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('settings.resetConfirm')}</p>
        <button
          onClick={handleReset}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
        >
          <Trash2 size={15} />
          {t('settings.reset')}
        </button>
      </section>
    </div>
  );
}
