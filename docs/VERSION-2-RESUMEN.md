# Versión 2 — Formatos Combinados Praia + UPS (Opción 3)

## Resumen

La Versión 2 incorpora **UPS Internacional** al motor de cotizaciones de Praia Envíos, permitiendo mostrar ambas opciones (Praia y UPS) en un mismo mensaje para Venezuela, o solo UPS para otros países.

Un feature flag `FORMATO_COMPLETO` permite activar/desactivar el nuevo flujo sin afectar a usuarios existentes.

---

## Flujo general

```
POST /cotizar → FORMATO_COMPLETO=true?
  → NO → Legacy: solo Praia (igual que antes)

  → SÍ → ¿País = Venezuela?
    → SÍ → Praia + UPS en PARALELO (Promise.allSettled, timeout 8s)
      → UPS ok → mensaje único con Praia + UPS
      → UPS falla → solo Praia con aviso
    → NO → ¿País internacional?
      → SÍ → solo UPS con 1 reintento
      → NO → Brasil → legacy (solo Praia)
```

---

## Feature Flag

| Variable | Default | Descripción |
|----------|---------|-------------|
| `FORMATO_COMPLETO` | `false` | `true` activa el nuevo flujo combinado. `false` mantiene el comportamiento legacy intacto. |

---

## Nuevas tablas en DB

### trechos_config
Almacena 37 ciudades LATAM con información para el trecho nacional hasta Curitiba.

| Columna | Descripción |
|---------|-------------|
| `ciudad` | Nombre de la ciudad |
| `codigo_iata` | Código IATA del aeropuerto |
| `direccion_latam` | Dirección de la oficina LATAM Cargo |
| `tiempo_adicional_dias` | Días adicionales por trecho |
| `activo` | Si la ciudad está habilitada |

**Editable desde admin.** Permite agregar/quitar ciudades sin deploy.

### config_texto
Almacena configuraciones de texto clave-valor.

| Columna | Descripción |
|---------|-------------|
| `clave` | Identificador único |
| `valor` | Texto configurable |

**Ejemplos de uso:**
- `direccion_base_curitiba` — dirección de la base logística (configurable por si se mudan)

**Editable desde admin.**

---

## Configuraciones desde admin

| Config | Default | Qué controla |
|--------|---------|--------------|
| `porcentaje_ganancia_ups` | `40` | Margen de ganancia (%) sobre el precio UPS devuelto por el sistema |
| `tasa_ups_offset` | `0.40` | Puntos adicionales sobre la tasa de mercado para conversión USD → R$ |
| `direccion_base_curitiba` | (texto) | Dirección física de la base logística en Curitiba |

---

## Motor — Nuevas funciones

| Función | Descripción |
|---------|-------------|
| `getInfoTrecho(ciudad)` | Busca ciudad en trechos_config. Devuelve datos LATAM (IATA, dirección, días) |
| `recolectaDisponible(ciudad)` | Verifica si la ciudad está en zona de recolecta |
| `requiereTrecho(ciudad)` | Determina si la ciudad requiere trecho (no está en ZONA_BASE) |

---

## 15 formatos reutilizables

Sistema de bloques que se combinan según condiciones. Reemplaza los templates monolíticos anteriores.

| Formato | Cuándo se usa | Bloques en el mensaje |
|---------|---------------|-----------------------|
| 1 | VE base (Curitiba) | Praia + UPS |
| 2 | VE + trecho LATAM | Praia + UPS + trecho |
| 3 | VE + recolecta | Praia + UPS + recolecta |
| 4 | VE sin cobertura LATAM | Praia + UPS + aviso "envía a Curitiba" |
| 5 | VE + compra assistida | Praia + UPS + productos + cajas |
| 6 | VE + compra + no disponibles | Praia + UPS + prods + no disponibles |
| 7 | Otro país (base) | Solo UPS |
| 8 | Otro país + trecho | UPS + trecho |
| 9 | Otro país + recolecta | UPS + recolecta |
| 10 | Otro país + compra assistida | UPS + productos |
| 11 | Otro país + compra + no disponibles | UPS + prods + no disponibles |
| 12 | Sin cotizaciones UPS | Aviso de error |
| 13 | Todos los productos no disponibles | Aviso |
| 14 | Producto restringido | Aviso |
| 15 | Trecho pendiente sin valor | Aviso |

Todos los bloques tienen soporte i18n (ES/PT/EN).

---

## Validaciones nuevas

- `codigo_postal_destino` es **obligatorio** para cotizaciones UPS.

---

## Whapify — Sin cambios en la integración

```
Usuario WhatsApp → Whapify (conversación)
  → Whapify pide datos paso a paso
  → Cuando tiene todo → Whapify llama POST /whapify/cotizar
  → Nosotros: mismo handler que /cotizar
  → Devolvemos resultado_final + mensaje_formateado
  → Whapify envía mensaje al usuario
```

La integración con Whapify no cambió. Solo cambia el **contenido** del mensaje devuelto (ahora puede incluir UPS).

---

## Ejemplos de mensajes al usuario

### Venezuela — Praia + UPS (flujo normal)

```
✅ Cotización aproximada lista

Calculamos tu cotización desde Brasil hacia Venezuela
con Praia Envíos y UPS 🇧🇷📦🇻🇪

🔎 DATOS DEL ENVÍO
País: Brasil → Venezuela
Cajas: 1 | Valor: R$ 200

📦 SERVICIO PRAIA ENVÍOS
Total: R$ 264 | $57.39 USD
Tiempo: 15 días

✈️ SERVICIO UPS INTERNACIONAL
UPS Ground: R$ 380 | $82 USD
UPS Express: R$ 520 | $113 USD

💳 MÉTODOS DE PAGO
PIX, Zelle, Binance USDT, Tarjeta, PayPal
```

### Venezuela — Solo Praia (UPS falló)

```
✅ Cotización aproximada lista

...

📦 SERVICIO PRAIA ENVÍOS
Total: R$ 264 | $57.39 USD

💳 MÉTODOS DE PAGO
...

⚠️ UPS no estuvo disponible en este momento.
Solo se muestra cotización Praia Envíos.
```

### Venezuela — Con trecho (São Paulo)

```
✅ Cotización aproximada lista

Calculamos tu cotización desde São Paulo hacia Venezuela,
usando trecho nacional hasta Curitiba + Praia Envíos + UPS

🔎 DATOS DEL ENVÍO
...

TRECHO NACIONAL EN BRASIL
Trecho São Paulo → Curitiba (LATAM Cargo)
Valor: R$ 21 | $4.57 USD
Dirección: Aeropuerto de Congonhas...

📦 SERVICIO PRAIA ENVÍOS
Total: R$ 285 | $61.96 USD

✈️ SERVICIO UPS INTERNACIONAL
...
```

### Otro país — Solo UPS (Chile)

```
✅ Cotización internacional lista

Calculamos tu cotización UPS desde Brasil hacia Chile

🔎 DATOS DEL ENVÍO
...

✈️ SERVICIO UPS INTERNACIONAL
UPS Ground: R$ 380 | $82 USD
...
```

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `server.js` | Feature flag + flujo combinado + whapify |
| `src/motor/engine.js` | getInfoTrecho(), recolectaDisponible() |
| `src/motor/config.js` | Carga trechos_config, config_texto, zonas |
| `src/services/motor.js` | Orquestación cotizar (single/multiple) |
| `src/utils/format-selector.js` | Selecciona formato 1-15 según condiciones |
| `src/utils/bloques.js` | 15 bloques reutilizables con i18n |
| `src/utils/format-completo.js` | Constructor de mensajes combinados |
| `src/utils/validate.js` | Validación codigo_postal_destino |
| `src/db/migrate.js` | Creación de tablas trechos_config, config_texto |
| `src/db/seed.js` | Datos iniciales (37 ciudades, zonas, fórmulas) |
| `src/db/setup.js` | Wrapper migrate+seed para startup |
| `src/admin/router.js` | CRUD admin para nuevas tablas |
| `railway.json` | Config deploy con preDeploy (migrate) |

---

## Pendientes

| Item | Estado | Notas |
|------|--------|-------|
| FORMATO_COMPLETO=true default | ⏳ Pendiente | Aprobación del cliente |
| Ajustes post-feedback | ⏳ Pendiente | Feedback del cliente probando en vivo |
