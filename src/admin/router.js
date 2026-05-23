import { Router, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { query } from '../db/pool.js';
import { invalidateCache } from '../motor/config.js';
import { cotizarDebug as simular } from '../services/motor.js';

function auth(req, res, next) {
  const pw = process.env.ADMIN_PASSWORD || 'admin123';
  const token = req.query.token || req.headers['x-admin-token'] || req.cookies?.token;
  if (token === pw) {
    req.adminToken = token;
    return next();
  }
  if (req.path === '/login') return next();
  res.redirect('/admin/login');
}

function layout(heading, bodyHtml, t) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading} - Admin Praia Envíos</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--navy:#0f172a;--navy-light:#1e293b;--navy-hover:#334155;--blue:#3b82f6;--blue-hover:#2563eb;--green:#22c55e;--green-hover:#16a34a;--red:#ef4444;--red-hover:#dc2626;--gray-50:#f8fafc;--gray-100:#f1f5f9;--gray-200:#e2e8f0;--gray-300:#cbd5e1;--gray-400:#94a3b8;--gray-500:#64748b;--gray-600:#475569;--gray-700:#334155;--gray-800:#1e293b;--radius:10px;--shadow:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.06);--shadow-lg:0 10px 25px rgba(0,0,0,.12)}
body{font-family:'Inter',-apple-system,sans-serif;background:var(--gray-50);color:var(--gray-800);display:flex;min-height:100vh}

/* ─── SIDEBAR ─── */
.sidebar{width:240px;background:var(--navy);color:#fff;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar-header{padding:20px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08)}
.sidebar-header h1{font-size:.85rem;font-weight:700;letter-spacing:-.02em;color:#fff}
.sidebar-header .sub{font-size:.7rem;color:var(--gray-400);margin-top:2px}
.sidebar-nav{padding:8px 0;flex:1}
.sidebar-nav a{display:flex;align-items:center;gap:10px;padding:8px 16px;color:var(--gray-300);text-decoration:none;font-size:.8rem;font-weight:500;transition:all .15s;border-left:3px solid transparent}
.sidebar-nav a:hover{background:rgba(255,255,255,.05);color:#fff}
.sidebar-nav a.active{background:rgba(59,130,246,.15);color:var(--blue);border-left-color:var(--blue)}
.sidebar-nav .divider{height:1px;background:rgba(255,255,255,.08);margin:8px 16px}
.sidebar-nav .label{padding:16px 16px 4px;font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:var(--gray-500);font-weight:600}
.sidebar-footer{padding:12px 16px;border-top:1px solid rgba(255,255,255,.08);font-size:.75rem}
.sidebar-footer a{color:var(--gray-400);text-decoration:none;display:flex;align-items:center;gap:6px;transition:color .15s}
.sidebar-footer a:hover{color:var(--red)}

/* ─── MAIN ─── */
.main{flex:1;padding:24px 32px;max-width:100%;overflow-x:hidden}
.main-header{margin-bottom:24px}
.main-header h2{font-size:1.3rem;font-weight:700;color:var(--gray-800)}
.main-header p{font-size:.85rem;color:var(--gray-500);margin-top:2px}

/* ─── STATS ─── */
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);border:1px solid var(--gray-200)}
.stat-card .num{font-size:1.5rem;font-weight:700;color:var(--blue)}
.stat-card .label{font-size:.75rem;color:var(--gray-500);margin-top:2px;overflow-wrap:break-word}

/* ─── CARDS GRID ─── */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.card{background:#fff;border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);border:1px solid var(--gray-200);transition:box-shadow .2s,border-color .2s}
.card:hover{border-color:var(--blue);box-shadow:0 4px 12px rgba(59,130,246,.15)}
.card h3{font-size:.85rem;font-weight:600;color:var(--gray-700);margin-bottom:4px}
.card p{font-size:.75rem;color:var(--gray-500);margin-bottom:12px}
.card a{display:inline-flex;align-items:center;gap:4px;background:var(--blue);color:#fff;text-decoration:none;padding:5px 12px;border-radius:6px;font-size:.75rem;font-weight:500;transition:background .15s}
.card a:hover{background:var(--blue-hover)}

/* ─── TABLE ─── */
.table-wrap{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--gray-200);overflow:hidden}
.table-toolbar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--gray-200);gap:12px;flex-wrap:wrap}
.table-toolbar .search-wrap{position:relative}
.table-toolbar .search-wrap input{padding:6px 12px 6px 32px;border:1px solid var(--gray-300);border-radius:6px;font-size:.8rem;width:220px;font-family:inherit;transition:border-color .15s}
.table-toolbar .search-wrap input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.15)}
.table-toolbar .search-wrap .icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:.75rem}
table{width:100%;border-collapse:collapse;font-size:.82rem}
thead{background:var(--gray-50)}
th{padding:10px 14px;text-align:left;font-weight:600;color:var(--gray-600);font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--gray-200)}
td{padding:8px 14px;border-bottom:1px solid var(--gray-100);color:var(--gray-700);vertical-align:middle}
tbody tr:hover td{background:var(--gray-50)}
tbody tr:last-child td{border-bottom:none}
td form.inline{display:flex;gap:4px;align-items:center}
td input{padding:4px 8px;border:1px solid var(--gray-300);border-radius:5px;font-size:.78rem;font-family:inherit;width:100%;min-width:0;transition:border-color .15s}
td input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 2px rgba(59,130,246,.12)}
td .btn-sm{display:inline-flex;align-items:center;gap:4px;border:none;padding:4px 10px;border-radius:5px;cursor:pointer;font-size:.72rem;font-weight:500;transition:all .15s}
.btn-save{background:#e8f0fe;color:var(--blue)}
.btn-save:hover{background:var(--blue);color:#fff}
.btn-del{background:#fce8e8;color:var(--red)}
.btn-del:hover{background:var(--red);color:#fff}

/* ─── ADD FORM ─── */
.add-form{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--gray-200);padding:16px;margin-top:16px}
.add-form h3{font-size:.85rem;font-weight:600;color:var(--gray-700);margin-bottom:10px}
.add-form .fields{display:flex;gap:10px;flex-wrap:wrap;align-items:end}
.add-form label{font-size:.72rem;color:var(--gray-500);display:flex;flex-direction:column;gap:3px}
.add-form input,.add-form select{padding:6px 10px;border:1px solid var(--gray-300);border-radius:6px;font-size:.8rem;font-family:inherit;transition:border-color .15s}
.add-form input:focus,.add-form select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.add-form .btn-add{background:var(--green);color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:.8rem;font-weight:600;transition:background .15s}
.add-form .btn-add:hover{background:var(--green-hover)}

/* ─── TOAST ─── */
.toast{position:fixed;top:20px;right:20px;z-index:1000;padding:12px 20px;border-radius:8px;font-size:.85rem;font-weight:500;box-shadow:var(--shadow-lg);animation:slideIn .3s ease;display:flex;align-items:center;gap:8px}
.toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.toast-error{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

/* ─── MODAL ─── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s}
.modal{background:#fff;border-radius:12px;padding:24px;width:90%;max-width:380px;box-shadow:var(--shadow-lg);animation:scaleIn .2s}
.modal h3{font-size:1rem;font-weight:600;margin-bottom:8px}
.modal p{font-size:.85rem;color:var(--gray-500);margin-bottom:20px}
.modal .actions{display:flex;gap:8px;justify-content:end}
.modal button{padding:8px 16px;border:none;border-radius:6px;font-size:.8rem;font-weight:500;cursor:pointer;transition:all .15s}
.modal .btn-cancel{background:var(--gray-100);color:var(--gray-600)}
.modal .btn-cancel:hover{background:var(--gray-200)}
.modal .btn-confirm{background:var(--red);color:#fff}
.modal .btn-confirm:hover{background:var(--red-hover)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}

/* ─── RESPONSIVE ─── */
@media(max-width:768px){
  .sidebar{width:56px}
  .sidebar-header h1,.sidebar-header .sub,.sidebar-nav a span,.sidebar-nav .label,.sidebar-footer a span{display:none}
  .sidebar-nav a{padding:10px;justify-content:center;border-left:none}
  .sidebar-footer a{justify-content:center}
  .main{padding:16px}
  .stats{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
  .table-toolbar .search-wrap input{width:140px}
}

/* ─── SCROLLBAR ─── */
.sidebar::-webkit-scrollbar{width:4px}
.sidebar::-webkit-scrollbar-thumb{background:var(--navy-hover);border-radius:4px}
</style>
</head>
<body>
<aside class="sidebar">
  <div class="sidebar-header">
    <h1>Admin Panel</h1>
    <div class="sub">Praia Envíos v2</div>
  </div>
  <nav class="sidebar-nav">${renderNav(heading)}</nav>
  <div class="sidebar-footer">
    <a href="/admin/logout" onclick="event.preventDefault();fetch('/admin/logout').then(()=>location='/admin/login')">⏻ <span>Cerrar sesión</span></a>
  </div>
</aside>
<div class="main">
  <div class="main-header">
    <h2>${heading}</h2>
    <p>Panel de administración</p>
  </div>
  ${bodyHtml}
</div>
<script>
function confirmDelete(msg,form){
  const d=document.createElement('div');d.className='modal-overlay';
  d.innerHTML='<div class="modal"><h3>🗑️ Confirmar</h3><p>'+(msg||'¿Eliminar este registro?')+'</p><div class="actions"><button class="btn-cancel" onclick="this.closest(\\'.modal-overlay\\').remove()">Cancelar</button><button class="btn-confirm" onclick="this.closest(\\'.modal-overlay\\').remove();form.submit()">Eliminar</button></div></div>';
  document.body.appendChild(d);
}
function filterTable(el){const q=el.value.toLowerCase();const rows=el.closest('.table-wrap').querySelector('tbody').children;for(let r of rows){r.style.display=r.innerText.toLowerCase().includes(q)?'':'none'}}
</script>
</body>
</html>`;
}

function renderNav(active) {
  const items = [
    { label: 'Dashboard', path: '/admin', icon: '📊', key: 'Admin' },
    { divider: true },
    { label: 'Simulador', path: '/admin/simulador', icon: '🧮', key: 'Simulador' },
    { divider: true },
    { label: 'Tarifas Express', path: '/admin/tarifas_express', icon: '💰', key: 'Tarifas Express' },
    { label: 'Tarifas Terrestre', path: '/admin/tarifas_terrestre', icon: '🚚', key: 'Tarifas Terrestre' },
    { label: 'Nacional OP1', path: '/admin/nacional_op1', icon: '🏠', key: 'Nacional OP1 (MRW)' },
    { label: 'Nacional OP2', path: '/admin/nacional_op2', icon: '🏠', key: 'Nacional OP2 (LAE)' },
    { divider: true },
    { label: 'Tramos BV', path: '/admin/tramos_boa_vista', icon: '📏', key: 'Tramos Boa Vista' },
    { label: 'Tramos Gan.', path: '/admin/tramos_ganancia', icon: '📊', key: 'Tramos Ganancia' },
    { label: 'Modalidades', path: '/admin/modalidades', icon: '📋', key: 'Modalidades' },
    { label: 'Fórmulas', path: '/admin/formulas', icon: '🧮', key: 'Fórmulas' },
    { divider: true },
    { label: 'Categorías', path: '/admin/categorias', icon: '🏷️', key: 'Categorías' },
    { label: 'Zonas', path: '/admin/zonas', icon: '📍', key: 'Zonas' },
  ];
  return items.map(i => {
    if (i.divider) return '<div class="divider"></div>';
    return `<a href="${i.path}" class="${active === i.key ? 'active' : ''}"><span>${i.icon}</span><span>${i.label}</span></a>`;
  }).join('');
}

export function crearAdminRouter() {
  const router = Router();
  router.use(cookieParser());
  router.use(urlencoded({ extended: false }));

  /* ─── LOGIN ─── */
  router.get('/login', auth, (req, res) => {
    const pw = process.env.ADMIN_PASSWORD || 'admin123';
    if (req.query.token === pw || req.cookies?.token === pw) return res.redirect('/admin');
    const error = req.query.e ? 'true' : '';
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Login - Admin Praia Envíos</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;background:#0f172a}
/* ─── FONDO ANIMADO ─── */
.bg{position:fixed;inset:0;z-index:0}
.bg .orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.5;animation:float 12s ease-in-out infinite}
.bg .orb:nth-child(1){width:500px;height:500px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);top:-100px;right:-100px;animation-delay:0s}
.bg .orb:nth-child(2){width:400px;height:400px;background:linear-gradient(135deg,#06b6d4,#3b82f6);bottom:-80px;left:-80px;animation-delay:-4s}
.bg .orb:nth-child(3){width:300px;height:300px;background:linear-gradient(135deg,#a78bfa,#6366f1);top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:-8s;opacity:.3}
@keyframes float{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(30px,-30px) scale(1.05)}50%{transform:translate(-20px,20px) scale(.95)}75%{transform:translate(20px,10px) scale(1.02)}}

/* ─── PARTICULAS ─── */
.particles{position:fixed;inset:0;z-index:0;overflow:hidden}
.particle{position:absolute;width:4px;height:4px;background:#fff;border-radius:50%;opacity:.2;animation:drift linear infinite}
@keyframes drift{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:.3}90%{opacity:.3}100%{transform:translateY(-10vh) scale(1);opacity:0}}

/* ─── CARD ─── */
.login-wrap{position:relative;z-index:1;width:100%;max-width:400px;padding:20px}
.card{background:rgba(255,255,255,.06);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:20px;padding:40px 32px;border:1px solid rgba(255,255,255,.1);box-shadow:0 25px 50px rgba(0,0,0,.3);animation:cardIn .6s ease-out}
@keyframes cardIn{from{opacity:0;transform:translateY(30px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.logo{width:56px;height:56px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 16px;box-shadow:0 8px 24px rgba(59,130,246,.3)}
.card h1{color:#fff;text-align:center;font-size:1.2rem;font-weight:700;margin-bottom:4px}
.card .sub{color:rgba(255,255,255,.5);text-align:center;font-size:.82rem;margin-bottom:28px}
.input-group{margin-bottom:16px}
.input-group label{display:block;color:rgba(255,255,255,.6);font-size:.75rem;font-weight:500;margin-bottom:6px;letter-spacing:.02em}
.input-group .input-wrap{position:relative}
.input-group .input-wrap input{width:100%;padding:12px 14px 12px 40px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-size:.9rem;font-family:inherit;transition:all .25s}
.input-group .input-wrap input::placeholder{color:rgba(255,255,255,.25)}
.input-group .input-wrap input:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 4px rgba(59,130,246,.2),0 0 20px rgba(59,130,246,.15)}
.input-group .input-wrap .ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:.9rem;opacity:.4}
.btn-login{width:100%;padding:12px;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;border-radius:12px;color:#fff;font-size:.9rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .25s;position:relative;overflow:hidden}
.btn-login:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(59,130,246,.35)}
.btn-login:active{transform:translateY(0)}
.btn-login.loading{color:transparent;pointer-events:none}
.btn-login .spinner{display:none;position:absolute;inset:0;align-items:center;justify-content:center}
.btn-login.loading .spinner{display:flex}
.spinner::after{content:'';width:20px;height:20px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.error-msg{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5;padding:10px 14px;border-radius:10px;font-size:.8rem;margin-bottom:16px;text-align:center;animation:shake .4s ease}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
</style>
</head>
<body>
<div class="bg">
  <div class="orb"></div>
  <div class="orb"></div>
  <div class="orb"></div>
</div>
<div class="particles" id="particles"></div>
<div class="login-wrap">
  <div class="card">
    <div class="logo">📦</div>
    <h1>Admin Praia Envíos</h1>
    <p class="sub">Ingresa tu contraseña para acceder</p>
    ${error ? '<div class="error-msg">🔒 Contraseña incorrecta</div>' : ''}
    <form method="POST" action="/admin/login" onsubmit="document.querySelector('.btn-login').classList.add('loading')">
      <div class="input-group">
        <label>Contraseña</label>
        <div class="input-wrap">
          <span class="ico">🔑</span>
          <input type="password" name="password" placeholder="••••••••" autofocus required>
        </div>
      </div>
      <button type="submit" class="btn-login">
        Ingresar
        <div class="spinner"></div>
      </button>
    </form>
  </div>
</div>
<script>
// Particulas
(function(){const c=document.getElementById('particles');for(let i=0;i<40;i++){const p=document.createElement('div');p.className='particle';const s=Math.random()*3+1;p.style.width=s+'px';p.style.height=s+'px';p.style.left=Math.random()*100+'%';p.style.animationDuration=(Math.random()*10+8)+'s';p.style.animationDelay=(Math.random()*8)+'s';c.appendChild(p)}})();
// Redirigir si ya tiene sesión
if(document.cookie.includes('token=')){fetch('/admin').then(r=>{if(r.ok&&r.url.includes('/admin')&&!r.url.includes('/login'))location='/admin'})}
</script>
</body>
</html>`);
  });

  router.post('/login', (req, res) => {
    const pw = process.env.ADMIN_PASSWORD || 'admin123';
    if (req.body.password === pw) {
      res.cookie('token', pw, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });
      return res.redirect('/admin');
    }
    res.redirect('/admin/login?e=1');
  });

  router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
  });

  /* ─── DASHBOARD ─── */
  router.get('/', auth, async (req, res) => {
    const t = req.adminToken;
    const tables = [
      { key: 'tarifas_express', icon: '💰', name: 'Tarifas Express', desc: 'Precios por kg — Modalidad 1' },
      { key: 'tarifas_terrestre', icon: '🚚', name: 'Tarifas Terrestre', desc: 'Precios por kg — Modalidad 2' },
      { key: 'nacional_op1', icon: '🏠', name: 'Nacional OP1', desc: 'Costo nacional MRW' },
      { key: 'nacional_op2', icon: '🏠', name: 'Nacional OP2', desc: 'Costo nacional LAE' },
      { key: 'tramos_boa_vista', icon: '📏', name: 'Tramos Boa Vista', desc: 'Suma dimensiones → precio' },
      { key: 'tramos_ganancia', icon: '📊', name: 'Tramos Ganancia', desc: 'Peso → USD/kg' },
      { key: 'modalidades', icon: '📋', name: 'Modalidades', desc: 'Configuración de cada modalidad' },
      { key: 'formulas', icon: '🧮', name: 'Fórmulas', desc: 'Constantes y factores' },
      { key: 'categorias', icon: '🏷️', name: 'Categorías', desc: 'Vocabulario de categorías' },
      { key: 'zonas', icon: '📍', name: 'Zonas', desc: 'Base y orígenes prohibidos' },
    ];
    let statsHtml = '';
    try {
      const counts = await Promise.all(tables.map(t => query(`SELECT COUNT(*) c FROM ${t.key}`)));
      statsHtml = '<div class="stats">' + tables.map((t, i) =>
        `<div class="stat-card"><div class="num">${counts[i].rows[0].c}</div><div class="label">${t.icon} ${t.name}</div></div>`
      ).join('') + '</div>';
    } catch {
      statsHtml = '<p style="color:var(--red);font-size:.85rem">⚠️ Error al cargar estadísticas</p>';
    }
    const cardsHtml = tables.map(t =>
      `<div class="card"><h3>${t.icon} ${t.name}</h3><p>${t.desc}</p><a href="/admin/${t.key}">Editar →</a></div>`
    ).join('');
    const body = `${statsHtml}<div class="grid">${cardsHtml}</div>`;
    res.send(layout('Admin', body, t));
  });

  /* ─── SIMULADOR ─── */
  router.get('/simulador', auth, async (req, res) => {
    const t = req.adminToken;
    let ciudades = '', categorias = '';
    try {
      const z = await query("SELECT ciudad FROM zonas WHERE tipo = 'BASE' ORDER BY ciudad");
      ciudades = z.rows.map(r => `<option value="${r.ciudad}">${r.ciudad}</option>`).join('');
      const c = await query("SELECT DISTINCT categoria FROM categorias WHERE tipo = 'NEUTRAS' ORDER BY categoria");
      categorias = c.rows.map(r => `<label class="cat-tag"><input type="checkbox" name="cats" value="${r.categoria}"> ${r.categoria}</label>`).join('');
    } catch {}

    const result = req.query.r ? JSON.parse(Buffer.from(req.query.r.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()) : null;

    let resultHtml = '';
    if (result) {
      const d = result.desglose;
      const comps = d.componentes;
      const rows = Object.entries(comps).map(([k, v]) =>
        `<tr><td>${k.replace(/_/g, ' ')}</td><td class="val">R$ ${typeof v === 'number' ? v.toLocaleString('es-VE',{minimumFractionDigits:2}) : v}</td></tr>`
      ).join('');
      resultHtml = `<div class="result-card">
        <div class="result-header"><span class="result-badge ${result.con_trecho ? 'badge-trecho' : 'badge-ok'}">${result.nombre_modalidad}${result.con_trecho ? ' + Trecho' : ''}</span></div>
        <table class="result-table">
          <tr><td>Peso bruto</td><td class="val">${d.peso_bruto} kg</td></tr>
          <tr><td>Volumétrico</td><td class="val">${d.peso_volumetrico} kg</td></tr>
          <tr><td>Facturable</td><td class="val">${d.peso_facturable} kg <span class="hint">(${d.peso_facturable === d.peso_bruto ? 'usó bruto' : 'usó volumétrico'})</span></td></tr>
          <tr><td>FT³ / USD/kg</td><td class="val">${d.ft3} / $${d.tarifa_usd_kg}</td></tr>
          <tr class="sep"><td colspan="2"></td></tr>
          ${rows}
          <tr class="sep"><td colspan="2"></td></tr>
          <tr><td class="sub-label">Subtotal</td><td class="val sub-val">R$ ${d.sub_total.toLocaleString('es-VE',{minimumFractionDigits:2})}</td></tr>
          ${d.trecho ? `<tr><td>Trecho</td><td class="val">R$ ${d.trecho.toLocaleString('es-VE',{minimumFractionDigits:2})}</td></tr><tr class="sep"><td colspan="2"></td></tr>` : ''}
          <tr class="total-row"><td>Total</td><td class="val total-val">R$ ${result.total_final.toLocaleString('es-VE',{minimumFractionDigits:2})}</td></tr>
          <tr><td>USD</td><td class="val">$${result.total_usd.toFixed(2)} <span class="hint">(tasa R$${result.tasa_dolar})</span></td></tr>
          <tr><td>Costo nacional</td><td class="val">R$ ${d.costo_nacional.toLocaleString('es-VE',{minimumFractionDigits:2})}</td></tr>
          <tr><td>Tiempo entrega</td><td class="val">${result.tiempo_entrega}</td></tr>
        </table>
      </div>`;
    }

    const form = `<div class="sim-layout">
      <div class="sim-form">
        <div class="sim-title">🧮 Simulador de cotización</div>
        <form method="POST" action="/admin/simulador">
          <div class="sim-grid">
            <label>Peso <small>kg</small><input type="number" step="any" name="peso_bruto" required value="5"></label>
            <label>Largo <small>cm</small><input type="number" step="any" name="largo" required value="30"></label>
            <label>Ancho <small>cm</small><input type="number" step="any" name="ancho" required value="20"></label>
            <label>Alto <small>cm</small><input type="number" step="any" name="alto" required value="15"></label>
            <label>Valor <small>R$</small><input type="number" step="any" name="valor_mercancia" required value="500"></label>
            <label>Tipo<select name="tipo_mercancia"><option value="personal">Personal</option><option value="comercial">Comercial</option></select></label>
            <label class="full">Origen<select name="ciudad_origen">${ciudades}</select></label>
          </div>
          <div class="sim-cats">
            <div class="cats-title">Categorías</div>
            <div class="cats-grid">${categorias || '<span class="hint">Sin categorías disponibles</span>'}</div>
          </div>
          <button type="submit" class="sim-btn">🧮 Calcular cotización</button>
        </form>
      </div>
      ${resultHtml ? `<div class="sim-result">${resultHtml}</div>` : ''}
    </div>`;

    res.send(layout('Simulador', `<style>
.sim-layout{display:flex;gap:20px;align-items:flex-start}
.sim-form{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--gray-200);padding:24px;flex:1;min-width:0}
.sim-title{font-size:1rem;font-weight:700;color:var(--gray-800);margin-bottom:16px}
.sim-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:16px}
.sim-grid label{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:600;color:var(--gray-500)}
.sim-grid label.full{grid-column:1/-1}
.sim-grid small{color:var(--gray-400);font-weight:400}
.sim-grid input,.sim-grid select{padding:8px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:.85rem;font-family:inherit;transition:all .2s;background:#fff}
.sim-grid input:focus,.sim-grid select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.sim-cats{margin-bottom:16px}
.cats-title{font-size:.78rem;font-weight:600;color:var(--gray-600);margin-bottom:8px}
.cats-grid{display:flex;flex-wrap:wrap;gap:6px}
.cat-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem;color:var(--gray-600);cursor:pointer;transition:all .15s}
.cat-tag:hover{border-color:var(--blue);background:#f0f4ff}
.cat-tag input{accent-color:var(--blue)}
.sim-btn{width:100%;padding:10px;background:linear-gradient(135deg,var(--blue),#6366f1);border:none;border-radius:8px;color:#fff;font-size:.85rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.sim-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(59,130,246,.3)}
.sim-result{width:380px;flex-shrink:0}
.result-card{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--gray-200);overflow:hidden;animation:fadeSlide .3s ease}
@keyframes fadeSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
.result-header{padding:14px 18px;background:var(--gray-50);border-bottom:1px solid var(--gray-200)}
.result-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:600}
.badge-ok{background:#e8f0fe;color:var(--blue)}
.badge-trecho{background:#fef3c7;color:#d97706}
.result-table{width:100%;border-collapse:collapse;font-size:.8rem}
.result-table td{padding:7px 18px;border-bottom:1px solid var(--gray-100);color:var(--gray-600)}
.result-table .val{text-align:right;font-family:monospace;font-weight:500;color:var(--gray-800)}
.result-table .hint{font-size:.68rem;color:var(--gray-400);font-weight:400}
.result-table .sep td{height:1px;padding:0;background:var(--gray-100)}
.result-table .sub-label{font-weight:600;color:var(--gray-600)}
.result-table .sub-val{font-weight:600;color:var(--gray-700)}
.result-table .total-row td{padding:10px 18px}
.result-table .total-val{font-size:1.05rem;font-weight:700;color:var(--blue)}
@media(max-width:900px){.sim-layout{flex-direction:column}.sim-result{width:100%}}
</style>${form}`, t));
  });

  router.post('/simulador', auth, async (req, res) => {
    try {
      const cats = Array.isArray(req.body.cats) ? req.body.cats : (req.body.cats ? [req.body.cats] : ['general']);
      const result = await simular({
        peso_bruto: parseFloat(req.body.peso_bruto),
        largo: parseFloat(req.body.largo),
        ancho: parseFloat(req.body.ancho),
        alto: parseFloat(req.body.alto),
        valor_mercancia: parseFloat(req.body.valor_mercancia),
        tipo_mercancia: req.body.tipo_mercancia,
        categorias: cats,
        ciudad_origen: req.body.ciudad_origen
      });
      const encoded = Buffer.from(JSON.stringify(result)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      res.redirect(`/admin/simulador?r=${encoded}`);
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  /* ─── TABLES ─── */
  const TABLES = {
    tarifas_express: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Tarifas Express', icon: '💰' },
    tarifas_terrestre: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Tarifas Terrestre', icon: '🚚' },
    nacional_op1: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Nacional OP1 (MRW)', icon: '🏠' },
    nacional_op2: { cols: ['kg', 'precio_bs'], pk: 'kg', title: 'Nacional OP2 (LAE)', icon: '🏠' },
    tramos_boa_vista: { cols: ['hasta_cm', 'precio_bs'], pk: 'id', title: 'Tramos Boa Vista', icon: '📏', nullable: ['hasta_cm'] },
    tramos_ganancia: { cols: ['hasta_kg', 'usd_kg'], pk: 'id', title: 'Tramos Ganancia', icon: '📊', nullable: ['hasta_kg'] },
    modalidades: { cols: ['modalidad', 'clave', 'valor'], pk: 'id', title: 'Modalidades', icon: '📋' },
    formulas: { cols: ['clave', 'valor'], pk: 'clave', title: 'Fórmulas', icon: '🧮' },
    categorias: { cols: ['tipo', 'categoria'], pk: 'id', title: 'Categorías', icon: '🏷️' },
    zonas: { cols: ['tipo', 'ciudad'], pk: 'id', title: 'Zonas', icon: '📍' }
  };

  for (const [table, info] of Object.entries(TABLES)) {
    const cols = info.cols;
    const pk = info.pk;
    const isNullable = info.nullable || [];
    const isNumeric = {};
    for (const col of cols) {
      if (col === 'valor' && table === 'modalidades') isNumeric[col] = false;
      else if (['precio_bs', 'usd_kg', 'kg', 'hasta_cm', 'hasta_kg', 'valor'].includes(col)) isNumeric[col] = true;
      else isNumeric[col] = false;
    }

    const showSearch = ['categorias', 'modalidades', 'zonas'].includes(table);

    router.get(`/${table}`, auth, async (req, res) => {
      try {
        const result = await query(`SELECT * FROM ${table} ORDER BY ${cols[0]}`);
        const rows = result.rows;
        const t = req.adminToken;
        const toast = req.query.saved
          ? '<div class="toast toast-success">✅ Cambios guardados</div>'
          : req.query.deleted
            ? '<div class="toast toast-error">🗑️ Registro eliminado</div>' : '';

        let html = `${toast}<div class="table-wrap">`;
        html += `<div class="table-toolbar">
          <span style="font-weight:600;font-size:.85rem">${info.icon} ${info.title}</span>
          <div class="search-wrap">${showSearch ? '<span class="icon">🔍</span><input type="text" placeholder="Buscar..." oninput="filterTable(this)">' : ''}</div>
        </div>`;
        html += `<table><thead><tr>`;
        for (const col of cols) html += `<th>${col}</th>`;
        html += `<th style="width:120px">Acciones</th></tr></thead><tbody>`;

        for (const row of rows) {
          html += `<tr>`;
          for (const col of cols) {
            const val = row[col] === null ? '' : row[col];
            html += `<td>
              <form class="inline" method="POST" action="/admin/${table}/${row[pk]}/update" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">
                ${col === pk ? `<span style="font-weight:600;color:var(--gray-500)">${val}</span>`
                  : isNumeric[col]
                    ? `<input type="number" step="any" name="${col}" value="${val}">`
                    : `<input type="text" name="${col}" value="${val.replace(/"/g,'&quot;')}">`}
              </td>`;
            if (col === cols[cols.length - 1]) {
              html += `<td>
                <button class="btn-sm btn-save" type="submit">💾</button>
                </form>
                <form class="inline" method="POST" action="/admin/${table}/${row[pk]}/delete" onsubmit="event.preventDefault();confirmDelete('¿Eliminar ${pk}=${val}?',this)">
                  <button class="btn-sm btn-del" type="submit">🗑️</button>
                </form>
              </td>`;
            }
          }
          html += `</tr>`;
        }

        html += `</tbody></table></div>`;

        html += `<div class="add-form"><h3>➕ Agregar nuevo registro</h3>`;
        html += `<form class="fields" method="POST" action="/admin/${table}/add" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">`;
        for (const col of cols) {
          if (col === pk && pk === 'id') continue;
          const nullable = isNullable.includes(col);
          const placeholder = nullable ? `${col} (sin límite)` : col;
          if (isNumeric[col]) {
            html += `<label>${col} <input type="number" step="any" name="${col}" ${nullable ? '' : 'required'} placeholder="${placeholder}"></label>`;
          } else {
            html += `<label>${col} <input type="text" name="${col}" required placeholder="${placeholder}"></label>`;
          }
        }
        html += `<button class="btn-add" type="submit">➕ Agregar</button>`;
        html += `</form></div>`;

        res.send(layout(info.title, html, t));
      } catch (err) {
        res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
      }
    });

    router.post(`/${table}/add`, auth, async (req, res) => {
      try {
        const colNames = cols.filter(c => !(c === pk && pk === 'id'));
        const placeholders = colNames.map((_, i) => '$' + (i + 1));
        const values = colNames.map(c => {
          const v = req.body[c];
          return (isNullable.includes(c) && (v === '' || v === undefined || v === null)) ? null
            : isNumeric[c] ? Number(v) : v;
        });
        await query(`INSERT INTO ${table} (${colNames.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT DO NOTHING`, values);
        invalidateCache();
        res.redirect(`/admin/${table}?saved=1`);
      } catch (err) {
        res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
      }
    });

    router.post(`/${table}/:pk/update`, auth, async (req, res) => {
      try {
        const pkVal = req.params.pk;
        const setClauses = cols.filter(c => c !== pk).map((c, i) => `${c} = $${i + 1}`);
        const values = cols.filter(c => c !== pk).map(c => {
          const v = req.body[c];
          return (isNullable.includes(c) && (v === '' || v === undefined || v === null)) ? null
            : isNumeric[c] ? Number(v) : v;
        });
        values.push(pkVal);
        await query(`UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${pk} = $${values.length}`, values);
        invalidateCache();
        res.redirect(`/admin/${table}?saved=1`);
      } catch (err) {
        res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
      }
    });

    router.post(`/${table}/:pk/delete`, auth, async (req, res) => {
      try {
        await query(`DELETE FROM ${table} WHERE ${pk} = $1`, [req.params.pk]);
        invalidateCache();
        res.redirect(`/admin/${table}?deleted=1`);
      } catch (err) {
        res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
      }
    });
  }

  return router;
}
