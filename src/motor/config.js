import { query } from '../db/pool.js';

let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000;

export async function loadConfig(forceReload = false) {
  const now = Date.now();
  if (!forceReload && cache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cache;
  }

  const [expressRows, terreRows, nac1Rows, nac2Rows, bvRows, ganRows, modRows, formRows, zonaRows, svcRows, mapRows, trechoRows, configTextoRows] = await Promise.all([
    query('SELECT kg, precio_bs FROM tarifas_express ORDER BY kg'),
    query('SELECT kg, precio_bs FROM tarifas_terrestre ORDER BY kg'),
    query('SELECT kg, precio_bs FROM nacional_op1 ORDER BY kg'),
    query('SELECT kg, precio_bs FROM nacional_op2 ORDER BY kg'),
    query('SELECT hasta_cm, precio_bs FROM tramos_boa_vista ORDER BY id'),
    query('SELECT hasta_kg, usd_kg FROM tramos_ganancia ORDER BY id'),
    query('SELECT modalidad, clave, valor FROM modalidades ORDER BY modalidad, clave'),
    query('SELECT clave, valor FROM formulas'),
    query('SELECT tipo, ciudad FROM zonas ORDER BY tipo, ciudad'),
    query('SELECT categoria, servicio, estado, documentacion FROM categoria_servicios ORDER BY categoria, servicio'),
    query('SELECT termino, categoria, restricciones FROM mapeo_categorias ORDER BY termino'),
    query('SELECT ciudad, codigo_iata, direccion_latam, tiempo_adicional_dias, activo FROM trechos_config ORDER BY ciudad'),
    query('SELECT clave, valor FROM config_texto ORDER BY clave')
  ]);

  const TABLA_EXPRESS = {};
  for (const r of expressRows.rows) TABLA_EXPRESS[r.kg] = Number(r.precio_bs);

  const TABLA_TERRESTRE = {};
  for (const r of terreRows.rows) TABLA_TERRESTRE[r.kg] = Number(r.precio_bs);

  const TABLA_NACIONAL_OP1 = {};
  for (const r of nac1Rows.rows) TABLA_NACIONAL_OP1[r.kg] = Number(r.precio_bs);

  const TABLA_NACIONAL_OP2 = {};
  for (const r of nac2Rows.rows) TABLA_NACIONAL_OP2[r.kg] = Number(r.precio_bs);

  const TRAMOS_BOA_VISTA = bvRows.rows.map(r => {
    return r.hasta_cm !== null ? { hasta: Number(r.hasta_cm), precio: Number(r.precio_bs) } : { precio: Number(r.precio_bs) };
  });

  const TRAMOS_GANANCIA = ganRows.rows.map(r => {
    return r.hasta_kg !== null ? { hasta: Number(r.hasta_kg), usd_kg: Number(r.usd_kg) } : { usd_kg: Number(r.usd_kg) };
  });

  const MODALIDADES = {};
  for (const r of modRows.rows) {
    if (!MODALIDADES[r.modalidad]) MODALIDADES[r.modalidad] = {};
    const val = isNaN(Number(r.valor)) ? r.valor : Number(r.valor);
    MODALIDADES[r.modalidad][r.clave] = val;
  }

  const FORMULAS = {};
  for (const r of formRows.rows) FORMULAS[r.clave] = Number(r.valor);

  const CONFIG_TEXTO = {};
  for (const r of configTextoRows.rows) CONFIG_TEXTO[r.clave] = r.valor;

  const ZONA_BASE = [];
  const ORIGENES_PROHIBIDOS = [];
  const ZONAS_SIN_COBERTURA = [];
  const ZONAS_RECOLECTA = [];
  for (const r of zonaRows.rows) {
    const ciudad = r.ciudad;
    if (r.tipo === 'BASE') ZONA_BASE.push(ciudad);
    else if (r.tipo === 'PROHIBIDO') ORIGENES_PROHIBIDOS.push(ciudad);
    else if (r.tipo === 'SIN_COBERTURA') ZONAS_SIN_COBERTURA.push(ciudad);
    else if (r.tipo === 'RECOLECTA') ZONAS_RECOLECTA.push(ciudad);
  }

  // ── Trechos LATAM Cargo ──
  const TRECHOS_MAP = {};
  for (const r of trechoRows.rows) {
    if (r.activo) {
      const ciudadKey = r.ciudad.toLowerCase().trim();
      TRECHOS_MAP[ciudadKey] = {
        ciudad: r.ciudad,
        codigo_iata: r.codigo_iata,
        direccion_latam: r.direccion_latam,
        tiempo_adicional_dias: r.tiempo_adicional_dias
      };
    }
  }

  // ── Matriz categoría × servicio ──
  const SERVICIOS_MATRIZ = { sedex: { permitidas: [], amarillas: {}, docs: {} }, pac: { permitidas: [], amarillas: {}, docs: {} }, latam: { permitidas: [], amarillas: {}, docs: {} } };
  for (const r of svcRows.rows) {
    const svc = r.servicio;
    if (r.estado === 'verde' || r.estado === 'amarillo') {
      SERVICIOS_MATRIZ[svc].permitidas.push(r.categoria);
      if (r.estado === 'amarillo') {
        SERVICIOS_MATRIZ[svc].amarillas[r.categoria] = true;
        if (r.documentacion) SERVICIOS_MATRIZ[svc].docs[r.categoria] = r.documentacion;
      }
    }
  }

  // ── Mapeo de términos → categorías ──
  const MAPEO_TERMINOS = {};
  for (const r of mapRows.rows) {
    MAPEO_TERMINOS[r.termino] = { categoria: r.categoria, restricciones: r.restricciones ? r.restricciones.split(',').map(s => s.trim()).filter(Boolean) : [] };
  }

  const config = {
    TABLA_EXPRESS, TABLA_TERRESTRE, TABLA_NACIONAL_OP1, TABLA_NACIONAL_OP2,
    TRAMOS_BOA_VISTA, TRAMOS_GANANCIA, MODALIDADES, FORMULAS, CONFIG_TEXTO,
    ZONA_BASE, ORIGENES_PROHIBIDOS, ZONAS_SIN_COBERTURA, ZONAS_RECOLECTA,
    SERVICIOS_MATRIZ, MAPEO_TERMINOS, TRECHOS_MAP
  };

  cache = config;
  cacheTimestamp = now;
  return config;
}

export function invalidateCache() {
  cache = null;
  cacheTimestamp = 0;
}
