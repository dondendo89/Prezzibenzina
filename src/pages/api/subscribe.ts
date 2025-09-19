import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { subscription, filters } = req.body || {};
    if (!subscription) return res.status(400).json({ error: 'missing subscription' });
    const row = {
      endpoint: subscription.endpoint,
      subscription,
      filters: filters || null,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('push_subscriptions').select('endpoint');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ count: data?.length || 0 });
  }
  return res.status(405).end();
}


