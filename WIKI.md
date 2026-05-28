# 📊 Panel Praia Envíos — Wiki del Sistema

> Versión v2.0.0 · Documentación viva · Los datos marcados como "desde DB" se actualizan automáticamente en el dashboard

---

## 📌 Hoy en el sistema

| Métrica | Valor |
|---|---|
| Cotizaciones hoy | (desde logs) |
| Envíos internacionales hoy | (desde logs) |
| Última cotización | (desde logs) |
| Caché Shippo hits / misses | (desde logs) |
| Errores hoy | (desde logs) |

---

## 🚚 ¿Cómo funciona?

Cuando un cliente escribe por WhatsApp, el sistema procesa así:

**Paso 1 — Recibir el mensaje**
El cliente escribe algo como:
```
peso=2, largo=30, ancho=20, alto=15, valor=500, categoria=laptop
```
O el Prompt Maestro de Whapify ya envía un JSON estructurado.

**Paso 2 — Interpretar los datos**
El servidor extrae los campos del mensaje. Acepta:
- Formato clave=valor separado por comas
- JSON directo
- Objeto `json_datos` anidado

**Paso 3 — Clasificar el producto**
El sistema determina la categoría usando dos sistemas en cascada:

1. **IA (OpenAI GPT-4o mini)** — envía el texto del producto a OpenAI y recibe un
   array JSON de categorías. Ej: `["electronicos", "baterias"]`
2. **Diccionario local** — si la IA falla o no hay API key, usa un diccionario con
   ~900 términos en español/portugués con fuzzy matching (distancia Levenshtein)

**Paso 4 — Elegir modalidad**
Según la categoría, el motor selecciona qué tipo de envío ofrecer:

| Tipo de categoría | Modalidades disponibles |
|---|---|
| **NEUTRAS** | Express o Terrestre o Aéreo |
| **TERRESTRE** | Solo Terrestre (alimentos, líquidos) |
| **SOLO_AEREO** | Solo Aéreo (baterías, alcohol) |

El orden de prioridad es: Express → Terrestre → Aéreo.
La primera modalidad que cumpla todos los requisitos es la que se usa.

**Paso 5 — Calcular precio** (ver sección Fórmulas)

**Paso 6 — Responder**
Devuelve un mensaje formateado con:
- Modalidad y precio total
- Desglose por caja (si son múltiples)
- Tiempo estimado de entrega
- Costo nacional en Venezuela (Bs)
- Métodos de pago disponibles

---

## 📦 Modalidades de envío

### 🚀 Express (Modalidad 1)

| Propiedad | Valor |
|---|---|
| Código | 1 |
| Tiempo entrega | desde DB |
| Peso máximo | desde DB |
| Dimensión máxima | desde DB |
| Valor máximo | desde DB |
| Tipo de mercancía | Solo personal |

**¿Qué productos califican?** Solo categorías NEUTRAS que no estén en TERRESTRE
ni SOLO_AEREO. Ej: electrónicos, ropa, cosméticos, libros.

**Fórmula:**
```
Express = Tarifa(kg_facturable) + ValorExtra(ft³) + Embalaje(ft³)
         + Ganancia(peso) + CargoFijo + BoaVista(dimensiones)
```

### 🚛 Terrestre (Modalidad 2)

| Propiedad | Valor |
|---|---|
| Código | 2 |
| Tiempo entrega | desde DB |
| Peso máximo | desde DB |
| Dimensión máxima | desde DB |
| Valor máximo | desde DB |
| Tipo de mercancía | Solo personal |

**¿Qué productos califican?** Solo categorías TERRESTRE. Ej: alimentos,
bebidas, perfumes, líquidos, químicos.

**Fórmula:**
```
Terrestre = Tarifa(kg) + ValorExtra(ft³) + Embalaje(ft³)
           + Ganancia(peso) + CargoFijo + BoaVista(dimensiones)
```

### ✈️ Aéreo (Modalidad 3)

| Propiedad | Valor |
|---|---|
| Código | 3 |
| Tiempo entrega | desde DB |
| Tipo de mercancía | Personal o comercial |

**¿Qué productos califican?** Cualquiera que no cumpla Express ni Terrestre.
Es el fallback por defecto.

**Fórmula:**
```
Aéreo = Flete(peso_facturable × R$ 9.50) + Seguro(valor × 0.7%)
       + EmpresaManaus(valor × 4.444%) + ValorExtra(ft³)
       + Embalaje(ft³) + BoaVista(dimensiones)
       + CargoYhonatan + Ganancia(peso)
       + CargoPickup + CargoManausBV
```

### Aéreo + Trecho (Modalidad 4)

Se activa cuando el origen NO está en la zona BASE (Curitiba, Manaus, etc.).
Agrega un costo extra de "trecho" (flete aéreo desde el origen hasta la base
logística).

**Fórmula del trecho:**
```
Trecho = ceil(peso_facturable × R$ 9.50 + valor × 0.7%)
```

---

## 🧮 Fórmulas del motor

### Fórmulas generales

| Fórmula | Valor | Descripción |
|---|---|---|
| `divisor_volumetrico` | 6.000 | Divide L×A×A para peso volumétrico |
| `factor_ft3` | 0,0000353147 | Convierte cm³ → ft³ para cargos por volumen |
| `flete_aereo_por_kg` | R$ 9,50 | Costo del flete aéreo por kg facturable |
| `factor_seguro` | 0,7% | Porcentaje del valor de la mercancía como seguro |
| `factor_empresa_manaus` | 4,444% | Cargo por gestión de empresa en Manaus |
| `factor_ganancia` | 6 | Multiplicador de ganancia sobre tarifa USD |
| `tasa_dolar` | desde DB | Cotización del dólar para conversión |

### Componentes

**Peso volumétrico:**
```
peso_vol = ceil(L × A × A ÷ divisor_volumetrico)
```
Ej: 30×20×15÷6000 = 1,5 → ceil = 2 kg

**Peso facturable:**
```
peso_fact = ceil(max(peso_bruto, peso_volumetrico))
```

**FT³ (pies cúbicos):**
```
ft3 = L × A × A × factor_ft3
```

**ValorExtra:**
```
valor_extra = ceil(ft3 × 8)
```
Cargo por manejo especial de volumen.

**Embalaje:**
```
embalaje = ceil(ft3 × 15)
```
Costo del material de empaque.

**Ganancia:**
```
ganancia = peso_bruto × tarifa_usd_kg × factor_ganancia
```
La tarifa USD/kg varía por tramos de peso.

**BoaVista:**
Cargo por envío vía Boa Vista, según suma de dimensiones.

### Ejemplo práctico: Laptop 2kg

```
Producto:         Laptop
Peso:             2 kg
Dimensiones:      30 × 20 × 15 cm
Valor:            R$ 500
Categoría:        Electrónicos (NEUTRAS)

Cálculos:
1. Peso volumétrico = 30×20×15÷6000 = 1,5 → 2 kg
2. Peso facturable  = max(2, 2) = 2 kg
3. FT³              = 30×20×15×0,0000353 = 0,3178
4. ValorExtra       = ceil(0,3178×8) = R$ 3
5. Embalaje         = ceil(0,3178×15) = R$ 5
6. Ganancia         = 2 × $5 USD × 6 = R$ 60
7. Tarifa Express   = R$ 106 (para 2 kg)
8. BoaVista         = R$ 70 (suma≤76)

EXPRESS = 106 + 3 + 5 + 60 + 20 + 70 = R$ 264
AÉREO   = ceil(2×9,50) + ceil(500×0,007)
          + ceil(500×0,04444) + 3 + 5 + 70 + 90
          + 60 + 80 + 133 = R$ 487
```

---

## 🏷️ Categorías de productos

### ¿Cómo se clasifica un producto?

El sistema usa **dos motores** en cascada:

1. **OpenAI GPT-4o mini** (si hay API key):
   - Envía el texto del producto
   - Recibe un array JSON de categorías
   - Cachea resultado para no repetir llamadas
   - Tiempo de respuesta: ~500ms por llamada

2. **Diccionario local** (fallback si la IA falla):
   - ~900 términos en español y portugués
   - Busca: exacto → sin acentos → singular → Levenshtein
   - Soporta conectores (y, e, con, de, /, -)
   - Detecta typos comunes (0 → o)

### Tipos de categoría

| Tipo | Significado | Modalidades |
|---|---|---|
| **NEUTRAS** | Sin restricción | Express, Terrestre o Aéreo |
| **TERRESTRE** | Solo por tierra | Terrestre únicamente |
| **SOLO_AEREO** | Solo por aire | Aéreo únicamente |

*(Lista completa desde DB)*

### Reglas especiales para baterías

- Producto ES una batería/power bank → categoría "baterias" (SOLO_AEREO)
- Producto CONTIENE baterías (celular, laptop, drone) → agrega "baterias"
- Producto USA baterías externas no incluidas → NO agrega "baterias"
- Baterías de auto → categoría "repuestos" (a menos que se envíen sueltas)

---

## 🌍 Envíos Internacionales

### ¿Cómo funciona?

Cuando los datos incluyen `pais_destino`, el sistema usa la integración
internacional en vez del motor local.

**Flujo:**
1. Extrae origen, destino, dimensiones y peso
2. Genera llave de caché (país + zip + ciudad + medidas)
3. Si existe en caché, devuelve sin costo
4. Si no, llama a Shippo API
5. Shippo consulta las transportistas conectadas
6. Devuelve tasas comparativas con precio y plazo
7. Guarda en caché por 1 hora

### Caché de tasas

Para no pagar 1¢ por cada consulta, las tasas se guardan en PostgreSQL:

```
Llave: datos normalizados del envío
Expira: 1 hora desde DB
```

Si dos clientes piden la misma ruta con las mismas medidas, el segundo no paga.

---

## 📈 Tablas de tarifas

### Express (R$/kg)

(desde DB — tarifas_express)

### Terrestre (R$/kg)

(desde DB — tarifas_terrestre)

### Nacional Venezuela (Bs/kg)

Costo de entrega nacional en Venezuela. Se usa el mayor entre OP1 y OP2.

(desde DB — nacional_op1 + nacional_op2)

---

## 📋 Datasets de referencia

### Tramos Boa Vista

| Suma L+A+A (cm) | Precio (R$) |
|---|---|
| (desde DB — tramos_boa_vista) |

### Tramos Ganancia (USD/kg)

| Hasta (kg) | USD/kg |
|---|---|
| (desde DB — tramos_ganancia) |

### Zonas

| Tipo | Ciudades |
|---|---|
| **BASE** | Curitiba, Campo Largo, Manaus... |
| **PROHIBIDO** | Boa Vista, Pacaraima |

---

## 🗄️ Base de datos

| Tabla | Función |
|---|---|
| `tarifas_express` | Precio por kg para Express |
| `tarifas_terrestre` | Precio por kg para Terrestre |
| `nacional_op1` | Costo nacional Venezuela OP1 |
| `nacional_op2` | Costo nacional Venezuela OP2 |
| `tramos_boa_vista` | Cargos por dimensiones ruta BV |
| `tramos_ganancia` | Tarifa USD/kg según peso |
| `modalidades` | Configuración de cada modalidad |
| `formulas` | Constantes del motor |
| `categorias` | Tipo + nombre de categoría |
| `zonas` | Ciudades BASE y PROHIBIDO |
| `logs` | Registro de eventos |
| `rate_cache` | Caché de tasas Shippo |
| `prompts_config` | Prompts para la IA |
| `cache_urls` | Caché de scraping |

---

## ❓ FAQ

**¿Qué no se puede enviar?**
Armas, drogas, material explosivo, productos ilegales.
No se aceptan envíos desde Boa Vista o Pacaraima.

**¿Cómo se elige la modalidad?**
Express → Terrestre → Aéreo. La primera que cumpla todos los requisitos.

**¿Por qué a veces el precio es más alto?**
Probablemente por peso volumétrico. Si la caja es grande pero ligera,
se cobra por el espacio, no por el peso.

**¿El costo nacional está incluido?**
Sí, el precio final incluye entrega en Venezuela.

**¿Puedo cambiar un precio?**
Sí, desde admin → Tarifas Express / Terrestre. Reflejado en 30s.

**¿Cómo agrego una categoría?**
Admin → Categorías. Si quieres que la IA la reconozca, edita el Prompt.

---

## 📖 Glosario

| Término | Definición |
|---|---|
| **Peso bruto** | Lo que marca la báscula |
| **Peso volumétrico** | L×A×A÷6000 — el espacio que ocupa |
| **Peso facturable** | El mayor entre bruto y volumétrico (lo que se cobra) |
| **FT³** | Pies cúbicos, medida de volumen para cargos extra |
| **ValorExtra** | Cargo por manejo de paquetes voluminosos |
| **Embalaje** | Costo del material de empaque |
| **Ganancia** | Margen de la empresa |
| **BoaVista** | Cargo por ruta terrestre vía Boa Vista |
| **Trecho** | Recorrido desde ciudades fuera de la base logística |
| **Modalidad** | Tipo de envío (Express, Terrestre, Aéreo) |
| **NEUTRAS** | Sin restricción de modalidad |
| **TERRESTRE** | Solo por tierra |
| **SOLO_AEREO** | Solo por aire |
