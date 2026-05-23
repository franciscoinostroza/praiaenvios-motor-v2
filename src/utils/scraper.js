import { log } from './log.js';
import { query } from '../db/pool.js';

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

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
];

const TIMEOUT_MS = 5000;
const CACHE_TTL = 600_000; // 10 min

async function getCache(url) {
  try {
    const r = await query('SELECT resultado FROM cache_urls WHERE url = $1 AND created_at > NOW() - INTERVAL \'10 minutes\'', [url]);
    if (r.rows.length > 0) return r.rows[0].resultado;
  } catch {}
  return null;
}

async function setCache(url, data) {
  try {
    await query('INSERT INTO cache_urls (url, resultado) VALUES ($1, $2) ON CONFLICT (url) DO UPDATE SET resultado = $2, created_at = NOW()', [url, JSON.stringify(data)]);
  } catch {}
}

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
  for (const key in ESTIMACIONES) {
    if (titulo.includes(key)) return ESTIMACIONES[key];
  }
  return null;
}

function consolidarBoxes(datos) {
  if (!Array.isArray(datos.boxes) || datos.boxes.length < 2) return datos;

  const scrapeados = [];
  const directos = [];
  for (const b of datos.boxes) {
    if (b.url) scrapeados.push(b);
    else directos.push(b);
  }

  if (scrapeados.length < 2) return datos;

  let volumenTotal = 0, pesoTotal = 0, valorTotal = 0;
  for (const b of scrapeados) {
    volumenTotal += b.largo * b.ancho * b.alto;
    pesoTotal += b.peso_bruto || 0;
    valorTotal += b.valor_mercancia || 0;
  }

  let cajaElegida = CAJAS_ESTANDAR[CAJAS_ESTANDAR.length - 1];
  for (const caja of CAJAS_ESTANDAR) {
    if (caja.largo * caja.ancho * caja.alto >= volumenTotal) {
      cajaElegida = caja;
      break;
    }
  }

  log('INFO', 'Boxes consolidated', { count: scrapeados.length, to: `${cajaElegida.largo}x${cajaElegida.ancho}x${cajaElegida.alto}`, vol: volumenTotal, peso: pesoTotal });

  const newBoxes = [...directos];
  newBoxes.push({
    peso_bruto: pesoTotal,
    largo: cajaElegida.largo,
    ancho: cajaElegida.ancho,
    alto: cajaElegida.alto,
    valor_mercancia: valorTotal
  });
  datos.boxes = newBoxes;
  return datos;
}

function extractJsonLd(html) {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!matches) return null;
  for (const match of matches) {
    try {
      const jsonStr = match.replace(/<script[^>]*>/gi, '').replace(/<\/script>/gi, '');
      const ld = JSON.parse(jsonStr);
      const item = ld['@graph'] ? ld['@graph'][0] : ld;
      const result = {};
      if (item.name) result.title = item.name;
      if (item.offers) {
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        result.price = parseFloat(offer.price) || 0;
      }
      if (item.weight && item.weight.value) {
        result.weight = parseFloat(item.weight.value) || 0;
      }
      if (result.title || result.price) return result;
    } catch {}
  }
  return null;
}

function extractMetaTags(html) {
  const result = {};
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  if (ogTitle) result.title = ogTitle[1];
  const priceMeta = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']*)["']/i);
  if (priceMeta) result.price = parseFloat(priceMeta[1]) || 0;
  const weightMeta = html.match(/<meta[^>]*property=["']product:weight["'][^>]*content=["']([^"']*)["']/i);
  if (weightMeta) result.weight = parseFloat(weightMeta[1]) || 0;
  if (!result.title) {
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleTag) result.title = titleTag[1].trim();
  }
  return Object.keys(result).length > 0 ? result : null;
}

function extractByRegex(html) {
  const result = {};
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) result.title = titleMatch[1].trim();

  const pricePatterns = [
    /R\$\s*([\d,.]+)/,
    /precio.*?([\d,.]+)/,
    /price.*?([\d,.]+)/,
    /valor.*?([\d,.]+)/
  ];
  for (const pat of pricePatterns) {
    const m = html.match(pat);
    if (m) {
      const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
      if (val > 0) { result.price = val; break; }
    }
  }

  const weightPatterns = [
    /(\d+[\.,]?\d*)\s*kg/i,
    /peso.*?(\d+[\.,]?\d*)/i,
    /weight.*?(\d+[\.,]?\d*)/
  ];
  for (const pat of weightPatterns) {
    const m = html.match(pat);
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (val > 0) { result.weight = val; break; }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

async function fetchWithTimeout(url, ua, signal) {
  const response = await fetch(url, {
    headers: { 'User-Agent': ua, 'Accept': 'text/html,application/xhtml+xml' },
    signal
  });
  return response.text();
}

function scrapeMercadoLibre(html) {
  const result = {};

  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  if (ogTitle) result.title = ogTitle[1];
  else {
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleTag) result.title = titleTag[1].trim().replace(/\s*\|\s*Mercado( Libre| Livre).*$/, '');
  }

  const priceMeta = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']*)["']/i);
  if (priceMeta) {
    result.price = parseFloat(priceMeta[1]);
  } else {
    const priceMatch = html.match(/andes-money-amount__fraction[^>]*>([\d.]+)</);
    if (priceMatch) result.price = parseFloat(priceMatch[1].replace(/\./g, ''));
  }
  if (!result.price) {
    const centsMatch = html.match(/andes-money-amount__cents[^>]*>(\d+)</);
    const frac = html.match(/andes-money-amount__fraction[^>]*>([\d.]+)</);
    if (frac) {
      let val = frac[1].replace(/\./g, '');
      if (centsMatch) val += '.' + centsMatch[1];
      result.price = parseFloat(val);
    }
  }

  const specTables = html.match(/<th[^>]*>.*?Peso.*?<\/th>\s*<td[^>]*>(.*?)<\/td>/is);
  if (specTables) {
    const pesoText = specTables[1].replace(/<[^>]+>/g, '').trim();
    const pesoMatch = pesoText.match(/[\d,.]+/);
    if (pesoMatch) result.weight = parseFloat(pesoMatch[0].replace(',', '.'));
  }
  if (!result.weight) {
    const weightMeta = html.match(/<meta[^>]*property=["']product:weight["'][^>]*content=["']([^"']*)["']/i);
    if (weightMeta) result.weight = parseFloat(weightMeta[1]);
  }
  if (!result.weight) {
    const anyPeso = html.match(/(?:peso|weight|peso bruto)[^<]{0,50}?([\d,.]+)\s*(kg|g)/i);
    if (anyPeso) {
      let val = parseFloat(anyPeso[1].replace(',', '.'));
      if (anyPeso[2] === 'g' && val > 0) val = val / 1000;
      if (val > 0) result.weight = val;
    }
  }

  if (!result.title && !result.price) return null;
  return result;
}

async function scrapeUrl(url) {
  const cached = await getCache(url);
  if (cached) {
    log('INFO', 'URL cache hit', { url });
    return cached;
  }

  let lastError = null;
  for (const ua of USER_AGENTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      log('DEBUG', 'Scraping URL', { url, ua: ua.substring(0, 40) });
      const html = await fetchWithTimeout(url, ua, controller.signal);
      clearTimeout(timeout);

      const isML = url.includes('mercadolibre') || url.includes('mercadolivre');
      if (isML) {
        const mlData = scrapeMercadoLibre(html);
        if (mlData) { log('INFO', 'Scraped via MercadoLibre extractor', { url, title: mlData.title, price: mlData.price, weight: mlData.weight }); await setCache(url, mlData); return mlData; }
        log('WARN', 'ML extractor failed, falling back to generic', { url });
      }

      let data = extractJsonLd(html);
      if (data) { log('INFO', 'Scraped via ld+json', { url, title: data.title }); await setCache(url, data); return data; }

      data = extractMetaTags(html);
      if (data) { log('INFO', 'Scraped via meta tags', { url, title: data.title }); await setCache(url, data); return data; }

      data = extractByRegex(html);
      if (data) { log('WARN', 'Scraped via regex fallback', { url, title: data.title }); await setCache(url, data); return data; }

      log('WARN', 'No data extracted from URL', { url });
      return null;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      log('WARN', 'Scrape attempt failed', { url, attempt: ua.substring(0, 20), error: err.message });
    }
  }

  log('ERROR', 'All scrape attempts failed', { url, lastError: lastError?.message });
  return null;
}

export async function resolverUrls(datos) {
  if (!Array.isArray(datos.boxes)) return datos;

  let scrapeFailed = false;
  for (let i = 0; i < datos.boxes.length; i++) {
    const box = datos.boxes[i];
    if (!box.url) continue;
    if (box.peso_bruto && box.peso_bruto > 0) continue;

    const result = await scrapeUrl(box.url);
    if (!result) {
      scrapeFailed = true;
      continue;
    }

    const est = result.title ? estimarDimensiones(result.title) : null;
    const cantidad = parseInt(box.cantidad) || 1;
    const pesoEstimado = result.weight > 0 ? result.weight : (est ? est.peso : 1);

    datos.boxes[i].peso_bruto = pesoEstimado * cantidad;
    datos.boxes[i].largo = est ? est.largo : 30;
    datos.boxes[i].ancho = est ? est.ancho : 30;
    datos.boxes[i].alto = est ? est.alto : 30;
    datos.boxes[i].valor_mercancia = (result.price || 0) * cantidad;

    if (cantidad > 1 && est) {
      const volUnidad = est.largo * est.ancho * est.alto;
      const volTotal = volUnidad * cantidad;
      for (const caja of CAJAS_ESTANDAR) {
        if (caja.largo * caja.ancho * caja.alto >= volTotal) {
          datos.boxes[i].largo = caja.largo;
          datos.boxes[i].ancho = caja.ancho;
          datos.boxes[i].alto = caja.alto;
          log('INFO', 'Box expanded to standard size', { box: i + 1, dims: `${caja.largo}x${caja.ancho}x${caja.alto}`, for: cantidad + ' units', vol: volTotal });
          break;
        }
      }
    }

    log('INFO', 'Box scraped', { box: i + 1, title: result.title, dims: `${datos.boxes[i].largo}x${datos.boxes[i].ancho}x${datos.boxes[i].alto}`, peso: datos.boxes[i].peso_bruto });
  }

  consolidarBoxes(datos);
  return { scrapeFailed };
}
