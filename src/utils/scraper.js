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

const SITE_TIMEOUTS = {
  'mercadolibre': 8000,
  'mercadolivre': 8000,
  'shopee': 3000,
  'amazon': 8000
};

function getSiteTimeout(url) {
  for (const [site, ms] of Object.entries(SITE_TIMEOUTS)) {
    if (url.includes(site)) return ms;
  }
  return TIMEOUT_MS;
}

class RateLimitedError extends Error {
  constructor(retryAfter) {
    super('Rate limited');
    this.name = 'RateLimitedError';
    this.retryAfter = retryAfter;
  }
}

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

  const items = scrapeados
    .map(b => ({
      peso_bruto: b.peso_bruto || 0,
      largo: b.largo || 30,
      ancho: b.ancho || 30,
      alto: b.alto || 30,
      valor_mercancia: b.valor_mercancia || 0
    }))
    .sort((a, b) => (b.largo * b.ancho * b.alto) - (a.largo * a.ancho * a.alto));

  const openBoxes = [];

  for (const item of items) {
    const volItem = item.largo * item.ancho * item.alto;
    let bestBox = null;
    let bestRemaining = Infinity;
    let bestIdx = -1;

    for (let i = 0; i < openBoxes.length; i++) {
      const box = openBoxes[i];
      const cajaVol = box.cajaElegida.largo * box.cajaElegida.ancho * box.cajaElegida.alto;
      const remaining = cajaVol - box.volumenOcupado;
      if (remaining >= volItem && remaining < bestRemaining) {
        bestBox = box;
        bestRemaining = remaining;
        bestIdx = i;
      }
    }

    if (bestBox) {
      bestBox.volumenOcupado += volItem;
      bestBox.pesoTotal += item.peso_bruto;
      bestBox.valorTotal += item.valor_mercancia;
      bestBox.items.push(item);
    } else {
      let cajaElegida = CAJAS_ESTANDAR[CAJAS_ESTANDAR.length - 1];
      for (const caja of CAJAS_ESTANDAR) {
        if (caja.largo * caja.ancho * caja.alto >= volItem) {
          cajaElegida = caja;
          break;
        }
      }
      openBoxes.push({
        cajaElegida,
        volumenOcupado: volItem,
        pesoTotal: item.peso_bruto,
        valorTotal: item.valor_mercancia,
        items: [item]
      });
    }
  }

  const newBoxes = [...directos];
  for (const box of openBoxes) {
    newBoxes.push({
      peso_bruto: box.pesoTotal,
      largo: box.cajaElegida.largo,
      ancho: box.cajaElegida.ancho,
      alto: box.cajaElegida.alto,
      valor_mercancia: box.valorTotal
    });
  }

  log('INFO', 'Boxes consolidated (BFD)', {
    input: scrapeados.length,
    output: openBoxes.length,
    boxes: openBoxes.map(b => `${b.cajaElegida.largo}x${b.cajaElegida.ancho}x${b.cajaElegida.alto} vol=${b.volumenOcupado}/${b.cajaElegida.largo * b.cajaElegida.ancho * b.cajaElegida.alto} peso=${b.pesoTotal}`)
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

function extractDimensiones(html) {
  const patterns = [
    /(\d+[\s,.]*(?:x|×|\*)\s*[\d,.]+[\s,.]*(?:x|×|\*)\s*[\d,.]+)\s*(?:cm|centímetros|centimetros)/i,
    /(?:dimens[oó]es|dimensiones|dimensões|tamanho|tamaño|medidas)[^<]{0,80}?(\d+[\s,.]*(?:x|×|\*)\s*[\d,.]+[\s,.]*(?:x|×|\*)\s*[\d,.]+)/i,
    /<th[^>]*>.*?(?:dimens[oó]es|dimensiones|dimensões|tamanho|tamaño|medidas).*?<\/th>\s*<td[^>]*>(.*?)<\/td>/is,
    /<th[^>]*>.*?(?:altura|largura|profundidad|comprimento).*?<\/th>\s*<td[^>]*>(.*?)<\/td>/is
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (!m) continue;
    const dimStr = m[1] || m[2] || m[3];
    if (!dimStr) continue;
    const nums = dimStr.replace(/\s*(?:cm|centímetros|centimetros)\s*/gi, '').match(/[\d,.]+/g);
    if (nums && nums.length >= 3) {
      const dims = nums.slice(0, 3).map(n => Math.round(parseFloat(n.replace(',', '.'))));
      if (dims.every(d => d > 0 && d < 200)) return { largo: dims[0], ancho: dims[1], alto: dims[2] };
    }
  }

  const specs = html.match(/<th[^>]*>(.*?)<\/th>\s*<td[^>]*>(.*?)<\/td>/gis);
  if (specs) {
    let l, a, h;
    for (const row of specs) {
      const labelM = row.match(/<th[^>]*>(.*?)<\/th>/i);
      const valM = row.match(/<td[^>]*>(.*?)<\/td>/i);
      if (!labelM || !valM) continue;
      const label = labelM[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
      const val = valM[1].replace(/<[^>]+>/g, '').trim();
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num) || num <= 0) continue;
      if (label.includes('altura') || label.includes('alt')) h = num;
      else if (label.includes('largura') || label.includes('ancho') || label.includes('larg') || label.includes('width')) a = num;
      else if (label.includes('profundidad') || label.includes('profundidade') || label.includes('comprimento') || label.includes('compr') || label.includes('depth')) l = num;
    }
    if (l && a && h && l < 200 && a < 200 && h < 200) return { largo: Math.round(l), ancho: Math.round(a), alto: Math.round(h) };
  }
  return null;
}

function scrapeShopee(html) {
  const result = {};

  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  if (titleMatch) result.title = titleMatch[1];
  else {
    const tt = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (tt) result.title = tt[1].trim().replace(/\s*\|\s*Shopee.*$/, '');
  }

  const priceMatch = html.match(/data-sku-price["']>\s*R?\$?\s*([\d,.]+)/i) || html.match(/data-sale-price["']>\s*([\d,.]+)/i);
  if (priceMatch) result.price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
  if (!result.price) {
    const priceScript = html.match(/"price"\s*:\s*(\d+)/);
    if (priceScript) result.price = parseInt(priceScript[1]) / 100000;
  }
  if (!result.price) {
    const priceSpan = html.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([\d,.]+)/i);
    if (priceSpan) result.price = parseFloat(priceSpan[1].replace(/\./g, '').replace(',', '.'));
  }

  const weightScript = html.match(/"weight"\s*:\s*([\d.]+)/);
  if (weightScript) {
    let w = parseFloat(weightScript[1]);
    if (w > 100) w = w / 1000;
    if (w > 0 && w < 100) result.weight = w;
  }
  if (!result.weight) {
    const anyPeso = html.match(/(?:peso|weight)[^<]{0,50}?([\d,.]+)\s*(kg|g|kilos|gramas)/i);
    if (anyPeso) {
      let val = parseFloat(anyPeso[1].replace(',', '.'));
      if (anyPeso[2].toLowerCase() === 'g' || anyPeso[2].toLowerCase() === 'gramas') val = val / 1000;
      if (val > 0 && val < 100) result.weight = val;
    }
  }

  if (!result.title && !result.price) return null;

  const dims = extractDimensiones(html);
  if (dims) {
    result.largo = dims.largo;
    result.ancho = dims.ancho;
    result.alto = dims.alto;
  }
  return result;
}

function scrapeAmazon(html) {
  const result = {};

  const ogTitle = html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']*)["']/i);
  if (ogTitle) result.title = ogTitle[1];
  else {
    const tt = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (tt) result.title = tt[1].trim().replace(/\s*:?\s*Amazon\.com(\.br)?.*$/, '');
  }

  const priceEl = html.match(/id="priceblock_ourprice"[^>]*>([\d,.]+)/i) || html.match(/id="priceblock_saleprice"[^>]*>([\d,.]+)/i);
  if (priceEl) result.price = parseFloat(priceEl[1].replace(/\./g, '').replace(',', '.'));
  if (!result.price) {
    const aPrice = html.match(/a-price-whole[^>]*>(\d+)[^<]*</);
    const aFrac = html.match(/a-price-fraction[^>]*>(\d+)[^<]*</);
    if (aPrice) {
      let val = aPrice[1];
      if (aFrac) val += '.' + aFrac[1];
      result.price = parseFloat(val);
    }
  }
  if (!result.price) {
    const priceScript = html.match(/"price"\s*:\s*([\d.]+)/);
    if (priceScript) result.price = parseFloat(priceScript[1]);
  }

  const weightTable = html.match(/id="productDetails_db_sections"[^>]*>([\s\S]*?)<\/table>/i);
  if (weightTable) {
    const pesoMatch = weightTable[1].match(/(?:Peso do produto|Peso|Weight|Item Weight)[^<]*?<td[^>]*>([\s\S]*?)<\/td>/i);
    if (pesoMatch) {
      const pesoText = pesoMatch[1].replace(/<[^>]+>/g, '').trim();
      const num = pesoText.match(/[\d,.]+/);
      if (num) {
        let val = parseFloat(num[0].replace(',', '.'));
        if (pesoText.includes('g') && !pesoText.includes('kg')) val = val / 1000;
        if (val > 0 && val < 100) result.weight = val;
      }
    }
  }

  if (!result.weight) {
    const anyPeso = html.match(/(?:Peso|Weight|Item Weight)[^<]{0,60}?([\d,.]+)\s*(kg|g|pounds|lbs)/i);
    if (anyPeso) {
      let val = parseFloat(anyPeso[1].replace(',', '.'));
      if (anyPeso[2] === 'g') val = val / 1000;
      if (anyPeso[2] === 'pounds' || anyPeso[2] === 'lbs') val = val * 0.453;
      if (val > 0 && val < 100) result.weight = val;
    }
  }

  if (!result.title && !result.price) return null;

  const dims = extractDimensiones(html);
  if (dims) {
    result.largo = dims.largo;
    result.ancho = dims.ancho;
    result.alto = dims.alto;
  }
  return result;
}

async function fetchWithTimeout(url, ua, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': ua, 'Accept': 'text/html,application/xhtml+xml' },
      signal: controller.signal
    });
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
      throw new RateLimitedError(retryAfter);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
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

  const dims = extractDimensiones(html);
  if (dims) {
    result.largo = dims.largo;
    result.ancho = dims.ancho;
    result.alto = dims.alto;
  }
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
    const timeoutMs = getSiteTimeout(url);
    try {
      log('DEBUG', 'Scraping URL', { url, ua: ua.substring(0, 40), timeout: timeoutMs });
      const html = await fetchWithTimeout(url, ua, timeoutMs);

      const isShopee = url.includes('shopee');
      if (isShopee) {
        const shData = scrapeShopee(html);
        if (shData) { log('INFO', 'Scraped via Shopee extractor', { url, title: shData.title, price: shData.price, weight: shData.weight }); await setCache(url, shData); return shData; }
        log('WARN', 'Shopee extractor failed, falling back', { url });
      }

      const isML = url.includes('mercadolibre') || url.includes('mercadolivre');
      if (isML) {
        const mlData = scrapeMercadoLibre(html);
        if (mlData) { log('INFO', 'Scraped via MercadoLibre extractor', { url, title: mlData.title, price: mlData.price, weight: mlData.weight }); await setCache(url, mlData); return mlData; }
        log('WARN', 'ML extractor failed, falling back to generic', { url });
      }

      const isAmazon = url.includes('amazon');
      if (isAmazon) {
        const amData = scrapeAmazon(html);
        if (amData) { log('INFO', 'Scraped via Amazon extractor', { url, title: amData.title, price: amData.price, weight: amData.weight }); await setCache(url, amData); return amData; }
        log('WARN', 'Amazon extractor failed, falling back', { url });
      }

      let data = extractJsonLd(html);
      if (data) {
        const dims = extractDimensiones(html);
        if (dims) { data.largo = dims.largo; data.ancho = dims.ancho; data.alto = dims.alto; }
        log('INFO', 'Scraped via ld+json', { url, title: data.title }); await setCache(url, data); return data;
      }

      data = extractMetaTags(html);
      if (data) {
        const dims = extractDimensiones(html);
        if (dims) { data.largo = dims.largo; data.ancho = dims.ancho; data.alto = dims.alto; }
        log('INFO', 'Scraped via meta tags', { url, title: data.title }); await setCache(url, data); return data;
      }

      data = extractByRegex(html);
      if (data) {
        const dims = extractDimensiones(html);
        if (dims) { data.largo = dims.largo; data.ancho = dims.ancho; data.alto = dims.alto; }
        log('WARN', 'Scraped via regex fallback', { url, title: data.title }); await setCache(url, data); return data;
      }

      log('WARN', 'No data extracted from URL', { url });
      return null;
    } catch (err) {
      lastError = err;
      if (err instanceof RateLimitedError) {
        const wait = Math.min(err.retryAfter, 5);
        log('WARN', 'Rate limited, backing off', { url, ua: ua.substring(0, 20), wait: wait + 's' });
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
      log('WARN', 'Scrape attempt failed', { url, attempt: ua.substring(0, 20), error: err.message });
    }
  }

  log('ERROR', 'All scrape attempts failed', { url, lastError: lastError?.message });
  return null;
}

const SCRAPE_TIMEOUT_MS = 20000;

export async function resolverUrls(datos) {
  if (!Array.isArray(datos.boxes)) return datos;

  const indicesUrgen = [];
  for (let i = 0; i < datos.boxes.length; i++) {
    const box = datos.boxes[i];
    if (box.url && (!box.peso_bruto || box.peso_bruto <= 0)) {
      indicesUrgen.push(i);
    }
  }

  if (indicesUrgen.length === 0) return datos;

  const resultados = await Promise.allSettled(
    indicesUrgen.map(i => {
      const box = datos.boxes[i];
      return Promise.race([
        scrapeUrl(box.url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Scrape timeout after ' + SCRAPE_TIMEOUT_MS + 'ms')), SCRAPE_TIMEOUT_MS))
      ]);
    })
  );

  let scrapeFailed = false;
  for (let r = 0; r < resultados.length; r++) {
    const i = indicesUrgen[r];
    const box = datos.boxes[i];
    const settled = resultados[r];

    if (settled.status === 'rejected' || !settled.value) {
      scrapeFailed = true;
      log('WARN', 'Scrape falló para URL', { url: box.url, error: settled.reason?.message || 'sin datos' });
      continue;
    }

    const data = settled.value;
    const est = data.title ? estimarDimensiones(data.title) : null;
    const cantidad = parseInt(box.cantidad) || 1;
    const pesoEstimado = data.weight > 0 ? data.weight : (est ? est.peso : 1);
    const tieneDims = data.largo > 0 && data.ancho > 0 && data.alto > 0;

    datos.boxes[i].peso_bruto = pesoEstimado * cantidad;
    datos.boxes[i].largo = tieneDims ? data.largo : (est ? est.largo : 30);
    datos.boxes[i].ancho = tieneDims ? data.ancho : (est ? est.ancho : 30);
    datos.boxes[i].alto = tieneDims ? data.alto : (est ? est.alto : 30);
    datos.boxes[i].valor_mercancia = (data.price || 0) * cantidad;

    const dims = tieneDims ? data : est;
    if (cantidad > 1 && dims) {
      const volUnidad = dims.largo * dims.ancho * dims.alto;
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

    log('INFO', 'Box scraped', { box: i + 1, title: data.title, dims: `${datos.boxes[i].largo}x${datos.boxes[i].ancho}x${datos.boxes[i].alto}`, peso: datos.boxes[i].peso_bruto });
  }

  consolidarBoxes(datos);
  return { scrapeFailed };
}
