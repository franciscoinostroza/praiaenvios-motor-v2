import { seleccionarFormato } from './format-selector.js';
import * as B from './bloques.js';

function getTrechoInfoFromConfig(ciudadOrigen, config) {
  if (!ciudadOrigen || !config) return null;
  const key = ciudadOrigen.toLowerCase().trim();
  const base = config.ZONA_BASE || [];
  const sinCobertura = config.ZONAS_SIN_COBERTURA || [];
  const trechos = config.TRECHOS_MAP || {};
  if (base.indexOf(key) !== -1) {
    return { ciudad: ciudadOrigen, requiere_trecho: false, modalidad: 0, origen_fuera_zona_base: false, latam_disponible: false, codigo_iata: '', direccion_latam: '', tiempo_adicional_dias: 0, observacion: '', requiere_envio_a_curitiba_por_cliente: false };
  }
  const latam = trechos[key];
  if (latam) {
    return { ciudad: latam.ciudad, requiere_trecho: true, modalidad: 4, origen_fuera_zona_base: true, latam_disponible: true, codigo_iata: latam.codigo_iata, direccion_latam: latam.direccion_latam, tiempo_adicional_dias: latam.tiempo_adicional_dias, observacion: 'Origen fuera de zona base. Se calcula trecho adicional hasta Curitiba.', requiere_envio_a_curitiba_por_cliente: false };
  }
  const noCobertura = sinCobertura.indexOf(key) !== -1;
  return { ciudad: ciudadOrigen, requiere_trecho: false, modalidad: 0, origen_fuera_zona_base: true, latam_disponible: false, codigo_iata: '', direccion_latam: '', tiempo_adicional_dias: 0, observacion: noCobertura ? 'Origen fuera de zona base sin LATAM Cargo permitido.' : 'Ciudad de origen no reconocida.', requiere_envio_a_curitiba_por_cliente: true };
}

export async function formatearMensajeCompleto(datos, praiaResult, upsResult, config) {
  if (!config) {
    return formatearLegacy(datos, praiaResult, upsResult);
  }

  const lang = (datos.idioma === 'pt' || datos.idioma === 'en') ? datos.idioma : 'es';

  const tasaDolar = config.FORMULAS?.tasa_dolar || 5.48;
  const tasaUpsOffset = config.FORMULAS?.tasa_ups_offset || 0.40;
  const porcentajeGanancia = config.FORMULAS?.porcentaje_ganancia_ups || 40;
  const direccionBase = config.CONFIG_TEXTO?.direccion_base_curitiba || B.t('direccion_base_curitiba', lang);

  const valorRecolectaReales = (datos.recolecta?.valor_recolecta ? parseFloat(datos.recolecta.valor_recolecta) : 0) || 0;
  const valorRecolectaUSD = valorRecolectaReales / tasaDolar;
  const valorTrecho = praiaResult?.desglose?.trecho || 0;
  const valorTrechoUSD = valorTrecho / tasaDolar;

  const datosConTasa = { ...datos, _tasa_dolar: tasaDolar };

  const esCompraAssistida = datos.tipo_flujo === 'comprando_desde_venezuela' || datos.tipo_flujo === 'comprando_desde_otro_pais';
  const origenCiudad = esCompraAssistida ? 'Curitiba' : (datos.origen || datos.ciudad_origen || 'Curitiba');
  const trechoInfo = getTrechoInfoFromConfig(origenCiudad, config);

  const flagsBase = {
    pais_destino: datos.pais_destino || '',
    origen_ciudad: origenCiudad,
    direccion_base: direccionBase,
    trecho: trechoInfo,
    valor_trecho_reales: valorTrecho,
    valor_trecho_usd: valorTrechoUSD,
    valor_recolecta_reales: valorRecolectaReales,
    valor_recolecta_usd: valorRecolectaUSD,
    porcentaje_ganancia_ups: porcentajeGanancia,
    tasa_dolar: tasaDolar,
    tasa_ups_offset: tasaUpsOffset
  };

  const { formato, flags } = seleccionarFormato(datos, praiaResult, upsResult, { modo_completo: true, ...flagsBase });
  const f = { ...flagsBase, ...flags };

  if (formato === 0) {
    return formatearLegacy(datos, praiaResult, upsResult);
  }

  let msg = '';

  switch (formato) {
    case 1:
      msg += B.bloqueAprobacion() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloquePraia(praiaResult, datosConTasa, f, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 2:
      msg += B.bloqueAprobacion() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueTrecho(f.trecho, valorTrecho, valorTrechoUSD, lang);
      msg += B.bloquePraia(praiaResult, datosConTasa, f, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 8:
      msg += B.bloqueAprobacionIntl() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueTrecho(f.trecho, valorTrecho, valorTrechoUSD, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 3:
      msg += B.bloqueAprobacion() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueRecolecta(valorRecolectaReales, valorRecolectaUSD, lang);
      msg += B.bloquePraia(praiaResult, datosConTasa, f, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 4:
      msg += B.bloqueAprobacion() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueSinCoberturaTrecho(f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloquePraia(praiaResult, datosConTasa, f, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 5:
      msg += B.bloqueAprobacion() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueCompra(datos.productos_cotizados, datos.total_compra_reales || 0, datos.total_compra_usd || 0, lang);
      msg += B.bloqueCajas(datosConTasa, praiaResult, lang);
      msg += B.bloquePraia(praiaResult, datosConTasa, f, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 6:
      msg += B.bloqueAprobacion() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueCompra(datos.productos_cotizados, datos.total_compra_reales || 0, datos.total_compra_usd || 0, lang);
      msg += B.bloqueProductosNoDisponibles(datos.productos_no_disponibles, lang);
      msg += B.bloqueCajas(datosConTasa, praiaResult, lang);
      msg += B.bloquePraia(praiaResult, datosConTasa, f, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 7:
      msg += B.bloqueAprobacionIntl() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 8:
      msg += B.bloqueAprobacionIntl() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueTrecho(praiaResult?.trecho, valorTrecho, valorTrechoUSD, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 9:
      msg += B.bloqueAprobacionIntl() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueRecolecta(valorRecolectaReales, valorRecolectaUSD, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 10:
      msg += B.bloqueAprobacionIntl() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueCompra(datos.productos_cotizados, datos.total_compra_reales || 0, datos.total_compra_usd || 0, lang);
      msg += B.bloqueCajas(datosConTasa, praiaResult, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 11:
      msg += B.bloqueAprobacionIntl() + '\n';
      msg += B.bloqueIntro(datosConTasa, f, lang) + '\n';
      msg += B.bloqueDatosEnvio(datosConTasa, f, lang);
      msg += B.bloqueCompra(datos.productos_cotizados, datos.total_compra_reales || 0, datos.total_compra_usd || 0, lang);
      msg += B.bloqueProductosNoDisponibles(datos.productos_no_disponibles, lang);
      msg += B.bloqueCajas(datosConTasa, praiaResult, lang);
      msg += B.bloqueUps(upsResult, datosConTasa, f, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang);
      msg += B.bloqueMetodosPago(lang);
      break;

    case 12:
      msg += B.bloqueFormato12UpsSinCotizaciones(lang);
      break;

    case 13:
      msg += B.bloqueTodosNoDisponibles(datos.productos_no_disponibles || flags?.productos_no_disponibles, lang);
      break;

    case 14:
      msg += B.bloqueRestriccion(datos.categoria || '', datos.motivo_restriccion || flags?.motivo_restriccion || '', lang);
      break;

    case 15:
      msg += B.bloqueTrechoPendiente(f.trecho, lang);
      break;

    default:
      msg = formatearLegacy(datos, praiaResult, upsResult);
  }

  return msg;
}

function formatearLegacy(datos, praiaResult, upsResult) {
  if (upsResult && upsResult.mensaje_formateado) return upsResult.mensaje_formateado;
  if (praiaResult && praiaResult.mensaje_formateado) return praiaResult.mensaje_formateado;
  return 'Cotización disponible. Consulta los detalles en el panel de administración.';
}
