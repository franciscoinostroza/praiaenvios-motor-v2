export function crearMotor(config) {
  const {
    TABLA_EXPRESS, TABLA_TERRESTRE, TABLA_NACIONAL_OP1, TABLA_NACIONAL_OP2,
    TRAMOS_BOA_VISTA, TRAMOS_GANANCIA, MODALIDADES, FORMULAS,
    CATEGORIAS_SOLO_AEREO, CATEGORIAS_TERRESTRE, CATEGORIAS_NEUTRAS,
    ZONA_BASE, ORIGENES_PROHIBIDOS
  } = config;

  function calcularPesoVolumetrico(largo, ancho, alto) {
    return (largo * ancho * alto) / FORMULAS.divisor_volumetrico;
  }

  function calcularPesoFacturable(peso_bruto, largo, ancho, alto) {
    return Math.ceil(Math.max(peso_bruto, calcularPesoVolumetrico(largo, ancho, alto)));
  }

  function calcularFt3(largo, ancho, alto) {
    return largo * ancho * alto * FORMULAS.factor_ft3;
  }

  function calcularValorExtra(ft3) {
    return Math.ceil(ft3 * 8);
  }

  function calcularEmbalaje(ft3) {
    return Math.ceil(ft3 * 15);
  }

  function calcularTarifaUSD(peso_bruto) {
    for (let i = 0; i < TRAMOS_GANANCIA.length; i++) {
      if (TRAMOS_GANANCIA[i].hasta === undefined || peso_bruto <= TRAMOS_GANANCIA[i].hasta) {
        return TRAMOS_GANANCIA[i].usd_kg;
      }
    }
    return 1;
  }

  function calcularGanancia(peso_bruto) {
    return (peso_bruto * calcularTarifaUSD(peso_bruto)) * FORMULAS.factor_ganancia;
  }

  function calcularBoaVista(largo, ancho, alto) {
    const suma = largo + ancho + alto;
    for (let i = 0; i < TRAMOS_BOA_VISTA.length; i++) {
      if (TRAMOS_BOA_VISTA[i].hasta === undefined || suma <= TRAMOS_BOA_VISTA[i].hasta) {
        return TRAMOS_BOA_VISTA[i].precio;
      }
    }
    return 500;
  }

  function requiereTrecho(ciudad_origen) {
    return ZONA_BASE.indexOf(ciudad_origen.toLowerCase().trim()) === -1;
  }

  function calcularFechaEntrega(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    const meses = ['enero','febrero','marzo','abril','mayo','junio',
                   'julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return fecha.getDate() + ' de ' + meses[fecha.getMonth()] + ' de ' + fecha.getFullYear();
  }

  function tieneCategoriasSoloAereo(categorias) {
    const norm = categorias.map(c => c.toLowerCase().trim());
    for (let i = 0; i < norm.length; i++) {
      if (CATEGORIAS_SOLO_AEREO.indexOf(norm[i]) !== -1) return true;
    }
    return false;
  }

  function tieneCategoriasTerrestre(categorias) {
    const norm = categorias.map(c => c.toLowerCase().trim());
    for (let i = 0; i < norm.length; i++) {
      if (CATEGORIAS_TERRESTRE.indexOf(norm[i]) !== -1) return true;
    }
    return false;
  }

  function validarInput(d) {
    if (!d || typeof d !== 'object') return 'Body vacío o JSON inválido';

    const numericos = ['peso_bruto', 'largo', 'ancho', 'alto', 'valor_mercancia'];
    for (let i = 0; i < numericos.length; i++) {
      const campo = numericos[i];
      if (d[campo] === undefined || d[campo] === null) return 'Falta el campo: ' + campo;
      if (isNaN(parseFloat(d[campo]))) return 'El campo ' + campo + ' debe ser numérico';
      if (parseFloat(d[campo]) <= 0) return 'El campo ' + campo + ' debe ser mayor que 0';
    }

    if (!d.tipo_mercancia || ['personal', 'comercial'].indexOf(d.tipo_mercancia) === -1)
      return "Campo inválido: tipo_mercancia debe ser 'personal' o 'comercial'";

    if (!Array.isArray(d.categorias) || d.categorias.length === 0)
      return 'Campo inválido: categorias debe ser un arreglo con al menos un elemento';

    const categoriasValidas = CATEGORIAS_SOLO_AEREO.concat(CATEGORIAS_TERRESTRE).concat(CATEGORIAS_NEUTRAS);
    const categoriasNorm = d.categorias.map(c => c.toLowerCase().trim());
    for (let j = 0; j < categoriasNorm.length; j++) {
      const cat = categoriasNorm[j];
      if (categoriasValidas.indexOf(cat) !== -1) continue;
      let encontrada = false;
      for (let k = 0; k < categoriasValidas.length; k++) {
        if (categoriasValidas[k].indexOf(cat) !== -1 || cat.indexOf(categoriasValidas[k]) !== -1) {
          encontrada = true;
          break;
        }
      }
      if (!encontrada) return "Categoría no reconocida: '" + d.categorias[j] + "'";
    }

    if (!d.ciudad_origen || typeof d.ciudad_origen !== 'string')
      return 'Falta el campo: ciudad_origen';

    const origenNorm = d.ciudad_origen.toLowerCase().trim();
    if (ORIGENES_PROHIBIDOS.indexOf(origenNorm) !== -1)
      return 'No se atienden envíos desde ' + d.ciudad_origen + ' como origen';

    if (tieneCategoriasTerrestre(d.categorias)) {
      const mt = MODALIDADES.TERRESTRE;
      if (d.tipo_mercancia !== 'personal'
          || parseFloat(d.peso_bruto) > mt.peso_max_kg
          || parseFloat(d.largo) > mt.dimension_max_cm
          || parseFloat(d.ancho) > mt.dimension_max_cm
          || parseFloat(d.alto) > mt.dimension_max_cm
          || parseFloat(d.valor_mercancia) > mt.valor_max_rs)
        return 'Las categorías indicadas solo pueden enviarse por vía terrestre y el envío excede los límites de esa modalidad';
    }

    return null;
  }

  function validarInputMultiple(d) {
    if (!d || typeof d !== 'object') return 'Body vacío o JSON inválido';

    if (!d.tipo_mercancia || ['personal', 'comercial'].indexOf(d.tipo_mercancia) === -1)
      return "Campo inválido: tipo_mercancia debe ser 'personal' o 'comercial'";

    if (!Array.isArray(d.categorias) || d.categorias.length === 0)
      return 'Campo inválido: categorias debe ser un arreglo con al menos un elemento';

    const categoriasValidas = CATEGORIAS_SOLO_AEREO.concat(CATEGORIAS_TERRESTRE).concat(CATEGORIAS_NEUTRAS);
    const categoriasNorm = d.categorias.map(c => c.toLowerCase().trim());
    for (let j = 0; j < categoriasNorm.length; j++) {
      const cat = categoriasNorm[j];
      if (categoriasValidas.indexOf(cat) !== -1) continue;
      let encontrada = false;
      for (let k = 0; k < categoriasValidas.length; k++) {
        if (categoriasValidas[k].indexOf(cat) !== -1 || cat.indexOf(categoriasValidas[k]) !== -1) {
          encontrada = true;
          break;
        }
      }
      if (!encontrada) return "Categoría no reconocida: '" + d.categorias[j] + "'";
    }

    if (!d.ciudad_origen || typeof d.ciudad_origen !== 'string')
      return 'Falta el campo: ciudad_origen';

    const origenNorm = d.ciudad_origen.toLowerCase().trim();
    if (ORIGENES_PROHIBIDOS.indexOf(origenNorm) !== -1)
      return 'No se atienden envíos desde ' + d.ciudad_origen + ' como origen';

    if (tieneCategoriasTerrestre(d.categorias)) {
      const mt = MODALIDADES.TERRESTRE;
      if (d.tipo_mercancia !== 'personal')
        return 'Las categorías indicadas solo pueden enviarse por vía terrestre y el tipo comercial no aplica';
      for (let b = 0; b < d.boxes.length; b++) {
        const bx = d.boxes[b];
        if (parseFloat(bx.peso_bruto) > mt.peso_max_kg
            || parseFloat(bx.largo) > mt.dimension_max_cm
            || parseFloat(bx.ancho) > mt.dimension_max_cm
            || parseFloat(bx.alto) > mt.dimension_max_cm
            || parseFloat(bx.valor_mercancia) > mt.valor_max_rs)
          return 'Caja ' + (b + 1) + ': las categorías indicadas solo pueden ir por vía terrestre y excede los límites de esa modalidad';
      }
    }

    for (let i = 0; i < d.boxes.length; i++) {
      const box = d.boxes[i];
      const numericos = ['peso_bruto', 'largo', 'ancho', 'alto', 'valor_mercancia'];
      for (let k = 0; k < numericos.length; k++) {
        const campo = numericos[k];
        if (box[campo] === undefined || box[campo] === null) return 'Caja ' + (i + 1) + ': falta el campo ' + campo;
        if (isNaN(parseFloat(box[campo]))) return 'Caja ' + (i + 1) + ': ' + campo + ' debe ser numérico';
        if (parseFloat(box[campo]) <= 0) return 'Caja ' + (i + 1) + ': ' + campo + ' debe ser mayor que 0';
      }
    }

    return null;
  }

  function validarExpress(peso_bruto, largo, ancho, alto, valor_mercancia, tipo_mercancia, categorias) {
    const m = MODALIDADES.EXPRESS;
    if (tipo_mercancia !== 'personal') return false;
    if (peso_bruto > m.peso_max_kg) return false;
    if (largo > m.dimension_max_cm || ancho > m.dimension_max_cm || alto > m.dimension_max_cm) return false;
    if (valor_mercancia > m.valor_max_rs) return false;
    if (tieneCategoriasSoloAereo(categorias)) return false;
    if (tieneCategoriasTerrestre(categorias)) return false;
    return true;
  }

  function validarTerrestre(peso_bruto, largo, ancho, alto, valor_mercancia, tipo_mercancia, categorias) {
    const m = MODALIDADES.TERRESTRE;
    if (tipo_mercancia !== 'personal') return false;
    if (peso_bruto > m.peso_max_kg) return false;
    if (largo > m.dimension_max_cm || ancho > m.dimension_max_cm || alto > m.dimension_max_cm) return false;
    if (valor_mercancia > m.valor_max_rs) return false;
    if (tieneCategoriasSoloAereo(categorias)) return false;
    if (!tieneCategoriasTerrestre(categorias)) return false;
    return true;
  }

  function calcularExpress(peso_bruto, largo, ancho, alto) {
    const m = MODALIDADES.EXPRESS;
    const peso_fact = calcularPesoFacturable(peso_bruto, largo, ancho, alto);
    const kg_fact = Math.min(Math.ceil(peso_fact), m.peso_max_kg);
    const ft3 = calcularFt3(largo, ancho, alto);

    return Math.round(
      TABLA_EXPRESS[kg_fact]
      + calcularValorExtra(ft3)
      + calcularEmbalaje(ft3)
      + calcularGanancia(peso_bruto)
      + m.valor_fijo_rs
      + calcularBoaVista(largo, ancho, alto)
    );
  }

  function calcularTerrestre(peso_bruto, largo, ancho, alto) {
    const m = MODALIDADES.TERRESTRE;
    const kg_base = Math.min(Math.ceil(peso_bruto), m.peso_max_kg);
    const ft3 = calcularFt3(largo, ancho, alto);

    return Math.round(
      TABLA_TERRESTRE[kg_base]
      + calcularValorExtra(ft3)
      + calcularEmbalaje(ft3)
      + calcularGanancia(peso_bruto)
      + m.valor_fijo_rs
      + calcularBoaVista(largo, ancho, alto)
    );
  }

  function calcularAereo(peso_bruto, largo, ancho, alto, valor_mercancia) {
    const m = MODALIDADES.AEREO;
    const peso_fact = calcularPesoFacturable(peso_bruto, largo, ancho, alto);
    const ft3 = calcularFt3(largo, ancho, alto);

    return Math.floor(
      (peso_fact * FORMULAS.flete_aereo_por_kg) + Math.ceil(valor_mercancia * FORMULAS.factor_seguro)
      + Math.ceil(valor_mercancia * FORMULAS.factor_empresa_manaus)
      + calcularValorExtra(ft3)
      + calcularEmbalaje(ft3)
      + calcularBoaVista(largo, ancho, alto)
      + m.cargo_yhonatan_rs
      + calcularGanancia(peso_bruto)
      + m.cargo_pickup_rs
      + m.cargo_manaus_bv_rs
    );
  }

  function calcularTrecho(peso_bruto, largo, ancho, alto, valor_mercancia) {
    const peso_fact = calcularPesoFacturable(peso_bruto, largo, ancho, alto);
    return Math.ceil(
      (peso_fact * FORMULAS.flete_aereo_por_kg) + (valor_mercancia * FORMULAS.factor_seguro)
    );
  }

  function calcularCostoNacional(peso_bruto) {
    const key = Math.max(FORMULAS.nacional_peso_min, Math.min(FORMULAS.nacional_peso_max, Math.floor(peso_bruto)));
    return Math.max(TABLA_NACIONAL_OP1[key], TABLA_NACIONAL_OP2[key]);
  }

  function cotizar(params) {
    const peso_bruto = parseFloat(params.peso_bruto);
    const largo = parseFloat(params.largo);
    const ancho = parseFloat(params.ancho);
    const alto = parseFloat(params.alto);
    const valor_mercancia = parseFloat(params.valor_mercancia);
    const tipo_mercancia = params.tipo_mercancia;
    const categorias = params.categorias;
    const ciudad_origen = params.ciudad_origen;

    let total_principal, modalidad_cfg;

    if (validarExpress(peso_bruto, largo, ancho, alto, valor_mercancia, tipo_mercancia, categorias)) {
      total_principal = calcularExpress(peso_bruto, largo, ancho, alto);
      modalidad_cfg = MODALIDADES.EXPRESS;
    } else if (validarTerrestre(peso_bruto, largo, ancho, alto, valor_mercancia, tipo_mercancia, categorias)) {
      total_principal = calcularTerrestre(peso_bruto, largo, ancho, alto);
      modalidad_cfg = MODALIDADES.TERRESTRE;
    } else {
      total_principal = calcularAereo(peso_bruto, largo, ancho, alto, valor_mercancia);
      modalidad_cfg = MODALIDADES.AEREO;
    }

    let trecho = requiereTrecho(ciudad_origen)
      ? calcularTrecho(peso_bruto, largo, ancho, alto, valor_mercancia)
      : 0;

    if (modalidad_cfg.id === 3 && trecho > 0) {
      modalidad_cfg = MODALIDADES.AEREO_TRECHO;
    }

    return {
      status: 'ok',
      modalidad: modalidad_cfg.id,
      nombre_modalidad: modalidad_cfg.nombre,
      total_final: Math.round(total_principal + trecho),
      tiempo_entrega: modalidad_cfg.tiempo_entrega_dias + ' días',
      fecha_entrega: calcularFechaEntrega(modalidad_cfg.tiempo_entrega_dias),
      con_trecho: trecho > 0,
      costo_nacional: calcularCostoNacional(peso_bruto),
      tasa_dolar: FORMULAS.tasa_dolar || 4.60
    };
  }

  function cotizarMultiple(params) {
    const tipo_mercancia = params.tipo_mercancia;
    const categorias = params.categorias;
    const ciudad_origen = params.ciudad_origen;
    const diasPorId = { 1: MODALIDADES.EXPRESS.tiempo_entrega_dias, 2: MODALIDADES.TERRESTRE.tiempo_entrega_dias, 3: MODALIDADES.AEREO.tiempo_entrega_dias, 4: MODALIDADES.AEREO_TRECHO.tiempo_entrega_dias };

    let totalFinal = 0;
    let totalPeso = 0;
    let maxDias = 0;
    const cajas = [];

    for (let i = 0; i < params.boxes.length; i++) {
      const box = params.boxes[i];
      const r = cotizar({
        peso_bruto: parseFloat(box.peso_bruto),
        largo: parseFloat(box.largo),
        ancho: parseFloat(box.ancho),
        alto: parseFloat(box.alto),
        valor_mercancia: parseFloat(box.valor_mercancia),
        tipo_mercancia: tipo_mercancia,
        categorias: categorias,
        ciudad_origen: ciudad_origen
      });

      totalFinal += r.total_final;
      totalPeso += parseFloat(box.peso_bruto);
      if (diasPorId[r.modalidad] > maxDias) maxDias = diasPorId[r.modalidad];

      cajas.push({
        caja: i + 1,
        modalidad: r.modalidad,
        nombre_modalidad: r.nombre_modalidad,
        total: r.total_final,
        con_trecho: r.con_trecho
      });
    }

    return {
      status: 'ok',
      total_final: Math.round(totalFinal),
      tiempo_entrega: maxDias + ' días',
      fecha_entrega: calcularFechaEntrega(maxDias),
      costo_nacional: calcularCostoNacional(totalPeso),
      tasa_dolar: FORMULAS.tasa_dolar || 4.60,
      cajas: cajas
    };
  }

  return {
    cotizar,
    cotizarMultiple,
    validarInput,
    validarInputMultiple
  };
}
