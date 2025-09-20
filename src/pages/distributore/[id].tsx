import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useI18n } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Caricamento dinamico del componente Mappa solo lato client
const Mappa = dynamic(() => import('@/components/Mappa'), { 
  ssr: false,
  loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>Caricamento mappa...</div>
});

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DistributoreDettaglio() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { data } = useSWR(id ? `/api/benzinai?id=${id}&storico=true` : null, fetcher);
  const [notificheAttive, setNotificheAttive] = useState(false);

  const item = data?.data;
  const storico = data?.storico || [];

  if (!id) return null;
  if (!item) return <div style={{ padding: 16 }}>Caricamento…</div>;

  const abilitaNotifiche = async () => {
    try {
      if (typeof window === 'undefined') {
        return; // Non eseguire sul server
      }
      
      if (!('Notification' in window)) {
        alert('Il tuo browser non supporta le notifiche');
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, filters: { id: item.id } })
        });
        
        setNotificheAttive(true);
        alert('Notifiche abilitate con successo!');
      }
    } catch (err) {
      console.error('Errore durante la sottoscrizione:', err);
      alert('Errore durante l\'attivazione delle notifiche');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: '1200px', margin: '0 auto' }}>
      <a href="/" style={{ display: 'block', marginBottom: '16px', color: '#333', textDecoration: 'none' }}>{t('back_home')}</a>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 16px 0', color: '#333' }}>{item.nome}</h1>
          <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Località: {item.comune} ({item.provincia})</div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Carburante: {item.tipo}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('price')} attuale: {item.prezzo_attuale ?? 'n/d'}</div>
            {item.prezzo_precedente != null && (
              <div style={{ fontSize: 14, color: '#666' }}>{t('price')} precedente: {item.prezzo_precedente}</div>
            )}
            {item.variazione ? <div style={{ color: 'orange', fontSize: 14, marginTop: 8 }}>{t('recent_variation')}</div> : null}
          </div>
          
          <button 
            onClick={abilitaNotifiche} 
            disabled={notificheAttive}
            style={{ 
              marginBottom: '20px', 
              padding: '10px 15px', 
              backgroundColor: notificheAttive ? '#ccc' : '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: notificheAttive ? 'default' : 'pointer',
              width: '100%',
              fontWeight: 600
            }}
          >
            {notificheAttive ? 'Notifiche attive' : t('enable_notifications')}
          </button>
          
          <h2 style={{ margin: '20px 0 12px 0', color: '#333', fontSize: 18 }}>{t('history')}</h2>
          <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            {storico.map((v: any, index: number) => (
              <div 
                key={v.changed_at} 
                style={{ 
                  padding: '8px 12px', 
                  borderBottom: index < storico.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: 14, color: '#666' }}>{v.changed_at}</span>
                <span style={{ fontWeight: 600 }}>{v.prezzo}</span>
              </div>
            ))}
            {storico.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                Nessuna variazione di prezzo registrata
              </div>
            )}
          </div>
        </div>
        
        <div style={{ height: '400px', border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
          {item.lat && item.lon && (
            <Mappa 
              items={[item]} 
              userPosition={null} 
            />
          )}
        </div>
      </div>
    </div>
  );
}


