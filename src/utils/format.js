import { normalizarCategoriasConIA } from './categories.js';

export async function extractMotorParams(datos) {
  var origen = datos.tipo_flujo === 'comprando_desde_venezuela'
    ? 'Curitiba'
    : (datos.origen || 'Curitiba');

  var categorias = [];
  if (Array.isArray(datos.categorias) && datos.categorias.length > 0) {
    categorias = datos.categorias;
  } else if (datos.categoria) {
    categorias = datos.categoria.split(',').map(function(c) { return c.trim(); }).filter(Boolean);
  } else {
    categorias = ['general'];
  }

  categorias = await normalizarCategoriasConIA(categorias);
  datos._categorias_norm = categorias;

  var boxes = datos.boxes || datos.cajas || [];

  if (boxes.length === 0 && datos.peso_bruto) {
    boxes = [{
      peso_bruto:     datos.peso_bruto,
      largo:          datos.largo,
      ancho:          datos.ancho,
      alto:           datos.alto,
      valor_mercancia: datos.valor_mercancia
    }];
  }

  return {
    boxes:          boxes,
    tipo_mercancia: datos.tipo_mercancia || 'personal',
    categorias:     categorias,
    ciudad_origen:  origen
  };
}

export function formatearMensaje(datos, resultadoMotor) {
  var total_reales = resultadoMotor.total_final || 0;
  var tasa = resultadoMotor.tasa_dolar;
  var total_usd = (total_reales / tasa).toFixed(2);

  var modalidad = resultadoMotor.modalidad
    || (resultadoMotor.cajas && resultadoMotor.cajas.length > 0 ? resultadoMotor.cajas[0].modalidad : undefined);
  var modalidadNombre = { 1: 'Modalidad 1', 2: 'Modalidad 2', 3: 'Modalidad 3', 4: 'Modalidad 4' }[modalidad] || modalidad;

  var origen = datos.tipo_flujo === 'comprando_desde_venezuela'
    ? 'Curitiba (salida logística)'
    : (datos.origen || '');

  var categoria = Array.isArray(datos._categorias_norm)
    ? datos._categorias_norm.join(', ')
    : (datos.categoria || (Array.isArray(datos.categorias) ? datos.categorias.join(', ') : '') || '');
  var tipoMer = datos.tipo_mercancia || '';

  var cajasInfo = '';
  if (Array.isArray(datos.boxes) && datos.boxes.length > 0) {
    var partes = [];
    for (var i = 0; i < datos.boxes.length; i++) {
      var c = datos.boxes[i];
      partes.push('Caja ' + (i + 1) + ': ' + c.largo + 'x' + c.ancho + 'x' + c.alto + ' cm, ' + c.peso_bruto + ' kg, R$ ' + c.valor_mercancia);
    }
    cajasInfo = partes.join('\n');
  }

  var costo = resultadoMotor.costo_nacional || 0;
  var costoFormateado = costo.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  var agenciaInfo = '';
  if (datos.agencia && datos.agencia.direccion) {
    agenciaInfo = '• ' + datos.agencia.direccion + ' (' + (datos.agencia.tipo === 1 ? '1' : '2') + ')\n';
  }

  var msg = '*Cotización Praia Envíos* 🇧🇷➡️🇻🇪\n\n';
  msg += '🔎 *DATOS DEL ENVÍO*\n';
  if (origen) msg += '• Origen: ' + origen + '\n';
  if (datos.destino_ciudad) msg += '• Destino: ' + datos.destino_ciudad + '\n';
  if (datos.direccion_destino) msg += '• Dirección destino: ' + datos.direccion_destino + '\n';
  if (tipoMer) msg += '• Tipo de mercancía: ' + tipoMer + '\n';
  if (categoria) msg += '• Categoría: ' + categoria + '\n';
  if (cajasInfo) msg += '• ' + cajasInfo.replace(/\n/g, '\n• ') + '\n';
  msg += '\n🚀 *MODALIDAD*\n';
  if (resultadoMotor.cajas && resultadoMotor.cajas.length > 1) {
    for (var j = 0; j < resultadoMotor.cajas.length; j++) {
      var cb = resultadoMotor.cajas[j];
      var modalidadCaja = { 1: 'Modalidad 1', 2: 'Modalidad 2', 3: 'Modalidad 3', 4: 'Modalidad 4' }[cb.modalidad] || cb.nombre_modalidad;
      var trechoTxt = cb.con_trecho ? ' (incluye trecho)' : '';
      msg += '• Caja ' + cb.caja + ': ' + modalidadCaja + ' — R$ ' + cb.total + trechoTxt + '\n';
    }
  } else {
    msg += '• Modalidad aplicada: ' + modalidadNombre + '\n';
  }
  msg += '\n💰 *RESULTADO FINAL*\n';
  if (datos.tipo_flujo === 'comprando_desde_venezuela') {
    msg += '• Total: $' + total_usd + ' USD\n';
  } else {
    msg += '• Total: R$ ' + total_reales + '\n';
    msg += '• Equivalente: $' + total_usd + ' USD\n';
  }
  msg += '\n📦 *TIEMPO DE ENTREGA*\n';
  msg += '• Tiempo estimado: ' + (resultadoMotor.tiempo_entrega || '') + '\n';
  if (resultadoMotor.fecha_entrega) msg += '• Fecha estimada de entrega: ' + resultadoMotor.fecha_entrega + '\n';
  msg += '\n📍 *ENTREGA EN VENEZUELA*\n';
  if (agenciaInfo) {
    msg += agenciaInfo;
  } else {
    msg += '• Tu envío será entregado para retiro en la agencia más cercana a tu destino.\n';
  }
  msg += '\n🇻🇪 *COSTO NACIONAL*\n';
  msg += '• Costo nacional aproximado: Bs ' + costoFormateado + '\n';
  if (datos.tipo_flujo === 'comprando_desde_venezuela') {
    msg += '\n💳 *MÉTODOS DE PAGO:* Zelle, Binance USDT, Tarjeta, PayPal\n';
  } else {
    msg += '\n💳 *MÉTODOS DE PAGO:* PIX, Zelle, Binance USDT, Tarjeta, PayPal\n';
  }
  msg += '\n_Escribe *Menú* para volver al inicio._';

  return msg;
}
