import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchAndParseCSV } from '@/utils/parseCSV';
import { sendPushToSubscription } from '@/lib/push';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST' && process.env.NODE_ENV === 'production') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const records = await fetchAndParseCSV(process.env.MIMIT_CSV_URL || 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv');
    // Load anagrafica map
    const { data: impianti } = await supabaseAdmin.from('impianti').select('id,nome,comune,provincia,tipo,lat,lon');
    const mapImpianti = new Map<string, any>();
    (impianti || []).forEach((i: any) => mapImpianti.set(String(i.id), i));

    // Upsert logic with variation tracking
    let updated = 0;
    const changed: Array<{ id: string; nome: string; comune: string; provincia: string; tipo: string; prezzo: number | null }> = [];
    for (const r of records) {
      const id = r.id;
      const prezzo = r.prezzo_attuale;

      const { data: existing } = await supabaseAdmin
        .from('benzinai')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const variazione = existing ? existing.prezzo_attuale !== prezzo : false;
      const prezzo_precedente = existing ? existing.prezzo_attuale : null;

      const meta = mapImpianti.get(String(id));
      // Preferisce coordinate/metadati da anagrafica; se mancanti, conserva quelli esistenti
      const resolvedNome = (meta?.nome ?? existing?.nome ?? '') as string;
      const resolvedComune = (meta?.comune ?? existing?.comune ?? '') as string;
      const resolvedProvincia = (meta?.provincia ?? existing?.provincia ?? '') as string;
      const resolvedTipo = (r.tipo || meta?.tipo || existing?.tipo || '') as string;
      const resolvedLat = (meta?.lat ?? existing?.lat ?? null) as number | null;
      const resolvedLon = (meta?.lon ?? existing?.lon ?? null) as number | null;

      const upsertPayload = {
        id,
        nome: resolvedNome,
        comune: resolvedComune,
        provincia: resolvedProvincia,
        tipo: resolvedTipo,
        lat: resolvedLat ?? 0,
        lon: resolvedLon ?? 0,
        prezzo_attuale: prezzo,
        prezzo_precedente,
        variazione,
        timestamp: new Date().toISOString(),
      };

      // Se ancora non abbiamo coordinate, saltiamo l'inserimento per evitare marker a (0,0)
      if ((upsertPayload.lat ?? 0) === 0 || (upsertPayload.lon ?? 0) === 0) {
        continue;
      }

      const { error } = await supabaseAdmin.from('benzinai').upsert(upsertPayload).eq('id', id);
      if (error) throw error;

      if (variazione) {
        await supabaseAdmin.from('variazioni').insert({ id, prezzo, changed_at: new Date().toISOString() });
        changed.push({ id, nome: meta?.nome || String(id), comune: meta?.comune || '', provincia: meta?.provincia || '', tipo: r.tipo || meta?.tipo || '', prezzo });
      }
      updated++;
    }

    // Send push notifications to all subscribers (basic broadcast; you can filter by area/tipo)
    if (changed.length > 0) {
      const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('subscription');
      if (subs && subs.length > 0) {
        const payloadTitle = `Variazioni prezzo carburanti`;
        const body = `${changed.length} impianti aggiornati`;
        await Promise.all(
          subs.map(async (s: any) => {
            await sendPushToSubscription(s.subscription, { title: payloadTitle, body, url: '/' });
          })
        );
      }
    }

    return res.status(200).json({ ok: true, updated, changed: changed.length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}


