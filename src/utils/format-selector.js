function normalizarPais(pais) {
  if (!pais || typeof pais !== 'string') return null;
  const p = pais.toUpperCase().trim();
  const mapa = {
    'VENEZUELA': 'VE', 'VE': 'VE',
    'BRASIL': 'BR', 'BRAZIL': 'BR', 'BR': 'BR',
    'ARGENTINA': 'AR', 'AR': 'AR',
    'CHILE': 'CL', 'CL': 'CL',
    'PERU': 'PE', 'PE': 'PE',
    'COLOMBIA': 'CO', 'CO': 'CO',
    'ECUADOR': 'EC', 'EC': 'EC',
    'BOLIVIA': 'BO', 'BO': 'BO',
    'PARAGUAY': 'PY', 'PY': 'PY',
    'URUGUAY': 'UY', 'UY': 'UY',
    'MEXICO': 'MX', 'MX': 'MX',
    'PANAMA': 'PA', 'PA': 'PA',
    'COSTA RICA': 'CR', 'CR': 'CR',
    'REPUBLICA DOMINICANA': 'DO', 'REPÚBLICA DOMINICANA': 'DO', 'DO': 'DO',
    'GUATEMALA': 'GT', 'GT': 'GT',
    'EL SALVADOR': 'SV', 'SV': 'SV',
    'HONDURAS': 'HN', 'HN': 'HN',
    'NICARAGUA': 'NI', 'NI': 'NI',
    'ESTADOS UNIDOS': 'US', 'USA': 'US', 'US': 'US',
    'PORTUGAL': 'PT', 'PT': 'PT',
    'ESPAÑA': 'ES', 'ESPANHA': 'ES', 'ES': 'ES'
  };
  return mapa[p] || p;
}

function ciudadEnLista(ciudad, lista) {
  if (!ciudad || !lista || !lista.length) return false;
  return lista.indexOf(ciudad.toLowerCase().trim()) !== -1;
}

export function seleccionarFormato(datos, praiaResult, upsResult, flags) {
  const paisDestino = normalizarPais(datos.pais_destino || (datos.tipo_flujo === 'comprando_desde_venezuela' ? 'VE' : null));
  const esCompraAssistida = datos.tipo_flujo === 'comprando_desde_venezuela' || datos.tipo_flujo === 'comprando_desde_otro_pais' || !!flags?.compra_assistida;
  const tieneRecolecta = !!(datos.recolecta && datos.recolecta.solicitada);
  const origenCiudad = datos.origen || datos.ciudad_origen || 'Curitiba';
  const tieneUpsRates = upsResult && upsResult.rates && upsResult.rates.length > 0;
  const productosNoDisponibles = datos.productos_no_disponibles || flags?.productos_no_disponibles || [];
  const productosCotizados = datos.productos_cotizados || flags?.productos_cotizados || [];
  const productoRestringido = datos.producto_restringido || flags?.producto_restringido || false;
  const trechoInfo = praiaResult?.trecho || flags?.trecho;
  const trechoSinValor = flags?.trecho_sin_valor || (trechoInfo?.requiere_trecho && !praiaResult?.desglose?.trecho);
  const modoCompleto = flags?.modo_completo !== false;

  if (!modoCompleto) {
    return { formato: 0, flags: {} };
  }

  const flagsResult = {
    pais_destino: paisDestino,
    es_venezuela: paisDestino === 'VE',
    es_compra_assistida: esCompraAssistida,
    tiene_recolecta: tieneRecolecta,
    tiene_ups_rates: tieneUpsRates,
    productos_no_disponibles: productosNoDisponibles,
    productos_cotizados: productosCotizados,
    producto_restringido: productoRestringido,
    trecho: trechoInfo,
    origen_ciudad: origenCiudad,
    requiere_envio_a_curitiba: trechoInfo?.requiere_envio_a_curitiba_por_cliente || false,
    latam_disponible: trechoInfo?.latam_disponible || false
  };

  if (productoRestringido) {
    return { formato: 14, flags: flagsResult };
  }

  const hayProductosCotizados = productosCotizados.length > 0;
  if (hayProductosCotizados && productosNoDisponibles.length > 0 && productosCotizados.length === 0) {
    return { formato: 13, flags: flagsResult };
  }

  if (trechoInfo?.requiere_trecho && trechoSinValor) {
    return { formato: 15, flags: flagsResult };
  }

  if (paisDestino === 'VE') {
    if (esCompraAssistida && hayProductosCotizados) {
      if (productosNoDisponibles.length > 0) {
        return { formato: 6, flags: flagsResult };
      }
      return { formato: 5, flags: flagsResult };
    }

    if (!trechoInfo?.origen_fuera_zona_base) {
      if (tieneRecolecta) {
        return { formato: 3, flags: flagsResult };
      }
      return { formato: 1, flags: flagsResult };
    }

    if (trechoInfo?.latam_disponible) {
      return { formato: 2, flags: flagsResult };
    }

    return { formato: 4, flags: flagsResult };
  }

  if (paisDestino && paisDestino !== 'VE') {
    if (esCompraAssistida && hayProductosCotizados) {
      if (productosNoDisponibles.length > 0) {
        return { formato: 11, flags: flagsResult };
      }
      return { formato: 10, flags: flagsResult };
    }

    if (!trechoInfo?.origen_fuera_zona_base) {
      if (tieneRecolecta) {
        return { formato: 9, flags: flagsResult };
      }
      return { formato: 7, flags: flagsResult };
    }

    if (trechoInfo?.latam_disponible) {
      return { formato: 8, flags: flagsResult };
    }

    return { formato: 7, flags: flagsResult };
  }

  return { formato: 1, flags: flagsResult };
}
