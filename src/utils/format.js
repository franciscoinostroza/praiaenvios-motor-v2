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

var TEXTOS = {
  es: {
    caja: 'Caja',
    trecho: 'incluye trecho',
    modalidad_aplicada: 'Modalidad aplicada',
    origen_ve: 'Curitiba (salida logística)',
    agencia_default: '* Tu envío será entregado para retiro en la agencia más cercana a tu destino.',
    metodos_br: 'PIX, Zelle, Binance USDT, Tarjeta de Crédito, PayPal',
    metodos_ve: 'Zelle, Binance USDT, Tarjeta de Crédito, PayPal',
    footer: 'Escribe Menú para volver al inicio o dime qué producto, caja o dirección deseas cambiar para cotizar nuevamente.'
  },
  pt: {
    caja: 'Caixa',
    trecho: 'inclui trecho',
    modalidad_aplicada: 'Modalidade aplicada',
    origen_ve: 'Curitiba (saída logística)',
    agencia_default: '* Sua encomenda será entregue para retirada na agência mais próxima do seu destino.',
    metodos_br: 'PIX, Zelle, Binance USDT, Cartão de Crédito, PayPal',
    metodos_ve: 'Zelle, Binance USDT, Cartão de Crédito, PayPal',
    footer: 'Escreva Menu para voltar ao início ou diga qual produto, caixa ou endereço deseja alterar para cotar novamente.'
  },
  en: {
    caja: 'Box',
    trecho: 'includes leg',
    modalidad_aplicada: 'Applied shipping method',
    origen_ve: 'Curitiba (logistics departure)',
    agencia_default: '* Your shipment will be delivered for pickup at the nearest agency to your destination.',
    metodos_br: 'PIX, Zelle, Binance USDT, Credit Card, PayPal',
    metodos_ve: 'Zelle, Binance USDT, Credit Card, PayPal',
    footer: 'Write Menu to go back to the beginning or tell me which product, box or address you want to change to quote again.'
  }
};

export async function formatearMensaje(datos, resultadoMotor) {
  var lang = datos.idioma === 'pt' || datos.idioma === 'en' ? datos.idioma : 'es';
  var t = TEXTOS[lang];

  var total_reales = resultadoMotor.total_final || 0;
  var tasa = resultadoMotor.tasa_dolar;
  var total_usd = (total_reales / tasa).toFixed(2);
  var esVenezuela = datos.tipo_flujo === 'comprando_desde_venezuela';

  var modalidad = resultadoMotor.modalidad
    || (resultadoMotor.cajas && resultadoMotor.cajas.length > 0 ? resultadoMotor.cajas[0].modalidad : undefined);
  var modalidadNombre = { 1: 'Modalidad 1', 2: 'Modalidad 2', 3: 'Modalidad 3', 4: 'Modalidad 4' }[modalidad] || modalidad;

  var origen = esVenezuela
    ? t.origen_ve
    : (datos.origen || '');

  var direccionOrigen = datos.direccion_origen || '';

  var ciudadBaseCalculo = datos.origen_base_calculo || origen;

  var categoria = Array.isArray(datos._categorias_norm)
    ? datos._categorias_norm.join(', ')
    : (datos.categoria || (Array.isArray(datos.categorias) ? datos.categorias.join(', ') : '') || '');

  var cajas = '';
  if (Array.isArray(datos.boxes) && datos.boxes.length > 0) {
    var partes = [];
    for (var i = 0; i < datos.boxes.length; i++) {
      var c = datos.boxes[i];
      partes.push(t.caja + ' ' + (i + 1) + ': ' + c.largo + 'x' + c.ancho + 'x' + c.alto + ' cm, ' + c.peso_bruto + ' kg, R$ ' + c.valor_mercancia);
    }
    cajas = partes.join('\n* ');
  }

  var numeroCajas = Array.isArray(datos.boxes) ? datos.boxes.length : (datos.numero_cajas || 0);
  var detalleCajas = datos.resumen_cajas || '';
  var valorTotalMercancia = datos.valor_total_mercancia || 0;

  var costo = resultadoMotor.costo_nacional || 0;
  var costoFormateado = costo.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  var agencia = '';
  var agenciaTipo = '';
  if (datos.agencia && datos.agencia.direccion) {
    agencia = datos.agencia.direccion;
    agenciaTipo = datos.agencia.tipo === 1 ? '1' : '2';
  } else {
    agencia = t.agencia_default;
  }

  var modalidadTexto = '';
  if (resultadoMotor.cajas && resultadoMotor.cajas.length > 1) {
    for (var j = 0; j < resultadoMotor.cajas.length; j++) {
      var cb = resultadoMotor.cajas[j];
      var modalidadCaja = { 1: 'Modalidad 1', 2: 'Modalidad 2', 3: 'Modalidad 3', 4: 'Modalidad 4' }[cb.modalidad] || cb.nombre_modalidad;
      var trechoTxt = cb.con_trecho ? ' (' + t.trecho + ')' : '';
      modalidadTexto += '* ' + t.caja + ' ' + cb.caja + ': ' + modalidadCaja + ' — R$ ' + cb.total + trechoTxt + '\n';
    }
  } else {
    modalidadTexto = '* ' + t.modalidad_aplicada + ': ' + modalidadNombre;
  }

  var totalTexto = esVenezuela
    ? '* Total en Dólares: $' + total_usd + ' USD'
    : '* Total en Reales: R$ ' + total_reales + '\n* Total en Dólares: $' + total_usd + ' USD';

  var metodosPago = esVenezuela ? t.metodos_ve : t.metodos_br;

  var sufijo = lang === 'es' ? '' : '_' + lang;
  var clave = (esVenezuela ? 'mensaje_domestico_venezuela' : 'mensaje_domestico_brasil') + sufijo;

  var fechaEntrega = resultadoMotor.fecha_entrega || '';

  return await renderizarPlantilla(clave, {
    origen: origen,
    direccion_origen: direccionOrigen,
    ciudad_base_calculo: ciudadBaseCalculo,
    destino: datos.destino_ciudad || '',
    direccion_destino: datos.direccion_destino || '',
    tipo_mercancia: datos.tipo_mercancia || '',
    categoria: categoria,
    cajas: cajas,
    numero_cajas: numeroCajas,
    detalle_cajas: detalleCajas,
    valor_total_mercancia: valorTotalMercancia,
    modalidad: modalidadTexto,
    total: totalTexto,
    total_reales: total_reales,
    total_usd: total_usd,
    tiempo: resultadoMotor.tiempo_entrega || '',
    fecha_entrega: fechaEntrega,
    agencia: agencia,
    agencia_tipo: agenciaTipo,
    costo_nacional: costoFormateado,
    metodos_pago: metodosPago,
    footer: t.footer
  });
}
