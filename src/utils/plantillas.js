import { query } from '../db/pool.js';

const cache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000;

const PLANTILLAS_DEFAULT = {
  mensaje_domestico_brasil: '*Cotización Praia Envíos* 🇧🇷➡️🇻🇪\n\n\
🔎 *DATOS DEL ENVÍO*\n\
• Origen: {{origen}}{{#if destino}}\n\
• Destino: {{destino}}{{/if}}{{#if direccion_destino}}\n\
• Dirección destino: {{direccion_destino}}{{/if}}{{#if tipo_mercancia}}\n\
• Tipo de mercancía: {{tipo_mercancia}}{{/if}}\n\
• Categoría: {{categoria}}{{#if cajas}}\n\
• {{cajas}}{{/if}}\n\n\
🚀 *MODALIDAD*\n\
{{modalidad}}\n\n\
💰 *RESULTADO FINAL*\n\
• Total: R$ {{total_reales}}\n\
• Equivalente: ${{total_usd}} USD\n\n\
📦 *TIEMPO DE ENTREGA*\n\
• Tiempo estimado: {{tiempo}}{{#if fecha_entrega}}\n\
• Fecha estimada de entrega: {{fecha_entrega}}{{/if}}\n\n\
📍 *ENTREGA EN VENEZUELA*\n\
{{agencia}}\n\n\
🇻🇪 *COSTO NACIONAL*\n\
• Costo nacional aproximado: Bs {{costo_nacional}}\n\n\
💳 *MÉTODOS DE PAGO:* {{metodos_pago}}\n\n\
{{footer}}',

  mensaje_domestico_venezuela: '*Cotización Praia Envíos* 🇧🇷➡️🇻🇪\n\n\
🔎 *DATOS DEL ENVÍO*\n\
• Origen: {{origen}}{{#if destino}}\n\
• Destino: {{destino}}{{/if}}{{#if direccion_destino}}\n\
• Dirección destino: {{direccion_destino}}{{/if}}{{#if tipo_mercancia}}\n\
• Tipo de mercancía: {{tipo_mercancia}}{{/if}}\n\
• Categoría: {{categoria}}{{#if cajas}}\n\
• {{cajas}}{{/if}}\n\n\
🚀 *MODALIDAD*\n\
{{modalidad}}\n\n\
💰 *RESULTADO FINAL*\n\
{{total}}\n\n\
📦 *TIEMPO DE ENTREGA*\n\
• Tiempo estimado: {{tiempo}}{{#if fecha_entrega}}\n\
• Fecha estimada de entrega: {{fecha_entrega}}{{/if}}\n\n\
📍 *ENTREGA EN VENEZUELA*\n\
{{agencia}}\n\n\
🇻🇪 *COSTO NACIONAL*\n\
• Costo nacional aproximado: Bs {{costo_nacional}}\n\n\
💳 *MÉTODOS DE PAGO:* {{metodos_pago}}\n\n\
{{footer}}',

  mensaje_internacional: '*Cotización Internacional* 🌎\n\n\
{{origen_linea}}\n\
{{destino_linea}}\n\
{{paquete}}{{#if opciones_envio}}\n\n\
*OPCIONES DE ENVÍO*\n\
{{opciones_envio}}{{/if}}{{#if sin_cotizaciones}}\n\
{{sin_cotizaciones}}{{/if}}\n\n\
💳 *MÉTODOS DE PAGO:* {{metodos_pago}}\n\n\
{{footer}}'
};

export { PLANTILLAS_DEFAULT };

export function invalidarPlantillasCache() {
  cache.clear();
  cacheTimestamp = 0;
}

async function cargarPlantilla(clave) {
  const ahora = Date.now();
  const cached = cache.get(clave);
  if (cached !== undefined && (ahora - cacheTimestamp) < CACHE_TTL_MS) {
    return cached;
  }

  let valor;
  try {
    const result = await query('SELECT valor FROM plantillas_mensajes WHERE clave = $1', [clave]);
    if (result.rows.length > 0 && result.rows[0].valor) {
      valor = result.rows[0].valor;
    }
  } catch {}

  if (valor == null) {
    valor = PLANTILLAS_DEFAULT[clave];
    if (valor == null) return '';
  }

  cache.set(clave, valor);
  cacheTimestamp = ahora;
  return valor;
}

export async function renderizarPlantilla(clave, variables) {
  const template = await cargarPlantilla(clave);
  if (!template) return '';

  let result = template;

  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, name, content) => {
    const val = variables[name];
    return (val != null && val !== '' && val !== false) ? content : '';
  });

  result = result.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    const val = variables[name];
    return (val != null && val !== false) ? String(val) : '';
  });

  return result;
}
