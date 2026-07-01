import { query } from '../db/pool.js';

const ASSURE_URL = 'https://onlinetools.ups.com/api/brokerage/v1/importexport/exportassure';

function generarLlave(titulo, paisOrigen, paisDestino) {
  return 'assure:' + JSON.stringify({ titulo, paisOrigen, paisDestino });
}

async function obtenerDeCache(llave) {
  try {
    const r = await query('SELECT resultado FROM rate_cache WHERE cache_key = $1 AND expira_en > NOW()', [llave]);
    if (r.rows.length > 0) return r.rows[0].resultado;
  } catch {}
  return null;
}

async function guardarEnCache(llave, resultado) {
  try {
    await query(
      'INSERT INTO rate_cache (cache_key, resultado, expira_en) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\') ON CONFLICT (cache_key) DO UPDATE SET resultado = $2, expira_en = NOW() + INTERVAL \'1 hour\'',
      [llave, JSON.stringify(resultado)]
    );
  } catch {}
}

export async function verificarRestriccionUps({ token, titulo, paisOrigen, paisDestino }) {
  if (!titulo || !token) return { permitido: true, motivo: '' };

  const llave = generarLlave(titulo, paisOrigen, paisDestino);
  const cacheado = await obtenerDeCache(llave);
  if (cacheado) return cacheado;

  try {
    const body = {
      evaluateImportExportRequirements: true,
      evaluateDescriptions: true,
      shipment: {
        exportCountryCode: paisOrigen || 'BR',
        importCountryCode: paisDestino || 'VE',
        shipmentItems: [{
          description: titulo,
          originCountryCode: paisOrigen || 'BR'
        }]
      }
    };

    const res = await fetch(ASSURE_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    const resultado = {
      permitido: res.ok,
      motivo: ''
    };

    if (!res.ok) {
      const alerts = data.assureResponse?.alerts || data.alerts || [];
      const descs = Array.isArray(alerts) ? alerts : [alerts];
      const prohibido = descs.find(a => /prohibit|restrict|not.allow/i.test(a.code || a.message || a));
      resultado.motivo = prohibido?.message || prohibido?.description || descs.map(a => a.message || a).filter(Boolean).join('; ');
      resultado.permitido = false;
    }

    await guardarEnCache(llave, resultado);
    console.log('[ups-assure]', titulo.slice(0, 40), '→', resultado.permitido ? 'permitido' : 'restringido');
    return resultado;
  } catch (err) {
    console.error('[ups-assure] error', err.message);
    return { permitido: true, motivo: '' };
  }
}
