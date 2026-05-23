import { Router } from 'express';
import { query } from '../db/pool.js';
import { loadConfig, invalidateCache } from '../motor/config.js';

export function crearAdminRouter() {
  const router = Router();

  // Auth middleware
  function auth(req, res, next) {
    const pw = process.env.ADMIN_PASSWORD || 'admin123';
    if (req.query.token !== pw) {
      if (req.headers['x-admin-token'] === pw) return next();
      // Check session/token in query or header
      return res.status(401).send('Unauthorized. Use ?token=PASSWORD or X-Admin-Token header');
    }
    next();
  }

  // Dashboard
  router.get('/', auth, (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin - Praia Envíos Motor v2</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,sans-serif;background:#f5f5f5;color:#333;padding:20px}
h1{font-size:1.5rem;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.card{background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.card h2{font-size:1rem;margin-bottom:8px}
.card p{font-size:.85rem;color:#666;margin-bottom:12px}
.card a{display:inline-block;background:#1565C0;color:#fff;text-decoration:none;padding:6px 14px;border-radius:4px;font-size:.85rem}
.card a:hover{background:#0D47A1}
</style></head>
<body>
<h1>⚙️ Admin - Praia Envíos Motor v2</h1>
<div class="grid">
<div class="card"><h2>💰 Tarifas Express</h2><p>Precios por kg - Modalidad 1</p><a href="/admin/tarifas_express">Editar</a></div>
<div class="card"><h2>🚚 Tarifas Terrestre</h2><p>Precios por kg - Modalidad 2</p><a href="/admin/tarifas_terrestre">Editar</a></div>
<div class="card"><h2>🇻🇪 Nacional OP1 (MRW)</h2><p>Costo nacional por kg</p><a href="/admin/nacional_op1">Editar</a></div>
<div class="card"><h2>🇻🇪 Nacional OP2 (LAE)</h2><p>Costo nacional por kg</p><a href="/admin/nacional_op2">Editar</a></div>
<div class="card"><h2>📏 Tramos Boa Vista</h2><p>Suma dimensiones → precio</p><a href="/admin/tramos_boa_vista">Editar</a></div>
<div class="card"><h2>📊 Tramos Ganancia</h2><p>Peso → USD/kg</p><a href="/admin/tramos_ganancia">Editar</a></div>
<div class="card"><h2>📋 Modalidades</h2><p>Configuración de cada modalidad</p><a href="/admin/modalidades">Editar</a></div>
<div class="card"><h2>🧮 Fórmulas</h2><p>Constantes y factores</p><a href="/admin/formulas">Editar</a></div>
<div class="card"><h2>🏷️ Categorías</h2><p>Vocabulario de categorías</p><a href="/admin/categorias">Editar</a></div>
<div class="card"><h2>📍 Zonas</h2><p>Base y orígenes prohibidos</p><a href="/admin/zonas">Editar</a></div>
</div>
</body></html>`);
  });

  // Generic CRUD helpers
  const TABLES = {
    tarifas_express: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Tarifas Express' },
    tarifas_terrestre: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Tarifas Terrestre' },
    nacional_op1: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Nacional OP1 (MRW)' },
    nacional_op2: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Nacional OP2 (LAE)' },
    tramos_boa_vista: { cols: ['hasta_cm', 'precio_bs'], pk: 'id', title: 'Tramos Boa Vista', nullable: ['hasta_cm'] },
    tramos_ganancia: { cols: ['hasta_kg', 'usd_kg'], pk: 'id', title: 'Tramos Ganancia', nullable: ['hasta_kg'] },
    modalidades: { cols: ['modalidad', 'clave', 'valor'], pk: 'id', title: 'Modalidades' },
    formulas: { cols: ['clave', 'valor'], pk: 'clave', title: 'Fórmulas' },
    categorias: { cols: ['tipo', 'categoria'], pk: 'id', title: 'Categorías' },
    zonas: { cols: ['tipo', 'ciudad'], pk: 'id', title: 'Zonas' }
  };

  for (const [table, info] of Object.entries(TABLES)) {
    const cols = info.cols;
    const pk = info.pk;
    const isNullable = info.nullable || [];
    const isNumeric = {};

    // Determine numeric cols from schema (check if non-pk cols are numeric)
    for (const col of cols) {
      if (col === 'valor' && table === 'modalidades') isNumeric[col] = false;
      else if (['precio_bs', 'usd_kg', 'kg', 'hasta_cm', 'hasta_kg', 'valor'].includes(col)) isNumeric[col] = true;
      else isNumeric[col] = false;
    }

    // List
    router.get(`/${table}`, auth, async (req, res) => {
      try {
        const result = await query(`SELECT * FROM ${table} ORDER BY ${cols[0]}`);
        const rows = result.rows;
        let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${info.title} - Admin</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,sans-serif;background:#f5f5f5;color:#333;padding:20px}
h1{font-size:1.3rem;margin-bottom:16px}
a.back{color:#1565C0;text-decoration:none;font-size:.85rem;display:inline-block;margin-bottom:12px}
table{border-collapse:collapse;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
th{background:#1565C0;color:#fff;padding:10px 12px;text-align:left;font-size:.8rem}
td{padding:8px 12px;border-bottom:1px solid #eee;font-size:.85rem}
tr:hover td{background:#f0f4ff}
form.inline{display:inline}
input,select{padding:4px 8px;border:1px solid #ccc;border-radius:4px;font-size:.85rem;width:100%}
td form.inline{display:flex;gap:4px;align-items:center}
.btn{background:#1565C0;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:.8rem;text-decoration:none;display:inline-block}
.btn-del{background:#c62828}
.btn:hover{opacity:.9}
.add-form{background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:end}
.add-form label{font-size:.8rem;color:#666;display:flex;flex-direction:column;gap:2px}
.add-form input,.add-form select{padding:6px 10px;border:1px solid #ccc;border-radius:4px;font-size:.85rem}
.success{background:#e8f5e9;color:#2e7d32;padding:8px 12px;border-radius:4px;margin-bottom:12px;font-size:.85rem}
</style></head><body>
<a href="/admin" class="back">← Dashboard</a>
<h1>${info.title}</h1>`;

        if (req.query.saved) html += `<div class="success">✅ Guardado</div>`;
        if (req.query.deleted) html += `<div class="success">🗑️ Eliminado</div>`;

        html += `<table><thead><tr>`;
        for (const col of cols) html += `<th>${col}</th>`;
        html += `<th style="width:140px">Acciones</th></tr></thead><tbody>`;

        for (const row of rows) {
          html += `<tr>`;
          for (const col of cols) {
            const val = row[col] === null ? '' : row[col];
            html += `<td>
              <form class="inline" method="POST" action="/admin/${table}/${row[pk]}/update?token=${req.query.token}">
                ${col === pk ? `<span>${val}</span>` : isNumeric[col]
                  ? `<input type="number" step="any" name="${col}" value="${val}" style="width:100px">`
                  : `<input type="text" name="${col}" value="${val}">`}
              `;
            if (col === cols[cols.length - 1]) {
              html += `<button class="btn" type="submit">💾</button>`;
            }
            html += `</form></td>`;
          }
          html += `<td>
            <form class="inline" method="POST" action="/admin/${table}/${row[pk]}/delete?token=${req.query.token}" onsubmit="return confirm('¿Eliminar?')">
              <button class="btn btn-del" type="submit">🗑️</button>
            </form>
          </td></tr>`;
        }

        html += `</tbody></table>`;

        // Add form
        html += `<div class="add-form"><h3 style="width:100%;margin-bottom:4px;font-size:.9rem">Agregar nuevo</h3>`;
        html += `<form method="POST" action="/admin/${table}/add?token=${req.query.token}" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;width:100%">`;
        for (const col of cols) {
          if (col === pk && pk === 'id') continue;
          const nullable = isNullable.includes(col);
          const placeholder = nullable ? `${col} (dejar vacío = sin límite)` : col;
          if (isNumeric[col]) {
            html += `<label>${col} <input type="number" step="any" name="${col}" ${nullable ? '' : 'required'} placeholder="${placeholder}"></label>`;
          } else {
            html += `<label>${col} <input type="text" name="${col}" required placeholder="${placeholder}"></label>`;
          }
        }
        html += `<button class="btn" type="submit">➕ Agregar</button>`;
        html += `</form></div>`;

        html += `</body></html>`;
        res.send(html);
      } catch (err) {
        res.status(500).send('Error: ' + err.message);
      }
    });

    // Add
    router.post(`/${table}/add`, auth, async (req, res) => {
      try {
        const colNames = cols.filter(c => !(c === pk && pk === 'id'));
        const placeholders = colNames.map((_, i) => '$' + (i + 1));
        const values = colNames.map(c => {
          const v = req.body[c];
          if (isNullable.includes(c) && (v === '' || v === undefined || v === null)) return null;
          return isNumeric[c] ? Number(v) : v;
        });
        await query(`INSERT INTO ${table} (${colNames.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT DO NOTHING`, values);
        invalidateCache();
        res.redirect(`/admin/${table}?token=${req.query.token}&saved=1`);
      } catch (err) {
        res.status(500).send('Error: ' + err.message);
      }
    });

    // Update
    router.post(`/${table}/:pk/update`, auth, async (req, res) => {
      try {
        const pkVal = req.params.pk;
        const setClauses = cols.filter(c => c !== pk).map((c, i) => `${c} = $${i + 1}`);
        const values = cols.filter(c => c !== pk).map(c => {
          const v = req.body[c];
          if (isNullable.includes(c) && (v === '' || v === undefined || v === null)) return null;
          return isNumeric[c] ? Number(v) : v;
        });
        values.push(pkVal);
        await query(`UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${pk} = $${values.length}`, values);
        invalidateCache();
        res.redirect(`/admin/${table}?token=${req.query.token}&saved=1`);
      } catch (err) {
        res.status(500).send('Error: ' + err.message);
      }
    });

    // Delete
    router.post(`/${table}/:pk/delete`, auth, async (req, res) => {
      try {
        await query(`DELETE FROM ${table} WHERE ${pk} = $1`, [req.params.pk]);
        invalidateCache();
        res.redirect(`/admin/${table}?token=${req.query.token}&deleted=1`);
      } catch (err) {
        res.status(500).send('Error: ' + err.message);
      }
    });
  }

  return router;
}
