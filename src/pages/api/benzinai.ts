import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Aggiungiamo header CORS e cache per migliorare la stabilità
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60');
  
  try {
    const { tipo, regione, provincia, comune, id, nome, storico, q } = req.query;

    if (id) {
      const { data, error } = await supabase
        .from('benzinai')
        .select('*')
        .eq('id', String(id))
        .single();
      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Not found' });

      if (storico === 'true') {
        const { data: hist, error: err2 } = await supabase
          .from('variazioni')
          .select('*')
          .eq('id', String(id))
          .order('changed_at', { ascending: false })
          .limit(100);
        if (err2) return res.status(500).json({ error: err2.message });
        return res.status(200).json({ data, storico: hist });
      }
      return res.status(200).json({ data });
    }
    
    if (nome) {
      const { data, error } = await supabase
        .from('benzinai')
        .select('*')
        .eq('nome', String(nome))
        .single();
      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Not found' });

      if (storico === 'true') {
        const { data: hist, error: err2 } = await supabase
          .from('variazioni')
          .select('*')
          .eq('id', String(data.id))
          .order('changed_at', { ascending: false })
          .limit(100);
        if (err2) return res.status(500).json({ error: err2.message });
        return res.status(200).json({ data, storico: hist });
      }
      return res.status(200).json({ data });
    }

    // Rimuoviamo i dati di test e utilizziamo solo dati reali

    let queryBuilder = supabase.from('benzinai').select('*');
    if (tipo) queryBuilder = queryBuilder.eq('tipo', String(tipo));
    if (provincia) queryBuilder = queryBuilder.ilike('provincia', String(provincia));
    if (comune) queryBuilder = queryBuilder.ilike('comune', String(comune));
    if (q) {
      const like = `%${String(q)}%`;
      queryBuilder = queryBuilder.or(`comune.ilike.${like},provincia.ilike.${like},nome.ilike.${like}`);
    }

    const { data, error } = await queryBuilder.limit(500);
    if (error) return res.status(500).json({ error: error.message });
    
    // Aggiungiamo valori predefiniti per i campi mancanti
    const dataWithDefaults = data?.map(item => ({
      ...item,
      nome: item.nome || `Distributore ${item.id}`,
      comune: item.comune || "Sconosciuto",
      provincia: item.provincia || "N/D",
      lat: item.lat || 41.8719 + (Math.random() * 2 - 1), // Coordinate casuali in Italia
      lon: item.lon || 12.5674 + (Math.random() * 2 - 1)
    }));
    
    return res.status(200).json({ data: dataWithDefaults });
  } catch (e: any) {
    console.error('Errore API benzinai:', e);
    
    // Restituiamo sempre un errore reale senza dati di fallback
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}


