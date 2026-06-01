# Praia Envíos Motor v2

Motor de cotización para envíos internacionales Brasil → Venezuela.

## Stack

- **Runtime:** Node.js 22+ (ESM)
- **Framework:** Express 4
- **DB:** PostgreSQL (via `pg`)
- **Admin:** HTML/CSS inline (sin framework frontend)
- **Deploy:** Railway

## Dependencias (0 externas nuevas)

Solo 3 dependencias en producción — cero bloat:
- `express` — servidor HTTP
- `cookie-parser` — sesión admin
- `pg` — PostgreSQL

## Arquitectura

```
POST /cotizar ──► server.js ──► src/services/motor.js ──► src/motor/engine.js
                                  │                           │
                                  ▼                           ▼
POST /whapify/cotizar          src/utils/validate.js      src/motor/config.js
  (webhook WhatsApp)           src/utils/format.js        src/db/pool.js
                                src/utils/categories.js   src/db/migrate.js
                                src/utils/scraper.js      src/db/seed.js
                                src/utils/log.js
                                                   src/admin/router.js
                                                  GET /admin/* (panel CRUD)
```

## Rutas del servidor

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/cotizar` | Cotización doméstica (formato JSON plano) |
| POST | `/whapify/cotizar` | Cotización vía webhook Whapify (WhatsApp) |
| POST | `/whapify/cotizar` | Cotización doméstica e internacional (detecta auto) |
| GET | `/health` | Healthcheck → `{ status: "ok", version: "v2.0.0" }` |
| GET/POST | `/admin/*` | Panel administrativo |

## Admin Panel

**Credenciales:** configuradas via `ADMIN_PASSWORD` (default `erick-praia3nvios-m0t0r2`).

`/admin/login` → form → POST → cookie → `/admin`

### Páginas

| Ruta | Descripción |
|------|-------------|
| `/admin/` | Dashboard con contadores y acceso a tablas |
| `/admin/:table` | CRUD para cada tabla configurable |
| `/admin/simulador` | Simulador con desglose detallado |
| `/admin/logs` | Visor de logs con filtros |

### Tablas gestionables (CRUD)

| Tabla | PK | Propósito |
|-------|-----|-----------|
| `tarifas_express` | kg | Precios por kg para Express |
| `tarifas_terrestre` | kg | Precios por kg para Terrestre |
| `nacional_op1` | kg | Nacional MRW |
| `nacional_op2` | kg | Nacional LAE |
| `tramos_boa_vista` | id | Bracks de dimensión Boa Vista |
| `tramos_ganancia` | id | Bracks de ganancia por kg |
| `modalidades` | id | Config por modalidad |
| `formulas` | clave | Constantes de fórmula |
| `categorias` | id | Categorías + tipo (SOLO_AEREO/TERRESTRE/NEUTRAS) |
| `zonas` | id | Ciudades base y orígenes prohibidos |

## Base de datos

### Tablas

**Tablas de precio (`tarifas_express`, `tarifas_terrestre`, `nacional_op1`, `nacional_op2`)**
```
kg INTEGER PK
precio_bs NUMERIC(10,2) NOT NULL
```

**`tramos_boa_vista`**
```
id SERIAL PK
hasta_cm INTEGER (nullable = catch-all)
precio_bs NUMERIC(10,2) NOT NULL
```

**`tramos_ganancia`**
```
id SERIAL PK
hasta_kg INTEGER (nullable = catch-all)
usd_kg NUMERIC(10,2) NOT NULL
```

**`modalidades`**
```
id SERIAL PK
modalidad VARCHAR(30) NOT NULL
clave VARCHAR(30) NOT NULL
valor TEXT NOT NULL
UNIQUE (modalidad, clave)
```

**`formulas`**
```
clave VARCHAR(50) PK
valor NUMERIC(20,10) NOT NULL
```

**`categorias`**
```
id SERIAL PK
tipo VARCHAR(20) NOT NULL (SOLO_AEREO | TERRESTRE | NEUTRAS)
categoria VARCHAR(100) NOT NULL
UNIQUE (tipo, categoria)
```

**`zonas`**
```
id SERIAL PK
tipo VARCHAR(20) NOT NULL (BASE | PROHIBIDO)
ciudad VARCHAR(100) NOT NULL
UNIQUE (tipo, ciudad)
```

**`logs`**
```
id SERIAL PK
nivel VARCHAR(10) NOT NULL
mensaje TEXT NOT NULL
contexto JSONB (nullable)
contacto VARCHAR(100) (nullable)
created_at TIMESTAMP DEFAULT NOW()
INDEX idx_logs_created ON (created_at DESC)
```

**`cache_urls`**
```
url VARCHAR(2048) PK
resultado JSONB NOT NULL
created_at TIMESTAMP DEFAULT NOW()
INDEX idx_cache_urls_created ON (created_at)
```

### Setup

```
npm run db:setup   # migrate + seed
```

### Seed data

| Fórmula | Valor |
|---------|-------|
| `divisor_volumetrico` | 6000 |
| `flete_aereo_por_kg` | 9.5 |
| `factor_seguro` | 0.007 |
| `factor_empresa_manaus` | 0.04444 |
| `factor_ganancia` | 6 |
| `tasa_dolar` | 4.60 |

## Flujo de cotización doméstica

### Input

El endpoint acepta tres formatos:

**1. JSON directo (body.json_datos o body directo)**
```json
{
  "peso": 2,
  "largo": 30,
  "ancho": 20,
  "alto": 15,
  "valor": 500,
  "categoria": "electronico",
  "ciudad_destino": "caracas",
  "origen": "curitiba",
  "cantidad": 1,
  "url": "https://mercadolibre.com/..."
}
```

**2. Texto clave=valor (body.message)**
```
peso=2, largo=30, ancho=20, alto=15, valor=500, categoria=electronico
```

**3. URL directa (body.message)**
```
https://mercadolibre.com/...
```

### Procesamiento

1. **`parseBody(body)`** — detecta formato y extrae datos
2. **`validateMotorInput(data)`** — valida campos requeridos, omite chequeo de dimensiones si hay URL
3. **`extractMotorParams(data)`** — normaliza: origen default Curitiba, categorías via `normalizarCategorias()`, construye `boxes[]`
4. **`resolverUrls(boxes)`** — para cada box con URL:
   - Busca en caché (cache_urls, TTL 10 min)
   - Scraping con extractor específico por sitio (Shopee → ML → Amazon) o genérico (ld+json → meta → regex)
   - Extrae dimensiones reales desde ficha técnica si están disponibles
   - Si falla el scraping, marca `scrapeFailed` (no bloquea, el usuario puede reintentar con datos directos)
   - Si `cantidad > 1`, expande a caja estándar que quepa el volumen total
5. **`cotizar(params)`** — ejecuta motor de pricing:
   - Selecciona servicio según Matriz de Servicios (SEDEX → PAC → LATAM)
   - Calcula todos los componentes
   - Determina si requiere trecho (origen remoto)
   - Calcula costo nacional
6. **`formatearMensaje()`** — construye respuesta WhatsApp

### Output

```json
{
  "resultado_final": {
    "modalidad": "EXPRESS",
    "nombre_modalidad": "Express",
    "total_reales": 150.00,
    "total_usd": 32.61,
    "costo_nacional": 2008.00,
    "tiempo_estimado": "5-7 días hábiles",
    "fecha_estimada": "lunes 2 de junio",
    "cajas": [{
      "peso_bruto": 2,
      "largo": 30,
      "ancho": 20,
      "alto": 15,
      "valor_mercancia": 500,
      "categoria": "electronico"
    }]
  },
  "mensaje_formateado": "🛫 *Cotización Praia Envíos*..."
}
```

## Motor de pricing (`src/motor/engine.js`)

### Selección de modalidad (orden de prioridad)

1. **`validarExpress()`** — personal, ≤10kg, ≤50cm en todas las dimensiones, ≤2000R$, sin categorías SOLO_AEREO ni TERRESTRE
2. **`validarTerrestre()`** — mismo límite que Express pero requiere categoría TERRESTRE
3. **Aéreo** — fallback por defecto

### Cálculos

**Express / Terrestre:**
```
total = tabla[kg] + valor_extra + embalaje + ganancia + valor_fijo + boa_vista
```

**Aéreo:**
```
peso_volumetrico = (l * a * h) / divisor_volumetrico
peso_facturable = ceil(max(peso_bruto, peso_volumetrico))
total = (peso_fact * flete_aereo_kg) + seguro + empresa_manaus + valor_extra + embalaje + boa_vista + cargo_yhonatan + ganancia + cargo_pickup + cargo_manaus_bv
```

**Trecho:** ruta adicional si origen es remoto (e.g., Manaus → Boa Vista)

**Costo nacional:** `max(OP1[kg_clamped], OP2[kg_clamped])`

## Scraping (`src/utils/scraper.js`)

### Estrategias por sitio

| Sitio | Timeout | Extractor |
|-------|---------|-----------|
| Shopee | 3s | `data-sku-price`, JSON script, span price |
| MercadoLibre/Livre | 8s | `product:price:amount`, `andes-money-amount`, tabla peso |
| Amazon | 8s | `#priceblock_ourprice`, `a-price-whole`, `#productDetails` |
| Otros | 5s | ld+json → meta tags → regex |

### Caché

- Tabla `cache_urls` con TTL de 10 minutos
- Persiste entre restarts de Railway
- Se actualiza en cada scrape exitoso vía `ON CONFLICT DO UPDATE`

### Fallback

Si todas las estrategias y UAs fallan, se retorna `null` → `scrapeFailed = true` → el usuario recibe un mensaje amigable con instrucciones para ingresar datos manualmente.

## Whapify Webhook

`POST /whapify/cotizar`

Cuerpo típico que envía Whapify:
```json
{
  "sessionId": "584123456789@c.us",
  "contacto": "Juan Perez",
  "message": "Quiero enviar un celular a Caracas, pesa 2kg"
}
```

Donde:
- `sessionId` — número de teléfono (prioritario para contacto)
- `contacto` — nombre del contacto (puede ser literal `{{contact.first_name}}` si no se interpoló)
- `message` — mensaje procesado por IA de Whapify (contiene la categoría detectada automáticamente)

### extractContacto()

Filtra valores que contienen `{{` o `}}` para evitar guardar template literals sin interpolar en la DB.

## Logs

Logger estructurado en `src/utils/log.js`:
```javascript
log('INFO', 'mensaje', { contexto: 'opcional' }, 'contacto opcional');
```

**Salida:**
```
2026-05-23T12:00:00.000Z [INFO] mensaje {"contexto":"opcional"} contacto
```

Escribe a:
1. Consola (con timestamp)
2. Tabla `logs` (fire-and-forget, no bloquea)

### Niveles
- `DEBUG` — detalles de scraping, sólo visibles en consola/DB
- `INFO` — operaciones exitosas
- `WARN` — fallos recuperables (scrape falló, extractor específico falló)
- `ERROR` — fallos graves (todos los UAs fallaron)

## Categorías (`src/utils/categories.js`)

### Pipeline de matching

1. Coincidencia exacta en `MAPA_CATEGORIAS`
2. Strip prefijo (producto, articulo, etc.) y match
3. Tokenizar por conectores (y, e, con, de, &, /, -) y matchar cada token
4. Substring match (key de categoría dentro del input, length > 4)
5. Fallback a 'general'

### Auto-detección

La categoría NO se determina por scraper. Whapify IA la detecta del mensaje natural del usuario. El motor de categorías solo normaliza el texto recibido.

## Admin: Favicon

SVG data URI con emoji 📦 — sirve tanto en layout como en login.

## Admin: Modal de confirmación

En operaciones DELETE se muestra un modal nativo (confirm()) antes de ejecutar.

## Simulador (`/admin/simulador`)

POST → ejecuta `cotizarDebug()` → redirige a GET con `?r=<base64>` → renderiza:
- Formulario (lado izquierdo)
- Resultado (lado derecho): badge de modalidad, desglose completo por componente, tabla de cajas

## Railway

- **Dominio:** `praiaenvios-motor-v2.up.railway.app`
- **Variable de entorno:** `DATABASE_URL` (PostgreSQL), `ADMIN_PASSWORD`, y las credenciales UPS (`UPS_CUENTA_1_ID`, `UPS_CUENTA_1_SECRET`, `UPS_CUENTA_1_ACCOUNT`, `UPS_CUENTA_2_ID`, `UPS_CUENTA_2_SECRET`, `UPS_CUENTA_2_ACCOUNT`)

### Dockerfile

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run db:setup
EXPOSE 3000
CMD ["node", "server.js"]
```

## Uso

```bash
# Desarrollo
npm run dev

# Producción
npm start

# DB
npm run db:migrate
npm run db:seed
npm run db:setup   # ambos
```

## Decisiones técnicas clave

| Decisión | Razón |
|----------|-------|
| Sin Redis | Evitar dependencia externa innecesaria; Railway no lo incluye por defecto |
| Sin Puppeteer | Scraping liviano con fetch + regex; Puppeteer sería overkill y caro en RAM |
| Caché en DB en vez de memoria | Persiste entre restarts de Railway |
| 4 User-Agents rotativos | Evita bloqueos por User-Agent único sin depender de proxies |
| extractDimensiones() sobre keyword estimation | Las dimensiones reales desde ficha técnica dan cotizaciones mucho más precisas |
| Categoría por IA de Whapify | El mensaje natural del usuario es más confiable que inferir categoría desde HTML |
| Logs fire-and-forget | No bloquear la request principal por escritura de log |
| Sin rate limiting aún | Postergado hasta deploy de producción |
