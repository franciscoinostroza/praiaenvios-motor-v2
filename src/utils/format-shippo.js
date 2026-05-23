function extractShippoParams(datos) {
  const paisOrigen = datos.pais_origen || 'BR';
  const paisDestino = datos.pais_destino || '';
  const boxes = datos.boxes || datos.cajas || [];

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

  return {
    address_from: { country: paisOrigen },
    address_to: { country: paisDestino },
    parcels
  };
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
  msg += `Origen: ${bandera(paisOrigen)} ${paisOrigen}\n`;
  msg += `Destino: ${bandera(paisDestino)} ${paisDestino}\n`;

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
