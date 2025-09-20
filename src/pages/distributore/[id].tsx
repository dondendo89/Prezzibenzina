import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useI18n } from '@/lib/i18n';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DistributoreDettaglio() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { data } = useSWR(id ? `/api/benzinai?id=${id}&storico=true` : null, fetcher);

  const item = data?.data;
  const storico = data?.storico || [];

  if (!id) return null;
  if (!item) return <div style={{ padding: 16 }}>Caricamento…</div>;

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <a href="/">{t('back_home')}</a>
      <h1>{item.nome}</h1>
      <div>Località: {item.comune} ({item.provincia})</div>
      <div>Carburante: {item.tipo}</div>
      <div>{t('price')} attuale: {item.prezzo_attuale ?? 'n/d'}</div>
      {item.prezzo_precedente != null && (
        <div>{t('price')} precedente: {item.prezzo_precedente}</div>
      )}
      {item.variazione ? <div style={{ color: 'orange' }}>{t('recent_variation')}</div> : null}

      <h2>{t('history')}</h2>
      <ul>
        {storico.map((v: any) => (
          <li key={v.changed_at}>{v.changed_at}: {v.prezzo}</li>
        ))}
      </ul>
    </div>
  );
}


