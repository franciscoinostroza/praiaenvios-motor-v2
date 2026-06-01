import { query } from './pool.js';
import { CATEGORIAS_SEMILLA } from '../utils/categorias-semilla.js';
import { SYSTEM_PROMPT } from '../utils/classifier.js';
import { PLANTILLAS_DEFAULT } from '../utils/plantillas.js';

async function seed() {
  // Tarifas Express
  const expressData = [[1,83],[2,106],[3,127],[4,142],[5,153],[6,165],[7,180],[8,193],[9,207],[10,221]];
  for (const [kg, precio] of expressData) {
    await query('INSERT INTO tarifas_express (kg, precio_bs) VALUES ($1, $2) ON CONFLICT (kg) DO NOTHING', [kg, precio]);
  }
  console.log('[seed] tarifas_express ok');

  // Tarifas Terrestre
  const terreData = [[1,80],[2,85],[3,95],[4,100],[5,105],[6,110],[7,120],[8,200],[9,200],[10,200]];
  for (const [kg, precio] of terreData) {
    await query('INSERT INTO tarifas_terrestre (kg, precio_bs) VALUES ($1, $2) ON CONFLICT (kg) DO NOTHING', [kg, precio]);
  }
  console.log('[seed] tarifas_terrestre ok');

  // Nacional OP1
  const nac1 = [[1,2008.80],[2,3831.60],[3,5654.40],[4,7477.20],[5,9300.00],[6,11122.80],[7,12945.60],[8,12945.60],[9,14768.40],[10,14768.40],[11,16777.20],[12,16777.20],[13,18600.00],[14,18600.00],[15,20422.80],[16,20442.80],[17,22245.60],[18,22245.60],[19,24068.40],[20,24068.40],[21,24068.40],[22,26077.20],[23,26077.20],[24,26077.20],[25,27900.00],[26,27900.00],[27,27900.00],[28,29722.80],[29,29722.80],[30,29722.80],[31,31396.80],[32,31396.80],[33,31396.80],[34,32835.20],[35,32835.20],[36,32835.20],[37,34273.60],[38,34273.60],[39,34273.60],[40,35712.00],[41,35712.00],[42,35712.00],[43,37336.40],[44,37336.40],[45,37336.40],[46,38774.80],[47,38774.80],[48,38774.80],[49,40213.20],[50,40213.20],[51,40213.20],[52,41651.60],[53,41651.60],[54,41651.60],[55,43090.00],[56,43090.00],[57,43090.00],[58,44528.40],[59,44528.40],[60,44528.40],[61,46152.80],[62,46152.80],[63,46152.80],[64,47591.20],[65,47591.20],[66,47591.20],[67,49029.60],[68,49029.60],[69,49029.60],[70,50468.00],[71,50468.00],[72,50468.00],[73,51906.40],[74,51906.40],[75,51906.40],[76,53344.80],[77,53344.80],[78,53344.80],[79,53344.80],[80,53344.80]];
  for (const [kg, precio] of nac1) {
    await query('INSERT INTO nacional_op1 (kg, precio_bs) VALUES ($1, $2) ON CONFLICT (kg) DO NOTHING', [kg, precio]);
  }
  console.log('[seed] nacional_op1 ok');

  // Nacional OP2
  const nac2 = [[1,1662.47],[2,3189.77],[3,4703.57],[4,6163.29],[5,7677.09],[6,9190.88],[7,10704.64],[8,10704.64],[9,12218.47],[10,12218.47],[11,13110.52],[12,13110.52],[13,13840.39],[14,13840.39],[15,15624.49],[16,15624.49],[17,17307.24],[18,17307.24],[19,20273.98],[20,20273.98],[21,20273.98],[22,21625.60],[23,21625.60],[24,21625.60],[25,22977.20],[26,22977.20],[27,22977.20],[28,25004.60],[29,25004.60],[30,25004.60],[31,25920.20],[32,25920.20],[33,25920.20],[34,27184.60],[35,27184.60],[36,27184.60],[37,28449.00],[38,28449.00],[39,28449.00],[40,29081.18],[41,29081.18],[42,29081.18],[43,30977.80],[44,30977.80],[45,30977.80],[46,32242.20],[47,32242.20],[48,32242.20],[49,32874.40],[50,32874.40],[51,32874.40],[52,34138.80],[53,34138.80],[54,34138.80],[55,35403.20],[56,35403.20],[57,35403.20],[58,36667.60],[59,36667.60],[60,36667.60],[61,37932.00],[62,37932.00],[63,37932.00],[64,39196.40],[65,39196.40],[66,39196.40],[67,40460.80],[68,40460.80],[69,40460.80],[70,41725.20],[71,41725.20],[72,41725.20],[73,42989.60],[74,42989.60],[75,42989.60],[76,44254.00],[77,44254.00],[78,44254.00],[79,44254.00],[80,44254.00]];
  for (const [kg, precio] of nac2) {
    await query('INSERT INTO nacional_op2 (kg, precio_bs) VALUES ($1, $2) ON CONFLICT (kg) DO NOTHING', [kg, precio]);
  }
  console.log('[seed] nacional_op2 ok');

  // Tramos Boa Vista
  const bv = [[76,70],[130,150],[160,200],[300,300]];
  for (const [hasta, precio] of bv) {
    await query('INSERT INTO tramos_boa_vista (hasta_cm, precio_bs) VALUES ($1, $2) ON CONFLICT DO NOTHING', [hasta, precio]);
  }
  await query('INSERT INTO tramos_boa_vista (precio_bs) VALUES (500) ON CONFLICT DO NOTHING');
  console.log('[seed] tramos_boa_vista ok');

  // Tramos Ganancia
  const gan = [[5,5],[99,4],[599,3],[999,2]];
  for (const [hasta, usd] of gan) {
    await query('INSERT INTO tramos_ganancia (hasta_kg, usd_kg) VALUES ($1, $2) ON CONFLICT DO NOTHING', [hasta, usd]);
  }
  await query('INSERT INTO tramos_ganancia (usd_kg) VALUES (1) ON CONFLICT DO NOTHING');
  console.log('[seed] tramos_ganancia ok');

  // Modalidades
  const mods = [
    ['EXPRESS','id',1],['EXPRESS','nombre','Modalidad 1'],
    ['EXPRESS','peso_max_kg',10],['EXPRESS','dimension_max_cm',50],
    ['EXPRESS','valor_max_rs',2000],['EXPRESS','tiempo_entrega_dias',15],
    ['EXPRESS','valor_fijo_rs',20],
    ['TERRESTRE','id',2],['TERRESTRE','nombre','Modalidad 2'],
    ['TERRESTRE','peso_max_kg',10],['TERRESTRE','dimension_max_cm',50],
    ['TERRESTRE','valor_max_rs',2000],['TERRESTRE','tiempo_entrega_dias',30],
    ['TERRESTRE','valor_fijo_rs',20],
    ['AEREO','id',3],['AEREO','nombre','Modalidad 3'],
    ['AEREO','tiempo_entrega_dias',25],['AEREO','cargo_yhonatan_rs',90],
    ['AEREO','cargo_pickup_rs',80],['AEREO','cargo_manaus_bv_rs',133],
    ['AEREO_TRECHO','id',4],['AEREO_TRECHO','nombre','Modalidad 4'],
    ['AEREO_TRECHO','tiempo_entrega_dias',30]
  ];
  for (const [mod, key, val] of mods) {
    await query('INSERT INTO modalidades (modalidad, clave, valor) VALUES ($1, $2, $3) ON CONFLICT (modalidad, clave) DO NOTHING', [mod, key, String(val)]);
  }
  console.log('[seed] modalidades ok');

  // Formulas
  const forms = [
    ['divisor_volumetrico', 6000], ['factor_ft3', 0.0000353147],
    ['flete_aereo_por_kg', 9.5], ['factor_seguro', 0.007],
    ['factor_empresa_manaus', 0.04444], ['factor_ganancia', 6],
    ['nacional_peso_min', 1], ['nacional_peso_max', 80],
    ['tasa_dolar', 4.60]
  ];
  for (const [key, val] of forms) {
    await query('INSERT INTO formulas (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO NOTHING', [key, val]);
  }
  console.log('[seed] formulas ok');

  // Categorias — limpiar filas viejas que cambiaron de tipo
  await query("DELETE FROM categorias WHERE categoria IN ('medicamento', 'medicamentos')");
  for (const [tipo, cat] of CATEGORIAS_SEMILLA) {
    await query('INSERT INTO categorias (tipo, categoria) VALUES ($1, $2) ON CONFLICT (tipo, categoria) DO NOTHING', [tipo, cat]);
  }
  console.log('[seed] categorias ok');

  // Prompt clasificador
  await query("INSERT INTO prompts_config (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO NOTHING", ['clasificador_categorias', SYSTEM_PROMPT]);
  console.log('[seed] prompts_config ok');

  // Zonas
  const zonas = [
    ['BASE','curitiba'],['BASE','campo largo'],['BASE','contenda'],
    ['BASE','fazenda rio grande'],['BASE','araucária'],['BASE','araucaria'],
    ['BASE','almirante tamandaré'],['BASE','almirante tamandare'],['BASE','manaus'],
    ['PROHIBIDO','boa vista'],['PROHIBIDO','pacaraima']
  ];
  for (const [tipo, ciudad] of zonas) {
    await query('INSERT INTO zonas (tipo, ciudad) VALUES ($1, $2) ON CONFLICT (tipo, ciudad) DO NOTHING', [tipo, ciudad]);
  }
  console.log('[seed] zonas ok');

  // Plantillas de mensajes
  for (const [clave, valor] of Object.entries(PLANTILLAS_DEFAULT)) {
    await query('INSERT INTO plantillas_mensajes (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO NOTHING', [clave, valor]);
  }
  console.log('[seed] plantillas_mensajes ok');

  // Categoría × Servicio — matriz de semáforos
  const CATEGORIAS_MATRIZ = {
    electronica:             { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    electrodomesticos:       { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    ropa:                    { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    calzado:                 { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    accesorios:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    perfumes:                { sedex: 'verde',   pac: 'verde',   latam: 'verde',  doc: 'FISPQ/MSDS' },
    cosmeticos:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    repuestos:               { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    juguetes:                { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    herramientas:            { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    libros:                  { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    alimentos:               { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    suplementos:             { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    documentos:              { sedex: 'verde',   pac: 'rojo',    latam: 'rojo'    },
    quimicos:                { sedex: 'amarillo',pac: 'amarillo',latam: 'amarillo',doc: 'FISPQ/MSDS' },
    liquidos:                { sedex: 'amarillo',pac: 'amarillo',latam: 'amarillo',doc: 'FISPQ/MSDS' },
    baterias:                { sedex: 'rojo',    pac: 'verde',   latam: 'verde'   },
    corrosivos:              { sedex: 'rojo',    pac: 'rojo',    latam: 'rojo'    },
    insumos_medicos:         { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    medicamentos:            { sedex: 'rojo',    pac: 'rojo',    latam: 'rojo'    },
    alcohol:                 { sedex: 'rojo',    pac: 'rojo',    latam: 'rojo'    },
    grasa:                   { sedex: 'rojo',    pac: 'rojo',    latam: 'rojo'    },
    agroavicola:             { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    aerosoles_inflamables:   { sedex: 'rojo',    pac: 'rojo',    latam: 'rojo'    },
    aerosoles_no_inflamables:{ sedex: 'amarillo',pac: 'amarillo',latam: 'amarillo',doc: 'FISPQ/MSDS' },
    aeronaves_drones:        { sedex: 'rojo',    pac: 'verde',   latam: 'verde'   },
    odontologicos:           { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    audio_profesional:       { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    instrumentos_musicales:  { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    esotericos:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    peluqueria_barberia:     { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    automotriz:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    camping_pesca:           { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    mascotas:                { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    deportes:                { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    decoracion:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    semillas:                { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    jardineria:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    fiesta:                  { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    escolar:                 { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    oficina:                 { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    navidad:                 { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    bisuteria:               { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    joyeria:                 { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    religiosos:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    celulares:               { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    textiles_hogar:          { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    gaming:                  { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    fotografia_video:        { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    bebes:                   { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    cocina:                  { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    bano:                    { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    limpieza:                { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    ferreteria:              { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    manualidades:            { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    embalaje:                { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    seguridad:               { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    veterinario:             { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
    general:                 { sedex: 'verde',   pac: 'verde',   latam: 'verde'   },
  };

  for (const [cat, svc] of Object.entries(CATEGORIAS_MATRIZ)) {
    for (const servicio of ['sedex', 'pac', 'latam']) {
      await query(
        "INSERT INTO categoria_servicios (categoria, servicio, estado, documentacion) VALUES ($1, $2, $3, $4) ON CONFLICT (categoria, servicio) DO NOTHING",
        [cat, servicio, svc[servicio], svc.doc || '']
      );
    }
  }
  console.log('[seed] categoria_servicios ok (' + Object.keys(CATEGORIAS_MATRIZ).length + ' categorias)');

  // Mapeo de términos a categorías (diccionario editable por admin)
  const MAPEO_INICIAL = [
    ['drone', 'aeronaves_drones', 'baterias'],
    ['dron', 'aeronaves_drones', 'baterias'],
    ['laptop', 'electronica', 'baterias'],
    ['notebook', 'electronica', 'baterias'],
    ['smartphone', 'celulares', 'baterias'],
    ['celular', 'celulares', 'baterias'],
    ['tablet', 'electronica', 'baterias'],
    ['ipad', 'electronica', 'baterias'],
    ['smartwatch', 'electronica', 'baterias'],
    ['cámara digital', 'fotografia_video', 'baterias'],
    ['camara digital', 'fotografia_video', 'baterias'],
    ['perfume importado', 'perfumes', ''],
    ['colonia importada', 'perfumes', ''],
    ['suplemento alimenticio', 'suplementos', 'alimentos'],
    ['suplemento deportivo', 'suplementos', 'alimentos'],
    ['grasa automotriz', 'automotriz', ''],
    ['aceite de motor', 'automotriz', ''],
    ['medicamento controlado', 'medicamentos', ''],
    ['bebida alcohólica', 'alcohol', ''],
    ['bebida alcoholica', 'alcohol', ''],
    ['licor', 'alcohol', ''],
    ['instrumento musical', 'instrumentos_musicales', ''],
    ['guitarra', 'instrumentos_musicales', ''],
    ['material odontológico', 'odontologicos', ''],
    ['equipo odontológico', 'odontologicos', ''],
    ['artículo esotérico', 'esotericos', ''],
    ['articulo esoterico', 'esotericos', ''],
    ['herramienta de pesca', 'camping_pesca', ''],
    ['artículo de pesca', 'camping_pesca', ''],
    ['juguete para mascota', 'mascotas', ''],
    ['accesorio para mascota', 'mascotas', ''],
    ['artículo de navidad', 'navidad', ''],
    ['adorno navideño', 'navidad', ''],
    ['adorno navideno', 'navidad', ''],
    ['bisutería fina', 'bisuteria', ''],
    ['bisuteria fina', 'bisuteria', ''],
    ['bisutería artesanal', 'bisuteria', ''],
    ['bisuteria artesanal', 'bisuteria', ''],
    ['semilla de', 'semillas', ''],
    ['semillas de', 'semillas', ''],
    ['artículo religioso', 'religiosos', ''],
    ['articulo religioso', 'religiosos', ''],
  ];
  for (const [termino, categoria, restricciones] of MAPEO_INICIAL) {
    await query(
      "INSERT INTO mapeo_categorias (termino, categoria, restricciones) VALUES ($1, $2, $3) ON CONFLICT (termino) DO NOTHING",
      [termino, categoria, restricciones]
    );
  }
  console.log('[seed] mapeo_categorias ok (' + MAPEO_INICIAL.length + ' terminos)');

  // Actualizar nombres de modalidades con nomenclatura mixta
  const NOMBRES_MODALIDADES = {
    EXPRESS: 'Modalidad 1 — Express — SEDEX',
    TERRESTRE: 'Modalidad 2 — Terrestre — PAC',
    AEREO: 'Modalidad 3 — Aéreo — LATAM',
    AEREO_TRECHO: 'Modalidad 4 — Aéreo + Trecho — LATAM Trecho'
  };
  for (const [mod, nombre] of Object.entries(NOMBRES_MODALIDADES)) {
    await query(
      "UPDATE modalidades SET valor = $1 WHERE modalidad = $2 AND clave = 'nombre'",
      [nombre, mod]
    );
  }
  console.log('[seed] nombres de modalidades actualizados');

  console.log('[seed] todos los datos insertados correctamente');
  process.exit(0);
}

seed().catch(err => {
  console.error('[seed] error:', err.message);
  process.exit(1);
});
