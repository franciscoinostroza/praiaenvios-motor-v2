import { renderizarPlantilla } from './plantillas.js';

function extractUpsParams(datos) {
  const paisOrigen = datos.pais_origen || 'BR';
  const paisDestino = datos.pais_destino || '';
  const boxes = datos.boxes || datos.cajas || [];

  const address_from = { country: paisOrigen };
  const address_to = { country: paisDestino };

  if (datos.codigo_postal_origen) address_from.zip = datos.codigo_postal_origen;
  if (datos.codigo_postal_destino) address_to.zip = datos.codigo_postal_destino;
  if (datos.ciudad_origen) address_from.city = datos.ciudad_origen;
  if (datos.ciudad_destino) address_to.city = datos.ciudad_destino;
  if (datos.estado_origen) address_from.state = datos.estado_origen;
  if (datos.estado_destino) address_to.state = datos.estado_destino;
  if (datos.nombre_origen) address_from.name = datos.nombre_origen;
  if (datos.nombre_destino) address_to.name = datos.nombre_destino;

  const parcels = [];
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    parcels.push({
      length: String(b.largo || 30),
      width: String(b.ancho || 20),
      height: String(b.alto || 15),
      distance_unit: 'cm',
      weight: String(b.peso_bruto || 1),
      mass_unit: 'kg'
    });
  }

  if (parcels.length === 0) {
    parcels.push({
      length: '30',
      width: '20',
      height: '15',
      distance_unit: 'cm',
      weight: '1',
      mass_unit: 'kg'
    });
  }

  return { address_from, address_to, parcels };
}

const BANDERAS = {
  'BR': '🇧🇷', 'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪', 'CO': '🇨🇴',
  'EC': '🇪🇨', 'BO': '🇧🇴', 'PY': '🇵🇾', 'UY': '🇺🇾', 'MX': '🇲🇽',
  'PA': '🇵🇦', 'CR': '🇨🇷', 'DO': '🇩🇴', 'GT': '🇬🇹', 'SV': '🇸🇻',
  'HN': '🇭🇳', 'NI': '🇳🇮', 'VE': '🇻🇪'
};

function bandera(codigo) {
  return BANDERAS[codigo?.toUpperCase()] || '🌎';
}

function escogerTextosUps(lang) {
  if (lang === 'pt') return {
    origen: 'Origem',
    destino: 'Destino',
    caja: 'Caixa',
    paquete: 'Pacote',
    sin_cot: 'Nenhuma cotação encontrada para esta rota.',
    dias: 'dias',
    metodos: 'PIX, Zelle, Binance USDT, Cartão, PayPal',
    footer: '_Escreva *Menu* para voltar ao início._'
  };
  if (lang === 'en') return {
    origen: 'Origin',
    destino: 'Destination',
    caja: 'Box',
    paquete: 'Package',
    sin_cot: 'No quotes found for this route.',
    dias: 'days',
    metodos: 'PIX, Zelle, Binance USDT, Card, PayPal',
    footer: '_Write *Menu* to go back to the start._'
  };
  return {
    origen: 'Origen',
    destino: 'Destino',
    caja: 'Caja',
    paquete: 'Paquete',
    sin_cot: 'No se encontraron cotizaciones para esta ruta.',
    dias: 'días',
    metodos: 'PIX, Zelle, Binance USDT, Tarjeta de Crédito, PayPal',
    footer: '_Escribe *Menú* para volver al inicio._'
  };
}

async function formatearMensajeUps(datos, resultado) {
  var lang = datos.idioma === 'pt' || datos.idioma === 'en' ? datos.idioma : 'es';
  var t = escogerTextosUps(lang);

  const rates = resultado.rates || [];
  const paisOrigen = (datos.pais_origen || 'BR').toUpperCase();
  const paisDestino = (datos.pais_destino || '').toUpperCase();

  var origenLinea = t.origen + ': ' + bandera(paisOrigen) + ' ' + paisOrigen + (datos.ciudad_origen ? ', ' + datos.ciudad_origen : '') + (datos.codigo_postal_origen ? ' - ' + datos.codigo_postal_origen : '');
  var destinoLinea = t.destino + ': ' + bandera(paisDestino) + ' ' + paisDestino + (datos.ciudad_destino ? ', ' + datos.ciudad_destino : '') + (datos.codigo_postal_destino ? ' - ' + datos.codigo_postal_destino : '');

  var paquete = '';
  if (Array.isArray(datos.boxes) && datos.boxes.length > 0) {
    const partes = [];
    for (let i = 0; i < datos.boxes.length; i++) {
      const c = datos.boxes[i];
      partes.push(t.caja + ' ' + (i + 1) + ': ' + c.largo + 'x' + c.ancho + 'x' + c.alto + ' cm, ' + c.peso_bruto + ' kg' + (c.valor_mercancia ? ', R$ ' + c.valor_mercancia : ''));
    }
    paquete = t.paquete + ': ' + partes.join(' | ');
  }

  var opcionesEnvio = '';
  var sinCotizaciones = '';
  if (rates.length === 0) {
    sinCotizaciones = t.sin_cot;
  } else {
    for (let i = 0; i < Math.min(rates.length, 5); i++) {
      const r = rates[i];
      const dias = r.days ? ' (~' + r.days + ' ' + t.dias + ' apróx.)' : '';
      opcionesEnvio += '🇺🇸 UPS — ' + r.service + '\n';
      opcionesEnvio += '  💰 ' + r.currency + ' ' + r.amount + dias + '\n';
      if (i < Math.min(rates.length, 5) - 1) opcionesEnvio += '\n';
    }
  }

  var sufijo = lang === 'es' ? '' : '_' + lang;

  return await renderizarPlantilla('mensaje_internacional' + sufijo, {
    origen_linea: origenLinea,
    destino_linea: destinoLinea,
    paquete: paquete,
    opciones_envio: opcionesEnvio,
    sin_cotizaciones: sinCotizaciones,
    metodos_pago: t.metodos,
    footer: t.footer
  });
}

export { extractUpsParams, formatearMensajeUps };
