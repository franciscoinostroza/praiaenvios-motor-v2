const ESTIMACIONES = {
  'celular':   { largo: 20, ancho: 10, alto: 5,  peso: 0.5 },
  'telefono':  { largo: 20, ancho: 10, alto: 5,  peso: 0.5 },
  'teléfono':  { largo: 20, ancho: 10, alto: 5,  peso: 0.5 },
  'notebook':  { largo: 40, ancho: 30, alto: 5,  peso: 2.5 },
  'laptop':    { largo: 40, ancho: 30, alto: 5,  peso: 2.5 },
  'tablet':    { largo: 28, ancho: 20, alto: 3,  peso: 0.7 },
  'zapatilla': { largo: 35, ancho: 25, alto: 15, peso: 1 },
  'zapato':    { largo: 35, ancho: 25, alto: 15, peso: 1 },
  'tenis':     { largo: 35, ancho: 25, alto: 15, peso: 1 },
  'tênis':     { largo: 35, ancho: 25, alto: 15, peso: 1 },
  'camiseta':  { largo: 30, ancho: 25, alto: 5,  peso: 0.3 },
  'camisa':    { largo: 30, ancho: 25, alto: 5,  peso: 0.3 },
  'remera':    { largo: 30, ancho: 25, alto: 5,  peso: 0.3 },
  'pantalon':  { largo: 35, ancho: 30, alto: 5,  peso: 0.5 },
  'pantalón':  { largo: 35, ancho: 30, alto: 5,  peso: 0.5 },
  'jeans':     { largo: 35, ancho: 30, alto: 5,  peso: 0.6 },
  'perfume':   { largo: 10, ancho: 8,  alto: 15, peso: 0.3 },
  'reloj':     { largo: 12, ancho: 12, alto: 8,  peso: 0.3 },
  'relógio':   { largo: 12, ancho: 12, alto: 8,  peso: 0.3 },
  'auricular': { largo: 15, ancho: 10, alto: 5,  peso: 0.3 },
  'fone':      { largo: 15, ancho: 10, alto: 5,  peso: 0.3 },
  'headphone': { largo: 20, ancho: 18, alto: 8,  peso: 0.4 },
  'libro':     { largo: 25, ancho: 18, alto: 4,  peso: 0.8 },
  'juguete':   { largo: 30, ancho: 20, alto: 15, peso: 1 },
  'brinquedo': { largo: 30, ancho: 20, alto: 15, peso: 1 },
  'cafetera':  { largo: 30, ancho: 25, alto: 35, peso: 3 },
  'liquidificador': { largo: 25, ancho: 20, alto: 40, peso: 3 },
  'licuadora': { largo: 25, ancho: 20, alto: 40, peso: 3 },
  'electrodomestico': { largo: 35, ancho: 30, alto: 30, peso: 3 },
  'repuesto':  { largo: 20, ancho: 15, alto: 10, peso: 0.5 },
  'pieza':     { largo: 20, ancho: 15, alto: 10, peso: 0.5 },
  'peça':      { largo: 20, ancho: 15, alto: 10, peso: 0.5 },
  'herramienta': { largo: 30, ancho: 15, alto: 10, peso: 1 },
  'ferramenta':  { largo: 30, ancho: 15, alto: 10, peso: 1 },
  'accesorio':   { largo: 15, ancho: 10, alto: 5,  peso: 0.2 },
  'acessório':   { largo: 15, ancho: 10, alto: 5,  peso: 0.2 },
  'cosmetico':   { largo: 10, ancho: 8,  alto: 12, peso: 0.3 },
  'cosmético':   { largo: 10, ancho: 8,  alto: 12, peso: 0.3 },
  'suplemento':  { largo: 20, ancho: 15, alto: 15, peso: 1 }
};

const CAJAS_ESTANDAR = [
  { largo: 25, ancho: 16, alto: 12 },
  { largo: 29, ancho: 16, alto: 29 },
  { largo: 30, ancho: 30, alto: 30 },
  { largo: 35, ancho: 44, alto: 30 },
  { largo: 48, ancho: 40, alto: 35 },
  { largo: 38, ancho: 45, alto: 52 }
];

function estimarDimensiones(titulo) {
  titulo = (titulo || '').toLowerCase();
  for (var key in ESTIMACIONES) {
    if (titulo.includes(key)) return ESTIMACIONES[key];
  }
  return { largo: 30, ancho: 30, alto: 30, peso: 1 };
}

function consolidarBoxes(datos) {
  if (!Array.isArray(datos.boxes) || datos.boxes.length < 2) return datos;

  var scrapeados = [];
  var directos   = [];
  for (var i = 0; i < datos.boxes.length; i++) {
    if (datos.boxes[i].url) scrapeados.push(datos.boxes[i]);
    else directos.push(datos.boxes[i]);
  }

  if (scrapeados.length < 2) return datos;

  var volumenTotal = 0, pesoTotal = 0, valorTotal = 0;
  for (var s = 0; s < scrapeados.length; s++) {
    var b = scrapeados[s];
    volumenTotal += b.largo * b.ancho * b.alto;
    pesoTotal    += b.peso_bruto || 0;
    valorTotal   += b.valor_mercancia || 0;
  }

  var cajaElegida = CAJAS_ESTANDAR[CAJAS_ESTANDAR.length - 1];
  for (var k = 0; k < CAJAS_ESTANDAR.length; k++) {
    var volCaja = CAJAS_ESTANDAR[k].largo * CAJAS_ESTANDAR[k].ancho * CAJAS_ESTANDAR[k].alto;
    if (volCaja >= volumenTotal) {
      cajaElegida = CAJAS_ESTANDAR[k];
      break;
    }
  }

  console.log('[consolidar]', scrapeados.length, 'boxes scrapeados → 1 caja', cajaElegida.largo + 'x' + cajaElegida.ancho + 'x' + cajaElegida.alto, 'vol total:', volumenTotal, 'cm³, peso:', pesoTotal, 'kg, R$', valorTotal);

  var newBoxes = directos;
  newBoxes.push({
    peso_bruto:      pesoTotal,
    largo:           cajaElegida.largo,
    ancho:           cajaElegida.ancho,
    alto:            cajaElegida.alto,
    valor_mercancia: valorTotal
  });
  datos.boxes = newBoxes;

  return datos;
}

export async function resolverUrls(datos) {
  if (!Array.isArray(datos.boxes)) return datos;

  for (var i = 0; i < datos.boxes.length; i++) {
    var box = datos.boxes[i];
    if (!box.url) continue;

    var necesitaScraping = !box.peso_bruto || box.peso_bruto === 0;
    if (!necesitaScraping) continue;

    try {
      console.log('[scraper] fetching', box.url);
      var resp = await fetch(box.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PraiaBot/1.0)' }
      });
      var html = await resp.text();

      var precio = 0, titulo = '', peso = 0;

      var jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatch) {
        for (var j = 0; j < jsonLdMatch.length; j++) {
          try {
            var jsonStr = jsonLdMatch[j].replace(/<script[^>]*>/gi, '').replace(/<\/script>/gi, '');
            var ld = JSON.parse(jsonStr);
            ld = ld['@graph'] ? ld['@graph'][0] : ld;
            if (!titulo && ld.name) titulo = ld.name;
            if (!precio && ld.offers) {
              var offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
              precio = parseFloat(offer.price) || 0;
            }
            if (!peso && ld.weight && ld.weight.value) {
              peso = parseFloat(ld.weight.value) || 0;
            }
          } catch(_) {}
        }
      }

      if (!titulo) {
        var ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
        if (ogTitle) titulo = ogTitle[1];
        else {
          var titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleTag) titulo = titleTag[1].trim();
        }
      }
      if (!precio) {
        var priceMeta = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']*)["']/i);
        if (priceMeta) precio = parseFloat(priceMeta[1]) || 0;
      }

      var est = estimarDimensiones(titulo);
      var cantidad = parseInt(box.cantidad) || 1;
      var pesoEstimado = peso > 0 ? peso : est.peso;

      datos.boxes[i].peso_bruto      = pesoEstimado * cantidad;
      datos.boxes[i].largo           = est.largo;
      datos.boxes[i].ancho           = est.ancho;
      datos.boxes[i].alto            = est.alto;
      datos.boxes[i].valor_mercancia = precio * cantidad;

      console.log('[scraper]', titulo, '→', JSON.stringify(datos.boxes[i]));
    } catch (err) {
      console.log('[scraper] error', box.url, err.message);
    }
  }
  return consolidarBoxes(datos);
}
