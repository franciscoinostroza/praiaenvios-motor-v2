const TEXTOS = {
  es: {
    intro_ve: 'Calculamos tu cotización desde Brasil hacia Venezuela con Praia Envíos y UPS',
    intro_ve_recolecta: 'Calculamos tu cotización desde Brasil hacia Venezuela con recolecta incluida',
    intro_ve_trecho: 'Calculamos tu cotización desde {origen} hacia Venezuela, usando trecho nacional hasta Curitiba + Praia Envíos + UPS',
    intro_ve_base: 'Calculamos tu cotización usando Curitiba como base logística de Praia Envíos',
    intro_intl: 'Calculamos tu cotización UPS desde Brasil hacia {pais}',
    intro_intl_trecho: 'Calculamos tu cotización UPS desde {origen} hacia {pais}, incluyendo trecho nacional hasta Curitiba',
    intro_intl_recolecta: 'Calculamos tu cotización UPS desde Brasil hacia {pais} con recolecta incluida',
    intro_compra_ve: 'Calculamos tu cotización de compra asistida + envío internacional desde Brasil',
    intro_compra_intl: 'Calculamos tu cotización de compra asistida + envío UPS desde Brasil hacia {pais}',
    titulo_datos: 'DATOS DEL ENVÍO',
    pais_origen: 'Brasil',
    base_calculo: 'Curitiba',
    sin_trecho_aviso: 'Actualmente no tenemos trecho automático disponible desde esa ciudad.\n\nPuedes enviarnos tu caja a nuestra base logística en Curitiba usando Correos o cualquier transportadora de tu confianza. Cuando llegue a Curitiba, calculamos el envío internacional desde nuestra base.',
    titulo_trecho: 'TRECHO NACIONAL EN BRASIL',
    trecho_explicacion: 'Tu ciudad de origen está fuera de la base logística principal. Se incluye el trecho nacional hasta Curitiba.',
    titulo_recolecta: 'RECOLECTA',
    recolecta_explicacion: 'La recolecta fue solicitada y debe estar incluida en los totales mostrados para Praia Envíos y UPS.',
    titulo_praia: 'SERVICIO PRAIA ENVÍOS',
    praia_explicacion: 'Tu pago cubre el servicio internacional hasta Venezuela y la entrega a una transportadora local como MRW, Zoom, Aerocav o LAE.\nSolo pagarás aparte el envío nacional dentro de Venezuela, directamente a esa transportadora y en bolívares a tasa BCV.\nNo pagas nada más por el servicio internacional.',
    modalidad: 'Modalidad aplicada',
    tiempo_entrega: 'Tiempo de entrega',
    tiempo_estimado: 'Tiempo estimado aproximado',
    fecha_estimada: 'Fecha estimada de entrega',
    direccion_entrega: 'DIRECCIÓN DE ENTREGA EN VENEZUELA',
    costo_nacional: 'COSTO NACIONAL',
    costo_nacional_label: 'Costo nacional aproximado',
    titulo_ups: 'SERVICIO UPS INTERNACIONAL',
    ups_disclaimer: 'UPS cubre el transporte internacional, pero no incluye los cargos o impuestos que puedan generarse al entrar al país destino.\nSi la aduana aplica algún pago, el destinatario deberá cancelarlo localmente para liberar la mercancía.',
    ups_sin_cotizaciones: 'No conseguimos opciones UPS disponibles con los datos informados.\n\nPosibles motivos:\n* Código postal incompleto o no válido.\n* Dirección de destino no reconocida.\n* Peso o medidas fuera del rango permitido.\n* Producto con restricción internacional.\n\nPuedes revisar el código postal, dirección, peso, medidas o producto para intentar cotizar nuevamente.',
    titulo_opciones_ups: 'OPCIONES DE ENVÍO',
    ups_servicio: 'Servicio UPS',
    ups_tiempo: 'Tiempo estimado UPS',
    ups_total_reales: 'Total en Reales',
    ups_total_usd: 'Alternativa en Dólares',
    ups_nota_margen: 'Estos valores ya incluyen el 40% de ganancia Praia sobre el precio UPS devuelto por el sistema.',
    titulo_compra: 'PRODUCTOS COTIZADOS',
    titulo_no_disponibles: 'PRODUCTOS NO DISPONIBLES',
    no_disponibles_nota: 'Los productos sin stock o no disponibles no fueron tomados en cuenta para el cálculo de compra, caja, valor declarado ni flete.',
    titulo_costo_compra: 'COSTO APROXIMADO DE LA COMPRA',
    total_compra: 'Total compra aproximado',
    titulo_cajas: 'CAJAS SELECCIONADAS',
    valor_declarado: 'Valor total declarado',
    metodos_pago: 'PIX, Zelle, Binance USDT, Tarjeta de Crédito, PayPal',
    footer: 'Escribe *Menú* para volver al inicio o dime qué producto, caja o dirección deseas cambiar para cotizar nuevamente.',
    total_con_trecho: 'Total Praia Envíos con trecho incluido',
    total_con_recolecta: 'Total Praia Envíos con recolecta incluida',
    total_desde_curitiba: 'Total Praia Envíos desde Curitiba',
    con_trecho: 'Con trecho',
    sin_trecho: 'Sin trecho',
    trecho_incluido_ups: 'TRECHO INCLUIDO EN UPS',
    recolecta_incluida_ups: 'RECOLECTA INCLUIDA EN UPS',
    trecho_suma_ups: 'Este valor debe sumarse dentro del precio final de cada opción UPS.',
    recolecta_suma_ups: 'Este valor debe sumarse dentro del precio final de cada opción UPS.',
    trecho_mas_recolecta_suma_ups: 'Estos valores deben sumarse dentro del precio final de cada opción UPS.',
    formula_ups: 'Fórmula interna UPS: (precio UPS devuelto por el sistema + 40% ganancia Praia) + valor del trecho.',
    formula_ups_recolecta: 'Fórmula interna UPS: (precio UPS devuelto por el sistema + 40% ganancia Praia) + valor de la recolecta.',
    sin_cobertura_titulo: 'ORIGEN FUERA DE COBERTURA DE TRECHO',
    sin_cobertura_explicacion: 'Tu ciudad de origen no tiene cobertura de trecho LATAM Cargo disponible para este flujo, o no podemos prometer ese servicio desde esa ciudad.\n\nPara continuar, deberás enviar tu caja hasta nuestra base logística en Curitiba usando Correos o cualquier transportadora de tu confianza.',
    direccion_base_curitiba: 'Rua Padre Leonardo Nunes 30, Loja 02, CEP 80330-320, Bairro Portão, Curitiba, Paraná, Brasil. A nombre de: Praia Envíos.',
    sin_trecho_nota: 'En este caso no se aplica costo de trecho ni recolecta en Praia Envíos ni en UPS. La cotización se calcula desde Curitiba.',
    agencia_default: 'Tu envío será entregado para retiro en la agencia más cercana a tu destino.',
    producto_restringido: 'Producto no permitido para envío',
    restriccion_explicacion: 'No podemos cotizar este envío porque el producto informado tiene restricción o no está permitido para transporte internacional.',
    motivo: 'Motivo',
    trecho_pendiente: 'Cotización pendiente de trecho',
    trecho_pendiente_explicacion: 'Detectamos que tu ciudad de origen requiere trecho nacional hasta Curitiba, pero el sistema no devolvió el valor del trecho.',
    todos_no_disponibles: 'No pudimos generar la cotización',
    todos_no_disponibles_explicacion: 'Los productos enviados aparecen como no disponibles, sin stock o no tienen información suficiente para calcular la compra y el envío.',
    puedes_enviar_alternativos: 'Puedes enviarme nuevos links, nuevas fotos o productos alternativos para cotizar nuevamente.',
    caja: 'Caja',
    dias: 'días',
    reales: 'R$',
    dolares: '$',
    usd: 'USD',
    bs: 'Bs'
  },
  pt: {
    intro_ve: 'Calculamos sua cotação do Brasil para a Venezuela com Praia Envíos e UPS',
    intro_ve_trecho: 'Calculamos sua cotação de {origen} para a Venezuela, usando trecho nacional até Curitiba + Praia Envíos + UPS',
    intro_intl: 'Calculamos sua cotação UPS do Brasil para {pais}',
    titulo_datos: 'DADOS DO ENVIO',
    pais_origen: 'Brasil',
    titulo_trecho: 'TRECHO NACIONAL NO BRASIL',
    titulo_praia: 'SERVIÇO PRAIA ENVÍOS',
    praia_explicacion: 'Seu pagamento cobre o serviço internacional até a Venezuela e a entrega a uma transportadora local como MRW, Zoom, Aerocav ou LAE.',
    modalidad: 'Modalidade aplicada',
    titulo_ups: 'SERVIÇO UPS INTERNACIONAL',
    titulo_opciones_ups: 'OPÇÕES DE ENVIO',
    metodos_pago: 'PIX, Zelle, Binance USDT, Cartão de Crédito, PayPal',
    footer: 'Escreva *Menu* para voltar ao início ou diga qual produto, caixa ou endereço deseja alterar para cotar novamente.',
    caja: 'Caixa',
    dias: 'dias',
    reales: 'R$',
    dolares: '$',
    usd: 'USD',
    bs: 'Bs'
  },
  en: {
    intro_ve: 'We calculated your quote from Brazil to Venezuela with Praia Envíos and UPS',
    intro_intl: 'We calculated your UPS quote from Brazil to {pais}',
    titulo_datos: 'SHIPMENT DETAILS',
    pais_origen: 'Brazil',
    titulo_praia: 'PRAIA ENVÍOS SERVICE',
    modalidad: 'Applied shipping method',
    titulo_ups: 'UPS INTERNATIONAL SERVICE',
    titulo_opciones_ups: 'SHIPPING OPTIONS',
    metodos_pago: 'PIX, Zelle, Binance USDT, Credit Card, PayPal',
    footer: 'Write *Menu* to go back to the beginning or tell me which product, box or address you want to change to quote again.',
    caja: 'Box',
    dias: 'days',
    reales: 'R$',
    dolares: '$',
    usd: 'USD',
    bs: 'Bs'
  }
};

function t(clave, lang, vars) {
  const textos = TEXTOS[lang] || TEXTOS.es;
  let val = textos[clave] !== undefined ? textos[clave] : (TEXTOS.es[clave] || '');
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      val = val.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
    }
  }
  return val;
}

const SEP = '\n━━━━━━━━━━━━━━━━━━\n';
const LINE = '\n────────────────────\n';

function formatMonedaBR(valor) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonedaVE(valor) {
  return Number(valor).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function bloqueAprobacion() {
  return '✅ *Cotización aproximada lista*\n';
}

export function bloqueAprobacionIntl() {
  return '✅ *Cotización internacional lista*\n';
}

export function bloqueIntro(datos, flags, lang) {
  const paisDestino = flags?.pais_destino || '';
  const origen = datos.origen || flags?.origen_ciudad || 'Curitiba';
  const esVE = flags?.es_venezuela;
  const esCompra = flags?.es_compra_assistida;
  const tieneRecolecta = flags?.tiene_recolecta;
  const tieneTrecho = flags?.trecho?.latam_disponible;
  const requiereEnvio = flags?.requiere_envio_a_curitiba;

  if (esCompra) {
    if (esVE) return t('intro_compra_ve', lang) + ' 🇧🇷🛒📦🇻🇪\n';
    return t('intro_compra_intl', lang, { pais: paisDestino }) + ' 🇧🇷🛒✈️🌎\n';
  }
  if (esVE) {
    if (tieneRecolecta) return t('intro_ve_recolecta', lang) + ' 🇧🇷🚚📦🇻🇪\n';
    if (tieneTrecho) return t('intro_ve_trecho', lang, { origen }) + ' 🇧🇷📦🇻🇪\n';
    if (requiereEnvio) return t('intro_ve_base', lang) + ' 🇧🇷📦🇻🇪\n';
    return t('intro_ve', lang) + ' 🇧🇷📦🇻🇪\n';
  }
  if (tieneRecolecta) return t('intro_intl_recolecta', lang, { pais: paisDestino }) + ' 🇧🇷🚚✈️🌎\n';
  if (tieneTrecho) return t('intro_intl_trecho', lang, { origen, pais: paisDestino }) + ' 🇧🇷✈️🌎\n';
  return t('intro_intl', lang, { pais: paisDestino }) + ' 🇧🇷✈️🌎\n';
}

export function bloqueDatosEnvio(datos, flags, lang) {
  const paisDestino = flags?.pais_destino || '';
  const esVE = flags?.es_venezuela;
  const origen = datos.origen || datos.ciudad_origen || flags?.origen_ciudad || 'Curitiba';
  const direccionOrigen = datos.direccion_origen || '';
  const ciudadDestino = datos.destino_ciudad || datos.ciudad_destino || '';
  const direccionDestino = datos.direccion_destino || '';
  const codigoPostal = datos.codigo_postal_destino || '';
  const categoria = datos.categoria || (Array.isArray(datos.categorias) ? datos.categorias.join(', ') : '') || '';
  const tipoMercancia = datos.tipo_mercancia || '';
  const numeroCajas = Array.isArray(datos.boxes) ? datos.boxes.length : (datos.numero_cajas || 0);
  const detalleCajas = datos.resumen_cajas || '';
  const valorTotal = datos.valor_total_mercancia || 0;
  const baseCalculo = datos.origen_base_calculo || (flags?.trecho?.origen_fuera_zona_base ? t('base_calculo', lang) : origen);

  let salida = '';
  salida += SEP;
  salida += '🔎 *' + t('titulo_datos', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';

  salida += '🇧🇷 *País de origen:* ' + t('pais_origen', lang) + '\n';
  salida += '🏙️ *Ciudad de origen:* ' + origen + '\n';
  if (direccionOrigen) salida += '📍 *Dirección de origen:* ' + direccionOrigen + '\n';
  salida += '📦 *Ciudad base de cálculo:* ' + baseCalculo + '\n';
  salida += '\n';

  if (esVE) {
    salida += '🌍 *País de destino:* Venezuela\n';
  } else if (paisDestino) {
    salida += '🌍 *País de destino:* ' + paisDestino + '\n';
  }
  if (ciudadDestino) salida += '🏙️ *Ciudad de destino:* ' + ciudadDestino + '\n';
  if (direccionDestino) salida += '🏠 *Dirección de destino:* ' + direccionDestino + '\n';
  if (codigoPostal) salida += '🏷️ *Código postal destino:* ' + codigoPostal + '\n';
  salida += '\n';

  if (categoria) salida += '📦 *Producto que envías:* ' + categoria + '\n';
  if (tipoMercancia) salida += '🚚 *Tipo de envío:* ' + tipoMercancia + '\n';
  if (numeroCajas) salida += '📦 *Cantidad de cajas:* ' + numeroCajas + '\n';
  if (detalleCajas) salida += '📦 *Detalle de cajas:* ' + detalleCajas + '\n';
  salida += '💰 *Valor total declarado:* R$ ' + formatMonedaBR(valorTotal) + ' o $' + formatMonedaBR(valorTotal / (datos._tasa_dolar || 5.48)) + ' USD\n';

  return salida;
}

export function bloqueSinCoberturaTrecho(flags, lang) {
  let salida = '';
  salida += SEP;
  salida += '⚠️ *' + t('sin_cobertura_titulo', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  salida += t('sin_cobertura_explicacion', lang) + '\n\n';
  salida += '📍 *Base Praia Envíos Curitiba:*\n';
  salida += (flags?.direccion_base || t('direccion_base_curitiba', lang)) + '\n\n';
  salida += '📌 ' + t('sin_trecho_nota', lang) + '\n';
  return salida;
}

export function bloqueTrecho(trechoInfo, valorTrechoReales, valorTrechoUSD, lang) {
  if (!trechoInfo || !trechoInfo.requiere_trecho) return '';
  let salida = '';
  salida += SEP;
  salida += '🇧🇷✈️ *' + t('titulo_trecho', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  salida += t('trecho_explicacion', lang) + '\n\n';
  salida += '* Ciudad de origen del trecho:* ' + (trechoInfo.ciudad || '') + '\n';
  salida += '* Código IATA LATAM Cargo:* ' + (trechoInfo.codigo_iata || '') + '\n';
  if (trechoInfo.direccion_latam) salida += '* Dirección LATAM Cargo:* ' + trechoInfo.direccion_latam + '\n';
  if (valorTrechoReales) salida += '* Valor del trecho:* ' + t('reales', lang) + ' ' + formatMonedaBR(valorTrechoReales) + ' o ' + t('dolares', lang) + formatMonedaBR(valorTrechoUSD) + ' ' + t('usd', lang) + '\n';
  salida += '* Modalidad de trecho:* 4\n\n';
  salida += '📌 El valor del trecho debe estar sumado al total Praia Envíos y también dentro de cada opción UPS mostrada.\n';
  salida += '📌 ' + t('formula_ups', lang) + '\n';
  return salida;
}

export function bloqueRecolecta(valorRecolectaReales, valorRecolectaUSD, lang) {
  if (!valorRecolectaReales) return '';
  let salida = '';
  salida += SEP;
  salida += '🇧🇷🚚 *' + t('titulo_recolecta', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  salida += '* Valor de la recolecta:* ' + t('reales', lang) + ' ' + formatMonedaBR(valorRecolectaReales) + ' o ' + t('dolares', lang) + formatMonedaBR(valorRecolectaUSD) + ' ' + t('usd', lang) + '\n';
  salida += '📌 ' + t('recolecta_explicacion', lang) + '\n';
  salida += '📌 ' + t('formula_ups_recolecta', lang) + '\n';
  return salida;
}

export function bloquePraia(praiaResult, datos, flags, lang) {
  if (!praiaResult) return '';
  const esVE = flags?.es_venezuela;
  if (!esVE) return '';

  const totalReales = praiaResult.total_final || 0;
  const tasa = praiaResult.tasa_dolar || 5.48;
  const totalUSD = (totalReales / tasa).toFixed(2);
  const modalidad = praiaResult.modalidad || (praiaResult.cajas?.[0]?.modalidad);
  const tieneTrecho = flags?.trecho?.requiere_trecho;
  const tieneRecolecta = flags?.tiene_recolecta;
  const requiereEnvio = flags?.requiere_envio_a_curitiba;
  const tieneCajasMultiples = praiaResult.cajas && praiaResult.cajas.length > 1;
  const tiempo = praiaResult.tiempo_entrega || '';
  const fechaEntrega = praiaResult.fecha_entrega || '';
  const costoNacional = praiaResult.costo_nacional || 0;
  const costoFormateado = formatMonedaVE(costoNacional);
  const agencia = datos.agencia?.direccion || t('agencia_default', lang);
  const agenciaTipo = datos.agencia?.tipo ? '(' + datos.agencia.tipo + ')' : '';

  let modalidadTexto;
  if (tieneCajasMultiples) {
    modalidadTexto = '';
    for (const c of praiaResult.cajas) {
      const trechoTxt = c.con_trecho ? ' (' + t('con_trecho', lang) + ')' : '';
      modalidadTexto += '* ' + t('caja', lang) + ' ' + c.caja + ': ' + (c.nombre_modalidad || 'Modalidad ' + c.modalidad) + ' — R$ ' + c.total + trechoTxt + '\n';
    }
  } else {
    const modNum = modalidad || '';
    modalidadTexto = '* ' + t('modalidad', lang) + ':* ' + modNum;
  }

  let totalLabel = '*Total Praia Envíos:*';
  if (tieneTrecho) totalLabel = '*Total Praia Envíos con trecho incluido:*';
  else if (tieneRecolecta) totalLabel = '*Total Praia Envíos con recolecta incluida:*';
  else if (requiereEnvio) totalLabel = '*Total Praia Envíos desde Curitiba:*';

  let salida = '';
  salida += SEP;
  salida += '🇧🇷📦 *' + t('titulo_praia', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  salida += t('praia_explicacion', lang) + '\n\n';
  salida += '🚀 *' + t('modalidad', lang) + ':* ' + modalidad + '\n';
  salida += '💰 ' + totalLabel + ' ' + t('reales', lang) + ' ' + formatMonedaBR(totalReales) + ' o ' + t('dolares', lang) + totalUSD + ' ' + t('usd', lang) + '\n\n';
  salida += '📦 *' + t('tiempo_entrega', lang).toUpperCase() + '*\n';
  if (tiempo) salida += '* ' + t('tiempo_estimado', lang) + ': ' + tiempo + '\n';
  if (fechaEntrega) salida += '* ' + t('fecha_estimada', lang) + ': ' + fechaEntrega + '\n';
  salida += '\n';
  salida += '📍 *' + t('direccion_entrega', lang).toUpperCase() + '*\n';
  salida += '* ' + agencia + (agenciaTipo ? ' ' + agenciaTipo : '') + '\n\n';
  salida += '🇻🇪 *' + t('costo_nacional', lang).toUpperCase() + '*\n';
  salida += '* ' + t('costo_nacional_label', lang) + ': ' + t('bs', lang) + ' ' + costoFormateado + '\n';

  return salida;
}

export function bloqueUps(upsResult, datos, flags, tasaDolar, tasaUpsOffset, porcentajeGanancia, lang) {
  if (!upsResult) return '';
  const rates = upsResult.rates || [];
  const esVE = flags?.es_venezuela;
  const paisDestino = flags?.pais_destino || '';
  const tieneTrecho = flags?.trecho?.requiere_trecho;
  const tieneRecolecta = flags?.tiene_recolecta;
  const trechoValorUSD = flags?.valor_trecho_usd || 0;
  const recolectaValorUSD = flags?.valor_recolecta_usd || 0;

  let salida = '';
  salida += SEP;
  salida += '✈️ *' + t('titulo_ups', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  salida += '*' + t('titulo_ups', lang) + '* 🌎\n\n';
  salida += t('ups_disclaimer', lang) + '\n\n';

  if (tieneTrecho) {
    salida += '🇧🇷✈️ *' + t('trecho_incluido_ups', lang).toUpperCase() + '*\n';
    salida += '* Valor del trecho:* ' + t('reales', lang) + ' ' + formatMonedaBR(flags?.valor_trecho_reales || 0) + ' o ' + t('dolares', lang) + formatMonedaBR(trechoValorUSD) + ' ' + t('usd', lang) + '\n';
    salida += '📌 ' + t('trecho_suma_ups', lang) + '\n';
    salida += '📌 ' + t('formula_ups', lang) + '\n\n';
  }

  if (tieneRecolecta) {
    salida += '🇧🇷🚚 *' + t('recolecta_incluida_ups', lang).toUpperCase() + '*\n';
    salida += '* Valor de la recolecta:* ' + t('reales', lang) + ' ' + formatMonedaBR(flags?.valor_recolecta_reales || 0) + ' o ' + t('dolares', lang) + formatMonedaBR(recolectaValorUSD) + ' ' + t('usd', lang) + '\n';
    salida += '📌 ' + t('recolecta_suma_ups', lang) + '\n';
    salida += '📌 ' + t('formula_ups_recolecta', lang) + '\n\n';
  }

  const tds = datos || {};
  const origen = tds.pais_origen || 'BR';
  const destino = tds.pais_destino || paisDestino || '';
  const ciudadOrigen = tds.ciudad_origen || '';
  const zipOrigen = tds.codigo_postal_origen || '';
  const ciudadDestino = tds.ciudad_destino || '';
  const zipDestino = tds.codigo_postal_destino || '';

  const banderas = {
    'BR': '🇧🇷', 'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪', 'CO': '🇨🇴',
    'EC': '🇪🇨', 'BO': '🇧🇴', 'PY': '🇵🇾', 'UY': '🇺🇾', 'MX': '🇲🇽',
    'VE': '🇻🇪', 'US': '🇺🇸', 'ES': '🇪🇸', 'PT': '🇵🇹'
  };

  salida += '*Origen:* ' + (banderas[origen] || '🌎') + ' ' + origen;
  if (ciudadOrigen) salida += ', ' + ciudadOrigen;
  if (zipOrigen) salida += ' - ' + zipOrigen;
  salida += '\n';

  salida += '*Destino:* ' + (banderas[destino] || '🌎') + ' ' + destino;
  if (ciudadDestino) salida += ', ' + ciudadDestino;
  if (zipDestino) salida += ' - ' + zipDestino;
  salida += '\n\n';

  if (Array.isArray(tds.boxes) && tds.boxes.length > 0) {
    const partes = [];
    for (let i = 0; i < tds.boxes.length; i++) {
      const b = tds.boxes[i];
      partes.push(t('caja', lang) + ' ' + (i + 1) + ': ' + b.largo + 'x' + b.ancho + 'x' + b.alto + ' cm, ' + b.peso_bruto + ' kg' + (b.valor_mercancia ? ', R$ ' + b.valor_mercancia : ''));
    }
    salida += '*Paquete:* ' + partes.join(' | ') + '\n\n';
  }

  if (rates.length === 0) {
    salida += t('ups_sin_cotizaciones', lang) + '\n';
  } else {
    salida += '*' + t('titulo_opciones_ups', lang).toUpperCase() + '*\n';
    for (let i = 0; i < Math.min(rates.length, 5); i++) {
      const rate = rates[i];
      const precioBase = parseFloat(rate.amount) || 0;
      const margen = 1 + (porcentajeGanancia / 100);
      const precioConMargen = precioBase * margen;
      const totalUSD = precioConMargen + trechoValorUSD + recolectaValorUSD;
      const tasaUPS = tasaDolar + tasaUpsOffset;
      const totalBRL = totalUSD * tasaUPS;
      const diasTexto = rate.days ? ' (~' + rate.days + ' ' + t('dias', lang) + ')' : '';

      salida += '\n🇺🇸 UPS — ' + rate.service + '\n';
      salida += '* ' + t('ups_servicio', lang) + ':* ' + rate.service + '\n';
      salida += '* ' + t('ups_tiempo', lang) + ':* ' + (rate.duration || diasTexto) + '\n';
      salida += '* ' + t('ups_total_reales', lang) + ':* ' + t('reales', lang) + ' ' + formatMonedaBR(totalBRL) + '\n';
      salida += '* ' + t('ups_total_usd', lang) + ':* ' + t('dolares', lang) + formatMonedaBR(totalUSD) + ' ' + t('usd', lang) + '\n';
    }
    salida += '\n';
    salida += '📌 ' + t('ups_nota_margen', lang) + '\n';
  }

  return salida;
}

export function bloqueCompra(productosCotizados, totalCompraReales, totalCompraUSD, lang) {
  if (!productosCotizados || productosCotizados.length === 0) return '';
  let salida = '';
  salida += SEP;
  salida += '🛒 *' + t('titulo_compra', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  if (typeof productosCotizados === 'string') {
    salida += productosCotizados + '\n';
  } else {
    for (const prod of productosCotizados) {
      salida += '* ' + (prod.nombre || prod.producto || 'Producto') + (prod.precio ? ' — R$ ' + formatMonedaBR(prod.precio) : '') + '\n';
    }
  }
  salida += '\n';
  salida += SEP;
  salida += '💰 *' + t('titulo_costo_compra', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  salida += '* ' + t('total_compra', lang) + ':* ' + t('reales', lang) + ' ' + formatMonedaBR(totalCompraReales) + ' o ' + t('dolares', lang) + formatMonedaBR(totalCompraUSD) + ' ' + t('usd', lang) + '\n';
  return salida;
}

export function bloqueProductosNoDisponibles(productos, lang) {
  if (!productos || productos.length === 0) return '';
  let salida = '';
  salida += SEP;
  salida += '⚠️ *' + t('titulo_no_disponibles', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  if (typeof productos === 'string') {
    salida += productos + '\n';
  } else {
    for (const prod of productos) {
      salida += '* ' + (prod.nombre || prod.producto || 'Producto') + '\n';
    }
  }
  salida += '\n📌 ' + t('no_disponibles_nota', lang) + '\n';
  return salida;
}

export function bloqueCajas(datos, praiaResult, lang) {
  const resumenCajas = datos.resumen_cajas || '';
  const numeroCajas = Array.isArray(datos.boxes) ? datos.boxes.length : (datos.numero_cajas || 0);
  const valorTotal = datos.valor_total_mercancia || 0;
  const tasa = praiaResult?.tasa_dolar || 5.48;

  if (!resumenCajas && !numeroCajas) return '';
  let salida = '';
  salida += SEP;
  salida += '📦 *' + t('titulo_cajas', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  if (resumenCajas) salida += resumenCajas + '\n';
  salida += '\n* ' + t('valor_declarado', lang) + ':* ' + t('reales', lang) + ' ' + formatMonedaBR(valorTotal) + ' o ' + t('dolares', lang) + formatMonedaBR(valorTotal / tasa) + ' ' + t('usd', lang) + '\n';
  return salida;
}

export function bloqueMetodosPago(lang) {
  let salida = '';
  salida += SEP;
  salida += '💳 *MÉTODOS DE PAGO*\n';
  salida += SEP;
  salida += '\n';
  salida += t('metodos_pago', lang) + '\n\n';
  salida += t('footer', lang) + '\n';
  return salida;
}

export function bloqueRestriccion(categoria, motivo, lang) {
  let salida = '';
  salida += '⚠️ *' + t('producto_restringido', lang) + '*\n\n';
  salida += t('restriccion_explicacion', lang) + '\n\n';
  salida += '📦 *Producto:* ' + categoria + '\n';
  if (motivo) salida += '📌 *' + t('motivo', lang) + ':* ' + motivo + '\n';
  salida += '\nPuedes enviarme otro producto para verificar o cotizar nuevamente.\n\n';
  salida += t('footer', lang) + '\n';
  return salida;
}

export function bloqueTrechoPendiente(trechoInfo, lang) {
  let salida = '';
  salida += '⚠️ *' + t('trecho_pendiente', lang) + '*\n\n';
  salida += t('trecho_pendiente_explicacion', lang) + '\n\n';
  if (trechoInfo) {
    salida += '* Ciudad de origen del trecho:* ' + (trechoInfo.ciudad || '') + '\n';
    salida += '* Código IATA LATAM Cargo:* ' + (trechoInfo.codigo_iata || '') + '\n';
    if (trechoInfo.direccion_latam) salida += '* Dirección LATAM Cargo:* ' + trechoInfo.direccion_latam + '\n';
  }
  salida += '\nPara mostrar el total final correctamente, el motor debe devolver el valor del trecho en Reales y en Dólares.\n\n';
  salida += t('footer', lang) + '\n';
  return salida;
}

export function bloqueTodosNoDisponibles(productos, lang) {
  let salida = '';
  salida += '⚠️ *' + t('todos_no_disponibles', lang) + '*\n\n';
  salida += t('todos_no_disponibles_explicacion', lang) + '\n\n';
  salida += SEP;
  salida += '⚠️ *' + t('titulo_no_disponibles', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  if (typeof productos === 'string') {
    salida += productos + '\n';
  } else if (Array.isArray(productos)) {
    for (const prod of productos) {
      salida += '* ' + (prod.nombre || prod.producto || 'Producto') + '\n';
    }
  }
  salida += '\n📌 ' + t('no_disponibles_nota', lang) + '\n\n';
  salida += t('puedes_enviar_alternativos', lang) + '\n\n';
  salida += t('footer', lang) + '\n';
  return salida;
}

export function bloqueFormato12UpsSinCotizaciones(lang) {
  let salida = '';
  salida += SEP;
  salida += '✈️ *' + t('titulo_ups', lang).toUpperCase() + '*\n';
  salida += SEP;
  salida += '\n';
  salida += t('ups_disclaimer', lang) + '\n\n';
  salida += t('ups_sin_cotizaciones', lang) + '\n\n';
  salida += t('footer', lang) + '\n';
  return salida;
}
