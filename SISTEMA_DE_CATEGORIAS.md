# Sistema de Categorías y Servicios

## Arquitectura general

El sistema tiene **3 capas** que trabajan juntas para determinar qué servicio se usa para cada envío:

```
CLIENTE DICE → "drone con cámara"
       │
       ▼
CAPA 1 — PROMPT MAESTRO (IA en Whapify)
       → Clasifica el producto en categorías generales
       → Output: categoria: "electronica"
       │
       ▼
CAPA 2 — NORMALIZADOR (categories.js + mapeo_categorias)
       → Busca en el mapeo editable por admin
       → Si no encuentra, usa IA clasificadora
       → Si la IA falla, usa diccionario local
       → Agrega restricciones secundarias (baterias, quimicos...)
       → Output: ["electronica", "baterias"]
       │
       ▼
CAPA 3 — MOTOR con MATRIZ DE SERVICIOS (engine.js + categoria_servicios)
       → Revisa qué servicios tienen todas las categorías en 🟢 o 🟡
       → Prueba en orden: SEDEX → PAC → LATAM
       → Elige la primera que cumpla
       → Si hay 🟡, agrega advertencia de documentación
       │
       ▼
RESULTADO FINAL → Modalidad 1, 2, 3 o 4 con su precio
```

---

## Capa 1: Prompt Maestro

El Prompt Maestro (IA en Whapify) recibe el mensaje del cliente y:
1. Detecta el idioma (`es`, `pt`, `en`)
2. Clasifica el producto en categorías generales (ej: `electronica`, `ropa`)
3. Genera un JSON con `categoria`, `categorias`, `idioma`, y todos los datos del envío

**Importante:** La IA clasifica de forma amplia. Si el cliente dice "drone con cámara", la IA probablemente responda `electronica`. No sabe que un drone lleva batería. Eso lo resuelve la capa 2.

---

## Capa 2: Normalizador

El normalizador corre del lado del servidor cuando llega el JSON. Tiene 3 niveles de resolución:

### Nivel 1 — Mapeo editable por admin (tabla `mapeo_categorias`)

Si un término de producto fue cargado en el mapeo, se usa exactamente ese.

```
Ejemplo en DB:
  término: "drone con cámara" → categoria: "aeronaves_drones", restricciones: "baterias"

Resultado: ["aeronaves_drones", "baterias"]
```

**Prioridad máxima.** Si existe en el mapeo, no consulta IA ni diccionario.

### Nivel 2 — Clasificador IA

Usa GPT-4o-mini para clasificar el producto. Tiene un system prompt configurable desde el admin (`/admin/prompt-categorias`) que lista 22 categorías válidas con ejemplos. Sabe reglas especiales como:

> "Si el producto CONTIENE batería como parte esencial (laptop, celular, drone), agrega también la categoría `baterias`."

### Nivel 3 — Diccionario local (`categories.js`)

Si la IA falla (timeout, error), usa un diccionario con más de 500 términos en español/portugués/inglés mapeados a ~40 categorías canónicas.

```
"laptop" → ["electronicos", "baterias"]
"perfume importado" → ["perfumes"]
"guitarra eléctrica" → ["instrumentos_musicales"]
```

### Restricciones secundarias

El normalizador puede **agregar categorías adicionales** al producto. Por ejemplo:
- `laptop` → `electronica` (principal) + `baterias` (restricción)
- `perfume` → `perfumes` (principal) + `quimicos` (restricción, si aplica)

Esto asegura que el motor tenga toda la información para decidir el servicio.

---

## Capa 3: Motor con Matriz de Servicios

El motor recibe las categorías ya normalizadas y consulta la tabla `categoria_servicios` para decidir el servicio.

### Tabla `categoria_servicios`

Cada categoría tiene un estado para cada servicio:

| categoría | SEDEX | PAC | LATAM |
|---|---|---|---|
| electronica | 🟢 | 🟢 | 🟢 |
| baterias | 🔴 | 🟢 | 🟢 |
| medicamentos | 🔴 | 🔴 | 🔴 |
| documentos | 🟢 | 🔴 | 🔴 |
| perfumes | 🟢 | 🟢 | 🟢 (🟡 doc) |

**Verde 🟢** = Permitido sin restricciones
**Amarillo 🟡** = Permitido, pero requiere documentación (se muestra advertencia)
**Rojo 🔴** = No permitido para ese servicio

### Lógica de selección

El motor prueba servicios en este orden:

```
1. ¿TODAS las categorías están 🟢 o 🟡 para SEDEX?
   → Sí: usa SEDEX → Modalidad 1 — Express — SEDEX
   → No: sigue

2. ¿TODAS las categorías están 🟢 o 🟡 para PAC?
   → Sí: usa PAC → Modalidad 2 — Terrestre — PAC
   → No: sigue

3. ¿TODAS las categorías están 🟢 o 🟡 para LATAM?
   → Sí: usa LATAM → Modalidad 3 — Aéreo — LATAM
   → No: error "Producto no transportable"
```

Si el servicio elegido es LATAM y el origen requiere trecho, usa:
→ `Modalidad 4 — Aéreo + Trecho — LATAM Trecho`

### Documentación requerida (🟡)

Si alguna categoría está en 🟡 para el servicio elegido, el motor agrega al final del mensaje:

```
📋 DOCUMENTACIÓN REQUERIDA
* FISPQ/MSDS
```

---

## Nomenclatura de modalidades

Los nombres de las modalidades se almacenan en la tabla `modalidades` con clave `nombre`. Son editables desde el admin (`/admin/modalidades`).

Valores por defecto:

| ID | Nombre editable |
|---|---|
| Modalidad 1 | Modalidad 1 — Express — SEDEX |
| Modalidad 2 | Modalidad 2 — Terrestre — PAC |
| Modalidad 3 | Modalidad 3 — Aéreo — LATAM |
| Modalidad 4 | Modalidad 4 — Aéreo + Trecho — LATAM Trecho |

El cliente final **siempre** ve `Modalidad 1, 2, 3, 4`. La nomenclatura extendida (Express/SEDEX/PAC/LATAM) es para referencia del operador.

---

## Cómo se administra desde el dashboard

### 🚦 Matriz de Servicios (`/admin/categoria-servicios`)

Tabla donde cada categoría tiene un semáforo para SEDEX, PAC y LATAM.

**Para editar:**
1. Ir a `/admin/categoria-servicios`
2. Cada celda tiene un selector 🟢🟡🔴
3. Seleccionar el estado y se guarda automáticamente
4. En la columna "Documentación" se escribe el documento requerido (ej: "FISPQ/MSDS")

**Para agregar categoría nueva:**
- Usar el formulario al final de la página
- Asignar estado inicial para cada servicio
- La categoría se crea automáticamente para los 3 servicios

**Qué pasa después del cambio:**
- El motor lo detecta en ~30 segundos (cache TTL)
- Las próximas cotizaciones usan la nueva matriz

### 📖 Mapeo de Categorías (`/admin/mapeo-categorias`)

Diccionario que asocia términos de producto a categorías canónicas.

**Para qué sirve:**
- Si la IA del Prompt Maestro no clasifica bien un producto
- Si querés forzar que "drone" apunte a `aeronaves_drones` con restricción `baterias`
- Si hay productos problemáticos que necesitan categorización exacta

**Cómo usarlo:**
1. Ir a `/admin/mapeo-categorias`
2. Usar el buscador para encontrar términos existentes
3. Agregar nuevo: término, categoría destino, y restricciones (separadas por coma)
4. Editar o eliminar mapeos existentes

**Prioridad:** El mapeo tiene prioridad ABSOLUTA sobre la IA y el diccionario. Si existe, se usa siempre.

### 📋 Modalidades (`/admin/modalidades`)

Los nombres de las modalidades ahora son editables. Buscar la fila `nombre` de `EXPRESS`, `TERRESTRE`, `AEREO` o `AEREO_TRECHO` y modificar el valor.

---

## Flujo completo de ejemplo

### Ejemplo 1: Drone con cámara

```
Cliente WhatsApp → "drone con cámara"

Prompt Maestro:
  → Clasifica: "electronica"
  → JSON: { categoria: "electronica", idioma: "es", boxes: [...] }

Normalizador server-side:
  1. Busca "electronica" en mapeo_categorias → no está
  2. Busca "drone con cámara" en mapeo_categorias → no está
  3. Usa clasificador IA → "electronica" + "baterias" (porque contiene batería)
  4. Output: ["electronica", "baterias"]

Motor revisa matriz:
  electronica: sedex=🟢, pac=🟢, latam=🟢
  baterias:    sedex=🔴, pac=🟢, latam=🟢

  1. SEDEX → baterias está 🔴 → NO
  2. PAC → ambas 🟢 → SÍ ✅

  → Elige Modalidad 2 — Terrestre — PAC
```

### Ejemplo 2: Perfume importado

```
Prompt Maestro → "perfume"
JSON → { categoria: "perfumes", ... }

Normalizador:
  1. Busca "perfumes" en mapeo → no está
  2. IA clasifica → ["perfumes"]
  3. Output: ["perfumes"]

Motor:
  perfumes: sedex=🟢, pac=🟢, latam=🟢 (con doc)

  1. SEDEX → 🟢 → SÍ ✅
  → Elige Modalidad 1 — Express — SEDEX
  → Agrega: "📋 DOCUMENTACIÓN REQUERIDA\n* FISPQ/MSDS"
```

### Ejemplo 3: Agregando mapeo desde el admin

Situación: el cliente dice "suplemento deportivo" y el Prompt Maestro manda `"categoria": "suplemento deportivo"`. El normalizador no lo reconoce porque no está en el diccionario.

**Solución desde el admin:**
1. Ir a `/admin/mapeo-categorias`
2. Agregar: término `suplemento deportivo`, categoría `suplementos`, restricciones `alimentos`
3. Guardar

**A partir de ahí:**
```
Normalizador:
  1. Busca "suplemento deportivo" en mapeo → ENCONTRÓ
     → categoria: "suplementos", restricciones: ["alimentos"]
  → Output: ["suplementos", "alimentos"]

Motor:
  suplementos: sedex=🟢, pac=🟢, latam=🟢
  alimentos:   sedex=🟢, pac=🟢, latam=🟢

  → SEDEX ✅
  → Modalidad 1 — Express — SEDEX
```

---

## Preguntas frecuentes

### ¿Puedo agregar una categoría nueva?
Sí. Desde `/admin/categoria-servicios` usá el formulario "Agregar categoría a la matriz". Después asignale el semáforo correspondiente para cada servicio. Si querés que el normalizador la reconozca, agregá términos en `/admin/mapeo-categorias` o actualizá el diccionario en `categories.js`.

### ¿Los cambios en la matriz afectan cotizaciones en curso?
No. Solo afectan las cotizaciones nuevas. El motor recarga la matriz cada 30 segundos.

### ¿Qué pasa si un producto está 🔴 para todos los servicios?
El motor devuelve un error: "Ningún servicio disponible para las categorías indicadas. Algunos productos no pueden transportarse." Es el caso de `medicamentos`, `alcohol`, `corrosivos`.

### ¿Cómo sé qué servicio se eligió para una cotización?
En el mensaje final aparece la modalidad. Ej: `Modalidad 2 — Terrestre — PAC`. También podés ver el `resultado_final.modalidad` en la respuesta JSON.

### ¿El cliente final ve "SEDEX" o "LATAM"?
No. El cliente final ve `Modalidad 1`, `2`, `3` o `4` como siempre. Los nombres extendidos son para uso interno y del operador.

### ¿Puedo editar los nombres de las modalidades?
Sí, desde `/admin/modalidades`. Buscá la fila `nombre` de la modalidad que quieras cambiar y editá el valor.
