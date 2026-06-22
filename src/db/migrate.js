import { query } from './pool.js';

const TABLES = `

CREATE TABLE IF NOT EXISTS tarifas_express (
  kg INTEGER PRIMARY KEY,
  precio_bs NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tarifas_terrestre (
  kg INTEGER PRIMARY KEY,
  precio_bs NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS nacional_op1 (
  kg INTEGER PRIMARY KEY,
  precio_bs NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS nacional_op2 (
  kg INTEGER PRIMARY KEY,
  precio_bs NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tramos_boa_vista (
  id SERIAL PRIMARY KEY,
  hasta_cm INTEGER,
  precio_bs NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tramos_ganancia (
  id SERIAL PRIMARY KEY,
  hasta_kg INTEGER,
  usd_kg NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS modalidades (
  id SERIAL PRIMARY KEY,
  modalidad VARCHAR(30) NOT NULL,
  clave VARCHAR(30) NOT NULL,
  valor TEXT NOT NULL,
  UNIQUE(modalidad, clave)
);

CREATE TABLE IF NOT EXISTS formulas (
  clave VARCHAR(50) PRIMARY KEY,
  valor NUMERIC(20,10) NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  UNIQUE(tipo, categoria)
);

CREATE TABLE IF NOT EXISTS zonas (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  UNIQUE(tipo, ciudad)
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  nivel VARCHAR(10) NOT NULL,
  mensaje TEXT NOT NULL,
  contexto JSONB,
  contacto VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at DESC);

CREATE TABLE IF NOT EXISTS cache_urls (
  url VARCHAR(2048) PRIMARY KEY,
  resultado JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_urls_created ON cache_urls(created_at);

CREATE TABLE IF NOT EXISTS prompts_config (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_cache (
  cache_key TEXT PRIMARY KEY,
  resultado JSONB NOT NULL,
  criado_en TIMESTAMPTZ DEFAULT NOW(),
  expira_en TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS idx_rate_cache_expira ON rate_cache(expira_en);

CREATE TABLE IF NOT EXISTS plantillas_mensajes (
  clave VARCHAR(50) PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categoria_servicios (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  servicio VARCHAR(10) NOT NULL,
  estado VARCHAR(10) NOT NULL DEFAULT 'verde',
  documentacion TEXT DEFAULT '',
  UNIQUE(categoria, servicio)
);

CREATE TABLE IF NOT EXISTS mapeo_categorias (
  termino VARCHAR(200) PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  restricciones TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS trechos_config (
  ciudad VARCHAR(100) PRIMARY KEY,
  codigo_iata VARCHAR(10) NOT NULL,
  direccion_latam TEXT NOT NULL DEFAULT '',
  tiempo_adicional_dias INTEGER NOT NULL DEFAULT 5,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS config_texto (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL DEFAULT ''
);

`;

async function migrate() {
  const statements = TABLES.split(';').filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    await query(stmt);
  }
  console.log('[migrate] tablas creadas correctamente');
  process.exit(0);
}

migrate().catch(err => {
  console.error('[migrate] error:', err.message);
  process.exit(1);
});
