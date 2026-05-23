import { query } from '../db/pool.js';

let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000;

export async function loadConfig(forceReload = false) {
  const now = Date.now();
  if (!forceReload && cache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cache;
  }

  const [expressRows, terreRows, nac1Rows, nac2Rows, bvRows, ganRows, modRows, formRows, catRows, zonaRows] = await Promise.all([
    query('SELECT kg, precio_bs FROM tarifas_express ORDER BY kg'),
    query('SELECT kg, precio_bs FROM tarifas_terrestre ORDER BY kg'),
    query('SELECT kg, precio_bs FROM nacional_op1 ORDER BY kg'),
    query('SELECT kg, precio_bs FROM nacional_op2 ORDER BY kg'),
    query('SELECT hasta_cm, precio_bs FROM tramos_boa_vista ORDER BY id'),
    query('SELECT hasta_kg, usd_kg FROM tramos_ganancia ORDER BY id'),
    query('SELECT modalidad, clave, valor FROM modalidades ORDER BY modalidad, clave'),
    query('SELECT clave, valor FROM formulas'),
    query('SELECT tipo, categoria FROM categorias ORDER BY tipo, categoria'),
    query('SELECT tipo, ciudad FROM zonas ORDER BY tipo, ciudad')
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

  const CATEGORIAS_SOLO_AEREO = [];
  const CATEGORIAS_TERRESTRE = [];
  const CATEGORIAS_NEUTRAS = [];
  for (const r of catRows.rows) {
    const cat = r.categoria.toLowerCase().trim();
    if (r.tipo === 'SOLO_AEREO') CATEGORIAS_SOLO_AEREO.push(cat);
    else if (r.tipo === 'TERRESTRE') CATEGORIAS_TERRESTRE.push(cat);
    else if (r.tipo === 'NEUTRAS') CATEGORIAS_NEUTRAS.push(cat);
  }

  const ZONA_BASE = [];
  const ORIGENES_PROHIBIDOS = [];
  for (const r of zonaRows.rows) {
    const ciudad = r.ciudad;
    if (r.tipo === 'BASE') ZONA_BASE.push(ciudad);
    else if (r.tipo === 'PROHIBIDO') ORIGENES_PROHIBIDOS.push(ciudad);
  }

  const config = {
    TABLA_EXPRESS, TABLA_TERRESTRE, TABLA_NACIONAL_OP1, TABLA_NACIONAL_OP2,
    TRAMOS_BOA_VISTA, TRAMOS_GANANCIA, MODALIDADES, FORMULAS,
    CATEGORIAS_SOLO_AEREO, CATEGORIAS_TERRESTRE, CATEGORIAS_NEUTRAS,
    ZONA_BASE, ORIGENES_PROHIBIDOS
  };

  cache = config;
  cacheTimestamp = now;
  return config;
}

export function invalidateCache() {
  cache = null;
  cacheTimestamp = 0;
}
