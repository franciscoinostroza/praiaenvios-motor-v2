# Flujo Completo Praia Envíos — Motor v2

## 1. Arquitectura General

```
WhatsApp → Whapify → OpenAI (Prompt Maestro) → Whapify JS → Condición → Webhook → Railway Server → Respuesta → WhatsApp
```

---

## 2. Prompt Maestro (OpenAI en Whapify)

### Regla fundamental
La IA responde **ÚNICAMENTE con JSON puro**, empezando con `{`. Sin texto antes ni después.

### Formato del JSON

**Doméstico (Opción 3, Brasil→Venezuela):**
```json
{"con_datos":true,"tipo_flujo":"enviando_desde_brasil","origen":"Curitiba","destino_ciudad":"Caracas","direccion_destino":"Chacao","categoria":"ropa","tipo_mercancia":"personal","agencia":{"direccion":"...","tipo":1},"categorias":["ropa"],"boxes":[{"peso_bruto":2,"largo":30,"ancho":30,"alto":40,"valor_mercancia":150}]}
```

**Internacional (Opción 4, Brasil→otro país):**
```json
{"con_datos":true,"pais_origen":"BR","codigo_postal_origen":"80000-000","ciudad_origen":"Curitiba","pais_destino":"VE","codigo_postal_destino":"1060","ciudad_destino":"Caracas","boxes":[{"largo":30,"ancho":20,"alto":15,"peso_bruto":5,"valor_mercancia":1300}]}
```

### Campo obligatorio
- `"con_datos":true` — siempre debe estar presente

### El prompt completo está en `Prompt Maestro.txt`

---

## 3. JavaScript en Whapify (Acción #2)

```js
const texto = `{{respuesta_ia}}`.trim();
if (!texto.startsWith('{')) {
  return "sin_datos";
}
const match = texto.match(/\{[\s\S]*\}/);
return match ? match[0] : "sin_datos";
```

**Qué hace:**
1. Toma la respuesta de la IA
2. Si no empieza con `{`, retorna `"sin_datos"`
3. Extrae el JSON con regex y lo retorna
4. El valor retornado se guarda en el campo **`decisión`**

---

## 4. Condición en Whapify (Condición #1)

- **Si `decisión` contiene `con_datos`** → pasa al webhook
- Caso contrario → envía `{{respuesta_ia}}` al usuario (texto crudo)

El JSON devuelto por la IA contiene `con_datos:true`, que al convertirse a string contiene "con_datos". La condición se cumple.

---

## 5. Webhook en Whapify (Acción #3)

- **URL:** `https://praiaenvios-motor-v2.up.railway.app/whapify/cotizar`
- **Método:** POST
- **Body:**
```json
{
  "sessionId": "{{phone}}",
  "contacto": "{{contact.first_name}}",
  "message": "{{respuesta_ia}}"
}
```
- **Respuesta:** JSON completo del servidor
- **Mapeo:** JSONPath `mensaje_formateado` → `resultado_webhook`
- **Éxito:** Envía mensaje #5 con `{{resultado_webhook}}`
- **Fallo:** Envía mensaje #2 con "Ocurrió un error"

---

## 6. Servidor Railway (server.js)

### Endpoints

| Ruta | Descripción |
|------|-------------|
| `POST /cotizar` | Cotización normal (JSON) |
| `POST /whapify/cotizar` | Mismo que `/cotizar` (para Whapify) |
| `GET /health` | Health check |
| `GET /admin/*` | Admin panel |

### Flujo de procesamiento

```
req.body → parseBody() → ¿tiene pais_destino?
  ├── Sí → manejarCotizacionUps()
  │         → validateUpsInput()
  │         → extractUpsParams()
  │         → cotizarUps(entrada)
  │         → formatearMensajeUps()
  │         → res.json({ resultado_final, mensaje_formateado })
  │
  └── No → manejarCotizacion() (motor doméstico)
            → validateMotorInput()
            → extractMotorParams()
            → resolverUrls()
            → cotizar(entrada)
            → formatearMensaje()
            → res.json({ resultado_final, mensaje_formateado })
```

### parseBody() — Cómo extrae los datos

```js
// 1. Si body.json_datos existe → lo parsea como JSON
// 2. Si body.message existe → lo parsea como JSON
//    2a. Si falla, busca { } en el string y parsea eso
//    2b. Si falla, intenta parsear como key=value
// 3. Si nada funciona → retorna body tal cual
```

El body de Whapify tiene `message` = respuesta de la IA (JSON string). `parseBody` lo parsea correctamente.

### UPS — Cuentas

| Cuenta | ID | Estado | Uso |
|--------|----|--------|-----|
| Cuenta 1 | EW0793 | ❌ Inválida (ClientId is Invalid) | No usar |
| Cuenta 2 | B68686 | ✅ Funciona | **Internacional** |

`elegirCuenta()` en `ups.js` selecciona Cuenta 2 para destinos internacionales.

---

## 7. Diagrama de flujo completo

```
Usuario escribe en WhatsApp
        │
        ▼
Whapify → OpenAI (Prompt Maestro)
        │
        ▼
IA responde solo con JSON:
{"con_datos":true,"tipo_flujo":"enviando_desde_brasil",...}
        │
        ▼
Whapify JS (Acción #2):
  - startsWith('{')? Sí
  - Extrae JSON con regex
  - Retorna el JSON
        │
        ▼
decisión = el JSON completo
        │
        ▼
Condición: ¿decisión contiene "con_datos"? → SÍ
        │
        ▼
Webhook (Acción #3):
  POST https://praiaenvios-motor-v2.up.railway.app/whapify/cotizar
  Body: { sessionId, contacto, message: respuesta_ia }
        │
        ▼
Railway Server:
  parseBody → detecta pais_destino?
    ├── Sí (UPS):
    │     UPS API → tarifas → formatearMensajeUps
    │
    └── No (Motor doméstico):
          Motor → cálculo → formatearMensaje
        │
        ▼
Respuesta: { resultado_final, mensaje_formateado }
        │
        ▼
Whapify JSONPath extrae mensaje_formateado → resultado_webhook
        │
        ▼
Enviar mensaje #5: {{resultado_webhook}}
        │
        ▼
Usuario recibe cotización formateada en WhatsApp ✅
```

---

## 8. Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `Prompt Maestro.txt` | Prompt de OpenAI en Whapify |
| `server.js` | Servidor Express con endpoints |
| `src/services/ups.js` | Integración UPS (cuentas, elegirCuenta) |
| `src/services/motor.js` | Motor de cotización doméstico |
| `src/utils/validate.js` | parseBody, validateMotorInput, validateUpsInput |
| `src/utils/format.js` | formatearMensaje (doméstico) |
| `src/utils/format-ups.js` | formatearMensajeUps, extractUpsParams |
| `Flujo Whapify` | Documentación del flujo en Whapify |

---

## 9. Lo que NO se debe cambiar

- **JS en Whapify** — funciona con `startsWith('{')` y regex
- **Condición** — busca "con_datos" en `decisión`
- **Webhook URL** — apunta a Railway
- **Mapeo JSONPath** — `mensaje_formateado` → `resultado_webhook`
- **Body del webhook** — `sessionId`, `contacto`, `message`

## 10. Lo que SÍ puede cambiar (solo en Prompt Maestro.txt)

- La estructura del JSON (nuevos campos)
- Textos del menú
- Instrucciones a la IA

**Siempre mantener:**
- `"con_datos":true` en el JSON
- Respuesta EMPIEZA con `{`
- Sin texto antes ni después del JSON
