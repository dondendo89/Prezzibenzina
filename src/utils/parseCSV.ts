import Papa from 'papaparse';
import iconv from 'iconv-lite';

export type RecordCSV = {
  id: string;
  nome: string;
  comune: string;
  provincia: string;
  tipo: 'Benzina' | 'Gasolio' | 'GPL' | 'Metano' | string;
  lat: number;
  lon: number;
  prezzo_attuale: number | null;
};

export async function fetchAndParseCSV(url: string): Promise<RecordCSV[]> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Errore fetching CSV');
  const arrayBuffer = await resp.arrayBuffer();
  // Il CSV MIMIT è spesso in ISO-8859-1; convertiamo in UTF-8
  const text = iconv.decode(Buffer.from(arrayBuffer), 'ISO-8859-1');

  const parsed = Papa.parse<string[]>(text, { delimiter: ';', newline: '\n' });
  const rows = (parsed.data as string[][]).filter(r => r && r.length > 0);
  // Header: idImpianto;descCarburante;prezzo;isSelf;dtComu (con prima riga "Estrazione del ...")
  const headerIdx = rows.findIndex(r => r.join(';').toLowerCase().includes('idimpianto;'));
  const header = headerIdx >= 0 ? rows[headerIdx] : rows[0] || [];
  const dataRows = rows.slice((headerIdx >= 0 ? headerIdx + 1 : 1)).filter(r => r && r.length >= 5);

  const colIndex: {
    id: number;
    carburante: number;
    prezzo: number;
    nome: number;
    comune: number;
    provincia: number;
    lat: number;
    lon: number;
  } = {
    id: header.findIndex(h => /idimpianto/i.test(h)),
    carburante: header.findIndex(h => /desc.?carburante/i.test(h)),
    prezzo: header.findIndex(h => /prezzo/i.test(h)),
    nome: -1,  // Default to -1 if not found
    comune: -1,
    provincia: -1,
    lat: -1,
    lon: -1,
  };

  function parseNum(v: string): number | null {
    if (!v) return null;
    const norm = v.replace(',', '.');
    const n = Number(norm);
    return Number.isFinite(n) ? n : null;
  }

  const records: RecordCSV[] = dataRows.map((r) => {
    const tipoCarburante = r[colIndex.carburante] || '';
    const mapTipo = tipoCarburante;
    return {
      id: r[colIndex.id],
      nome: colIndex.nome >= 0 ? r[colIndex.nome] : '',
      comune: colIndex.comune >= 0 ? r[colIndex.comune] : '',
      provincia: colIndex.provincia >= 0 ? r[colIndex.provincia] : '',
      tipo: mapTipo as any,
      lat: colIndex.lat >= 0 ? parseNum(r[colIndex.lat]) || 0 : 0,
      lon: colIndex.lon >= 0 ? parseNum(r[colIndex.lon]) || 0 : 0,
      prezzo_attuale: parseNum(r[colIndex.prezzo]),
    };
  }).filter(r => r.id);

  return records;
}


