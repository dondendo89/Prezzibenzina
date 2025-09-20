import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const [{ data: cntImpianti }, { data: cntBenzinai }, { data: impiantiConPrezzo }, { data: byTipo }, { data: prezziNull }, { data: coordsMissing }]
      = await Promise.all([
        supabaseAdmin.rpc('exec_sql', { sql: 'select count(*)::int as n from impianti' }).select().maybeSingle(),
        supabaseAdmin.rpc('exec_sql', { sql: 'select count(*)::int as n from benzinai' }).select().maybeSingle(),
        supabaseAdmin.rpc('exec_sql', { sql: 'select count(distinct id)::int as n from benzinai' }).select().maybeSingle(),
        supabaseAdmin.rpc('exec_sql_rows', { sql: 'select tipo, count(*)::int as n from benzinai group by 1 order by n desc' }),
        supabaseAdmin.rpc('exec_sql', { sql: 'select count(*)::int as n from benzinai where prezzo_attuale is null' }).select().maybeSingle(),
        supabaseAdmin.rpc('exec_sql', { sql: 'select count(*)::int as n from benzinai where lat = 0 or lon = 0' }).select().maybeSingle()
      ] as any);

    return res.status(200).json({
      impianti: cntImpianti?.n ?? null,
      benzinai: cntBenzinai?.n ?? null,
      impianti_con_prezzo: impiantiConPrezzo?.n ?? null,
      per_tipo: byTipo ?? [],
      prezzi_null: prezziNull?.n ?? null,
      coord_mancanti: coordsMissing?.n ?? null,
    });
  } catch (e: any) {
    // Fallback senza RPC: eseguiamo query dirette con supabase-js
    try {
      const { count: impianti } = await supabaseAdmin.from('impianti').select('*', { count: 'exact', head: true });
      const { count: benzinai } = await supabaseAdmin.from('benzinai').select('*', { count: 'exact', head: true });
      const { data: byTipo } = await supabaseAdmin.from('benzinai').select('tipo').then(async r => {
        const arr = (r.data || []) as Array<{ tipo: string }>;
        const m: Record<string, number> = {};
        arr.forEach(x => { m[x.tipo] = (m[x.tipo] || 0) + 1; });
        return { data: Object.entries(m).map(([tipo, n]) => ({ tipo, n })) };
      });
      return res.status(200).json({ impianti, benzinai, per_tipo: byTipo });
    } catch (e2: any) {
      return res.status(500).json({ error: e2.message || e.message || 'stats_failed' });
    }
  }
}




