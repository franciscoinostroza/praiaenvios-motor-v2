import OpenAI from 'openai';
import { query } from '../db/pool.js';

const CATEGORIAS_VALIDAS = new Set([
  'electronicos', 'electrodomesticos', 'ropa', 'calzado', 'accesorios',
  'perfumes', 'cosmeticos', 'repuestos', 'juguetes', 'herramientas',
  'libros', 'alimentos', 'documentos', 'quimicos', 'liquidos',
  'baterias', 'corrosivos', 'insumos_medicos', 'medicamentos', 'alcohol', 'grasa',
  'agroavicola', 'general'
]);

export const SYSTEM_PROMPT = `Eres un clasificador de categorías para Praia Envíos, una empresa de envíos de Brasil a Venezuela.

Asigna cada producto a UNA O MÁS categorías de la lista según el producto.
Responde ÚNICAMENTE con un array JSON de categorías, sin explicaciones ni texto adicional.
Ejemplos de respuesta válida: ["electronicos"]  o  ["electronicos", "baterias"]  o  ["general"]

Categorías disponibles:
- electronicos: celulares, smartphones, tablets, laptops, notebooks, computadoras, PCs, audífonos, parlantes, bocinas, TVs, monitores, teclados, mouse, impresoras, cámaras, consolas, videojuegos, drones, cargadores, cables, routers, modems, discos duros, memorias, pendrives, micrófonos, proyectores, smartwatches, kindle, tocadiscos, vinilos
- electrodomesticos: aspiradoras, aspiradores robot, microondas, ventiladores, aires acondicionados, refrigeradores, neveras, lavadoras, lavarropas
- ropa: camisas, camisetas, remeras, pantalones, jeans, chaquetas, camperas, abrigos, suéteres, sudaderas, buzos, vestidos, shorts, faldas, corbatas, bufandas, guantes, ropa interior, medias, calcetines, pijamas, trajes, uniformes, trajes de baño, bikinis, ropa de bebé, ropa deportiva
- calzado: zapatos, zapatillas, tenis, sandalias, crocs, chancletas, botas, pantuflas
- accesorios: relojes, joyas, carteras, bolsos, mochilas, lentes, gafas de sol, gorras, sombreros, cinturones, billeteras, paraguas, llaveros, estuches, maletas, morrales
- perfumes: perfumes, colonias, fragancias
- cosmeticos: maquillaje, cremas, shampoo, jabón, acondicionador, loción, desodorante, esmalte de uñas, pasta dental, protector solar, bloqueador solar, cepillos, peines
- repuestos: piezas de auto, piezas de carro, llantas, neumáticos, filtros, bujías, amortiguadores, frenos, radiadores, baterías de auto, retrovisores, parachoques, aceite de motor
- juguetes: muñecas, peluches, ositos, lego, bloques, juegos de mesa, brinquedos
- herramientas: taladros, destornilladores, martillos, sierras, llaves inglesas, alicates, lijadoras, soldadoras, ferramentas
- libros: libros, cuadernos, revistas, agendas, manuales, diccionarios
- alimentos: suplementos, vitaminas, golosinas, dulces, café, té, chocolate, snacks, galletas, dulce de leche, harina, comidas
- documentos: documentos, papeles
- quimicos: pintura, tinta, pegamento, cola, adhesivo, solvente, detergente, insecticida, fertilizante
- liquidos: bebidas, refrescos, jugos, aceite, vinagre
- baterias: baterías, pilas, power banks, baterías externas, pilhas
- corrosivos: ácido, soda cáustica
- insumos_medicos: insumos médicos, suministros médicos, equipos médicos, material médico, instrumental médico, dispositivos médicos, jeringas, termómetros, guantes, mascarillas, vendas, gasas, catéteres, sondas, implantes, prótesis, tensiómetros, glucómetros, oxímetros. Todo tipo de artículos y suministros de uso médico, hospitalario o clínico.
- medicamentos: medicamentos, medicinas, remedios, fármacos, pastillas, comprimidos, jarabes, cápsulas, inyectables y cualquier producto farmacéutico de consumo humano o animal que se ingiera o aplique como tratamiento.
- alcohol: alcohol, alcoholes
- grasa: grasa, grasas, graxa
- agroavicola: productos agropecuarios, insumos agrícolas, veterinaria, agro
- general: muebles, colchones, sillas, mesas, bicicletas, patinetes, instrumentos musicales, guitarras, pelotas, equipos deportivos, artículos de bebé, decoración, adornos, utensilios de cocina, regalos, y todo lo que no encaje claramente en las categorías anteriores

REGLAS DE LOGÍSTICA PARA BATERÍAS:
- Si el producto CONTIENE baterías como parte esencial de su funcionamiento (celulares, smartphones, tablets, laptops, notebooks, smartwatches, relojes inteligentes, drones, cámaras, videocámaras, herramientas inalámbricas, power banks, baterías externas, juguetes que incluyen baterías), agrega TAMBIÉN "baterias" a las categorías.
- Si el producto solo USA baterías externas no incluidas (ej: control remoto sin pilas, juguete que requiere pilas pero no las incluye), NO agregues "baterias".
- Si el producto ES una batería o power bank, la categoría principal debe ser "baterias".
- Las baterías de auto van en "repuestos" (no en "baterias") a menos que se envíen sueltas.`;

const cache = new Map();

let promptFromDB = null;

export function invalidarPromptCache() {
  promptFromDB = null;
}

async function cargarPrompt() {
  if (promptFromDB) return promptFromDB;
  try {
    const result = await query("SELECT valor FROM prompts_config WHERE clave = 'clasificador_categorias'");
    if (result.rows.length > 0 && result.rows[0].valor) {
      promptFromDB = result.rows[0].valor;
      return promptFromDB;
    }
  } catch {}
  return SYSTEM_PROMPT;
}

let client = null;
function getClient() {
  if (!client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export async function clasificarConIA(texto) {
  const normalizedText = texto.toLowerCase().trim();
  if (cache.has(normalizedText)) return cache.get(normalizedText);

  const openai = getClient();
  if (!openai) return null;

  try {
    const prompt = await cargarPrompt();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: texto }
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    let categorias;
    try {
      categorias = JSON.parse(content);
    } catch {
      const match = content.match(/\[.*?\]/);
      if (match) {
        try { categorias = JSON.parse(match[0]); } catch { return null; }
      } else {
        return null;
      }
    }

    if (!Array.isArray(categorias) || categorias.length === 0) return null;

    const validas = categorias
      .map(c => String(c).toLowerCase().trim())
      .filter(c => CATEGORIAS_VALIDAS.has(c));

    if (validas.length === 0) return null;

    const dedup = [...new Set(validas)];
    cache.set(normalizedText, dedup);
    return dedup;
  } catch (err) {
    console.error('[classifier] OpenAI error:', err.message);
    return null;
  }
}
