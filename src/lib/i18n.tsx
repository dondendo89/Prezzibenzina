import { createContext, useContext, useMemo, ReactNode, useEffect, useState } from 'react';
import it from '@/i18n/it';
import en from '@/i18n/en';

type Locale = 'it' | 'en';
type Messages = Record<string, string>;

const allMessages: Record<Locale, Messages> = { it, en };

type Ctx = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<Ctx>({ locale: 'it', t: (k) => k, setLocale: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('it');

  useEffect(() => {
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
    const qLang = (url?.searchParams.get('lang') as Locale | null) || null;
    const stored = (typeof window !== 'undefined' ? window.localStorage.getItem('lang') : null) as Locale | null;
    const next = qLang || stored || 'it';
    setLocale(next);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', locale);
    }
  }, [locale]);

  const t = useMemo(() => {
    const messages = allMessages[locale] || allMessages.it;
    return (key: string) => messages[key] ?? key;
  }, [locale]);

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}




