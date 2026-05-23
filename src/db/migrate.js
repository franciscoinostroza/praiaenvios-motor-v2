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
