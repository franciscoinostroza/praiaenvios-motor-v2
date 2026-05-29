import express from 'express';
import { cotizar } from './src/services/motor.js';
import { crearUps } from './src/services/ups.js';
import { resolverUrls } from './src/utils/scraper.js';
import { extractMotorParams, formatearMensaje } from './src/utils/format.js';
import { extractUpsParams, formatearMensajeUps } from './src/utils/format-ups.js';
import { parseBody, validateMotorInput, validateUpsInput } from './src/utils/validate.js';
import { crearAdminRouter } from './src/admin/router.js';
import { log } from './src/utils/log.js';

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

    if (datos.pais_destino) {
      if (!cotizarUps) {
        log('WARN', 'Cotización internacional no disponible (UPS no configurado)', null, contacto);
        return res.status(503).json({
          resultado_final: { error: true, mensaje: 'Cotización internacional no configurada' },
          mensaje_formateado: '\u274C Cotización internacional no disponible. Contacta a un asesor.'
        });
      }
      log('INFO', 'Cotización internacional detectada → redirigiendo a UPS', { pais_destino: datos.pais_destino }, contacto);
      return manejarCotizacionUps(req, res);
    }

    log('INFO', 'Cotizar datos recibidos', { datos: JSON.stringify(datos) }, contacto);

    const validacion = validateMotorInput(datos);
    if (!validacion.valid) {
      log('WARN', 'Validación fallida', { error: validacion.error }, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: validacion.error },
        mensaje_formateado: '\u274C ' + validacion.error
      });
    }

    const entrada = await extractMotorParams(datos);
    log('INFO', 'Entrada normalizada', { entrada: JSON.stringify(entrada) }, contacto);

    const scrapeResult = await resolverUrls(entrada);
    log('INFO', 'Post-scrape', { entrada: JSON.stringify(entrada), scrapeFailed: scrapeResult?.scrapeFailed }, contacto);

    if (scrapeResult?.scrapeFailed) {
      log('WARN', 'Scrape falló para alguna URL', null, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: 'No pude leer los datos del link.' },
        mensaje_formateado: `📦 No pude leer los datos del link.\n\nEscríbeme directo así para cotizar al instante 🤖:\npeso=2, largo=30, ancho=20, alto=15, valor=500, categoria=electronico`
      });
    }

    const resultadoMotor = await cotizar(entrada);
    log('INFO', 'Motor resultado', { resultado: JSON.stringify(resultadoMotor) }, contacto);

    if (resultadoMotor.status === 'error_datos' || resultadoMotor.status === 'error_interno') {
      log('WARN', 'Motor devolvió error', { status: resultadoMotor.status, mensaje: resultadoMotor.mensaje }, contacto);
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
        return {
          caja: c.caja,
          modalidad: c.modalidad,
          nombre_modalidad: c.nombre_modalidad,
          total: c.total,
          con_trecho: c.con_trecho
        };
      });
    }

    const resultado_final = {
      modalidad: modalidad,
      total_reales: total_reales,
      total_usd: total_usd,
      costo_nacional_bs: resultadoMotor.costo_nacional || 0,
      tiempo_estimado: resultadoMotor.tiempo_entrega || '',
      fecha_estimada: resultadoMotor.fecha_entrega || '',
      cajas: cajasResult
    };

    const mensaje_formateado = formatearMensaje(datos, resultadoMotor);

    log('INFO', 'Cotización exitosa', { total_reales, total_usd, modalidad }, contacto);
    res.json({ resultado_final, mensaje_formateado });
  } catch (err) {
    log('ERROR', 'Error en cotización', { error: err.message, stack: err.stack?.split('\n')[0] }, contacto);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'No se pudo calcular la cotización. Intenta de nuevo.' },
      mensaje_formateado: '\u274C No se pudo calcular la cotización. Intenta de nuevo.'
    });
  }
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

    const mensaje_formateado = formatearMensajeUps(datos, resultadoUps);
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

app.get('/health', (_, res) => res.json({ status: 'ok', version: 'v2.0.0' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log('INFO', `Praia Envíos Motor v2 en http://localhost:${PORT}`));
