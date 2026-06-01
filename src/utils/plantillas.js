import { query } from '../db/pool.js';

const cache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000;

const PLANTILLAS_DEFAULT = {
  /* ─── ESPAÑOL ─── */
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
• Costo nacional aproximado: Bs {{costo_nacional}}\n\
Este costo deberás pagarlo en Venezuela a tasa oficial del Banco Central de Venezuela y lo pagarás a la empresa local que realizará el transporte, ya que no te cobramos este trecho en reales. De esa forma ahorras pagando en moneda local, bolívares.\n\n\
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
• Costo nacional aproximado: Bs {{costo_nacional}}\n\
Este costo deberás pagarlo en Venezuela a tasa oficial del Banco Central de Venezuela y lo pagarás a la empresa local que realizará el transporte, ya que no te cobramos este trecho en reales. De esa forma ahorras pagando en moneda local, bolívares.\n\n\
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
{{footer}}',

  /* ─── PORTUGUÊS ─── */
  mensaje_domestico_brasil_pt: '*Cotação Praia Envíos* 🇧🇷➡️🇻🇪\n\n\
🔎 *DADOS DO ENVIO*\n\
• Origem: {{origen}}{{#if destino}}\n\
• Destino: {{destino}}{{/if}}{{#if direccion_destino}}\n\
• Endereço destino: {{direccion_destino}}{{/if}}{{#if tipo_mercancia}}\n\
• Tipo de mercadoria: {{tipo_mercancia}}{{/if}}\n\
• Categoria: {{categoria}}{{#if cajas}}\n\
• {{cajas}}{{/if}}\n\n\
🚀 *MODALIDADE*\n\
{{modalidad}}\n\n\
💰 *RESULTADO FINAL*\n\
• Total: R$ {{total_reales}}\n\
• Equivalente: ${{total_usd}} USD\n\n\
📦 *PRAZO DE ENTREGA*\n\
• Prazo estimado: {{tiempo}}{{#if fecha_entrega}}\n\
• Data prevista de entrega: {{fecha_entrega}}{{/if}}\n\n\
📍 *ENTREGA NA VENEZUELA*\n\
{{agencia}}\n\n\
🇻🇪 *CUSTO NACIONAL*\n\
• Custo nacional aproximado: Bs {{costo_nacional}}\n\
Este custo deverá ser pago na Venezuela com a taxa oficial do Banco Central da Venezuela e você pagará à empresa local que realizará o transporte, já que não cobramos este trecho em reais. Dessa forma você economiza pagando em moeda local, bolívares.\n\n\
💳 *MÉTODOS DE PAGAMENTO:* {{metodos_pago}}\n\n\
{{footer}}',

  mensaje_domestico_venezuela_pt: '*Cotação Praia Envíos* 🇧🇷➡️🇻🇪\n\n\
🔎 *DADOS DO ENVIO*\n\
• Origem: {{origen}}{{#if destino}}\n\
• Destino: {{destino}}{{/if}}{{#if direccion_destino}}\n\
• Endereço destino: {{direccion_destino}}{{/if}}{{#if tipo_mercancia}}\n\
• Tipo de mercadoria: {{tipo_mercancia}}{{/if}}\n\
• Categoria: {{categoria}}{{#if cajas}}\n\
• {{cajas}}{{/if}}\n\n\
🚀 *MODALIDADE*\n\
{{modalidad}}\n\n\
💰 *RESULTADO FINAL*\n\
{{total}}\n\n\
📦 *PRAZO DE ENTREGA*\n\
• Prazo estimado: {{tiempo}}{{#if fecha_entrega}}\n\
• Data prevista de entrega: {{fecha_entrega}}{{/if}}\n\n\
📍 *ENTREGA NA VENEZUELA*\n\
{{agencia}}\n\n\
🇻🇪 *CUSTO NACIONAL*\n\
• Custo nacional aproximado: Bs {{costo_nacional}}\n\
Este custo deverá ser pago na Venezuela com a taxa oficial do Banco Central da Venezuela e você pagará à empresa local que realizará o transporte, já que não cobramos este trecho em reais. Dessa forma você economiza pagando em moeda local, bolívares.\n\n\
💳 *MÉTODOS DE PAGAMENTO:* {{metodos_pago}}\n\n\
{{footer}}',

  mensaje_internacional_pt: '*Cotação Internacional* 🌎\n\n\
{{origen_linea}}\n\
{{destino_linea}}\n\
{{paquete}}{{#if opciones_envio}}\n\n\
*OPÇÕES DE ENVIO*\n\
{{opciones_envio}}{{/if}}{{#if sin_cotizaciones}}\n\
{{sin_cotizaciones}}{{/if}}\n\n\
💳 *MÉTODOS DE PAGAMENTO:* {{metodos_pago}}\n\n\
{{footer}}',

  /* ─── ENGLISH ─── */
  mensaje_domestico_brasil_en: '*Praia Envíos Quote* 🇧🇷➡️🇻🇪\n\n\
🔎 *SHIPMENT DETAILS*\n\
• Origin: {{origen}}{{#if destino}}\n\
• Destination: {{destino}}{{/if}}{{#if direccion_destino}}\n\
• Destination address: {{direccion_destino}}{{/if}}{{#if tipo_mercancia}}\n\
• Type of goods: {{tipo_mercancia}}{{/if}}\n\
• Category: {{categoria}}{{#if cajas}}\n\
• {{cajas}}{{/if}}\n\n\
🚀 *SHIPPING METHOD*\n\
{{modalidad}}\n\n\
💰 *FINAL RESULT*\n\
• Total: R$ {{total_reales}}\n\
• Equivalent: ${{total_usd}} USD\n\n\
📦 *DELIVERY TIME*\n\
• Estimated time: {{tiempo}}{{#if fecha_entrega}}\n\
• Estimated delivery date: {{fecha_entrega}}{{/if}}\n\n\
📍 *DELIVERY IN VENEZUELA*\n\
{{agencia}}\n\n\
🇻🇪 *NATIONAL COST*\n\
• Approximate national cost: Bs {{costo_nacional}}\n\
This cost must be paid in Venezuela at the official exchange rate of the Central Bank of Venezuela and you will pay it to the local company that will carry out the transport, since we do not charge this leg in reais. This way you save by paying in local currency, bolívars.\n\n\
💳 *PAYMENT METHODS:* {{metodos_pago}}\n\n\
{{footer}}',

  mensaje_domestico_venezuela_en: '*Praia Envíos Quote* 🇧🇷➡️🇻🇪\n\n\
🔎 *SHIPMENT DETAILS*\n\
• Origin: {{origen}}{{#if destino}}\n\
• Destination: {{destino}}{{/if}}{{#if direccion_destino}}\n\
• Destination address: {{direccion_destino}}{{/if}}{{#if tipo_mercancia}}\n\
• Type of goods: {{tipo_mercancia}}{{/if}}\n\
• Category: {{categoria}}{{#if cajas}}\n\
• {{cajas}}{{/if}}\n\n\
🚀 *SHIPPING METHOD*\n\
{{modalidad}}\n\n\
💰 *FINAL RESULT*\n\
{{total}}\n\n\
📦 *DELIVERY TIME*\n\
• Estimated time: {{tiempo}}{{#if fecha_entrega}}\n\
• Estimated delivery date: {{fecha_entrega}}{{/if}}\n\n\
📍 *DELIVERY IN VENEZUELA*\n\
{{agencia}}\n\n\
🇻🇪 *NATIONAL COST*\n\
• Approximate national cost: Bs {{costo_nacional}}\n\
This cost must be paid in Venezuela at the official exchange rate of the Central Bank of Venezuela and you will pay it to the local company that will carry out the transport, since we do not charge this leg in reais. This way you save by paying in local currency, bolívars.\n\n\
💳 *PAYMENT METHODS:* {{metodos_pago}}\n\n\
{{footer}}',

  mensaje_internacional_en: '*International Quote* 🌎\n\n\
{{origen_linea}}\n\
{{destino_linea}}\n\
{{paquete}}{{#if opciones_envio}}\n\n\
*SHIPPING OPTIONS*\n\
{{opciones_envio}}{{/if}}{{#if sin_cotizaciones}}\n\
{{sin_cotizaciones}}{{/if}}\n\n\
💳 *PAYMENT METHODS:* {{metodos_pago}}\n\n\
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
