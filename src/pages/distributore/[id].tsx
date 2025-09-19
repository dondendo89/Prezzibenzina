import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useI18n } from '@/lib/i18n';
import styles from '@/styles/Distributore.module.css';
import Link from 'next/link';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DistributoreDettaglio() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { data } = useSWR(id ? `/api/benzinai?id=${id}&storico=true` : null, fetcher);
  const [notificaAttiva, setNotificaAttiva] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const item = data?.data;
  const storico = data?.storico || [];

  const attivaNotifiche = async () => {
    if (!id) return;
    
    setIsSubscribing(true);
    try {
      // Richiedi permesso per le notifiche
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('È necessario concedere il permesso per le notifiche');
          setIsSubscribing(false);
          return;
        }
      }

      // Registra la sottoscrizione
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          )
        });

        // Invia la sottoscrizione al server
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            filters: { distributoreId: id }
          })
        });

        setNotificaAttiva(true);
      }
    } catch (error) {
      console.error('Errore durante l\'attivazione delle notifiche:', error);
      alert('Si è verificato un errore durante l\'attivazione delle notifiche');
    }
    setIsSubscribing(false);
  };

  // Funzione di utilità per convertire la chiave pubblica
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!id) return null;
  if (!item) return <div style={{ padding: 16 }}>Caricamento…</div>;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          ← Indietro
        </Link>
        <h1 className={styles.title}>Dettaglio area di servizio</h1>
      </div>
      
      <div className={styles.detailsContainer}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Impianto</h2>
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.infoLabel}>Gestore:</div>
              <div className={styles.infoValue}>{item.gestore || 'N/D'}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Area di servizio:</div>
              <div className={styles.infoValue}>{item.nome}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Indirizzo:</div>
              <div className={styles.infoValue}>{item.indirizzo || `${item.comune} (${item.provincia})`}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Servizi:</div>
              <div className={styles.infoValue}>{item.tipo || 'N/D'}</div>
            </div>
          </div>
          
          <div className={styles.priceContainer}>
            <h3 className={styles.priceTitle}>Prezzi {t('comunicati dal gestore')}</h3>
            <div className={styles.updateInfo}>Ultima comunicazione rilevata:</div>
            
            <div className={styles.priceRow}>
              <span className={styles.fuelType}>Benzina{item.self ? ' (self)' : ''}</span>
              <span className={styles.price}>€ {item.prezzo_attuale || 'N/D'}</span>
            </div>
            
            {item.prezzo_gasolio && (
              <div className={styles.priceRow}>
                <span className={styles.fuelType}>Gasolio{item.self ? ' (self)' : ''}</span>
                <span className={styles.price}>€ {item.prezzo_gasolio}</span>
              </div>
            )}
            
            {item.prezzo_gpl && (
              <div className={styles.priceRow}>
                <span className={styles.fuelType}>GPL{item.self ? ' (self)' : ''}</span>
                <span className={styles.price}>€ {item.prezzo_gpl}</span>
              </div>
            )}
            
            {item.prezzo_metano && (
              <div className={styles.priceRow}>
                <span className={styles.fuelType}>Metano{item.self ? ' (self)' : ''}</span>
                <span className={styles.price}>€ {item.prezzo_metano}</span>
              </div>
            )}
            
            {item.prezzo_gnl && (
              <div className={styles.priceRow}>
                <span className={styles.fuelType}>GNL{item.self ? ' (self)' : ''}</span>
                <span className={styles.price}>€ {item.prezzo_gnl}</span>
              </div>
            )}
            
            {item.prezzo_elettrico && (
              <div className={styles.priceRow}>
                <span className={styles.fuelType}>Elettrico</span>
                <span className={styles.price}>€ {item.prezzo_elettrico}</span>
              </div>
            )}
            
            <div className={styles.updateInfo}>
              {item.data_aggiornamento ? 
                `in vigore dal ${item.data_aggiornamento}` : 
                'Data aggiornamento non disponibile'}
            </div>
          </div>
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Orari impianto</h2>
          <div>Gli orari si riferiscono al servizio erogato in modalità assistita</div>
          
          <table className={styles.scheduleTable}>
            <tbody>
              <tr>
                <td>Lunedì</td>
                <td>Aperto H24</td>
              </tr>
              <tr>
                <td>Martedì</td>
                <td>Aperto H24</td>
              </tr>
              <tr>
                <td>Mercoledì</td>
                <td>Aperto H24</td>
              </tr>
              <tr>
                <td>Giovedì</td>
                <td>Aperto H24</td>
              </tr>
              <tr>
                <td>Venerdì</td>
                <td>Aperto H24</td>
              </tr>
              <tr>
                <td>Sabato</td>
                <td>Aperto H24</td>
              </tr>
              <tr>
                <td>Domenica</td>
                <td>Aperto H24</td>
              </tr>
            </tbody>
          </table>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={attivaNotifiche}
              disabled={notificaAttiva || isSubscribing}
              style={{
                backgroundColor: notificaAttiva ? '#4CAF50' : '#0066cc',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: notificaAttiva || isSubscribing ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {isSubscribing ? 'Attivazione in corso...' : notificaAttiva ? 'Notifiche attive' : 'Attiva notifiche'}
              {notificaAttiva && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
                </svg>
              )}
            </button>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Ricevi notifiche quando i prezzi di questo distributore cambiano
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


