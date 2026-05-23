import { query } from '../db/pool.js';

const LEVELS = { INFO: 1, WARN: 2, ERROR: 3, DEBUG: 4 };

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export function log(level, message, ctx, contacto) {
  const ts = formatTimestamp();
  const prefix = `[${ts}] [${level}]`;
  const line = `${prefix} ${message}${ctx ? ' ' + JSON.stringify(ctx) : ''}${contacto ? ' from:' + contacto : ''}`;

  if (level === 'ERROR') console.error(line);
  else console.log(line);

  if (!level || !message) return;
  try {
    query(
      `INSERT INTO logs (nivel, mensaje, contexto, contacto) VALUES ($1,$2,$3,$4)`,
      [level, message, ctx ? JSON.stringify(ctx) : null, contacto || null]
    ).catch(() => {});
  } catch {}
}
