function extractShippoParams(datos) {
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

function formatearMensajeShippo(datos, resultado) {
  const rates = resultado.rates || [];
  const paisOrigen = (datos.pais_origen || 'BR').toUpperCase();
  const paisDestino = (datos.pais_destino || '').toUpperCase();

  let msg = '*Cotización Internacional* 🌎\n\n';
  msg += `Origen: ${bandera(paisOrigen)} ${paisOrigen}${datos.ciudad_origen ? ', ' + datos.ciudad_origen : ''}${datos.codigo_postal_origen ? ' - ' + datos.codigo_postal_origen : ''}\n`;
  msg += `Destino: ${bandera(paisDestino)} ${paisDestino}${datos.ciudad_destino ? ', ' + datos.ciudad_destino : ''}${datos.codigo_postal_destino ? ' - ' + datos.codigo_postal_destino : ''}\n`;

  if (Array.isArray(datos.boxes) && datos.boxes.length > 0) {
    const partes = [];
    for (let i = 0; i < datos.boxes.length; i++) {
      const c = datos.boxes[i];
      partes.push(`Caja ${i + 1}: ${c.largo}x${c.ancho}x${c.alto} cm, ${c.peso_bruto} kg${c.valor_mercancia ? ', R$ ' + c.valor_mercancia : ''}`);
    }
    msg += 'Paquete: ' + partes.join(' | ') + '\n';
  }

  if (rates.length === 0) {
    msg += '\nNo se encontraron cotizaciones para esta ruta.\n';
    msg += '\n_Escribe *Menú* para volver al inicio._';
    return msg;
  }

  msg += '\n*OPCIONES DE ENVÍO*\n';

  for (let i = 0; i < Math.min(rates.length, 5); i++) {
    const r = rates[i];
    const dias = r.days ? ` (~${r.days} días)` : '';
    msg += `\n${r.provider} — ${r.service}\n`;
    msg += `  💰 ${r.currency} ${r.amount}${dias}\n`;
  }

  msg += '\n💳 *MÉTODOS DE PAGO:* PIX, Zelle, Binance USDT, Tarjeta, PayPal\n';
  msg += '\n_Escribe *Menú* para volver al inicio._';

  return msg;
}

export { extractShippoParams, formatearMensajeShippo };
