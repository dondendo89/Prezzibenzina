import type { NextApiRequest, NextApiResponse } from 'next';
import iconv from 'iconv-lite';

async function fetchHeaders(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('fetch failed');
  const buf = await resp.arrayBuffer();
  const text = iconv.decode(Buffer.from(buf), 'ISO-8859-1');
  const firstLines = text.split(/\r?\n/).slice(0, 5);
  // find first line that looks like header (contains ';' and not starts with 'Estrazione')
  const headerLine = firstLines.find(l => l.includes(';') && !/^Estrazione/i.test(l)) || '';
  const headers = headerLine.split(';');
  return { headerLine, headers, firstLines };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prezzoUrl = process.env.MIMIT_CSV_URL || 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';
    const anagUrl = 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
    const [prezzo, anag] = await Promise.all([
      fetchHeaders(prezzoUrl),
      fetchHeaders(anagUrl)
    ]);
    return res.status(200).json({ prezzo, anag });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'debug failed' });
  }
}


