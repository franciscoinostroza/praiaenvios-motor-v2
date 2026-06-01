import { query } from '../db/pool.js';

const cache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000;

const PLANTILLAS_DEFAULT = {
  /* ─── ESPAÑOL ─── */
  mensaje_domestico_brasil: '🔎 *DATOS DEL ENVÍO*\n\
* Ciudad de Origen: {{origen}}\n\
* Dirección de Origen: {{direccion_origen}}\n\
* Ciudad Base de Cálculo: {{ciudad_base_calculo}}\n\
* Ciudad de Destino: {{destino}}\n\
* Dirección de Destino: {{direccion_destino}}\n\
* Producto que envías: {{categoria}}\n\
* Tipo de Envío: {{tipo_mercancia}}\n\
* Cantidad de Cajas: {{numero_cajas}}\n\
* Detalle de Cajas: {{detalle_cajas}}\n\
* Valor total declarado: {{valor_total_mercancia}} R$\n\n\
🚀 *MODALIDAD*\n\
* Modalidad aplicada: {{modalidad}}\n\n\
💰 *VALOR A PAGAR*\n\
* Total en Reales: R$ {{total_reales}}\n\
* Total en Dólares: ${{total_usd}} USD\n\n\
📦 *TIEMPO DE ENTREGA*\n\
* Tiempo estimado aproximado: {{tiempo}} días\n\
* Fecha estimada de entrega: {{fecha_entrega}}\n\n\
📍 *DIRECCIÓN DE ENTREGA EN VENEZUELA*\n\
* {{agencia}}{{#if agencia_tipo}} ({{agencia_tipo}}){{/if}}\n\n\
🇻🇪 *COSTO NACIONAL*\n\
* Costo nacional aproximado: Bs {{costo_nacional}}\n\
Este costo deberás pagarlo en Venezuela a tasa oficial del Banco Central de Venezuela y lo pagarás a la empresa local que realizará el transporte, ya que no te cobramos este trecho en reales. De esa forma ahorras pagando en moneda local, bolívares.\n\n\
💳 *MÉTODOS DE PAGO*\n\
{{metodos_pago}}\n\n\
{{footer}}',

  mensaje_domestico_venezuela: '🔎 *DATOS DEL ENVÍO*\n\
* Ciudad de Origen: {{origen}}\n\
* Dirección de Origen: {{direccion_origen}}\n\
* Ciudad de Destino: {{destino}}\n\
* Dirección de Destino: {{direccion_destino}}\n\
* Producto que envías: {{categoria}}\n\
* Tipo de Envío: {{tipo_mercancia}}\n\
* Cantidad de Cajas: {{numero_cajas}}\n\
* Detalle de Cajas: {{detalle_cajas}}\n\
* Valor total declarado: {{valor_total_mercancia}} R$\n\n\
🚀 *MODALIDAD*\n\
* Modalidad aplicada: {{modalidad}}\n\n\
💰 *VALOR A PAGAR*\n\
{{total}}\n\n\
📦 *TIEMPO DE ENTREGA*\n\
* Tiempo estimado aproximado: {{tiempo}} días\n\
* Fecha estimada de entrega: {{fecha_entrega}}\n\n\
📍 *DIRECCIÓN DE ENTREGA EN VENEZUELA*\n\
* {{agencia}}{{#if agencia_tipo}} ({{agencia_tipo}}){{/if}}\n\n\
🇻🇪 *COSTO NACIONAL*\n\
* Costo nacional aproximado: Bs {{costo_nacional}}\n\
Este costo deberás pagarlo en Venezuela a tasa oficial del Banco Central de Venezuela y lo pagarás a la empresa local que realizará el transporte, ya que no te cobramos este trecho en reales. De esa forma ahorras pagando en moneda local, bolívares.\n\n\
💳 *MÉTODOS DE PAGO*\n\
{{metodos_pago}}\n\n\
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
  mensaje_domestico_brasil_pt: '🔎 *DADOS DO ENVIO*\n\
* Cidade de Origem: {{origen}}\n\
* Endereço de Origem: {{direccion_origen}}\n\
* Cidade Base de Cálculo: {{ciudad_base_calculo}}\n\
* Cidade de Destino: {{destino}}\n\
* Endereço de Destino: {{direccion_destino}}\n\
* Produto que você envia: {{categoria}}\n\
* Tipo de Envio: {{tipo_mercancia}}\n\
* Quantidade de Caixas: {{numero_cajas}}\n\
* Detalhe das Caixas: {{detalle_cajas}}\n\
* Valor total declarado: {{valor_total_mercancia}} R$\n\n\
🚀 *MODALIDADE*\n\
* Modalidade aplicada: {{modalidad}}\n\n\
💰 *VALOR A PAGAR*\n\
* Total em Reais: R$ {{total_reales}}\n\
* Total em Dólares: ${{total_usd}} USD\n\n\
📦 *PRAZO DE ENTREGA*\n\
* Prazo estimado aproximado: {{tiempo}} dias\n\
* Data estimada de entrega: {{fecha_entrega}}\n\n\
📍 *ENDEREÇO DE ENTREGA NA VENEZUELA*\n\
* {{agencia}}{{#if agencia_tipo}} ({{agencia_tipo}}){{/if}}\n\n\
🇻🇪 *CUSTO NACIONAL*\n\
* Custo nacional aproximado: Bs {{costo_nacional}}\n\
Este custo deverá ser pago na Venezuela pela taxa oficial do Banco Central da Venezuela e será pago à empresa local que realizará o transporte, já que não cobramos esse trecho em reais. Dessa forma, você economiza pagando em moeda local, bolívares.\n\n\
💳 *FORMAS DE PAGAMENTO*\n\
{{metodos_pago}}\n\n\
{{footer}}',

  mensaje_domestico_venezuela_pt: '🔎 *DADOS DO ENVIO*\n\
* Cidade de Origem: {{origen}}\n\
* Endereço de Origem: {{direccion_origen}}\n\
* Cidade de Destino: {{destino}}\n\
* Endereço de Destino: {{direccion_destino}}\n\
* Produto que você envia: {{categoria}}\n\
* Tipo de Envio: {{tipo_mercancia}}\n\
* Quantidade de Caixas: {{numero_cajas}}\n\
* Detalhe das Caixas: {{detalle_cajas}}\n\
* Valor total declarado: {{valor_total_mercancia}} R$\n\n\
🚀 *MODALIDADE*\n\
* Modalidade aplicada: {{modalidad}}\n\n\
💰 *VALOR A PAGAR*\n\
{{total}}\n\n\
📦 *PRAZO DE ENTREGA*\n\
* Prazo estimado aproximado: {{tiempo}} dias\n\
* Data estimada de entrega: {{fecha_entrega}}\n\n\
📍 *ENDEREÇO DE ENTREGA NA VENEZUELA*\n\
* {{agencia}}{{#if agencia_tipo}} ({{agencia_tipo}}){{/if}}\n\n\
🇻🇪 *CUSTO NACIONAL*\n\
* Custo nacional aproximado: Bs {{costo_nacional}}\n\
Este custo deverá ser pago na Venezuela pela taxa oficial do Banco Central da Venezuela e será pago à empresa local que realizará o transporte, já que não cobramos esse trecho em reais. Dessa forma, você economiza pagando em moeda local, bolívares.\n\n\
💳 *FORMAS DE PAGAMENTO*\n\
{{metodos_pago}}\n\n\
{{footer}}',

  mensaje_internacional_pt: '*Cotação Internacional* 🌎\n\n\
{{origen_linea}}\n\
{{destino_linea}}\n\
{{paquete}}{{#if opciones_envio}}\n\n\
*OPÇÕES DE ENVIO*\n\
{{opciones_envio}}{{/if}}{{#if sin_cotizaciones}}\n\
{{sin_cotizaciones}}{{/if}}\n\n\
💳 *FORMAS DE PAGAMENTO:* {{metodos_pago}}\n\n\
{{footer}}',

  /* ─── ENGLISH ─── */
  mensaje_domestico_brasil_en: '🔎 *SHIPMENT DETAILS*\n\
* Origin City: {{origen}}\n\
* Origin Address: {{direccion_origen}}\n\
* Base Calculation City: {{ciudad_base_calculo}}\n\
* Destination City: {{destino}}\n\
* Destination Address: {{direccion_destino}}\n\
* Product you are sending: {{categoria}}\n\
* Shipment Type: {{tipo_mercancia}}\n\
* Number of Boxes: {{numero_cajas}}\n\
* Box Details: {{detalle_cajas}}\n\
* Total declared value: {{valor_total_mercancia}} R$\n\n\
🚀 *MODALITY*\n\
* Applied modality: {{modalidad}}\n\n\
💰 *AMOUNT TO PAY*\n\
* Total in Brazilian Reais: R$ {{total_reales}}\n\
* Total in US Dollars: ${{total_usd}} USD\n\n\
📦 *DELIVERY TIME*\n\
* Approximate estimated time: {{tiempo}} days\n\
* Estimated delivery date: {{fecha_entrega}}\n\n\
📍 *DELIVERY ADDRESS IN VENEZUELA*\n\
* {{agencia}}{{#if agencia_tipo}} ({{agencia_tipo}}){{/if}}\n\n\
🇻🇪 *NATIONAL COST*\n\
* Approximate national cost: Bs {{costo_nacional}}\n\
This cost must be paid in Venezuela at the official rate of the Central Bank of Venezuela and paid to the local company that will handle the domestic transport, since we do not charge this leg in Brazilian reais. This way, you save by paying in local currency, bolivars.\n\n\
💳 *PAYMENT METHODS*\n\
{{metodos_pago}}\n\n\
{{footer}}',

  mensaje_domestico_venezuela_en: '🔎 *SHIPMENT DETAILS*\n\
* Origin City: {{origen}}\n\
* Origin Address: {{direccion_origen}}\n\
* Destination City: {{destino}}\n\
* Destination Address: {{direccion_destino}}\n\
* Product you are sending: {{categoria}}\n\
* Shipment Type: {{tipo_mercancia}}\n\
* Number of Boxes: {{numero_cajas}}\n\
* Box Details: {{detalle_cajas}}\n\
* Total declared value: {{valor_total_mercancia}} R$\n\n\
🚀 *MODALITY*\n\
* Applied modality: {{modalidad}}\n\n\
💰 *AMOUNT TO PAY*\n\
{{total}}\n\n\
📦 *DELIVERY TIME*\n\
* Approximate estimated time: {{tiempo}} days\n\
* Estimated delivery date: {{fecha_entrega}}\n\n\
📍 *DELIVERY ADDRESS IN VENEZUELA*\n\
* {{agencia}}{{#if agencia_tipo}} ({{agencia_tipo}}){{/if}}\n\n\
🇻🇪 *NATIONAL COST*\n\
* Approximate national cost: Bs {{costo_nacional}}\n\
This cost must be paid in Venezuela at the official rate of the Central Bank of Venezuela and paid to the local company that will handle the domestic transport, since we do not charge this leg in Brazilian reais. This way, you save by paying in local currency, bolivars.\n\n\
💳 *PAYMENT METHODS*\n\
{{metodos_pago}}\n\n\
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
