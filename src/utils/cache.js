import { query } from '../db/pool.js';

export function generarLlaveShippo(params) {
  const { address_from, address_to, parcels } = params;
  const key = JSON.stringify({
    from: {
      country: address_from.country,
      zip: address_from.zip || '',
      city: address_from.city || '',
      state: address_from.state || ''
    },
    to: {
      country: address_to.country,
      zip: address_to.zip || '',
      city: address_to.city || '',
      state: address_to.state || ''
    },
    parcels
  });
  return key;
}

export async function obtenerDelCache(llave) {
  const res = await query(
    'SELECT resultado FROM rate_cache WHERE cache_key = $1 AND expira_en > NOW()',
    [llave]
  );
  if (res.rows.length === 0) return null;
  return res.rows[0].resultado;
}

export async function guardarEnCache(llave, resultado) {
  await query(
    `INSERT INTO rate_cache (cache_key, resultado, expira_en)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')
     ON CONFLICT (cache_key) DO UPDATE
       SET resultado = $2, expira_en = NOW() + INTERVAL '1 hour', criado_en = NOW()`,
    [llave, JSON.stringify(resultado)]
  );
}
