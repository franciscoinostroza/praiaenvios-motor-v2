import { query } from './pool.js';

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

  // Categorias
  const cats = [
    ['SOLO_AEREO','alcohol'],['SOLO_AEREO','alcoholes'],
    ['SOLO_AEREO','corrosivo'],['SOLO_AEREO','corrosivos'],
    ['SOLO_AEREO','bateria'],['SOLO_AEREO','baterias'],
    ['SOLO_AEREO','batería'],['SOLO_AEREO','baterías'],
    ['SOLO_AEREO','medicamento'],['SOLO_AEREO','medicamentos'],
    ['TERRESTRE','quimico'],['TERRESTRE','quimicos'],
    ['TERRESTRE','químico'],['TERRESTRE','químicos'],
    ['TERRESTRE','liquido'],['TERRESTRE','liquidos'],
    ['TERRESTRE','líquido'],['TERRESTRE','líquidos'],
    ['TERRESTRE','perfume'],['TERRESTRE','perfumes'],
    ['TERRESTRE','grasa'],['TERRESTRE','grasas'],
    ['NEUTRAS','ropa'],['NEUTRAS','calzado'],
    ['NEUTRAS','electrodomestico'],['NEUTRAS','electrodomesticos'],
    ['NEUTRAS','electrodoméstico'],['NEUTRAS','electrodomésticos'],
    ['NEUTRAS','electronico'],['NEUTRAS','electronicos'],
    ['NEUTRAS','electrónico'],['NEUTRAS','electrónicos'],
    ['NEUTRAS','juguete'],['NEUTRAS','juguetes'],
    ['NEUTRAS','accesorio'],['NEUTRAS','accesorios'],
    ['NEUTRAS','herramienta'],['NEUTRAS','herramientas'],
    ['NEUTRAS','cosmetico'],['NEUTRAS','cosmeticos'],
    ['NEUTRAS','cosmético'],['NEUTRAS','cosméticos'],
    ['NEUTRAS','alimento'],['NEUTRAS','alimentos'],
    ['NEUTRAS','documento'],['NEUTRAS','documentos'],
    ['NEUTRAS','libro'],['NEUTRAS','libros'],
    ['NEUTRAS','piezas de carro'],
    ['NEUTRAS','repuesto'],['NEUTRAS','repuestos'],
    ['NEUTRAS','zapatos'],
    ['NEUTRAS','otro'],['NEUTRAS','otros'],['NEUTRAS','general']
  ];
  for (const [tipo, cat] of cats) {
    await query('INSERT INTO categorias (tipo, categoria) VALUES ($1, $2) ON CONFLICT (tipo, categoria) DO NOTHING', [tipo, cat]);
  }
  console.log('[seed] categorias ok');

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

  console.log('[seed] todos los datos insertados correctamente');
  process.exit(0);
}

seed().catch(err => {
  console.error('[seed] error:', err.message);
  process.exit(1);
});
