import { crearMotor } from '../motor/engine.js';
import { loadConfig } from '../motor/config.js';

export async function cotizar(args) {
  const config = await loadConfig();
  const engine = crearMotor(config);

  const esMultiple = Array.isArray(args.boxes) && args.boxes.length > 0;

  if (!esMultiple && args.peso_bruto) {
    args.boxes = [{
      peso_bruto: args.peso_bruto,
      largo: args.largo,
      ancho: args.ancho,
      alto: args.alto,
      valor_mercancia: args.valor_mercancia
    }];
  }

  const errorValidacion = engine.validarInputMultiple(args);
  if (errorValidacion) {
    return { status: 'error_datos', mensaje: errorValidacion };
  }

  try {
    const resultado = engine.cotizarMultiple(args);
    return resultado;
  } catch (err) {
    return { status: 'error_interno', mensaje: 'Error inesperado: ' + err.message };
  }
}

export async function cotizarDebug(args) {
  const config = await loadConfig();
  const engine = crearMotor(config);
  try {
    return engine.cotizarDebug(args);
  } catch (err) {
    return { status: 'error_interno', mensaje: err.message };
  }
}
