import { clasificarConIA } from './classifier.js';

const TERMINOS_POR_CATEGORIA = {
  electronicos: [
    'electrónica', 'electronica', 'electrónico', 'electronico',
    'electrônica', 'eletrônico', 'eletronico',
    'producto electrónico', 'producto electronico', 'producto de electronica',
    'artículo electrónico', 'articulo electronico', 'productos electronicos',
    'equipo electrónico', 'equipo electronico', 'aparato electrónico',
    'celular', 'celulares', 'teléfono', 'telefono', 'telefone',
    'smartphone', 'iphone', 'android',
    'tablet', 'tablets', 'ipad',
    'notebook', 'laptop', 'computadora', 'computador', 'pc',
    'auricular', 'auriculares', 'fone', 'fones',
    'audífono', 'audifono', 'audífonos', 'audifonos',
    'headphone', 'headphones', 'earbuds',
    'parlante', 'parlantes', 'bocina', 'bocinas',
    'altavoz', 'altavoces', 'caixa de som',
    'televisor', 'televisores', 'televisão',
    'tv', 'smart tv', 'monitor', 'monitores',
    'pantalla', 'pantallas', 'tela',
    'mouse', 'teclado', 'teclados', 'keyboard',
    'impresora', 'impresoras', 'impressora',
    'consola', 'consolas', 'videojuego', 'videojuegos',
    'videogame', 'playstation', 'xbox', 'nintendo',
    'cámara', 'camara', 'cámaras', 'camaras',
    'câmera', 'cámara fotográfica',
    'drone', 'drones', 'dron',
    'cargador', 'cargadores', 'carregador', 'carregadores',
    'cable', 'cables', 'cabo', 'cabos',
    'router', 'modem', 'módem',
    'disco duro', 'disco rigido', 'hd', 'ssd',
    'memoria', 'memorias', 'pendrive', 'memória',
    'micrófono', 'microfono', 'micrófonos', 'microfone',
    'proyector', 'proyectores', 'projetor',
    'smartwatch', 'reloj inteligente', 'relógio inteligente',
    'kindle', 'lector', 'e-reader', 'ebook',
    'tocadiscos', 'vinilo', 'vinilos', 'vinil', 'vinis',
    'toca-discos', 'toca discos',
  ],

  electrodomesticos: [
    'electrodoméstico', 'electrodomestico', 'electrodomésticos', 'electrodomesticos',
    'aspiradora', 'aspirador', 'aspiradora robot',
    'microondas',
    'ventilador', 'ventiladores',
    'aire acondicionado', 'ar condicionado',
    'heladera', 'nevera', 'geladeira', 'refrigerador',
    'lavadora', 'lavarropas', 'máquina de lavar',
  ],

  ropa: [
    'camisa', 'camisas', 'camiseta', 'camisetas',
    'remera', 'remeras', 'playera',
    'pantalon', 'pantalón', 'pantalones',
    'jeans', 'jean', 'vaquero', 'vaqueros',
    'chaqueta', 'chaquetas', 'jaqueta',
    'campera', 'camperas', 'abrigo', 'abrigos',
    'suéter', 'sweater', 'suéteres', 'sudadera', 'sudaderas',
    'buzo', 'buzos', 'moletom',
    'vestido', 'vestidos',
    'bermuda', 'bermudas', 'short', 'shorts',
    'falda', 'faldas', 'saia',
    'corbata', 'corbatas', 'gravata', 'gravatas',
    'bufanda', 'bufandas', 'cachecol',
    'guante', 'guantes', 'luva', 'luvas',
    'ropa interior', 'calzoncillo', 'calzoncillos',
    'cueca', 'cuecas', 'bombacha', 'bombachas',
    'media', 'medias', 'calcetín', 'calcetines', 'meia', 'meias',
    'pijama', 'pijamas',
    'traje', 'trajes', 'terno', 'ternos',
    'uniforme', 'uniformes',
    'traje de baño', 'malla', 'bikini',
    'ropa de bebé', 'roupa de bebê', 'ropa de bebe',
    'ropa deportiva', 'roupa esportiva',
  ],

  calzado: [
    'zapatos', 'zapatillas', 'zapatilla',
    'tenis', 'tênis', 'zapato',
    'calzados', 'sapato', 'sapatos',
    'sandalias', 'sandalia', 'sandália', 'sandálias',
    'crocs', 'chancleta', 'chancletas', 'chinelo', 'chinelos',
    'bota', 'botas',
    'pantufla', 'pantuflas', 'pantufa', 'pantufas',
  ],

  accesorios: [
    'accesorio', 'accesorios', 'acessório', 'acessórios',
    'reloj', 'relojes', 'relógio', 'relógios',
    'joya', 'joyas', 'joia', 'joias',
    'cartera', 'carteras', 'bolso', 'bolsos',
    'mochila', 'mochilas',
    'lente', 'lentes', 'lentes de sol',
    'gafas', 'gafas de sol', 'óculos', 'óculos de sol',
    'anteojo', 'anteojos', 'óculos de grau',
    'gorro', 'gorros', 'gorra', 'gorras',
    'sombrero', 'sombreros', 'chapéu', 'chapéus',
    'cinturón', 'cinturon', 'cinturones', 'cinto', 'cintos',
    'billetera', 'billeteras', 'carteira',
    'paraguas', 'paragua', 'guarda-chuva',
    'llavero', 'llaveros', 'chaveiro',
    'estuche', 'estuches', 'estojo', 'estojos',
    'maleta', 'maletas', 'mala', 'malas',
    'morral', 'morrales',
  ],

  perfumes: [
    'perfume', 'perfumes', 'perfumería', 'perfumaria',
    'colonia', 'colonias', 'colônia', 'colônias',
    'fragancia', 'fragancias', 'fragrância',
  ],

  cosmeticos: [
    'cosmético', 'cosmetico', 'cosméticos', 'cosmeticos',
    'maquillaje', 'maquillajes', 'maquiagem', 'maquiagens',
    'crema', 'cremas', 'creme', 'cremes',
    'shampoo', 'shampú',
    'jabón', 'jabon', 'jabones', 'sabonete', 'sabonetes',
    'acondicionador', 'condicionador',
    'loción', 'locion', 'lociones', 'loção', 'loções',
    'desodorante', 'desodorantes',
    'esmalte', 'esmaltes', 'esmalte de uña',
    'pasta dental', 'pasta de dientes', 'crema dental', 'creme dental',
    'protector solar', 'protetor solar', 'bloqueador', 'bloqueador solar',
    'cepillo', 'cepillo de dientes', 'escova de dente',
    'peine', 'peines', 'pente', 'pentes',
  ],

  repuestos: [
    'pieza', 'peça', 'piezas', 'peças',
    'piezas de carro',
    'repuesto', 'repuestos',
    'llanta', 'llantas', 'neumático', 'neumatico', 'neumáticos',
    'pneu', 'pneus',
    'filtro', 'filtros', 'filtro de aceite', 'filtro de ar',
    'bujía', 'bujia', 'bujías', 'vela', 'velas',
    'amortiguador', 'amortiguadores', 'amortecedor', 'amortecedores',
    'freno', 'frenos', 'freio', 'freios',
    'radiador', 'radiadores',
    'batería de auto', 'bateria de carro',
    'retrovisor', 'retrovisores',
    'parachoques', 'paragolpes', 'parachoque',
    'aceite de motor', 'óleo de motor',
  ],

  juguetes: [
    'juguete', 'juguetes', 'brinquedo', 'brinquedos',
    'muñeca', 'muñecas', 'boneca', 'bonecas',
    'peluche', 'peluches', 'ursinho',
    'lego', 'bloques', 'blocos',
    'juego de mesa', 'juegos de mesa', 'jogo de tabuleiro',
  ],

  herramientas: [
    'herramienta', 'herramientas', 'ferramenta', 'ferramentas',
    'taladro', 'taladros', 'furadeira', 'furadeiras',
    'destornillador', 'destornilladores', 'chave de fenda',
    'martillo', 'martillos', 'martelo', 'martelos',
    'sierra', 'sierras', 'serra', 'serras',
    'llave inglesa', 'llave', 'llaves', 'chave',
    'alicate', 'alicates',
    'lijadora', 'lijadoras', 'lixadeira',
    'soldadora', 'soldador',
  ],

  libros: [
    'libro', 'libros', 'livro', 'livros',
    'cuaderno', 'cuadernos', 'caderno', 'cadernos',
    'revista', 'revistas',
    'agenda', 'agendas',
    'manual', 'manuales',
    'diccionario', 'diccionarios', 'dicionário',
  ],

  alimentos: [
    'alimento', 'alimentos', 'comida',
    'suplemento', 'suplementos', 'vitamina', 'vitaminas',
    'golosina', 'golosinas', 'dulce', 'dulces',
    'café', 'cafe', 'café em pó',
    'té', 'te', 'chá',
    'chocolate', 'chocolates',
    'snack', 'snacks',
    'galleta', 'galletas', 'bolacha', 'bolachas',
    'dulce de leche', 'dulce de leite', 'doce de leite',
    'harina', 'harinas', 'farinha',
  ],

  documentos: [
    'documento', 'documentos',
  ],

  quimicos: [
    'químico', 'quimico', 'químicos', 'quimicos',
    'pintura', 'pinturas', 'tinta', 'tintas',
    'pegamento', 'pegamentos', 'cola', 'colas',
    'adhesivo', 'adhesivos', 'adesivo', 'adesivos',
    'solvente', 'solventes',
    'detergente', 'detergentes',
    'insecticida', 'insecticidas', 'inseticida',
    'fertilizante', 'fertilizantes',
  ],

  liquidos: [
    'líquido', 'liquido', 'líquidos', 'liquidos',
    'bebida', 'bebidas',
    'refresco', 'refrescos', 'refrigerante',
    'jugo', 'jugos', 'suco', 'sucos',
    'aceite', 'aceites', 'óleo', 'óleos',
    'vinagre',
  ],

  baterias: [
    'bateria', 'batería', 'baterías', 'baterias',
    'pila', 'pilas', 'pilha', 'pilhas',
  ],

  corrosivos: [
    'corrosivo', 'corrosivos',
    'ácido', 'acido', 'ácidos', 'acidos',
    'soda cáustica', 'soda caustica',
  ],

  insumos_medicos: [
    'insumo médico', 'insumos médicos', 'insumo medico', 'insumos medicos',
    'suministro médico', 'suministros médicos', 'suministro medico', 'suministros medicos',
    'equipo médico', 'equipo medico',
    'material médico', 'material medico',
    'instrumental médico', 'instrumental medico',
    'artículo médico', 'articulo medico',
    'producto médico', 'producto medico',
    'dispositivo médico', 'dispositivo medico',
    'jeringa', 'jeringas', 'seringa', 'seringas',
    'termómetro', 'termometro', 'termômetro',
    'guante médico', 'guantes médicos', 'luva cirúrgica',
    'mascarilla', 'mascarillas', 'máscara cirúrgica',
    'venda', 'vendas', 'atadura', 'gasa', 'gasas',
    'catéter', 'cateter', 'sonda', 'sondas',
    'implante', 'implantes', 'prótesis', 'protesis',
    'tensiómetro', 'tensiometro', 'glucómetro', 'glucometro',
    'oxímetro', 'oximetro', 'pulsioxímetro', 'pulsioximetro',
  ],

  medicamentos: [
    'medicamento', 'medicamentos',
    'medicina', 'medicinas',
    'remedio', 'remedios', 'remédio', 'remédios',
    'fármaco', 'farmaco', 'fármacos',
    'pastilla', 'pastillas', 'comprimido', 'comprimidos',
    'jarabe', 'jarabes', 'xarope', 'xaropes',
    'cápsula', 'capsula', 'cápsulas', 'capsulas',
    'inyectable', 'inyectables',
  ],

  alcohol: [
    'alcohol', 'alcoholes', 'álcool',
  ],

  grasa: [
    'grasa', 'grasas', 'graxa', 'graxas',
  ],

  // ── Nuevas categorías ──
  agroavicola: [
    'agroavicola', 'agroavícola',
    'agropecuario', 'agropecuaria',
    'agrícola', 'agricola', 'agro',
    'avicola', 'avícola',
    'insumo agrícola', 'insumo agricola',
    'insumo avicola', 'insumo avícola',
    'insumo agropecuario',
    'producto agrícola', 'producto agricola',
    'insumo veterinario', 'veterinario', 'veterinaria',
  ],

  general: [
    'mueble', 'muebles', 'móveis', 'movel',
    'colchón', 'colchon', 'colchones', 'colchão',
    'silla', 'sillas', 'cadeira', 'cadeiras',
    'mesa', 'mesas',
    'bicicleta', 'bicicletas',
    'patinete', 'patineta',
    'instrumento musical', 'guitarra', 'guitarras',
    'pelota', 'pelotas', 'bola', 'bolas',
    'equipo deportivo', 'equipamiento deportivo',
    'artículo de bebé', 'articulo de bebe', 'cosa de bebé',
    'decoración', 'decoracion', 'adorno', 'adornos',
    'artículo de cocina', 'utensilio', 'utensilios',
    'regalo', 'regalos', 'presente',
    'otro', 'otros', 'general',
  ],
};

const MAPA_CATEGORIAS = {};
for (const [categoria, terminos] of Object.entries(TERMINOS_POR_CATEGORIA)) {
  MAPA_CATEGORIAS[categoria] = categoria;
  for (const termino of terminos) {
    MAPA_CATEGORIAS[termino] = categoria;
  }
}

function distanciaLevenshtein(a, b) {
  var m = a.length, n = b.length;
  var dp = [];
  for (var i = 0; i <= m; i++) dp[i] = [i];
  for (var j = 0; j <= n; j++) dp[0][j] = j;
  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      var costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + costo);
    }
  }
  return dp[m][n];
}

const CONECTORES = /\b(y|e|con|de|com|und|unidad)\b|[&\/\-\+\.\,]/gi;

function esNuevo(arr, val) {
  return !arr.includes(val);
}

function buscarToken(token, resultado) {
  // exacto
  if (MAPA_CATEGORIAS[token]) {
    if (esNuevo(resultado, MAPA_CATEGORIAS[token])) resultado.push(MAPA_CATEGORIAS[token]);
    return true;
  }
  // typo 0 → o
  var conO = token.replace(/0/g, 'o');
  if (conO !== token && MAPA_CATEGORIAS[conO]) {
    if (esNuevo(resultado, MAPA_CATEGORIAS[conO])) resultado.push(MAPA_CATEGORIAS[conO]);
    return true;
  }
  // singular
  var sing = token.replace(/es$/, '').replace(/s$/, '');
  if (sing !== token && MAPA_CATEGORIAS[sing]) {
    if (esNuevo(resultado, MAPA_CATEGORIAS[sing])) resultado.push(MAPA_CATEGORIAS[sing]);
    return true;
  }
  // fuzzy: distancia de Levenshtein
  var umbral = Math.max(1, Math.floor(token.length / 4));
  var mejorDistancia = Infinity, mejorKey = null;
  for (var key in MAPA_CATEGORIAS) {
    if (Math.abs(key.length - token.length) > umbral) continue;
    var dist = distanciaLevenshtein(token, key);
    if (dist < mejorDistancia) {
      mejorDistancia = dist;
      mejorKey = key;
    }
  }
  if (mejorKey && mejorDistancia <= umbral) {
    if (esNuevo(resultado, MAPA_CATEGORIAS[mejorKey])) resultado.push(MAPA_CATEGORIAS[mejorKey]);
    return true;
  }
  return false;
}

export function normalizarCategorias(categorias) {
  var resultado = [];
  for (var i = 0; i < categorias.length; i++) {
    var cat = categorias[i].toLowerCase().trim();
    var agregadosAntes = resultado.length;

    // Paso 1: match exacto
    if (MAPA_CATEGORIAS[cat]) {
      if (esNuevo(resultado, MAPA_CATEGORIAS[cat])) resultado.push(MAPA_CATEGORIAS[cat]);
      continue;
    }

    // Paso 2: strip prefijo y match
    var limpia = cat.replace(/^(producto|articulo|artículo|item|produto|insumo)\s+/g, '').trim();
    if (MAPA_CATEGORIAS[limpia]) {
      if (esNuevo(resultado, MAPA_CATEGORIAS[limpia])) resultado.push(MAPA_CATEGORIAS[limpia]);
      continue;
    }

    // Paso 3: tokenizar por conectores, buscar cada token
    var tokens = limpia.replace(CONECTORES, ' ').split(/\s+/).filter(function(t) { return t.length > 2; });
    for (var ti = 0; ti < tokens.length; ti++) {
      buscarToken(tokens[ti], resultado);
    }
    if (resultado.length > agregadosAntes) continue;

    // Paso 4: substring largo (key dentro de cat, último recurso)
    for (var key in MAPA_CATEGORIAS) {
      if (cat.includes(key) && key.length > 4) {
        if (esNuevo(resultado, MAPA_CATEGORIAS[key])) resultado.push(MAPA_CATEGORIAS[key]);
        break;
      }
    }
    if (resultado.length > agregadosAntes) continue;

    // Paso 5: fallback seguro a general (siempre existe en la planilla)
    if (esNuevo(resultado, 'general')) resultado.push('general');
  }
  return resultado.length > 0 ? resultado : ['general'];
}

export async function normalizarCategoriasConIA(categorias) {
  var resultado = [];
  for (var i = 0; i < categorias.length; i++) {
    var input = categorias[i].trim();
    var llmResult = await clasificarConIA(input);
    if (llmResult) {
      for (var j = 0; j < llmResult.length; j++) {
        if (!resultado.includes(llmResult[j])) resultado.push(llmResult[j]);
      }
    } else {
      var fallback = normalizarCategorias([input]);
      for (var k = 0; k < fallback.length; k++) {
        if (!resultado.includes(fallback[k])) resultado.push(fallback[k]);
      }
    }
  }
  return resultado.length > 0 ? resultado : ['general'];
}
