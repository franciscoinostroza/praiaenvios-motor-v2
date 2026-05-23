export function parseBody(body) {
  if (!body || typeof body !== 'object') return null;

  if (body.json_datos) {
    try {
      return typeof body.json_datos === 'string'
        ? JSON.parse(body.json_datos)
        : body.json_datos;
    } catch {
      return null;
    }
  }

  if (body.message) {
    try {
      const msgStr = typeof body.message === 'string'
        ? body.message
        : JSON.stringify(body.message);
      const inicio = msgStr.indexOf('{');
      const fin = msgStr.lastIndexOf('}') + 1;
      if (inicio >= 0 && fin > inicio) {
        return JSON.parse(msgStr.substring(inicio, fin));
      }
    } catch { /* message no es JSON válido, se usa el body original */ }
  }

  return body;
}

export function validateMotorInput(data) {
  if (!data) {
    return { valid: false, error: 'No se recibieron datos de entrada' };
  }

  const hasCategorias = Array.isArray(data.categorias) && data.categorias.length > 0;
  const hasCategoria = typeof data.categoria === 'string' && data.categoria.trim().length > 0;
  if (!hasCategorias && !hasCategoria) {
    return { valid: false, error: 'Falta indicar la categoría del producto' };
  }

  const boxes = data.boxes || data.cajas;
  if (boxes !== undefined && !Array.isArray(boxes)) {
    return { valid: false, error: 'El campo "boxes" debe ser un arreglo' };
  }

  if (Array.isArray(boxes) && boxes.length > 0) {
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const campos = ['largo', 'ancho', 'alto', 'peso_bruto', 'valor_mercancia'];
      for (const campo of campos) {
        if (b[campo] === undefined || b[campo] === null || b[campo] === '') {
          return { valid: false, error: `Caja ${i + 1}: falta el campo "${campo}"` };
        }
        const val = Number(b[campo]);
        if (isNaN(val) || val <= 0) {
          return { valid: false, error: `Caja ${i + 1}: "${campo}" debe ser un número positivo` };
        }
      }
    }
  }

  return { valid: true, error: null };
}

export function validateShippoInput(data) {
  if (!data) {
    return { valid: false, error: 'No se recibieron datos de entrada' };
  }

  if (!data.pais_destino || typeof data.pais_destino !== 'string' || data.pais_destino.trim().length === 0) {
    return { valid: false, error: 'Falta indicar el país de destino' };
  }

  const boxes = data.boxes || data.cajas;
  if (!Array.isArray(boxes) || boxes.length === 0) {
    return { valid: false, error: 'Falta indicar los datos del paquete' };
  }

  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const campos = ['largo', 'ancho', 'alto', 'peso_bruto'];
    for (const campo of campos) {
      if (b[campo] === undefined || b[campo] === null || b[campo] === '' || Number(b[campo]) <= 0) {
        return { valid: false, error: `Paquete ${i + 1}: falta o es inválido "${campo}"` };
      }
    }
  }

  return { valid: true, error: null };
}
