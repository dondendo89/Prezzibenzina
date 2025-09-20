import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Head from 'next/head';
import { I18nProvider } from '@/lib/i18n';
import 'leaflet/dist/leaflet.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return (
    <I18nProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Prezzi Carburanti</title>
        <meta name="description" content="Prezzi aggiornati di benzina, diesel, GPL e metano in Italia" />
        <meta property="og:title" content="Prezzi Carburanti" />
        <meta property="og:description" content="Prezzi aggiornati di benzina, diesel, GPL e metano in Italia" />
        <meta property="og:type" content="website" />
      </Head>
      <Component {...pageProps} />
    </I18nProvider>
  );
}


