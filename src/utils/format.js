import { normalizarCategoriasConIA } from './categories.js';
import { renderizarPlantilla } from './plantillas.js';

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

export async function formatearMensaje(datos, resultadoMotor) {
  var total_reales = resultadoMotor.total_final || 0;
  var tasa = resultadoMotor.tasa_dolar;
  var total_usd = (total_reales / tasa).toFixed(2);
  var esVenezuela = datos.tipo_flujo === 'comprando_desde_venezuela';

  var modalidad = resultadoMotor.modalidad
    || (resultadoMotor.cajas && resultadoMotor.cajas.length > 0 ? resultadoMotor.cajas[0].modalidad : undefined);
  var modalidadNombre = { 1: 'Modalidad 1', 2: 'Modalidad 2', 3: 'Modalidad 3', 4: 'Modalidad 4' }[modalidad] || modalidad;

  var origen = esVenezuela
    ? 'Curitiba (salida logística)'
    : (datos.origen || '');

  var categoria = Array.isArray(datos._categorias_norm)
    ? datos._categorias_norm.join(', ')
    : (datos.categoria || (Array.isArray(datos.categorias) ? datos.categorias.join(', ') : '') || '');

  var cajas = '';
  if (Array.isArray(datos.boxes) && datos.boxes.length > 0) {
    var partes = [];
    for (var i = 0; i < datos.boxes.length; i++) {
      var c = datos.boxes[i];
      partes.push('Caja ' + (i + 1) + ': ' + c.largo + 'x' + c.ancho + 'x' + c.alto + ' cm, ' + c.peso_bruto + ' kg, R$ ' + c.valor_mercancia);
    }
    cajas = partes.join('\n• ');
  }

  var costo = resultadoMotor.costo_nacional || 0;
  var costoFormateado = costo.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  var agencia = '';
  if (datos.agencia && datos.agencia.direccion) {
    agencia = '• ' + datos.agencia.direccion + ' (' + (datos.agencia.tipo === 1 ? '1' : '2') + ')';
  } else {
    agencia = '• Tu envío será entregado para retiro en la agencia más cercana a tu destino.';
  }

  var modalidadTexto = '';
  if (resultadoMotor.cajas && resultadoMotor.cajas.length > 1) {
    for (var j = 0; j < resultadoMotor.cajas.length; j++) {
      var cb = resultadoMotor.cajas[j];
      var modalidadCaja = { 1: 'Modalidad 1', 2: 'Modalidad 2', 3: 'Modalidad 3', 4: 'Modalidad 4' }[cb.modalidad] || cb.nombre_modalidad;
      var trechoTxt = cb.con_trecho ? ' (incluye trecho)' : '';
      modalidadTexto += '• Caja ' + cb.caja + ': ' + modalidadCaja + ' — R$ ' + cb.total + trechoTxt + '\n';
    }
  } else {
    modalidadTexto = '• Modalidad aplicada: ' + modalidadNombre;
  }

  var totalTexto = esVenezuela
    ? '• Total: $' + total_usd + ' USD'
    : '• Total: R$ ' + total_reales + '\n• Equivalente: $' + total_usd + ' USD';

  var metodosPago = esVenezuela
    ? 'Zelle, Binance USDT, Tarjeta, PayPal'
    : 'PIX, Zelle, Binance USDT, Tarjeta, PayPal';

  var clave = esVenezuela ? 'mensaje_domestico_venezuela' : 'mensaje_domestico_brasil';

  var fechaEntrega = resultadoMotor.fecha_entrega || '';

  var footer = '_Escribe *Menú* para volver al inicio._';

  return await renderizarPlantilla(clave, {
    origen: origen,
    destino: datos.destino_ciudad || '',
    direccion_destino: datos.direccion_destino || '',
    tipo_mercancia: datos.tipo_mercancia || '',
    categoria: categoria,
    cajas: cajas,
    modalidad: modalidadTexto,
    total: totalTexto,
    total_reales: total_reales,
    total_usd: total_usd,
    tiempo: resultadoMotor.tiempo_entrega || '',
    fecha_entrega: fechaEntrega,
    agencia: agencia,
    costo_nacional: costoFormateado,
    metodos_pago: metodosPago,
    footer: footer
  });
}
