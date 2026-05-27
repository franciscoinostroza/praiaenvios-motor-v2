import express from 'express';
import { cotizar } from './src/services/motor.js';
import { crearShippo } from './src/services/shippo.js';
import { resolverUrls } from './src/utils/scraper.js';
import { extractMotorParams, formatearMensaje } from './src/utils/format.js';
import { extractShippoParams, formatearMensajeShippo } from './src/utils/format-shippo.js';
import { parseBody, validateMotorInput, validateShippoInput } from './src/utils/validate.js';
import { crearAdminRouter } from './src/admin/router.js';
import { log } from './src/utils/log.js';

const app = express();
app.use(express.json());

const SHIPPO_TOKEN = process.env.SHIPPO_TOKEN;
if (!SHIPPO_TOKEN) {
  log('WARN', 'SHIPPO_TOKEN no definida — cotizaciones internacionales no disponibles');
}

let cotizarShippo = null;
if (SHIPPO_TOKEN) {
  cotizarShippo = crearShippo(SHIPPO_TOKEN).cotizar;
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

    // Envío internacional → redirigir al handler de Shippo
    if (datos.pais_destino) {
      if (!cotizarShippo) {
        log('WARN', 'Cotización internacional no disponible (sin SHIPPO_TOKEN)', null, contacto);
        return res.status(503).json({
          resultado_final: { error: true, mensaje: 'Cotización internacional no configurada' },
          mensaje_formateado: '\u274C Cotización internacional no disponible. Contacta a un asesor.'
        });
      }
      log('INFO', 'Cotización internacional detectada → redirigiendo a Shippo', { pais_destino: datos.pais_destino }, contacto);
      return manejarCotizacionShippo(req, res);
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

async function manejarCotizacionShippo(req, res) {
  const contacto = extractContacto(req.body);
  try {
    if (!cotizarShippo) {
      log('WARN', 'Shippo no disponible', null, contacto);
      return res.status(503).json({
        resultado_final: { error: true, mensaje: 'Shippo no configurado' },
        mensaje_formateado: '\u274C Cotización internacional no disponible. SHIPPO_TOKEN no configurado.'
      });
    }

    const datos = parseBody(req.body);
    if (!datos) {
      log('WARN', 'No se pudieron interpretar los datos (shippo)', null, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: 'No se pudieron interpretar los datos del envío.' },
        mensaje_formateado: '\u274C No se pudieron interpretar los datos del envío.'
      });
    }

    log('INFO', 'Cotizar shippo datos recibidos', { datos: JSON.stringify(datos) }, contacto);

    const validacion = validateShippoInput(datos);
    if (!validacion.valid) {
      log('WARN', 'Validación shippo fallida', { error: validacion.error }, contacto);
      return res.json({
        resultado_final: { error: true, mensaje: validacion.error },
        mensaje_formateado: '\u274C ' + validacion.error
      });
    }

    const entrada = extractShippoParams(datos);
    log('INFO', 'Entrada shippo normalizada', { entrada: JSON.stringify(entrada) }, contacto);

    const resultadoShippo = await cotizarShippo(entrada);
    log('INFO', 'Shippo resultado', { resultado: JSON.stringify(resultadoShippo) }, contacto);

    const mensaje_formateado = formatearMensajeShippo(datos, resultadoShippo);
    res.json({ resultado_final: resultadoShippo, mensaje_formateado });
  } catch (err) {
    log('ERROR', 'Error en cotización shippo', { error: err.message, stack: err.stack?.split('\n')[0] }, contacto);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'No se pudo calcular la cotización internacional. Intenta de nuevo.' },
      mensaje_formateado: '\u274C No se pudo calcular la cotización internacional. Intenta de nuevo.'
    });
  }
}

app.post('/cotizar-shippo', manejarCotizacionShippo);
app.post('/whapify/cotizar-shippo', manejarCotizacionShippo);

app.use('/admin', crearAdminRouter());

app.get('/health', (_, res) => res.json({ status: 'ok', version: 'v2.0.0' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log('INFO', `Praia Envíos Motor v2 en http://localhost:${PORT}`));
