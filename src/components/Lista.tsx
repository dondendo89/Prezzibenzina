import Link from 'next/link';

type Item = {
  id: string;
  nome: string;
  comune: string;
  provincia: string;
  tipo: string;
  prezzo_attuale: number | null;
  prezzo_precedente: number | null;
  variazione: boolean;
};

export default function Lista({ items }: { items: Item[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((i) => (
        <Link key={i.id} href={`/distributore/${i.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ border: '1px solid #eee', padding: 8, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{i.nome}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{i.comune} ({i.provincia}) • {i.tipo}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>€ {i.prezzo_attuale?.toFixed(3) ?? 'n/d'}</div>
              {i.variazione ? <span style={{ color: 'orange', fontSize: 12 }}>variazione</span> : null}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}


