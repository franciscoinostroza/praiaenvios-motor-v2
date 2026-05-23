import express from 'express';
import { cotizar } from './src/services/motor.js';
import { crearShippo } from './src/services/shippo.js';
import { resolverUrls } from './src/utils/scraper.js';
import { extractMotorParams, formatearMensaje } from './src/utils/format.js';
import { extractShippoParams, formatearMensajeShippo } from './src/utils/format-shippo.js';
import { parseBody, validateMotorInput, validateShippoInput } from './src/utils/validate.js';
import { crearAdminRouter } from './src/admin/router.js';

const app = express();
app.use(express.json());

const SHIPPO_TOKEN = process.env.SHIPPO_TOKEN;
if (!SHIPPO_TOKEN) {
  console.warn('[shippo] SHIPPO_TOKEN no definida — cotizaciones internacionales no disponibles');
}

let cotizarShippo = null;
if (SHIPPO_TOKEN) {
  cotizarShippo = crearShippo(SHIPPO_TOKEN).cotizar;
}

async function manejarCotizacion(req, res) {
  try {
    const datos = parseBody(req.body);
    if (!datos) {
      return res.json({
        resultado_final: { error: true, mensaje: 'No se pudieron interpretar los datos del envío.' },
        mensaje_formateado: '\u274C No se pudieron interpretar los datos del envío.\n\n_Escribe *Menú* para volver al inicio._'
      });
    }

    console.log('[cotizar] datos crudos →', JSON.stringify(datos));

    const validacion = validateMotorInput(datos);
    if (!validacion.valid) {
      return res.json({
        resultado_final: { error: true, mensaje: validacion.error },
        mensaje_formateado: '\u274C ' + validacion.error + '\n\n_Escribe *Menú* para volver al inicio._'
      });
    }

    const entrada = extractMotorParams(datos);
    console.log('[cotizar] entrada →', JSON.stringify(entrada));

    await resolverUrls(entrada);
    console.log('[cotizar] entrada (post-scrape) →', JSON.stringify(entrada));

    const resultadoMotor = await cotizar(entrada);
    console.log('[cotizar] motor →', JSON.stringify(resultadoMotor));

    if (resultadoMotor.status === 'error_datos' || resultadoMotor.status === 'error_interno') {
      return res.json({
        resultado_final: { error: true, mensaje: resultadoMotor.mensaje || 'Error al calcular la cotización' },
        mensaje_formateado: '\u274C ' + (resultadoMotor.mensaje || 'Error al calcular la cotización')
          + '\n\n_Escribe *Menú* para volver al inicio._'
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

    res.json({ resultado_final, mensaje_formateado });
  } catch (err) {
    console.error('[cotizar] error:', err.message);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'No se pudo calcular la cotización. Intenta de nuevo.' },
      mensaje_formateado: '\u274C No se pudo calcular la cotización. Intenta de nuevo.\n\n_Escribe *Menú* para volver al inicio._'
    });
  }
}

app.post('/cotizar', manejarCotizacion);
app.post('/whapify/cotizar', manejarCotizacion);

async function manejarCotizacionShippo(req, res) {
  try {
    if (!cotizarShippo) {
      return res.status(503).json({
        resultado_final: { error: true, mensaje: 'Shippo no configurado' },
        mensaje_formateado: '\u274C Cotización internacional no disponible. SHIPPO_TOKEN no configurado.\n\n_Escribe *Menú* para volver al inicio._'
      });
    }

    const datos = parseBody(req.body);
    if (!datos) {
      return res.json({
        resultado_final: { error: true, mensaje: 'No se pudieron interpretar los datos del envío.' },
        mensaje_formateado: '\u274C No se pudieron interpretar los datos del envío.\n\n_Escribe *Menú* para volver al inicio._'
      });
    }

    console.log('[cotizar-shippo] datos crudos →', JSON.stringify(datos));

    const validacion = validateShippoInput(datos);
    if (!validacion.valid) {
      return res.json({
        resultado_final: { error: true, mensaje: validacion.error },
        mensaje_formateado: '\u274C ' + validacion.error + '\n\n_Escribe *Menú* para volver al inicio._'
      });
    }

    const entrada = extractShippoParams(datos);
    console.log('[cotizar-shippo] entrada →', JSON.stringify(entrada));

    const resultadoShippo = await cotizarShippo(entrada);
    console.log('[cotizar-shippo] shippo →', JSON.stringify(resultadoShippo));

    const mensaje_formateado = formatearMensajeShippo(datos, resultadoShippo);
    res.json({ resultado_final: resultadoShippo, mensaje_formateado });
  } catch (err) {
    console.error('[cotizar-shippo] error:', err.message);
    res.status(500).json({
      resultado_final: { error: true, mensaje: 'No se pudo calcular la cotización internacional. Intenta de nuevo.' },
      mensaje_formateado: '\u274C No se pudo calcular la cotización internacional. Intenta de nuevo.\n\n_Escribe *Menú* para volver al inicio._'
    });
  }
}

app.post('/cotizar-shippo', manejarCotizacionShippo);
app.post('/whapify/cotizar-shippo', manejarCotizacionShippo);

app.use('/admin', crearAdminRouter());

app.get('/health', (_, res) => res.json({ status: 'ok', version: 'v2.0.0' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[server] Praia Envíos Motor v2 en http://localhost:${PORT}`));
