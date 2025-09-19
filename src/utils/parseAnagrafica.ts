import Papa from 'papaparse';
import iconv from 'iconv-lite';

export type Impianto = {
  id: string;
  nome: string;
  comune: string;
  provincia: string;
  tipo: string;
  lat: number | null;
  lon: number | null;
};

export async function fetchAndParseAnagrafica(url = 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv'): Promise<Impianto[]> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Errore fetching anagrafica CSV');
  const buf = await resp.arrayBuffer();
  const text = iconv.decode(Buffer.from(buf), 'ISO-8859-1');

  const parsed = Papa.parse<string[]>(text, { delimiter: ';', newline: '\n' });
  const rows = (parsed.data as string[][]).filter(r => r && r.length > 0);
  // find header row (skip "Estrazione del ...")
  const headerIdx = rows.findIndex(r => r.join(';').toLowerCase().includes('idimpianto;'));
  const header = headerIdx >= 0 ? rows[headerIdx] : rows[0] || [];
  const dataRows = rows.slice((headerIdx >= 0 ? headerIdx + 1 : 1)).filter(r => r && r.length >= 6);

  const col = {
    id: header.findIndex(h => /idimpianto/i.test(h)),
    nome: header.findIndex(h => /gestore/i.test(h)),
    comune: header.findIndex(h => /comune/i.test(h)),
    provincia: header.findIndex(h => /provincia/i.test(h)),
    tipo: header.findIndex(h => /tipo.?impianto/i.test(h)),
    lat: header.findIndex(h => /lat/i.test(h)),
    lon: header.findIndex(h => /lon/i.test(h)),
  };

  function parseNum(v: string): number | null {
    if (!v) return null;
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  return dataRows.map(r => ({
    id: r[col.id],
    nome: r[col.nome],
    comune: r[col.comune],
    provincia: r[col.provincia],
    tipo: r[col.tipo],
    lat: parseNum(r[col.lat]),
    lon: parseNum(r[col.lon]),
  })).filter(r => r.id);
}


