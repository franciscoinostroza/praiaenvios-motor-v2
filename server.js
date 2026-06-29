import express from 'express';
import { cotizar } from './src/services/motor.js';
import { crearUps } from './src/services/ups.js';
import { resolverUrls } from './src/utils/scraper.js';
import { extractMotorParams, formatearMensaje } from './src/utils/format.js';
import { extractUpsParams, formatearMensajeUps } from './src/utils/format-ups.js';
import { parseBody, validateMotorInput, validateUpsInput } from './src/utils/validate.js';
import { crearAdminRouter } from './src/admin/router.js';
import { log } from './src/utils/log.js';
import { loadConfig } from './src/motor/config.js';
import { formatearMensajeCompleto } from './src/utils/format-completo.js';


const app = express();
app.use(express.json());

let cotizarUps = null;
try {
  const cuentas = [];
  const c1id = process.env.UPS_CUENTA_1_ID;
  const c1sec = process.env.UPS_CUENTA_1_SECRET;
  const c1acc = process.env.UPS_CUENTA_1_ACCOUNT;
  if (c1id && c1sec && c1acc) {
    cuentas.push({ clientId: c1id, clientSecret: c1sec, account: c1acc, nombre: 'Cuenta 1' });
  }
  const c2id = process.env.UPS_CUENTA_2_ID;
  const c2sec = process.env.UPS_CUENTA_2_SECRET;
  const c2acc = process.env.UPS_CUENTA_2_ACCOUNT;
  if (c2id && c2sec && c2acc) {
    cuentas.push({ clientId: c2id, clientSecret: c2sec, account: c2acc, nombre: 'Cuenta 2' });
  }
  if (cuentas.length > 0) {
    const upsService = crearUps({
      cuentas,
      origen: {
        city: process.env.UPS_ORIGEN_CIUDAD || 'Curitiba',
        state: process.env.UPS_ORIGEN_ESTADO || 'PR',
        zip: process.env.UPS_ORIGEN_ZIP || '80000-000',
        country: process.env.UPS_ORIGEN_PAIS || 'BR'
      }
    });
    cotizarUps = upsService.cotizar;
    log('INFO', `UPS configurado con ${cuentas.length} cuenta(s)`);
  } else {
    log('WARN', 'UPS no configurado — cotizaciones internacionales no disponibles');
  }
} catch (e) {
  log('WARN', 'Error al configurar UPS: ' + e.message);
}

function extractContacto(body) {
  const inner = body?.json_datos || body;
  const candidates = [
    inner?.sessionId, inner?.session_id, inner?.phone,
    inner?.contacto, inner?.nombre, inner?.name,
    inner?.from_name, inner?.pushname, inner?.profile?.name,
    inner?.from, inner?.wa_id, inner?.sender, inner?.telefono,
    body?.sessionId, body?.session_id, body?.phone,
    body?.contacto, body?.nombre, body?.name,
    body?.from, body?.wa_id, body?.sender, body?.telefono
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string' && !c.includes('{{') && !c.includes('}}')) return c;
  }
  return null;
}

function normalizarPaisDestino(pais) {
  if (!pais || typeof pais !== 'string') return null;
  const p = pais.toUpperCase().trim();
  const mapa = {
    'VENEZUELA': 'VE', 'BRASIL': 'BR', 'BRAZIL': 'BR',
    'ARGENTINA': 'AR', 'CHILE': 'CL', 'PERU': 'PE', 'PERÚ': 'PE',
    'COLOMBIA': 'CO', 'ECUADOR': 'EC', 'BOLIVIA': 'BO',
    'PARAGUAY': 'PY', 'URUGUAY': 'UY', 'MEXICO': 'MX', 'MÉXICO': 'MX'
  };
  return mapa[p] || p;
}

const FORMATO_COMPLETO = process.env.FORMATO_COMPLETO === 'true';

async function manejarCotizacion(req, res) {
  const contacto = extractContacto(req.body);
  try {
    const datos = parseBody(req.body);
    if (!datos) {
      log('WARN', 'No se pudieron interpretar los datos', null, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: 'No se pudieron interpretar los datos del envío.' },
        mensaje_formateado: '\u274C No se pudieron interpretar los datos del envío.\n\n_Escribe *Menú* para volver al inicio._'
      });
    }

    if (!FORMATO_COMPLETO) {
      return manejarCotizacionLegacy(req, res, datos, contacto);
    }

    const paisDestino = normalizarPaisDestino(datos.pais_destino);

    if (paisDestino === 'VE') {
      log('INFO', 'Formato completo: Venezuela detectado → Praia + UPS', null, contacto);
      return manejarCotizacionCompleta(req, res, datos, contacto);
    }

    if (paisDestino) {
      log('INFO', 'Formato completo: internacional (no VE) → UPS con retry', { pais_destino: paisDestino }, contacto);
      return manejarCotizacionUpsConRetry(req, res, datos, contacto);
    }

    return manejarCotizacionLegacy(req, res, datos, contacto);
  } catch (err) {
    log('ERROR', 'Error en cotización', { error: err.message, stack: err.stack?.split('\n')[0] }, contacto);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'No se pudo calcular la cotización. Intenta de nuevo.' },
      mensaje_formateado: '\u274C No se pudo calcular la cotización. Intenta de nuevo.'
    });
  }
}

async function manejarCotizacionCompleta(req, res, datos, contacto) {
  try {
    const validacion = validateMotorInput(datos);
    if (!validacion.valid) {
      log('WARN', 'Validación fallida (completa)', { error: validacion.error }, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: validacion.error },
        mensaje_formateado: '\u274C ' + validacion.error
      });
    }

    if (datos.codigo_postal_destino) {
      datos._codigo_postal_valido = true;
    }

    const entrada = await extractMotorParams(datos);
    log('INFO', 'Entrada Praia normalizada (completa)', { entrada: JSON.stringify(entrada) }, contacto);

    const scrapeResult = await resolverUrls(entrada);
    if (scrapeResult?.scrapeFailed) {
      log('WARN', 'Scrape falló (completa)', null, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: 'No pude leer los datos del link.' },
        mensaje_formateado: '\u274C No pude leer los datos del link.'
      });
    }

    const entradaUps = extraerEntradaUps(datos);

    const [praiaPromise, upsPromise] = await Promise.allSettled([
      cotizar(entrada),
      cotizarUps ? ejecutarUpsConTimeout(entradaUps, 8000) : Promise.reject(new Error('UPS no configurado'))
    ]);

    const praiaResult = praiaPromise.status === 'fulfilled' ? praiaPromise.value : null;
    let upsResult = upsPromise.status === 'fulfilled' ? upsPromise.value : null;

    if (praiaResult && (praiaResult.status === 'error_datos' || praiaResult.status === 'error_interno')) {
      log('WARN', 'Motor Praia falló (completa)', { mensaje: praiaResult.mensaje }, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: praiaResult.mensaje || 'Error al calcular cotización Praia' },
        mensaje_formateado: '\u274C ' + (praiaResult.mensaje || 'Error al calcular')
      });
    }

    if (!upsResult && cotizarUps) {
      log('WARN', 'UPS falló para VE — respondiendo solo Praia', null, contacto);
    }

    const config = await loadConfig();
    const mensajeFinal = await formatearMensajeCompleto(datos, praiaResult, upsResult, config);

    const mensajeFormateado = mensajeFinal + (
      !upsResult && cotizarUps
        ? '\n\n⚠️ UPS no estuvo disponible en este momento. Solo se muestra cotización Praia Envíos.'
        : ''
    );

    log('INFO', 'Cotización completa exitosa', {
      total: praiaResult?.total_final,
      ups: upsResult ? 'ok' : 'fallo'
    }, contacto);

    res.json({
      resultado_final: {
        praia: praiaResult || null,
        ups: upsResult || null,
        completo: true
      },
      mensaje_formateado: mensajeFormateado
    });
  } catch (err) {
    log('ERROR', 'Error en cotización completa', { error: err.message }, contacto);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'Error al calcular cotización completa.' },
      mensaje_formateado: '\u274C Error al calcular cotización. Intenta de nuevo.'
    });
  }
}

async function manejarCotizacionUpsConRetry(req, res, datos, contacto) {
  try {
    if (!cotizarUps) {
      log('WARN', 'UPS no disponible (con retry)', null, contacto);
      return res.status(503).json({
        resultado_final: { error: true, mensaje: 'UPS no configurado' },
        mensaje_formateado: '\u274C Cotización internacional no disponible.'
      });
    }

    const validacion = validateUpsInput(datos);
    if (!validacion.valid) {
      log('WARN', 'Validación UPS fallida (con retry)', { error: validacion.error }, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: validacion.error },
        mensaje_formateado: '\u274C ' + validacion.error
      });
    }

    const entrada = extractUpsParams(datos);
    log('INFO', 'Entrada UPS (con retry)', { entrada: JSON.stringify(entrada) }, contacto);

    let upsResult = null;
    let lastError = null;
    for (let intento = 0; intento < 2; intento++) {
      try {
        upsResult = await cotizarUps(entrada);
        if (upsResult && upsResult.rates) break;
      } catch (e) {
        lastError = e;
        log('WARN', 'UPS intento ' + (intento + 1) + ' falló', { error: e.message }, contacto);
      }
    }

    if (!upsResult) {
      log('ERROR', 'UPS no respondió tras reintentos', { error: lastError?.message }, contacto);
      return res.status(502).json({
        resultado_final: { error: true, mensaje: 'UPS no disponible tras reintentos.' },
        mensaje_formateado: '\u274C UPS no está disponible en este momento. Intenta más tarde.'
      });
    }

    const config = await loadConfig();
    const mensaje_formateado = await formatearMensajeCompleto(datos, null, upsResult, config);

    log('INFO', 'Cotización UPS exitosa (con retry)', null, contacto);
    res.json({ resultado_final: upsResult, mensaje_formateado });
  } catch (err) {
    log('ERROR', 'Error en cotización UPS con retry', { error: err.message }, contacto);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'No se pudo calcular la cotización internacional.' },
      mensaje_formateado: '\u274C No se pudo calcular la cotización internacional. Intenta de nuevo.'
    });
  }
}

function extraerEntradaUps(datos) {
  const paisOrigen = datos.pais_origen || 'BR';
  const paisDestino = datos.pais_destino || 'VE';
  const address_from = { country: paisOrigen };
  const address_to = { country: paisDestino };
  if (datos.codigo_postal_origen) address_from.zip = datos.codigo_postal_origen;
  if (datos.codigo_postal_destino) address_to.zip = datos.codigo_postal_destino;
  if (datos.ciudad_origen) address_from.city = datos.ciudad_origen;
  if (datos.ciudad_destino) address_to.city = datos.ciudad_destino;
  if (datos.estado_origen) address_from.state = datos.estado_origen;
  if (datos.estado_destino) address_to.state = datos.estado_destino;

  const boxes = datos.boxes || datos.cajas || [];
  const parcels = boxes.length > 0 ? boxes.map(b => ({
    length: String(b.largo || 30),
    width: String(b.ancho || 20),
    height: String(b.alto || 15),
    distance_unit: 'cm',
    weight: String(b.peso_bruto || 1),
    mass_unit: 'kg'
  })) : [{ length: '30', width: '20', height: '15', distance_unit: 'cm', weight: '1', mass_unit: 'kg' }];

  return { address_from, address_to, parcels };
}

async function ejecutarUpsConTimeout(entrada, timeoutMs) {
  const resultado = await Promise.race([
    cotizarUps(entrada),
    new Promise((_, reject) => setTimeout(() => reject(new Error('UPS timeout after ' + timeoutMs + 'ms')), timeoutMs))
  ]);
  return resultado;
}

async function manejarCotizacionLegacy(req, res, datos, contacto) {
  log('INFO', 'Cotizar datos recibidos (legacy)', { datos: JSON.stringify(datos) }, contacto);

  const validacion = validateMotorInput(datos);
  if (!validacion.valid) {
    log('WARN', 'Validación fallida (legacy)', { error: validacion.error }, contacto);
    return res.json({
      resultado_final: { error: true, mensaje: validacion.error },
      mensaje_formateado: '\u274C ' + validacion.error
    });
  }

  const entrada = await extractMotorParams(datos);
  log('INFO', 'Entrada normalizada (legacy)', { entrada: JSON.stringify(entrada) }, contacto);

  const scrapeResult = await resolverUrls(entrada);
  log('INFO', 'Post-scrape (legacy)', { entrada: JSON.stringify(entrada), scrapeFailed: scrapeResult?.scrapeFailed }, contacto);

  if (scrapeResult?.scrapeFailed) {
    log('WARN', 'Scrape falló (legacy)', null, contacto);
    return res.json({
      resultado_final: { error: true, mensaje: 'No pude leer los datos del link.' },
      mensaje_formateado: '📦 No pude leer los datos del link.\n\nEscríbeme directo así para cotizar al instante 🤖:\npeso=2, largo=30, ancho=20, alto=15, valor=500, categoria=electronico'
    });
  }

  const resultadoMotor = await cotizar(entrada);
  log('INFO', 'Motor resultado (legacy)', { resultado: JSON.stringify(resultadoMotor) }, contacto);

  if (resultadoMotor.status === 'error_datos' || resultadoMotor.status === 'error_interno') {
    log('WARN', 'Motor devolvió error (legacy)', { status: resultadoMotor.status, mensaje: resultadoMotor.mensaje }, contacto);
    return res.json({
      resultado_final: { error: true, mensaje: resultadoMotor.mensaje || 'Error al calcular la cotización' },
      mensaje_formateado: '\u274C ' + (resultadoMotor.mensaje || 'Error al calcular la cotización')
    });
  }

  const total_reales = resultadoMotor.total_final || 0;
  const tasa = resultadoMotor.tasa_dolar;
  const total_usd = parseFloat((total_reales / tasa).toFixed(2));
  const modalidad = resultadoMotor.modalidad
    || (resultadoMotor.cajas && resultadoMotor.cajas.length > 0 ? resultadoMotor.cajas[0].modalidad : undefined);

  let cajasResult = [];
  if (resultadoMotor.cajas && resultadoMotor.cajas.length > 0) {
    cajasResult = resultadoMotor.cajas.map(function(c) {
      return { caja: c.caja, modalidad: c.modalidad, nombre_modalidad: c.nombre_modalidad, total: c.total, con_trecho: c.con_trecho };
    });
  }

  var cajasCount = Array.isArray(datos.boxes) ? datos.boxes.length : (datos.numero_cajas || cajasResult.length);
  var detalleCajas = datos.resumen_cajas || '';
  var valorTotalMerc = datos.valor_total_mercancia || 0;
  var recolectaAplica = datos.recolecta && datos.recolecta.solicitada ? true : false;
  var valorRecolecta = datos.recolecta && datos.recolecta.valor_recolecta ? datos.recolecta.valor_recolecta : '';
  var trechoAplica = resultadoMotor.cajas && resultadoMotor.cajas.some(function(c) { return c.con_trecho; }) ? true : false;
  var valorTrecho = resultadoMotor.valor_trecho || '';
  var observacion = datos.observaciones || '';

  const resultado_final = {
    modalidad: modalidad,
    total_reales: total_reales,
    total_usd: total_usd,
    costo_nacional_bs: resultadoMotor.costo_nacional || 0,
    tiempo_estimado: resultadoMotor.tiempo_entrega || '',
    fecha_estimada: resultadoMotor.fecha_entrega || '',
    cajas: cajasResult,
    numero_cajas: cajasCount,
    detalle_cajas: detalleCajas,
    valor_total_mercancia: valorTotalMerc,
    recolecta_aplica: recolectaAplica,
    valor_recolecta: valorRecolecta,
    trecho_aplica: trechoAplica,
    valor_trecho: valorTrecho,
    observacion: observacion
  };

  const mensaje_formateado = await formatearMensaje(datos, resultadoMotor);

  log('INFO', 'Cotización exitosa (legacy)', { total_reales, total_usd, modalidad }, contacto);
  res.json({ resultado_final, mensaje_formateado });
}

app.post('/cotizar', manejarCotizacion);

app.post('/whapify/cotizar', manejarCotizacion);

async function manejarCotizacionUps(req, res) {
  const contacto = extractContacto(req.body);
  try {
    if (!cotizarUps) {
      log('WARN', 'UPS no disponible', null, contacto);
      return res.status(503).json({
        resultado_final: { error: true, mensaje: 'UPS no configurado' },
        mensaje_formateado: '\u274C Cotización internacional no disponible.'
      });
    }

    const datos = parseBody(req.body);
    if (!datos) {
      log('WARN', 'No se pudieron interpretar los datos (ups)', null, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: 'No se pudieron interpretar los datos del envío.' },
        mensaje_formateado: '\u274C No se pudieron interpretar los datos del envío.'
      });
    }

    log('INFO', 'Cotizar UPS datos recibidos', { datos: JSON.stringify(datos) }, contacto);

    const validacion = validateUpsInput(datos);
    if (!validacion.valid) {
      log('WARN', 'Validación UPS fallida', { error: validacion.error }, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: validacion.error },
        mensaje_formateado: '\u274C ' + validacion.error
      });
    }

    const entrada = extractUpsParams(datos);
    log('INFO', 'Entrada UPS normalizada', { entrada: JSON.stringify(entrada) }, contacto);

    const resultadoUps = await cotizarUps(entrada);
    log('INFO', 'UPS resultado', { resultado: JSON.stringify(resultadoUps) }, contacto);

    const mensaje_formateado = await formatearMensajeUps(datos, resultadoUps);
    res.json({ resultado_final: resultadoUps, mensaje_formateado });
  } catch (err) {
    log('ERROR', 'Error en cotización UPS', { error: err.message, stack: err.stack?.split('\n')[0] }, contacto);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'No se pudo calcular la cotización internacional. Intenta de nuevo.' },
      mensaje_formateado: '\u274C No se pudo calcular la cotización internacional. Intenta de nuevo.'
    });
  }
}

app.use('/admin', crearAdminRouter());

app.get('/health', (_, res) => res.json({ status: 'ok', version: 'v2.1.0' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log('INFO', `Praia Envíos Motor v2 en http://localhost:${PORT}`);
});
