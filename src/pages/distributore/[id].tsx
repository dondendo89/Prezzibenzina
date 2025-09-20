import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DistributoreDettaglio() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { t } = useI18n();
  
  const { data, error } = useSWR(
    id ? `/api/benzinai?id=${id}&storico=true` : null,
    fetcher
  );

  if (error) return <div>Si è verificato un errore</div>;
  if (!data) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #0066cc',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 2s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Caricamento informazioni distributore...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
  
  // Estraggo i dati dal formato restituito dall'API
  const item = data.data;
  const storico = data.storico || [];

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '1200px', 
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#0066cc', 
        color: 'white', 
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderRadius: '5px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{t('title')} - Dettaglio Distributore</h1>
      </header>

      {/* Navigation */}
      <div style={{ 
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #eaeaea'
      }}>
        <Link href="/">
          <a style={{ 
            color: '#0066cc', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            width: 'fit-content'
          }}>
            <span style={{ marginRight: '5px' }}>←</span> {t('back')}
          </a>
        </Link>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        backgroundColor: 'white',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '25px',
        marginBottom: '30px'
      }}>
        {/* Left Column - Distributor Info */}
        <div>
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ 
              color: '#0066cc', 
              fontSize: '22px', 
              marginTop: 0,
              marginBottom: '15px',
              borderBottom: '2px solid #0066cc',
              paddingBottom: '10px'
            }}>
              Informazioni Impianto
            </h2>
            <div style={{ 
              backgroundColor: '#f9f9f9',
              padding: '15px',
              borderRadius: '5px'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                margin: '0 0 10px 0',
                color: '#333'
              }}>
                {item.nome}
              </h3>
              <p style={{ 
                margin: '5px 0',
                fontSize: '16px',
                color: '#555'
              }}>
                <strong>Indirizzo:</strong> {item.indirizzo || ''}, {item.comune}
              </p>
              {item.provincia && (
                <p style={{ margin: '5px 0', color: '#555' }}>
                  <strong>Provincia:</strong> {item.provincia}
                </p>
              )}
              {item.bandiera && (
                <p style={{ margin: '5px 0', color: '#555' }}>
                  <strong>Bandiera:</strong> {item.bandiera}
                </p>
              )}
              <p style={{ 
                margin: '5px 0',
                fontSize: '16px',
                color: '#555'
              }}>
                <strong>{t('fuel_type')}:</strong> {item.tipo}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Price Info */}
        <div>
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ 
              color: '#0066cc', 
              fontSize: '22px', 
              marginTop: 0,
              marginBottom: '15px',
              borderBottom: '2px solid #0066cc',
              paddingBottom: '10px'
            }}>
              Prezzi Carburante
            </h2>
            <div style={{ 
              backgroundColor: '#f9f9f9',
              padding: '15px',
              borderRadius: '5px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div style={{
                  backgroundColor: '#0066cc',
                  color: 'white',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: '15px',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>€</div>
                <div>
                  <p style={{ 
                    margin: '0 0 5px 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {t('current_price')}: €{item.prezzo_attuale ? item.prezzo_attuale.toFixed(3) : 'N/D'}
                  </p>
                  {item.prezzo_precedente && (
                    <p style={{ 
                      margin: '0',
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      {t('previous_price')}: €{item.prezzo_precedente.toFixed(3)}
                      <span style={{ 
                        marginLeft: '10px',
                        color: item.prezzo_attuale > item.prezzo_precedente ? '#d32f2f' : '#388e3c',
                        fontWeight: 'bold'
                      }}>
                        {item.prezzo_attuale > item.prezzo_precedente ? '▲' : '▼'} 
                        {((item.prezzo_attuale - item.prezzo_precedente) / item.prezzo_precedente * 100).toFixed(2)}%
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <p style={{ 
                fontSize: '12px',
                color: '#777',
                fontStyle: 'italic',
                margin: '0'
              }}>
                Ultimo aggiornamento: {item.data_aggiornamento ? new Date(item.data_aggiornamento).toLocaleString() : 'N/D'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Price History */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          color: '#0066cc', 
          fontSize: '22px', 
          marginTop: 0,
          marginBottom: '20px',
          borderBottom: '2px solid #0066cc',
          paddingBottom: '10px'
        }}>
          {t('price_history')}
        </h2>
        
        {storico && storico.length > 0 ? (
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '16px'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#f2f7fd',
                borderBottom: '2px solid #0066cc'
              }}>
                <th style={{ 
                  padding: '12px 15px',
                  textAlign: 'left'
                }}>Data</th>
                <th style={{ 
                  padding: '12px 15px',
                  textAlign: 'right'
                }}>Prezzo (€/litro)</th>
                <th style={{ 
                  padding: '12px 15px',
                  textAlign: 'right'
                }}>Variazione</th>
              </tr>
            </thead>
            <tbody>
              {storico.map((item: any, index: number) => {
                const prevItem = index < storico.length - 1 ? storico[index + 1] : null;
                const variazione = prevItem && prevItem.prezzo ? ((item.prezzo - prevItem.prezzo) / prevItem.prezzo * 100) : 0;
                
                return (
                  <tr key={index} style={{ 
                    borderBottom: '1px solid #eaeaea'
                  }}>
                    <td style={{ 
                      padding: '12px 15px'
                    }}>
                      {new Date(item.changed_at).toLocaleDateString()}
                    </td>
                    <td style={{ 
                      padding: '12px 15px',
                      textAlign: 'right',
                      fontWeight: index === 0 ? 'bold' : 'normal'
                    }}>
                      €{item.prezzo.toFixed(3)}
                    </td>
                    <td style={{ 
                      padding: '12px 15px',
                      textAlign: 'right',
                      color: variazione > 0 ? '#d32f2f' : variazione < 0 ? '#388e3c' : '#777'
                    }}>
                      {prevItem ? (
                        <>
                          {variazione > 0 ? '▲' : variazione < 0 ? '▼' : '—'} 
                          {variazione.toFixed(2)}%
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#777' }}>Nessuno storico prezzi disponibile</p>
        )}
      </div>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid #eaeaea',
        color: '#777',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0' }}>© {new Date().getFullYear()} {t('title')} - Tutti i diritti riservati</p>
      </footer>
    </div>
  );
}


