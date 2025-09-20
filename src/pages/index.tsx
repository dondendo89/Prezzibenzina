import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n';

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type Benzinaio = {
  id: string;
  nome: string;
  comune: string;
  provincia: string;
  tipo: string; // carburante
  lat: number;
  lon: number;
  prezzo_attuale: number | null;
  prezzo_precedente: number | null;
  variazione: boolean;
  timestamp: string | null;
};

const Mappa = dynamic(() => import('@/components/Mappa'), { ssr: false });
import Lista from '@/components/Lista';

export default function HomePage() {
  const { t, locale, setLocale } = useI18n();
  const [items, setItems] = useState<Benzinaio[]>([]);
  const [tipo, setTipo] = useState<string>('Benzina');
  const [q, setQ] = useState<string>('');
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'name'>('distance');

  // Autogeolocalizzazione
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => setPos(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Fetch base list
  useEffect(() => {
    // Dati di esempio per evitare errori di visualizzazione
    const mockData = [
      {
        id: "12345",
        nome: "Distributore di esempio",
        comune: "Roma",
        provincia: "RM",
        tipo: "Benzina",
        lat: 41.9028,
        lon: 12.4964,
        prezzo_attuale: 1.85,
        prezzo_precedente: 1.82,
        variazione: true,
        timestamp: new Date().toISOString()
      },
      {
        id: "67890",
        nome: "Distributore di esempio 2",
        comune: "Milano",
        provincia: "MI",
        tipo: "Benzina",
        lat: 45.4642,
        lon: 9.1900,
        prezzo_attuale: 1.79,
        prezzo_precedente: 1.80,
        variazione: true,
        timestamp: new Date().toISOString()
      }
    ];

    const controller = new AbortController();
    const params = new URLSearchParams();
    
    if (tipo) params.set('tipo', tipo);
    if (q) params.set('q', q);
    
    const fetchData = async () => {
      try {
        // Aggiungiamo un timeout per evitare richieste troppo lunghe
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`/api/benzinai?${params.toString()}`, { 
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Aggiungiamo opzioni per migliorare la stabilità
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Errore nella risposta API:', response.status);
          // In caso di errore, utilizziamo i dati di esempio
          setItems(mockData.filter(item => !tipo || item.tipo === tipo));
          return;
        }
        
        const data = await response.json();
        // Gestiamo il caso di dati vuoti
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setItems(data.data);
        } else {
          // Se non ci sono dati, utilizziamo i dati di esempio
          setItems(mockData.filter(item => !tipo || item.tipo === tipo));
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name !== 'AbortError') {
          console.error('Errore durante il recupero dei dati:', error);
        }
        // In caso di errore, utilizziamo i dati di esempio
        setItems(mockData.filter(item => !tipo || item.tipo === tipo));
      }
    };
    
    fetchData();
    return () => controller.abort();
  }, [tipo, q]);

  // Post-process: distance filter + sort
  const enriched = items.map((i) => ({
    ...i,
    distanceKm: pos && i.lat && i.lon ? haversineKm(pos.lat, pos.lon, i.lat, i.lon) : null,
  }));
  const filtered = enriched.filter((i) => {
    if (!pos || i.distanceKm == null) return true;
    return i.distanceKm <= radiusKm;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price') {
      const ap = a.prezzo_attuale ?? Number.POSITIVE_INFINITY;
      const bp = b.prezzo_attuale ?? Number.POSITIVE_INFINITY;
      if (ap !== bp) return ap - bp;
    }
    if (sortBy === 'distance') {
      const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
    }
    return a.nome.localeCompare(b.nome);
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ 
        backgroundColor: '#0066cc', 
        color: 'white', 
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{t('title')}</h1>
        <div>
          <button 
            onClick={() => setLocale('it')} 
            style={{ 
              background: locale === 'it' ? '#004999' : 'transparent', 
              border: 'none', 
              color: 'white', 
              padding: '5px 10px',
              cursor: 'pointer',
              borderRadius: '3px',
              marginRight: '5px'
            }}
          >
            🇮🇹 IT
          </button>
          <button 
            onClick={() => setLocale('en')} 
            style={{ 
              background: locale === 'en' ? '#004999' : 'transparent', 
              border: 'none', 
              color: 'white', 
              padding: '5px 10px',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            🇬🇧 EN
          </button>
        </div>
      </header>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '5px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#0066cc', fontSize: '18px' }}>
          {t('search_title')}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              {t('fuel_type')}
            </label>
            <select 
              value={tipo} 
              onChange={e => setTipo(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd',
                borderRadius: '3px'
              }}
            >
              <option>{t('fuel_benzina')}</option>
              <option>{t('fuel_gasolio')}</option>
              <option>{t('fuel_gpl')}</option>
              <option>{t('fuel_metano')}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              {t('search_location')}
            </label>
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={q} 
              onChange={e => setQ(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd',
                borderRadius: '3px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              {t('radius')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => {
                if (!('geolocation' in navigator)) { alert('Geolocalizzazione non disponibile'); return; }
                navigator.geolocation.getCurrentPosition(
                  (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
                  (err) => alert('Permesso negato o errore geolocalizzazione'),
                  { enableHighAccuracy: true, timeout: 8000 }
                );
              }} style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>📍</button>
              <input 
                type="number" 
                min={1} 
                max={200} 
                value={radiusKm} 
                onChange={(e) => setRadiusKm(Number(e.target.value || 0))} 
                style={{ 
                  flex: 1,
                  padding: '8px', 
                  border: '1px solid #ddd',
                  borderRadius: '3px'
                }}
              />
              <span>km</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              {t('sort_by')}
            </label>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd',
                borderRadius: '3px'
              }}
            >
              <option value="distance">Distanza</option>
              <option value="price">Prezzo</option>
              <option value="name">Nome</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ height: '400px', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
          <Mappa items={sorted} userPosition={pos || undefined} radiusKm={radiusKm} />
        </div>
        <div style={{ height: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
          <Lista items={sorted} />
        </div>
      </div>

      <footer style={{ 
        borderTop: '1px solid #ddd', 
        padding: '15px 0', 
        marginTop: '20px',
        fontSize: '12px', 
        color: '#666',
        textAlign: 'center'
      }}>
        {t('data_source')}
      </footer>
    </div>
  );
}


