import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchAndParseAnagrafica } from '@/utils/parseAnagrafica';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST' && process.env.NODE_ENV === 'production') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const url = req.query.url ? String(req.query.url) : undefined;
    const rows = await fetchAndParseAnagrafica(url);
    let up = 0;
    for (const r of rows) {
      if (r.lat == null || r.lon == null) continue; // ignora righe senza coordinate
      const { error } = await supabaseAdmin.from('impianti').upsert({
        id: r.id,
        nome: r.nome,
        comune: r.comune,
        provincia: r.provincia,
        tipo: r.tipo,
        lat: r.lat,
        lon: r.lon,
      }).eq('id', r.id);
      if (error) throw error;
      up++;
    }
    return res.status(200).json({ ok: true, upserted: up });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}


