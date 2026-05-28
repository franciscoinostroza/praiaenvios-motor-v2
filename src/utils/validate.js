import { log } from './log.js';

function parseKeyValue(message) {
  const pairs = message.split(',').map(s => s.trim()).filter(Boolean);
  const data = {};
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.substring(0, eqIdx).trim().toLowerCase();
    const val = pair.substring(eqIdx + 1).trim();
    if (!key || !val) continue;

    if (['peso', 'peso_bruto'].includes(key)) data.peso_bruto = parseFloat(val) || val;
    else if (key === 'largo') data.largo = parseFloat(val) || val;
    else if (key === 'ancho') data.ancho = parseFloat(val) || val;
    else if (key === 'alto') data.alto = parseFloat(val) || val;
    else if (['valor', 'valor_mercancia', 'precio'].includes(key)) data.valor_mercancia = parseFloat(val) || val;
    else if (['cat', 'categoria', 'categorias'].includes(key)) data.categoria = val;
    else if (['tipo', 'tipo_mercancia'].includes(key)) data.tipo_mercancia = val;
    else if (['origen', 'ciudad', 'ciudad_origen'].includes(key)) data.ciudad_origen = val;
    else if (['destino', 'destino_ciudad'].includes(key)) data.destino_ciudad = val;
    else data[key] = val;
  }
  return Object.keys(data).length > 0 ? data : null;
}

export function parseBody(body) {
  if (!body || typeof body !== 'object') return null;

  if (body.json_datos) {
    try {
      return typeof body.json_datos === 'string'
        ? JSON.parse(body.json_datos)
        : body.json_datos;
    } catch {
      log('WARN', 'Failed to parse json_datos');
      return null;
    }
  }

  if (body.message) {
    const msgStr = typeof body.message === 'string'
      ? body.message
      : JSON.stringify(body.message);

    try {
      return JSON.parse(msgStr);
    } catch {}

    const inicio = msgStr.indexOf('{');
    const fin = msgStr.lastIndexOf('}') + 1;
    if (inicio >= 0 && fin > inicio) {
      try {
        return JSON.parse(msgStr.substring(inicio, fin));
      } catch {}
    }

    const kv = parseKeyValue(msgStr);
    if (kv) return kv;
  }

  return body;
}

export function validateMotorInput(data) {
  if (!data) {
    return { valid: false, error: 'No se recibieron datos' };
  }

  const errors = [];

  const hasCategorias = Array.isArray(data.categorias) && data.categorias.length > 0;
  const hasCategoria = typeof data.categoria === 'string' && data.categoria.trim().length > 0;
  if (!hasCategorias && !hasCategoria) {
    errors.push('categoria');
  }

  const boxes = data.boxes || data.cajas;
  if (boxes !== undefined && !Array.isArray(boxes)) {
    errors.push('boxes debe ser una lista');
  }

  if (Array.isArray(boxes) && boxes.length > 0) {
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.url) continue;
      for (const campo of ['largo', 'ancho', 'alto', 'peso_bruto', 'valor_mercancia']) {
        if (b[campo] === undefined || b[campo] === null || b[campo] === '' || Number(b[campo]) <= 0) {
          errors.push(`${campo} en caja ${i + 1}`);
        }
      }
    }
  } else if (!boxes || boxes.length === 0) {
    for (const campo of ['peso_bruto', 'largo', 'ancho', 'alto', 'valor_mercancia']) {
      if (data[campo] === undefined || data[campo] === null || data[campo] === '' || Number(data[campo]) <= 0) {
        errors.push(campo);
      }
    }
  }

  if (errors.length > 0) {
    const msg = 'Falta: ' + errors.join(', ') + '\n\nEjemplo:\npeso=2, largo=30, ancho=20, alto=15, valor=500, categoria=electronico';
    return { valid: false, error: msg };
  }

  return { valid: true, error: null };
}

export function validateUpsInput(data) {
  if (!data) {
    return { valid: false, error: 'No se recibieron datos' };
  }

  if (!data.pais_destino || typeof data.pais_destino !== 'string' || data.pais_destino.trim().length === 0) {
    return { valid: false, error: 'Falta: pais_destino' };
  }

  const boxes = data.boxes || data.cajas;
  if (!Array.isArray(boxes) || boxes.length === 0) {
    return { valid: false, error: 'Falta: datos del paquete (boxes)' };
  }

  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    for (const campo of ['largo', 'ancho', 'alto', 'peso_bruto']) {
      if (b[campo] === undefined || b[campo] === null || b[campo] === '' || Number(b[campo]) <= 0) {
        return { valid: false, error: `Paquete ${i + 1}: falta ${campo}` };
      }
    }
  }

  return { valid: true, error: null };
}
