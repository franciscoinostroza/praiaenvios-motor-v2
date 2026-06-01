import { Router, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { query } from '../db/pool.js';
import { invalidateCache } from '../motor/config.js';
import { cotizarDebug as simular } from '../services/motor.js';
import { log } from '../utils/log.js';
import { CATEGORIAS_SEMILLA, SEED_SET } from '../utils/categorias-semilla.js';
import { invalidarPromptCache } from '../utils/classifier.js';
import { invalidarPlantillasCache, PLANTILLAS_DEFAULT } from '../utils/plantillas.js';

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
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📦</text></svg>">
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

/* ─── HERO STATS ─── */
.hero{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:22px}
.hero-card{background:#fff;border-radius:12px;padding:18px 20px;box-shadow:var(--shadow);border:1px solid var(--gray-200);border-left:4px solid var(--blue);position:relative;overflow:hidden;transition:box-shadow .2s}
.hero-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
.hero-card .h-icon{font-size:1.3rem;margin-bottom:6px}
.hero-card .h-num{font-size:1.6rem;font-weight:700;color:var(--gray-800);line-height:1.2}
.hero-card .h-label{font-size:.72rem;color:var(--gray-500);margin-top:2px}
.hero-card .h-sub{font-size:.7rem;font-weight:500;margin-top:4px}
.hero-card .h-sub.green{color:var(--green)}
.hero-card .h-sub.red{color:var(--red)}
.hero-card:nth-child(1){border-left-color:#3b82f6}
.hero-card:nth-child(2){border-left-color:#22c55e}
.hero-card:nth-child(3){border-left-color:#f59e0b}
.hero-card:nth-child(4){border-left-color:#ef4444}

/* ─── QUICK ACTIONS ─── */
.quick-actions{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.qa-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:.8rem;font-weight:600;text-decoration:none;transition:all .15s;border:none;cursor:pointer;font-family:inherit}
.qa-btn.primary{background:var(--blue);color:#fff}
.qa-btn.primary:hover{background:var(--blue-hover);transform:translateY(-1px)}
.qa-btn.secondary{background:var(--gray-100);color:var(--gray-700);border:1px solid var(--gray-200)}
.qa-btn.secondary:hover{background:var(--gray-200);transform:translateY(-1px)}
.qa-btn.warning{background:#fef3c7;color:#92400e;border:1px solid #fde68a}
.qa-btn.warning:hover{background:#fde68a;transform:translateY(-1px)}

/* ─── TIMELINE ─── */
.timeline{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--gray-200);margin-bottom:24px;overflow:hidden}
.timeline-head{display:flex;align-items:center;gap:8px;padding:12px 18px;border-bottom:1px solid var(--gray-200);font-size:.82rem;font-weight:600;color:var(--gray-700)}
.timeline-body{max-height:220px;overflow-y:auto}
.tl-item{display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid var(--gray-100);font-size:.78rem;transition:background .12s}
.tl-item:last-child{border-bottom:none}
.tl-item:hover{background:var(--gray-50)}
.tl-time{color:var(--gray-400);font-size:.7rem;white-space:nowrap;min-width:60px;font-weight:500}
.tl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.tl-dot.sedex{background:var(--blue)}
.tl-dot.pac{background:#f59e0b}
.tl-dot.latam{background:#8b5cf6}
.tl-text{color:var(--gray-600);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-val{font-weight:600;color:var(--gray-800);white-space:nowrap}

/* ─── SECTIONED GRID ─── */
.section{margin-bottom:20px}
.section:last-child{margin-bottom:0}
.section-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:.82rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em}
.section-header .sh-line{flex:1;height:1px;background:var(--gray-200)}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.card{background:#fff;border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow);border:1px solid var(--gray-200);border-left:3px solid var(--gray-300);transition:box-shadow .2s,border-color .2s,transform .15s;display:flex;flex-direction:column}
.card:hover{border-color:var(--gray-300);box-shadow:0 4px 12px rgba(0,0,0,.08);transform:translateY(-1px)}
.card h3{font-size:.8rem;font-weight:600;color:var(--gray-700);margin-bottom:2px}
.card p{font-size:.7rem;color:var(--gray-500);margin-bottom:10px;line-height:1.4;flex:1}
.card a{display:inline-flex;align-items:center;gap:4px;background:var(--gray-100);color:var(--gray-600);text-decoration:none;padding:4px 10px;border-radius:6px;font-size:.7rem;font-weight:500;transition:all .15s;align-self:flex-start}
.card a:hover{background:var(--blue);color:#fff}
.card.section-tarifas{border-left-color:#3b82f6}
.card.section-tarifas a:hover{background:#3b82f6}
.card.section-envios{border-left-color:#f59e0b}
.card.section-envios a:hover{background:#f59e0b}
.card.section-clasificacion{border-left-color:#8b5cf6}
.card.section-clasificacion a:hover{background:#8b5cf6}

/* ─── TABLE ─── */
.table-wrap{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--gray-200);overflow-x:auto;-webkit-overflow-scrolling:touch}
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

/* ─── HAMBURGUESA ─── */
.hamburger{display:none;position:fixed;top:12px;left:12px;z-index:1001;width:36px;height:36px;background:var(--navy);border:none;border-radius:8px;color:#fff;font-size:1.2rem;cursor:pointer;align-items:center;justify-content:center;transition:background .15s;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.hamburger:hover{background:var(--navy-hover)}
.side-overlay{display:none}
@media(max-width:768px){
  .hamburger{display:flex}
  .sidebar{position:fixed;top:0;left:0;z-index:1000;transform:translateX(-100%);transition:transform .25s ease;box-shadow:4px 0 20px rgba(0,0,0,.2)}
  .sidebar.open{transform:translateX(0)}
  .side-overlay{display:block;position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .25s ease}
  .side-overlay.open{opacity:1;pointer-events:auto}
  .main{padding:60px 16px 16px;margin-left:0}
  body.menu-open{overflow:hidden}
  .hero{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
  .hero-card{padding:12px 14px}
  .hero-card .h-num{font-size:1.25rem}
  .quick-actions{gap:6px}
  .qa-btn{padding:6px 12px;font-size:.75rem}
  .timeline-body{max-height:none}
  .table-toolbar .search-wrap input{width:140px}
  .grid{grid-template-columns:1fr}
  td,th{padding:6px 8px;font-size:.75rem}
  td input{padding:3px 6px;font-size:.72rem;min-width:60px}
  td .btn-sm{padding:3px 7px;font-size:.68rem}
  .table-toolbar{flex-direction:column;align-items:stretch;gap:8px;padding:10px 12px}
  .table-toolbar .search-wrap input{width:100%}
  .table-toolbar form.inline{width:100%}
  .table-toolbar form.inline button{width:100%}
  .add-form{padding:12px}
  .add-form .fields{flex-direction:column}
  .add-form label{width:100%}
  .add-form input,.add-form select{width:100%}
  .add-form .btn-add{width:100%;text-align:center}
  .stat-card{padding:12px}
  .stat-card .num{font-size:1.2rem}
  .card{padding:12px}
  .toast{top:auto;bottom:20px;right:20px;left:20px;font-size:.8rem;padding:10px 16px}
}
@media(max-width:480px){
  .hamburger{top:8px;left:8px;width:32px;height:32px;font-size:1rem}
  .main{padding:48px 14px 14px}
  .main-header{margin-bottom:10px}
  .main-header h2{font-size:1.05rem}
  .main-header p{font-size:.78rem}
  .pg-btn{padding:3px 7px;font-size:.7rem}
  td,th{padding:4px 6px;font-size:.7rem}
  td input{padding:2px 5px;font-size:.68rem;min-width:50px}
  td .btn-sm{padding:2px 6px;font-size:.64rem}
  .stat-card{padding:10px 12px}
  .stat-card .num{font-size:1.15rem}
  .hero{gap:8px}
  .hero-card{padding:10px 12px}
  .hero-card .h-icon{font-size:1.1rem;margin-bottom:4px}
  .hero-card .h-num{font-size:1.1rem}
  .stats{gap:8px}
  .grid{gap:8px;padding:0}
  .card{padding:12px}
  .sidebar{width:220px}
}

/* ─── SCROLLBAR ─── */
.sidebar::-webkit-scrollbar{width:4px}
.sidebar::-webkit-scrollbar-thumb{background:var(--navy-hover);border-radius:4px}
</style>
</head>
<body>
<button class="hamburger" onclick="toggleSidebar()" aria-label="Menú">☰</button>
<div class="side-overlay" onclick="toggleSidebar()"></div>
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
<script>
function toggleSidebar(){
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.side-overlay').classList.toggle('open');
  document.body.classList.toggle('menu-open');
}
document.addEventListener('click',function(e){
  var l=e.target.closest('.sidebar-nav a');
  if(l&&window.innerWidth<=768){document.querySelector('.sidebar').classList.remove('open');document.querySelector('.side-overlay').classList.remove('open');document.body.classList.remove('menu-open')}
});
function confirmDelete(msg,form){
  const d=document.createElement('div');d.className='modal-overlay';
  d.innerHTML='<div class="modal"><h3>🗑️ Confirmar</h3><p>'+(msg||'¿Eliminar este registro?')+'</p><div class="actions"><button class="btn-cancel">Cancelar</button><button class="btn-confirm">Eliminar</button></div></div>';
  d.querySelector('.btn-cancel').onclick=()=>d.remove();
  d.querySelector('.btn-confirm').onclick=()=>{d.remove();form.submit()};
  document.body.appendChild(d);
}
function filterTable(el){
  const q=el.value.toLowerCase();
  const rows=el.closest('.table-wrap').querySelector('tbody').children;
  for(let r of rows){
    r.dataset.matched=r.innerText.toLowerCase().includes(q)?'1':'0';
    r.style.display='';
  }
  renderPage(1,el.closest('.table-wrap'));
}
function renderPage(page,wrap){
  var perPage=20;
  var all=Array.from(wrap.querySelector('tbody').children);
  var visible=all.filter(function(r){return r.dataset.matched!=='0'});
  var pages=Math.ceil(visible.length/perPage)||1;
  if(page>pages)page=pages;
  all.forEach(function(r){
    var idx=visible.indexOf(r);
    var p=idx>=0?Math.floor(idx/perPage)+1:-1;
    r.style.display=p===page?'':'none';
  });
  renderPaginator(page,pages,visible.length,wrap);
}
function renderPaginator(page,pages,total,wrap){
  var el=wrap.querySelector('.paginator');
  if(pages<=1){el.innerHTML='<span style="font-size:.78rem;color:var(--gray-400);padding:8px 0;display:block;text-align:center">' + total + ' registro(s)</span>';return}
  var start=(page-1)*20+1;
  var end=Math.min(page*20,total);
  var h='<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 0;flex-wrap:wrap">';
  h+='<span style="font-size:.78rem;color:var(--gray-500);margin-right:8px">'+start+'-'+end+' de '+total+'</span>';
  if(page>1)h+='<button class="pg-btn" onclick="renderPage('+(page-1)+',this.closest(\\'.table-wrap\\'))">‹ Anterior</button>';
  var maxVisible=5,range=2,startP=Math.max(1,page-range),endP=Math.min(pages,page+range);
  if(pages>maxVisible+2){
    if(startP>2){h+='<button class="pg-btn" onclick="renderPage(1,this.closest(\\'.table-wrap\\'))">1</button><span class="pg-dots">…</span>'}
    else if(startP===2)h+='<button class="pg-btn" onclick="renderPage(1,this.closest(\\'.table-wrap\\'))">1</button>';
    for(var i=startP;i<=endP;i++)h+='<button class="pg-btn '+(i===page?'pg-act':'')+'" onclick="renderPage('+i+',this.closest(\\'.table-wrap\\'))">'+i+'</button>';
    if(endP<pages-1)h+='<span class="pg-dots">…</span><button class="pg-btn" onclick="renderPage('+pages+',this.closest(\\'.table-wrap\\'))">'+pages+'</button>';
    else if(endP===pages-1)h+='<button class="pg-btn" onclick="renderPage('+pages+',this.closest(\\'.table-wrap\\'))">'+pages+'</button>';
  }else{
    for(var i=1;i<=pages;i++)h+='<button class="pg-btn '+(i===page?'pg-act':'')+'" onclick="renderPage('+i+',this.closest(\\'.table-wrap\\'))">'+i+'</button>';
  }
  if(page<pages)h+='<button class="pg-btn" onclick="renderPage('+(page+1)+',this.closest(\\'.table-wrap\\'))">Siguiente ›</button>';
  h+='</div>';
  el.innerHTML=h;
}
</script>
  ${bodyHtml}
</div>
<style>
.pg-btn{padding:4px 10px;border:1px solid var(--gray-300);background:#fff;border-radius:6px;cursor:pointer;font-size:.78rem;font-family:inherit;transition:all .12s}
.pg-btn:hover{background:var(--gray-50);border-color:var(--gray-400)}
.pg-btn.pg-act{background:var(--blue)!important;color:#fff!important;border-color:var(--blue)!important}
.pg-dots{font-size:.78rem;color:var(--gray-400);padding:0 2px;user-select:none}
</style>
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
    { label: 'Tramos Boa Vista', path: '/admin/tramos_boa_vista', icon: '📏', key: 'Tramos Boa Vista' },
    { label: 'Tramos Ganancia', path: '/admin/tramos_ganancia', icon: '📊', key: 'Tramos Ganancia' },
    { label: 'Modalidades', path: '/admin/modalidades', icon: '📋', key: 'Modalidades' },
    { label: 'Fórmulas', path: '/admin/formulas', icon: '🧮', key: 'Fórmulas' },
    { divider: true },
    { label: 'Prompt Clasificador', path: '/admin/prompt-categorias', icon: '🤖', key: 'Prompt Clasificador' },
    { label: 'Zonas', path: '/admin/zonas', icon: '📍', key: 'Zonas' },
    { divider: true },
    { label: 'Matriz de Servicios', path: '/admin/categoria-servicios', icon: '🚦', key: 'Matriz de Servicios' },
    { label: 'Mapeo de Categorías', path: '/admin/mapeo-categorias', icon: '📖', key: 'Mapeo de Categorías' },
    { divider: true },
    { label: 'Mensajes', path: '/admin/mensajes', icon: '💬', key: 'Mensajes' },
    { divider: true },
    { label: 'Logs', path: '/admin/logs', icon: '📋', key: 'Logs' },
    { divider: true },
    { label: 'Wiki', path: '/admin/panel', icon: '📖', key: 'Wiki' },
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
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📦</text></svg>">
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
    const esc = (s) => String(s == null ? '' : s).replace(/</g,'&lt;').replace(/>/g,'&gt;');

    // ── queries ──
    let heroData = { cotizHoy: 0, cotizAyer: 0, tasaUsd: '—', ultCotiz: null, errHoy: 0, ultErr: null };
    let timelineRows = [];
    let counts = [];
    try {
      const [qCotiz, qTasa, qUltCotiz, qErrs, qUltErr, qTimeline] = await Promise.all([
        query(`SELECT
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as hoy,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '2 days' AND created_at < NOW() - INTERVAL '1 day') as ayer
        FROM logs WHERE nivel='INFO' AND mensaje LIKE '%Cotización exitosa%'`),
        query("SELECT valor FROM formulas WHERE clave='tasa_dolar'"),
        query("SELECT created_at FROM logs WHERE nivel='INFO' AND mensaje LIKE '%Cotización exitosa%' ORDER BY created_at DESC LIMIT 1"),
        query("SELECT COUNT(*) c FROM logs WHERE nivel='ERROR' AND created_at >= NOW() - INTERVAL '1 day'"),
        query("SELECT created_at, mensaje FROM logs WHERE nivel='ERROR' ORDER BY created_at DESC LIMIT 1"),
        query("SELECT created_at, mensaje FROM logs WHERE nivel='INFO' AND mensaje LIKE '%Cotización exitosa%' ORDER BY created_at DESC LIMIT 5"),
      ]);
      heroData.cotizHoy = Number(qCotiz.rows[0].hoy);
      heroData.cotizAyer = Number(qCotiz.rows[0].ayer);
      heroData.tasaUsd = qTasa.rows.length > 0 ? Number(qTasa.rows[0].valor).toFixed(2) : '—';
      heroData.ultCotiz = qUltCotiz.rows.length > 0 ? qUltCotiz.rows[0].created_at : null;
      heroData.errHoy = Number(qErrs.rows[0].c);
      heroData.ultErr = qUltErr.rows.length > 0 ? { time: qUltErr.rows[0].created_at, msg: qUltErr.rows[0].mensaje } : null;
      timelineRows = qTimeline.rows;
    } catch {}

    // ── hero stats ──
    const pctCambio = heroData.cotizAyer > 0
      ? ((heroData.cotizHoy - heroData.cotizAyer) / heroData.cotizAyer * 100).toFixed(0)
      : null;
    const cambioCls = pctCambio !== null ? (Number(pctCambio) >= 0 ? 'green' : 'red') : '';
    const cambioStr = pctCambio !== null ? `${Number(pctCambio) >= 0 ? '+' : ''}${pctCambio}% vs ayer` : '';

    const timeAgo = (d) => {
      if (!d) return '—';
      const diff = (Date.now() - new Date(d).getTime()) / 1000;
      if (diff < 60) return 'hace segundos';
      if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
      return `hace ${Math.floor(diff / 3600)}h`;
    };

    const heroHtml = `<div class="hero">
      <div class="hero-card"><div class="h-icon">📈</div><div class="h-num">${heroData.cotizHoy}</div><div class="h-label">Cotizaciones hoy</div>${cambioStr ? `<div class="h-sub ${cambioCls}">${cambioStr}</div>` : ''}</div>
      <div class="hero-card"><div class="h-icon">💰</div><div class="h-num">R$ ${heroData.tasaUsd}</div><div class="h-label">Tasa USD</div><div class="h-sub" style="color:var(--gray-400)">desde formulas</div></div>
      <div class="hero-card"><div class="h-icon">⏱</div><div class="h-num">${timeAgo(heroData.ultCotiz)}</div><div class="h-label">Última cotización</div><div class="h-sub" style="color:var(--gray-400)">${heroData.ultCotiz ? new Date(heroData.ultCotiz).toLocaleString('es-VE',{hour:'2-digit',minute:'2-digit'}) : '—'}</div></div>
      <div class="hero-card"><div class="h-icon">⚠️</div><div class="h-num" style="color:${heroData.errHoy > 0 ? 'var(--red)' : 'var(--green)'}">${heroData.errHoy}</div><div class="h-label">Errores hoy</div>${heroData.ultErr ? `<div class="h-sub red">${timeAgo(heroData.ultErr.time)}: ${esc(heroData.ultErr.msg.slice(0,50))}</div>` : '<div class="h-sub green">Sin errores</div>'}</div>
    </div>`;

    // ── quick actions ──
    const actionsHtml = `<div class="quick-actions">
      <a href="/admin/simulador" class="qa-btn primary">🧮 Simulador</a>
      <a href="/admin/panel" class="qa-btn secondary">📖 Wiki</a>
      <a href="/admin/logs?nivel=ERROR" class="qa-btn ${heroData.errHoy > 0 ? 'warning' : 'secondary'}">📋 Logs de error</a>
    </div>`;

    // ── timeline ──
    const dotClass = (msg) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('sedex') || m.includes('express')) return 'sedex';
      if (m.includes('pac') || m.includes('terrestre')) return 'pac';
      return 'latam';
    };
    const extraerValor = (msg) => {
      const m = msg || '';
      const match = m.match(/R\$\s*([\d.]+(?:,\d+)?)/);
      return match ? 'R$ ' + match[1] : '';
    };
    const timelineHtml = timelineRows.length > 0 ? `<div class="timeline">
      <div class="timeline-head">⏱️ Últimas cotizaciones</div>
      <div class="timeline-body">${timelineRows.map(r =>
        `<div class="tl-item"><span class="tl-time">${new Date(r.created_at).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit'})}</span><span class="tl-dot ${dotClass(r.mensaje)}"></span><span class="tl-text">${esc(r.mensaje.slice(0,80))}</span><span class="tl-val">${esc(extraerValor(r.mensaje))}</span></div>`
      ).join('')}</div>
    </div>` : '';

    // ── sectioned cards ──
    const sections = [
      { key: 'tarifas', icon: '💰', label: 'Tarifas', cls: 'section-tarifas', cards: [
        { key: 'tarifas_express', icon: '💰', name: 'Express', desc: 'Modalidad 1 — SEDEX' },
        { key: 'tarifas_terrestre', icon: '🚚', name: 'Terrestre', desc: 'Modalidad 2 — PAC' },
        { key: 'nacional_op1', icon: '🏠', name: 'Nacional OP1', desc: 'Costo nacional MRW' },
        { key: 'nacional_op2', icon: '🏠', name: 'Nacional OP2', desc: 'Costo nacional LAE' },
      ]},
      { key: 'envios', icon: '📦', label: 'Envíos', cls: 'section-envios', cards: [
        { key: 'tramos_boa_vista', icon: '📏', name: 'Tramos Boa Vista', desc: 'Suma dimensiones → precio' },
        { key: 'tramos_ganancia', icon: '📊', name: 'Tramos Ganancia', desc: 'Peso → USD/kg' },
        { key: 'modalidades', icon: '📋', name: 'Modalidades', desc: 'Configuración de cada modalidad' },
        { key: 'formulas', icon: '🧮', name: 'Fórmulas', desc: 'Constantes del motor' },
        { key: 'zonas', icon: '📍', name: 'Zonas', desc: 'Base y orígenes prohibidos' },
      ]},
      { key: 'clasificacion', icon: '🤖', label: 'Clasificación', cls: 'section-clasificacion', cards: [
        { key: 'categoria-servicios', icon: '🚦', name: 'Matriz de Servicios', desc: 'Categorías × SEDEX / PAC / LATAM' },
        { key: 'mapeo-categorias', icon: '📖', name: 'Mapeo de Categorías', desc: 'Términos → categorías' },
        { key: 'categorias', icon: '🏷️', name: 'Categorías', desc: 'Vocabulario para el clasificador IA' },
        { key: 'prompt-categorias', icon: '🤖', name: 'Prompt Clasificador', desc: 'System prompt GPT-4o mini' },
        { key: 'mensajes', icon: '💬', name: 'Mensaje Final', desc: 'Plantillas de respuesta ES/PT/EN' },
      ]},
    ];

    let seccionesHtml = '';
    for (const sec of sections) {
      seccionesHtml += `<div class="section"><div class="section-header">${sec.icon} ${sec.label}<span class="sh-line"></span></div><div class="grid">`;
      for (const c of sec.cards) {
        seccionesHtml += `<div class="card ${sec.cls}"><h3>${c.icon} ${c.name}</h3><p>${c.desc}</p><a href="/admin/${c.key}">Editar →</a></div>`;
      }
      seccionesHtml += '</div></div>';
    }

    const body = `${heroHtml}${actionsHtml}${timelineHtml}${seccionesHtml}`;
    res.send(layout('Admin', body, t));
  });

  /* ─── PANEL (Wiki viva) ─── */
  router.get('/panel', auth, async (req, res) => {
    const t = req.adminToken;
    try {
      const [
        modRows, catRows, matRows, expRows, terrRows, formRows,
        bvRows, ganRows, zonaRows, nac1Rows, nac2Rows,
        logStats, cacheStats
      ] = await Promise.all([
        query('SELECT modalidad, clave, valor FROM modalidades ORDER BY modalidad, clave'),
        query('SELECT tipo, categoria FROM categorias ORDER BY tipo, categoria'),
        query('SELECT * FROM categoria_servicios ORDER BY categoria, servicio'),
        query('SELECT kg, precio_bs FROM tarifas_express ORDER BY kg'),
        query('SELECT kg, precio_bs FROM tarifas_terrestre ORDER BY kg'),
        query('SELECT clave, valor FROM formulas ORDER BY clave'),
        query('SELECT hasta_cm, precio_bs FROM tramos_boa_vista ORDER BY id'),
        query('SELECT hasta_kg, usd_kg FROM tramos_ganancia ORDER BY id'),
        query('SELECT tipo, ciudad FROM zonas ORDER BY tipo, ciudad'),
        query('SELECT MIN(kg) min_kg, MAX(kg) max_kg, MIN(precio_bs) min_p, MAX(precio_bs) max_p FROM nacional_op1'),
        query('SELECT MIN(kg) min_kg, MAX(kg) max_kg, MIN(precio_bs) min_p, MAX(precio_bs) max_p FROM nacional_op2'),
        query(`SELECT
          (SELECT COUNT(*) FROM logs WHERE nivel='INFO' AND mensaje LIKE '%Cotización exitosa%' AND created_at >= NOW() - INTERVAL '1 day') cotiz,
          (SELECT COUNT(*) FROM logs WHERE nivel='INFO' AND mensaje LIKE '%UPS%' AND created_at >= NOW() - INTERVAL '1 day') intl,
          (SELECT COUNT(*) FROM logs WHERE nivel='ERROR' AND created_at >= NOW() - INTERVAL '1 day') errs,
          (SELECT created_at FROM logs WHERE nivel='INFO' AND mensaje LIKE '%Cotización exitosa%' AND created_at >= NOW() - INTERVAL '1 day' ORDER BY created_at DESC LIMIT 1) ultima`),
        query(`SELECT
          (SELECT COUNT(*) FROM logs WHERE mensaje LIKE '%cache HIT%' AND created_at >= NOW() - INTERVAL '1 day') hits,
          (SELECT COUNT(*) FROM logs WHERE mensaje LIKE '%cache MISS%' AND created_at >= NOW() - INTERVAL '1 day') misses`)
      ]);

      const mods = {};
      for (const r of modRows.rows) {
        if (!mods[r.modalidad]) mods[r.modalidad] = {};
        const val = isNaN(Number(r.valor)) ? r.valor : Number(r.valor);
        mods[r.modalidad][r.clave] = val;
      }

      const cats = { NEUTRAS: [], TERRESTRE: [], SOLO_AEREO: [] };
      for (const r of catRows.rows) {
        if (cats[r.tipo]) cats[r.tipo].push(r.categoria);
      }

      const matriz = {};
      for (const r of matRows.rows) {
        if (!matriz[r.categoria]) matriz[r.categoria] = {};
        matriz[r.categoria][r.servicio] = { estado: r.estado, doc: r.documentacion || '' };
      }
      const SERVICIOS_MATRIZ = ['sedex', 'pac', 'latam'];

      const forms = {};
      for (const r of formRows.rows) forms[r.clave] = Number(r.valor);

      const expressTable = expRows.rows.map(r => ({ kg: r.kg, precio: Number(r.precio_bs) }));
      const terreTable = terrRows.rows.map(r => ({ kg: r.kg, precio: Number(r.precio_bs) }));

      const bvTramos = bvRows.rows.map(r => ({ hasta: r.hasta_cm, precio: Number(r.precio_bs) }));
      const ganTramos = ganRows.rows.map(r => ({ hasta: r.hasta_kg, usd: Number(r.usd_kg) }));

      const zonas = { BASE: [], PROHIBIDO: [] };
      for (const r of zonaRows.rows) {
        if (zonas[r.tipo]) zonas[r.tipo].push(r.ciudad);
      }

      const nac1 = nac1Rows.rows[0];
      const nac2 = nac2Rows.rows[0];
      const stats = logStats.rows[0];
      const cache = cacheStats.rows[0];
      const upsStatus = process.env.UPS_CUENTA_1_ID ? '✅ Conectado' : '⏳ Pendiente';
      const ultima = stats.ultima ? new Date(stats.ultima).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '—';
      const version = 'v2.0.0';

      const esc = s => String(s == null ? '' : s).replace(/</g,'&lt;').replace(/>/g,'&gt;');

      // ── helpers ──
      const jumpMenu = () => `<div class="jump-menu">
        ${[
          { id: 'como-funciona', icon: '🚚', label: '¿Cómo funciona?' },
          { id: 'modalidades', icon: '📦', label: 'Modalidades' },
          { id: 'formulas', icon: '🧮', label: 'Fórmulas' },
          { id: 'ejemplo', icon: '📐', label: 'Ejemplo' },
          { id: 'categorias', icon: '🏷️', label: 'Categorías' },
          { id: 'matriz', icon: '🚦', label: 'Matriz de Servicios' },
          { id: 'internacional', icon: '🌍', label: 'Internacional' },
          { id: 'tarifas', icon: '📈', label: 'Tarifas' },
          { id: 'referencia', icon: '📋', label: 'Referencia' },
          { id: 'db', icon: '🗄️', label: 'Base de Datos' },
          { id: 'faq', icon: '❓', label: 'FAQ' },
          { id: 'glosario', icon: '📖', label: 'Glosario' },
        ].map(i => `<a href="#${i.id}" class="jm-link">${i.icon} ${i.label}</a>`).join('')}
      </div>`;

      const section = (id, icon, title, content, cls) =>
        `<section id="${id}" class="panel-section${cls ? ' ' + cls : ''}">
          <div class="ps-header"><span class="ps-icon">${icon}</span><h2>${esc(title)}</h2></div>
          <div class="ps-body">${content}</div>
        </section>`;

      const card = (icon, title, items, accent) =>
        `<div class="modal-card" style="${accent ? '--mc-accent:' + accent : ''}">
          <div class="mc-head">${icon} ${esc(title)}</div>
          <div class="mc-body">${items}</div>
        </div>`;

      // ── sections ──
      const comoFunciona = `<div class="how-flow">
        <div class="hf-step"><div class="hf-num">1</div><div class="hf-txt"><strong>Recibe</strong> mensaje del cliente en WhatsApp</div></div>
        <div class="hf-arr">→</div>
        <div class="hf-step"><div class="hf-num">2</div><div class="hf-txt"><strong>Interpreta</strong> los datos (JSON o clave=valor)</div></div>
        <div class="hf-arr">→</div>
        <div class="hf-step"><div class="hf-num">3</div><div class="hf-txt"><strong>Clasifica</strong> el producto: primero busca en <b>Mapeo de Categorías</b>, si no encuentra usa IA (OpenAI), y si falla usa diccionario local</div></div>
        <div class="hf-arr">→</div>
        <div class="hf-step"><div class="hf-num">4</div><div class="hf-txt"><strong>Elige</strong> servicio según la <b>Matriz de Categorías × Servicio</b> (semáforos 🟢🟡🔴)</div></div>
        <div class="hf-arr">→</div>
        <div class="hf-step"><div class="hf-num">5</div><div class="hf-txt"><strong>Calcula</strong> precio con la fórmula exacta</div></div>
        <div class="hf-arr">→</div>
        <div class="hf-step"><div class="hf-num">6</div><div class="hf-txt"><strong>Responde</strong> con precio y plazo al cliente</div></div>
      </div>
      <p class="panel-note">El motor prueba servicios en orden: <strong>SEDEX</strong> → <strong>PAC</strong> → <strong>LATAM</strong>. Usa el primer servicio que tenga todas las categorías del producto en 🟢 Verde o 🟡 Amarillo en la <b>Matriz de Servicios</b>.</p>`;

      const renderLimits = (m) => {
        const d = mods[m] || {};
        if (!d.id) return '<p class="hint">Sin datos</p>';
        return `<table class="info-table">
          <tr><td>Peso máximo</td><td><strong>${d.peso_max_kg || '—'}</strong> kg</td></tr>
          <tr><td>Dimensión máxima</td><td><strong>${d.dimension_max_cm || '—'}</strong> cm</td></tr>
          <tr><td>Valor máximo</td><td><strong>R$ ${d.valor_max_rs || '—'}</strong></td></tr>
          <tr><td>Tipo mercancía</td><td>${d.id === 3 ? 'Personal o <strong>Comercial</strong>' : 'Solo <strong>Personal</strong>'}</td></tr>
          <tr><td>Tiempo entrega</td><td><strong>${d.tiempo_entrega_dias || '—'}</strong> días</td></tr>
        </table>`;
      };

      const expM = mods.EXPRESS || {};
      const terreM = mods.TERRESTRE || {};
      const aereoM = mods.AEREO || {};
      const aereoTrechoM = mods.AEREO_TRECHO || {};

      const renderPriceTable = (rows, unit) =>
        rows.length === 0 ? '<p class="hint">(vacío)</p>' :
        `<div class="ptable-wrap"><table class="ptable"><thead><tr><th>kg</th><th>${esc(unit)}</th><th style="width:40%">Barra</th></tr></thead><tbody>
        ${rows.map(r => {
          const maxPrec = Math.max(...rows.map(x => x.precio));
          const pct = (r.precio / maxPrec) * 100;
          return `<tr><td>${r.kg}</td><td><strong>R$ ${r.precio.toFixed(2)}</strong></td><td><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div></td></tr>`;
        }).join('')}</tbody></table></div>`;

      const modalidadesHtml = `<div class="modal-grid">
        ${card('🚀', 'Express · ' + (expM.nombre || ''), `<p class="mc-desc">Envío rápido para productos sin restricción. Electrónicos, ropa, cosméticos, accesorios.</p>${renderLimits('EXPRESS')}` + renderPriceTable(expressTable, 'R$'), '#3b82f6')}
        ${card('🚛', 'Terrestre · ' + (terreM.nombre || ''), `<p class="mc-desc">Envío económico para categorías restringidas: alimentos, bebidas, líquidos, perfumes.</p>${renderLimits('TERRESTRE')}` + renderPriceTable(terreTable, 'R$'), '#f59e0b')}
        ${card('✈️', 'Aéreo · ' + (aereoM.nombre || ''), `<p class="mc-desc">Envío por vía aérea. Productos con baterías, alcohol, corrosivos. Acepta comercial.</p>${renderLimits('AEREO')}${aereoTrechoM.tiempo_entrega_dias ? `<p class="mc-info">➕ <strong>Aéreo + Trecho</strong> (Mod. 4): cuando el origen no está en zona BASE. +${aereoTrechoM.tiempo_entrega_dias || '—'} días.</p>` : ''}`, '#8b5cf6')}
      </div>`;

      const renderFormTable = (filterKeys, label) => {
        const rows = formRows.rows.filter(r => !filterKeys || filterKeys.includes(r.clave));
        if (rows.length === 0) return '<p class="hint">(vacío)</p>';
        return `<table class="info-table">
          ${rows.map(r => `<tr><td><code>${esc(r.clave)}</code></td><td><strong>${Number(r.valor)}</strong></td></tr>`).join('')}
        </table>`;
      };

      const formulasHtml = `<div class="two-col">
        <div>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">Fórmulas generales</h3>
          ${renderFormTable(['divisor_volumetrico','factor_ft3','flete_aereo_por_kg','factor_seguro','factor_empresa_manaus','factor_ganancia','tasa_dolar'])}
          <br>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">Componentes de cálculo</h3>
          <table class="info-table">
            <tr><td><code>peso_vol = ceil(L×A×A ÷ ${esc(String(forms.divisor_volumetrico || 6000))})</code></td><td>Peso según volumen</td></tr>
            <tr><td><code>peso_fact = ceil(max(bruto, vol))</code></td><td>El que se cobra (el mayor)</td></tr>
            <tr><td><code>ft³ = L×A×A × ${forms.factor_ft3 || '0.000035'}</code></td><td>Pies cúbicos</td></tr>
            <tr><td><code>valor_extra = ceil(ft³ × 8)</code></td><td>Manejo de volumen</td></tr>
            <tr><td><code>embalaje = ceil(ft³ × 15)</code></td><td>Material de empaque</td></tr>
            <tr><td><code>ganancia = peso × tarifa_usd × ${forms.factor_ganancia || 6}</code></td><td>Margen de ganancia</td></tr>
          </table>
        </div>
        <div>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">Fórmula Express</h3>
          <div class="formula-box">
            <code>Tarifa(kg) + ValorExtra + Embalaje + Ganancia + CargoFijo + BoaVista</code>
          </div>
          <br>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">Fórmula Terrestre</h3>
          <div class="formula-box">
            <code>Tarifa(kg) + ValorExtra + Embalaje + Ganancia + CargoFijo + BoaVista</code>
          </div>
          <br>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">Fórmula Aéreo</h3>
          <div class="formula-box">
            <code>Flete + Seguro + EmpresaManaus + ValorExtra + Embalaje + BV + CargoYho + Ganancia + CargoPickup + CargoManausBV</code>
          </div>
        </div>
      </div>`;

      const ejemploHtml = `<div class="example-grid">
        <div class="eg-data">
          <table class="info-table">
            <tr><td>Producto</td><td><strong>Laptop</strong></td></tr>
            <tr><td>Peso bruto</td><td>2 kg</td></tr>
            <tr><td>Dimensiones</td><td>30 × 20 × 15 cm</td></tr>
            <tr><td>Valor</td><td>R$ 500</td></tr>
            <tr><td>Categoría</td><td><span class="cat-tag" style="--tag-clr:var(--green)">✅ electrónicos</span></td></tr>
          </table>
        </div>
        <div class="eg-steps">
          <div class="eg-step"><div class="eg-n">1</div><div><code>Peso vol = 30×20×15÷${esc(String(forms.divisor_volumetrico || 6000))} = 1,5 → <strong>2 kg</strong></code></div></div>
          <div class="eg-step"><div class="eg-n">2</div><div><code>Peso fact = max(2, 2) = <strong>2 kg</strong></code></div></div>
          <div class="eg-step"><div class="eg-n">3</div><div><code>FT³ = 30×20×15×${forms.factor_ft3 || '0.000035'} = <strong>0,3178</strong></code></div></div>
          <div class="eg-step"><div class="eg-n">4</div><div><code>ValorExtra = ceil(0,3178×8) = <strong>R$ 3</strong>  |  Embalaje = ceil(0,3178×15) = <strong>R$ 5</strong></code></div></div>
          <div class="eg-step"><div class="eg-n">5</div><div><code>Ganancia = 2 × $5 USD × ${forms.factor_ganancia || 6} = <strong>R$ 60</strong></code></div></div>
          <div class="eg-step"><div class="eg-n">6</div><div><code>Express: <strong>R$ ${expressTable[1] ? expressTable[1].precio : '...'} + 3 + 5 + 60 + ${expM.valor_fijo_rs || 20} + BoaVista</strong></code></div></div>
          <div class="eg-total">
            <div class="eg-total-item"><span>🚀 Express</span><strong>R$ 264</strong></div>
            <div class="eg-total-item"><span>✈️ Aéreo</span><strong>R$ 487</strong></div>
          </div>
        </div>
      </div>`;

      const categoriasHtml = () => {
        const estadoIcono = { verde: '🟢', amarillo: '🟡', rojo: '🔴' };
        const categoriasList = Object.keys(matriz).sort();
        if (categoriasList.length === 0) return '<p class="hint">(vacío — configurar en Matriz de Servicios)</p>';
        let html = `<div style="margin-bottom:12px;font-size:.8rem;color:var(--gray-500)">📋 <b>${categoriasList.length}</b> categorías activas en la matriz. Cada semáforo muestra si el servicio acepta esa categoría.</div>`;
        html += '<div class="table-wrap" style="margin:0"><table><thead><tr><th>Categoría</th><th style="text-align:center;text-transform:uppercase">🟢 sedex</th><th style="text-align:center;text-transform:uppercase">🚚 pac</th><th style="text-align:center;text-transform:uppercase">✈️ latam</th><th>Documentación</th></tr></thead><tbody>';
        for (const cat of categoriasList) {
          html += '<tr><td><b>' + esc(cat) + '</b></td>';
          for (const s of SERVICIOS_MATRIZ) {
            const celda = matriz[cat] && matriz[cat][s];
            const icono = estadoIcono[celda ? celda.estado : 'rojo'];
            html += '<td style="text-align:center;font-size:1.1rem">' + icono + '</td>';
          }
          const doc = matriz[cat] && matriz[cat].sedex ? matriz[cat].sedex.doc : '';
          html += '<td style="font-size:.75rem;color:var(--gray-500)">' + esc(doc) + '</td></tr>';
        }
        html += '</tbody></table></div>';
        return html;
      };

      const internacionalHtml = `<div class="two-col">
        <div>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">Flujo internacional</h3>
          <div class="how-flow" style="flex-wrap:wrap">
            <div class="hf-step" style="flex:1;min-width:120px"><div class="hf-num">1</div><div class="hf-txt"><strong>Detecta</strong> pais_destino</div></div>
            <div class="hf-arr" style="flex:0">→</div>
            <div class="hf-step" style="flex:1;min-width:120px"><div class="hf-num">2</div><div class="hf-txt"><strong>Cachea</strong> o consulta UPS</div></div>
            <div class="hf-arr" style="flex:0">→</div>
            <div class="hf-step" style="flex:1;min-width:120px"><div class="hf-num">3</div><div class="hf-txt"><strong>Devuelve</strong> tasas comparativas</div></div>
          </div>
        </div>
        <div>
          <table class="info-table">
            <tr><td>🔄 Caché (1h)</td><td><strong>${cache.hits || 0}</strong> hits · <strong>${cache.misses || 0}</strong> misses hoy</td></tr>
            <tr><td>🇺🇸 UPS</td><td>${upsStatus}</td></tr>
          </table>
          <br>
          <p class="panel-note" style="margin:0">Si dos clientes piden la misma ruta con las mismas medidas, el segundo <strong>no paga</strong> (usa caché).</p>
        </div>
      </div>`;

      const tarifasHtml = `<div class="two-col">
        <div><h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">🚀 Express</h3>${renderPriceTable(expressTable, 'R$')}</div>
        <div><h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">🚛 Terrestre</h3>${renderPriceTable(terreTable, 'R$')}</div>
      </div>
      <br>
      <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">🏠 Nacional Venezuela (Bs/kg)</h3>
      <table class="info-table" style="max-width:400px">
        <tr><td>OP1</td><td><strong>R$ ${Number(nac1.min_p).toFixed(2)}</strong> (${nac1.min_kg}kg) → <strong>R$ ${Number(nac1.max_p).toFixed(2)}</strong> (${nac1.max_kg}kg)</td></tr>
        <tr><td>OP2</td><td><strong>R$ ${Number(nac2.min_p).toFixed(2)}</strong> (${nac2.min_kg}kg) → <strong>R$ ${Number(nac2.max_p).toFixed(2)}</strong> (${nac2.max_kg}kg)</td></tr>
      </table>`;

      const matrizHtml = `<div style="padding:4px 0">
        <p style="font-size:.85rem;color:var(--gray-700);line-height:1.6;margin-bottom:14px">La <b>Matriz de Categorías × Servicio</b> define qué servicios de envío aceptan cada categoría de producto. El motor prueba servicios en orden <b>SEDEX → PAC → LATAM</b> y usa el primero donde todas las categorías estén en 🟢 o 🟡.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px">
          <span style="font-size:.8rem;padding:4px 10px;background:#ecfdf5;color:#065f46;border-radius:6px;font-weight:500">🟢 Verde = Permitido sin documentos</span>
          <span style="font-size:.8rem;padding:4px 10px;background:#fef3c7;color:#92400e;border-radius:6px;font-weight:500">🟡 Amarillo = Permitido con documentación</span>
          <span style="font-size:.8rem;padding:4px 10px;background:#fef2f2;color:#991b1b;border-radius:6px;font-weight:500">🔴 Rojo = No permitido</span>
        </div>
        <p style="font-size:.8rem;color:var(--gray-500)">📋 Las categorías <b>${Object.keys(matriz).length}</b> activas se pueden editar desde <a href="/admin/categoria-servicios" style="color:var(--blue);text-decoration:underline">Admin → Matriz de Servicios</a>.</p>
      </div>`;

      const referenciaHtml = `<div class="two-col">
        <div>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">📏 Tramos Boa Vista</h3>
          <table class="info-table">
            ${bvTramos.map(r => `<tr><td>${r.hasta !== null ? '≤ ' + r.hasta + ' cm' : '> límite'}</td><td><strong>R$ ${r.precio}</strong></td></tr>`).join('')}
          </table>
        </div>
        <div>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">📊 Tramos Ganancia</h3>
          <table class="info-table">
            ${ganTramos.map(r => `<tr><td>${r.hasta !== null ? '≤ ' + r.hasta + ' kg' : '> límite'}</td><td><strong>$${r.usd}/kg</strong></td></tr>`).join('')}
          </table>
        </div>
      </div>
      <br>
      <div class="two-col">
        <div>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">📍 Zonas BASE</h3>
          <div>${zonas.BASE.map(c => `<span class="cat-pill" style="--pill-clr:var(--blue)">${esc(c)}</span>`).join('')}</div>
        </div>
        <div>
          <h3 style="margin:0 0 8px;font-size:.85rem;color:var(--gray-600)">🚫 Zonas PROHIBIDO</h3>
          <div>${zonas.PROHIBIDO.map(c => `<span class="cat-pill" style="--pill-clr:var(--red)">${esc(c)}</span>`).join('')}</div>
        </div>
      </div>`;

      const dbHtml = `<div class="table-wrap" style="margin:0"><table>
        <thead><tr><th>Tabla</th><th>Función</th></tr></thead>
        <tbody>
          ${[['tarifas_express','Precio por kg para Express'],
            ['tarifas_terrestre','Precio por kg para Terrestre'],
            ['nacional_op1','Costo nacional Venezuela — operador 1'],
            ['nacional_op2','Costo nacional Venezuela — operador 2'],
            ['tramos_boa_vista','Cargos por dimensiones para ruta Boa Vista'],
            ['tramos_ganancia','Tarifa USD/kg según peso del paquete'],
            ['modalidades','Configuración de cada modalidad (límites, cargos, nombre)'],
            ['formulas','Constantes del motor de cálculo'],
            ['categorias','Vocabulario de categorías para el clasificador IA'],
            ['categoria_servicios','Matriz de servicios: qué servicio acepta cada categoría (🟢🟡🔴)'],
            ['mapeo_categorias','Mapeo de términos de producto → categoría (prioridad máxima)'],
            ['plantillas_mensajes','Plantillas de respuesta para WhatsApp (ES/PT/EN)'],
            ['zonas','Ciudades BASE y PROHIBIDO'],
            ['logs','Registro de eventos del sistema'],
            ['rate_cache','Caché de tasas UPS (expira 1h)'],
            ['prompts_config','Prompts personalizados para la IA clasificadora'],
            ['cache_urls','Caché de scraping de URLs'],
          ].map(([t,d]) => `<tr><td><code>${t}</code></td><td>${d}</td></tr>`).join('')}
        </tbody>
      </table></div>`;

      const faqHtml = `<div class="faq-list">
        ${[
          ['¿Qué productos no se pueden enviar?','Armas, drogas, material explosivo y productos ilegales. Tampoco se aceptan envíos desde Boa Vista o Pacaraima como origen.'],
          ['¿Cómo se elige el servicio?','El motor prueba en orden: <b>SEDEX → PAC → LATAM</b>. Usa el primer servicio que tenga todas las categorías del producto en 🟢 Verde o 🟡 Amarillo en la <b>Matriz de Servicios</b>.'],
          ['¿Por qué a veces el precio es más alto de lo esperado?','Por el peso volumétrico. Si la caja es grande pero ligera, se cobra por el espacio que ocupa, no por lo que pesa.'],
          ['¿El costo nacional en Venezuela está incluido?','Sí, el precio final incluye el costo de entrega en Venezuela (el mayor entre OP1 y OP2 para ese peso).'],
          ['¿Puedo cambiar un precio?','Sí, desde el admin → Tarifas Express o Tarifas Terrestre. Los cambios se reflejan en la siguiente cotización (el motor recarga cada 30 segundos).'],
          ['¿Cómo agrego una categoría nueva?','Admin → Categorías (vocabulario). Si quieres que la IA la reconozca, edita el Prompt desde admin → Prompt Clasificador. Luego ve a Matriz de Servicios para configurar qué servicios la aceptan y a Mapeo de Categorías si quieres mapear términos específicos.'],

          ['¿Se puede rastrear el envío?','Para internacionales vía UPS, sí. Para domésticos Brasil→Venezuela, se entrega código de seguimiento de la transportista local.'],
        ].map(([q,a]) => `<details class="faq-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
      </div>`;

      const glosarioHtml = `<div class="table-wrap" style="margin:0"><table>
        <thead><tr><th>Término</th><th>Definición</th></tr></thead>
        <tbody>
          ${[
            ['Peso bruto','Lo que marca la báscula. Peso real del paquete.'],
            ['Peso volumétrico','L×A×A÷6000. El peso según el espacio que ocupa.'],
            ['Peso facturable','El mayor entre bruto y volumétrico. Es lo que se cobra.'],
            ['FT³','Pies cúbicos. Medida de volumen para cargos extra.'],
            ['ValorExtra','Cargo por manejo de paquetes voluminosos.'],
            ['Embalaje','Costo del material de empaque (caja, relleno, cinta).'],
            ['Ganancia','Margen de la empresa sobre el envío.'],
            ['BoaVista','Cargo por ruta terrestre vía Boa Vista (frontera).'],
            ['Trecho','Recorrido aéreo desde ciudades fuera de la base logística.'],
            ['Modalidad','Tipo de envío: 1 (Express/SEDEX), 2 (Terrestre/PAC), 3 (Aéreo/LATAM), 4 (Aéreo+Trecho).'],
            ['Tipo mercancía','Personal (uso propio) o Comercial (para reventa).'],
            ['Matriz de Servicios','Tabla categoria_servicios: define qué servicios (SEDEX/PAC/LATAM) aceptan cada categoría.'],
            ['Mapeo de Categorías','Tabla mapeo_categorias: asigna términos de producto exactos a categorías (prioridad máxima).'],
            ['SEDEX','Servicio Express — primera opción del motor.'],
            ['PAC','Servicio Terrestre — segunda opción del motor.'],
            ['LATAM','Servicio Aéreo — tercera y última opción del motor.'],
            ['🟢 Verde','Servicio permitido para esta categoría.'],
            ['🟡 Amarillo','Servicio permitido pero requiere documentación extra.'],
            ['🔴 Rojo','Servicio NO permitido para esta categoría.'],
            ['NEUTRAS','(Antiguo) Categorías sin restricción — reemplazado por Matriz de Servicios.'],
            ['TERRESTRE','(Antiguo) Categorías solo por tierra — reemplazado por Matriz de Servicios.'],
            ['SOLO_AEREO','(Antiguo) Categorías solo por aire — reemplazado por Matriz de Servicios.'],
            ['UPS Cuenta 1 (EW0793)','Para envíos internacionales fuera de Venezuela.'],
            ['UPS Cuenta 2 (B68686)','Para envíos desde Brasil hacia Venezuela.'],
            ['IA / OpenAI','Inteligencia artificial que clasifica productos (GPT-4o mini).'],
          ].map(([t,d]) => `<tr><td><strong>${esc(t)}</strong></td><td>${esc(d)}</td></tr>`).join('')}
        </tbody>
      </table></div>`;

      const html = `${jumpMenu()}${section('como-funciona','🚚','¿Cómo funciona?', comoFunciona)}
${section('modalidades','📦','Modalidades de envío', modalidadesHtml)}
${section('formulas','🧮','Fórmulas de cálculo', formulasHtml)}
${section('ejemplo','📐','Ejemplo paso a paso — Laptop 2kg', ejemploHtml)}
${section('categorias','🏷️','Categorías de productos', categoriasHtml())}
${section('internacional','🌍','Envíos Internacionales', internacionalHtml)}
${section('tarifas','📈','Tablas de tarifas', tarifasHtml)}
${section('matriz','🚦','Matriz de Servicios', matrizHtml)}
${section('referencia','📋','Datos de referencia', referenciaHtml)}
${section('db','🗄️','Base de datos', dbHtml)}
${section('faq','❓','Preguntas Frecuentes', faqHtml)}
${section('glosario','📖','Glosario', glosarioHtml)}`;

      res.send(layout('Wiki', `<style>
        /* ─── WIKI STYLES ─── */

        .jump-menu{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px;padding:12px 16px;background:#fff;border-radius:10px;border:1px solid var(--gray-200);box-shadow:var(--shadow)}
        .jm-link{font-size:.75rem;font-weight:500;color:var(--gray-600);text-decoration:none;padding:4px 10px;border-radius:6px;border:1px solid var(--gray-200);transition:all .15s}
        .jm-link:hover{background:var(--gray-50);border-color:var(--blue);color:var(--blue)}

        .panel-section{margin-bottom:20px}
        .ps-header{display:flex;align-items:center;gap:10px;padding:14px 18px;background:linear-gradient(135deg,var(--gray-50),#fff);border-radius:10px 10px 0 0;border:1px solid var(--gray-200);border-bottom:none}
        .ps-icon{font-size:1.2rem}
        .ps-header h2{font-size:.9rem;font-weight:700;color:var(--gray-700);margin:0}
        .ps-body{padding:18px;background:#fff;border:1px solid var(--gray-200);border-radius:0 0 10px 10px;overflow-x:auto}
        .panel-note{font-size:.78rem;color:var(--gray-500);background:var(--gray-50);padding:10px 14px;border-radius:8px;border-left:3px solid var(--blue);margin-top:12px}

        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:768px){.two-col{grid-template-columns:1fr}}

        .modal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .modal-card{border-radius:10px;border:1px solid var(--gray-200);overflow:hidden;transition:box-shadow .2s,transform .15s}
        .modal-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-2px)}
        .mc-head{padding:12px 16px;font-weight:700;font-size:.88rem;color:#fff;background:var(--mc-accent,#3b82f6)}
        .mc-body{padding:14px 16px}
        .mc-desc{font-size:.78rem;color:var(--gray-500);margin-bottom:10px;line-height:1.5}
        .mc-info{font-size:.75rem;color:var(--gray-500);margin-top:10px;padding-top:10px;border-top:1px solid var(--gray-100)}

        .how-flow{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;overflow-x:auto;padding:4px 0}
        .hf-step{display:flex;align-items:center;gap:6px;background:var(--gray-50);padding:8px 12px;border-radius:8px;border:1px solid var(--gray-200);white-space:nowrap}
        .hf-num{width:22px;height:22px;border-radius:50%;background:var(--blue);color:#fff;font-size:.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .hf-txt{font-size:.76rem;color:var(--gray-700)}
        .hf-arr{color:var(--gray-300);font-weight:700;font-size:1rem;flex-shrink:0}

        .info-table{width:100%;border-collapse:collapse;font-size:.8rem}
        .info-table td{padding:6px 10px;border-bottom:1px solid var(--gray-100);color:var(--gray-600)}
        .info-table td:last-child{text-align:right;font-weight:500;color:var(--gray-800)}
        .info-table code{font-size:.76rem;background:var(--gray-50);padding:2px 6px;border-radius:4px;color:var(--gray-700)}

        .ptable-wrap{overflow-x:auto}
        .ptable{width:100%;border-collapse:collapse;font-size:.78rem;margin-top:8px}
        .ptable th{padding:6px 10px;text-align:left;font-weight:600;font-size:.68rem;text-transform:uppercase;color:var(--gray-400);border-bottom:1px solid var(--gray-200)}
        .ptable td{padding:5px 10px;border-bottom:1px solid var(--gray-100);color:var(--gray-700)}
        .bar-wrap{background:var(--gray-100);border-radius:10px;height:8px;overflow:hidden}
        .bar{height:100%;background:linear-gradient(90deg,var(--mc-accent,#3b82f6),#6366f1);border-radius:10px;transition:width .3s}

        .formula-box{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:12px 14px}
        .formula-box code{font-size:.75rem;color:var(--gray-700);word-break:break-all}

        .example-grid{display:grid;grid-template-columns:1fr 2fr;gap:16px}
        @media(max-width:768px){.example-grid{grid-template-columns:1fr}}
        .eg-steps{display:flex;flex-direction:column;gap:6px}
        .eg-step{display:flex;align-items:flex-start;gap:8px;background:var(--gray-50);border-radius:8px;padding:8px 10px;border:1px solid var(--gray-200);font-size:.76rem}
        .eg-step code{color:var(--gray-700);word-break:break-all}
        .eg-n{width:20px;height:20px;border-radius:50%;background:var(--blue);color:#fff;font-size:.65rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .eg-total{display:flex;gap:12px;margin-top:4px}
        .eg-total-item{flex:1;display:flex;justify-content:space-between;padding:10px 14px;border-radius:8px;font-size:.82rem;font-weight:600}
        .eg-total-item:first-child{background:#e8f0fe;color:var(--blue)}
        .eg-total-item:last-child{background:#f3e8ff;color:#7c3aed}

        .cat-group{margin-bottom:12px}
        .cg-head{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;margin-bottom:6px;font-size:.78rem;font-weight:600;color:var(--cg-clr);background:color-mix(in srgb,var(--cg-clr) 8%,#fff)}
        .cg-count{margin-left:auto;font-size:.7rem;background:var(--cg-clr);color:#fff;padding:1px 8px;border-radius:10px}
        .cg-body{display:flex;flex-wrap:wrap;gap:5px;padding:4px 4px}
        .cat-pill{font-size:.72rem;padding:3px 10px;border-radius:12px;border:1px solid color-mix(in srgb,var(--pill-clr) 30%,transparent);color:var(--pill-clr);background:color-mix(in srgb,var(--pill-clr) 6%,#fff)}
        .cat-tag{display:inline-block;font-size:.72rem;padding:2px 8px;border-radius:8px;font-weight:600;color:var(--tag-clr);background:color-mix(in srgb,var(--tag-clr) 10%,#fff)}

        .faq-list{display:flex;flex-direction:column;gap:6px}
        .faq-item{border:1px solid var(--gray-200);border-radius:8px;overflow:hidden}
        .faq-item summary{padding:10px 14px;font-size:.82rem;font-weight:600;color:var(--gray-700);cursor:pointer;background:var(--gray-50);transition:background .15s;list-style:none;display:flex;align-items:center;gap:8px}
        .faq-item summary::-webkit-details-marker{display:none}
        .faq-item summary::before{content:'❓';font-size:.75rem}
        .faq-item[open] summary::before{content:'💡'}
        .faq-item summary:hover{background:var(--gray-100)}
        .faq-item p{padding:10px 14px;font-size:.78rem;color:var(--gray-600);line-height:1.6;margin:0}
        .hint{color:var(--gray-400);font-size:.76rem;font-style:italic}
      </style>${html}`, t));
    } catch (err) {
      res.status(500).send(layout('Wiki', `<p style="color:var(--red);font-size:.85rem">⚠️ Error al cargar el wiki: ${err.message}</p>`, t));
    }
  });

  /* ─── SIMULADOR ─── */
  router.get('/simulador', auth, async (req, res) => {
    const t = req.adminToken;
    let ciudades = '', categorias = '', categoriasRaw = [];
    try {
      const z = await query("SELECT ciudad FROM zonas WHERE tipo = 'BASE' ORDER BY ciudad");
      ciudades = z.rows.map(r => `<option value="${r.ciudad}">${r.ciudad}</option>`).join('');
      const c = await query("SELECT DISTINCT categoria FROM categoria_servicios ORDER BY categoria");
      categoriasRaw = c.rows.map(r => r.categoria);
      categorias = categoriasRaw.map(r => `<label class="cat-tag"><input type="checkbox" name="cats" value="${r}"> ${r}</label>`).join('');
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
          <div class="sim-section">
            <div class="sim-section-title">📦 Dimensiones y peso</div>
            <div class="sim-grid">
              <label>Peso <small>kg</small><input type="number" step="any" name="peso_bruto" required value="5"></label>
              <label>Largo <small>cm</small><input type="number" step="any" name="largo" required value="30"></label>
              <label>Ancho <small>cm</small><input type="number" step="any" name="ancho" required value="20"></label>
              <label>Alto <small>cm</small><input type="number" step="any" name="alto" required value="15"></label>
            </div>
          </div>
          <div class="sim-section">
            <div class="sim-section-title">📋 Datos del envío</div>
            <div class="sim-grid">
              <label>Valor <small>R$</small><input type="number" step="any" name="valor_mercancia" required value="500"></label>
              <label>Tipo<select name="tipo_mercancia"><option value="personal">Personal</option><option value="comercial">Comercial</option></select></label>
              <label class="full">Origen<select name="ciudad_origen">${ciudades}</select></label>
            </div>
          </div>
          <div class="sim-cats">
            <div class="cats-header" onclick="var b=this.nextElementSibling;b.classList.toggle('open');this.classList.toggle('open')">
              <span class="cats-title">Categorías</span>
              <span class="cats-count">${categoriasRaw.length}</span>
              <span class="cats-arrow">▾</span>
            </div>
            <div class="cats-body">
              <div class="cat-search-wrap"><input type="text" class="cat-search" placeholder="Buscar categoría..." oninput="filterCats(this)"></div>
              <div class="cats-grid" id="cats-grid">${categorias || '<span class="hint">Sin categorías disponibles</span>'}</div>
            </div>
          </div>
          <button type="submit" class="sim-btn">🧮 Calcular cotización</button>
        </form>
      </div>
      ${resultHtml ? `<div class="sim-result">${resultHtml}</div>` : ''}
    </div>`;

    const escSim = (s) => String(s == null ? '' : s).replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const catsJson = escSim(JSON.stringify(categoriasRaw));
    res.send(layout('Simulador', `<style>
.sim-layout{display:flex;gap:20px;align-items:flex-start}
.sim-form{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--gray-200);padding:24px;flex:1;min-width:0}
.sim-title{font-size:1rem;font-weight:700;color:var(--gray-800);margin-bottom:16px}
.sim-section{margin-bottom:16px}
.sim-section-title{font-size:.78rem;font-weight:600;color:var(--gray-500);margin-bottom:8px;letter-spacing:.02em}
.sim-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.sim-grid label{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:600;color:var(--gray-500)}
.sim-grid label.full{grid-column:1/-1}
.sim-grid small{color:var(--gray-400);font-weight:400}
.sim-grid input,.sim-grid select{padding:8px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:.85rem;font-family:inherit;transition:all .2s;background:#fff}
.sim-grid input:focus,.sim-grid select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.sim-cats{border:1px solid var(--gray-200);border-radius:8px;overflow:hidden;margin-bottom:16px}
.cats-header{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--gray-50);cursor:pointer;user-select:none;transition:background .15s}
.cats-header:hover{background:var(--gray-100)}
.cats-header .cats-title{font-size:.8rem;font-weight:600;color:var(--gray-700);flex:1}
.cats-count{font-size:.72rem;font-weight:600;color:var(--gray-500);background:var(--gray-200);padding:1px 8px;border-radius:10px}
.cats-arrow{font-size:.7rem;color:var(--gray-400);transition:transform .2s}
.cats-header.open .cats-arrow{transform:rotate(180deg)}
.cats-body{padding:12px;display:none}
.cats-body.open{display:block}
.cat-search-wrap{margin-bottom:8px}
.cat-search{width:100%;padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:.8rem;font-family:inherit;transition:border-color .2s;background:#fff}
.cat-search:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.cats-grid{display:flex;flex-wrap:wrap;gap:6px}
.cat-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem;color:var(--gray-600);cursor:pointer;transition:all .15s}
.cat-tag:hover{border-color:var(--blue);background:#f0f4ff}
.cat-tag input{accent-color:var(--blue)}
.sim-btn{width:100%;padding:10px;background:linear-gradient(135deg,var(--blue),#6366f1);border:none;border-radius:8px;color:#fff;font-size:.85rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.sim-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(59,130,246,.3)}
.sim-result{width:380px;flex-shrink:0}
.result-card{background:#fff;border-radius:var(--radius);box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid var(--gray-200);overflow:hidden;animation:fadeSlide .3s ease}
@keyframes fadeSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
.result-header{padding:14px 18px;background:linear-gradient(135deg,var(--gray-50),#fff);border-bottom:1px solid var(--gray-200)}
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
</style>${form}<script>
var catsData=${catsJson};
var filterTimer;
function filterCats(el){
  clearTimeout(filterTimer);
  filterTimer=setTimeout(function(){
    var q=el.value.toLowerCase();
    var grid=document.getElementById('cats-grid');
    var checked={};grid.querySelectorAll('input:checked').forEach(function(cb){checked[cb.value]=true});
    if(!q)grid.innerHTML=catsData.map(function(c){return '<label class="cat-tag"><input type="checkbox" name="cats" value="'+c+'"> '+c+'</label>'}).join('');
    else{
      var f=catsData.filter(function(c){return c.toLowerCase().includes(q)});
      grid.innerHTML=f.length?f.map(function(c){return '<label class="cat-tag"><input type="checkbox" name="cats" value="'+c+'"> '+c+'</label>'}).join(''):'<span class="hint" style="padding:4px 0">Sin resultados</span>';
    }
    grid.querySelectorAll('input').forEach(function(cb){if(checked[cb.value])cb.checked=true});
  },400);
}
</script>`, t));
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

  /* ─── LOGS ─── */
  router.get('/logs', auth, async (req, res) => {
    const t = req.adminToken;
    const nivel = req.query.nivel || '';
    const search = req.query.search || '';
    try {
      let conditions = [];
      let params = [];
      if (nivel) {
        params.push(nivel);
        conditions.push(`nivel = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(mensaje ILIKE $${params.length} OR COALESCE(contacto,'') ILIKE $${params.length})`);
      }
      const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      const result = await query(`SELECT id, nivel, mensaje, contexto, contacto, created_at FROM logs ${where} ORDER BY created_at DESC LIMIT 100`, params);
      const rows = result.rows;

      const badgeClass = (n) => n === 'ERROR' ? 'badge-er' : n === 'WARN' ? 'badge-wa' : 'badge-in';
      const esc = (s) => (s == null ? '' : String(s)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const rowsHtml = rows.map(r => {
        const ctxStr = r.contexto ? JSON.stringify(r.contexto, null, 2) : '';
        const msgPreview = r.mensaje.length > 80 ? esc(r.mensaje.substring(0, 80)) + '…' : esc(r.mensaje);
        return `<tr class="log-row" onclick="openLog(${r.id})">
          <td><span class="log-badge ${badgeClass(r.nivel)}">${r.nivel}</span></td>
          <td class="msg-cell" title="${esc(r.mensaje)}">${msgPreview}</td>
          <td>${r.contacto ? esc(r.contacto) : '<span class="hint">—</span>'}</td>
          <td class="ctx-cell">${ctxStr ? '<code>'+esc(ctxStr.substring(0,60))+'…</code>' : '<span class="hint">—</span>'}</td>
          <td class="date-cell">${new Date(r.created_at).toLocaleString('es-VE')}</td>
        </tr>`;
      }).join('');

      const logsJson = esc(JSON.stringify(rows.map(r => ({
        id: r.id, nivel: r.nivel, mensaje: r.mensaje,
        contexto: r.contexto, contacto: r.contacto,
        fecha: new Date(r.created_at).toLocaleString('es-VE')
      }))));

      const body = `<div class="table-wrap">
        <div class="table-toolbar">
          <span style="font-weight:600;font-size:.85rem">📋 Logs (últimos 100)</span>
          <div style="display:flex;gap:8px">
            <select onchange="location='?nivel='+this.value+(document.querySelector('#ls')?.value?'&search='+encodeURIComponent(document.querySelector('#ls').value):'')" style="padding:5px 10px;border:1px solid var(--gray-300);border-radius:6px;font-size:.78rem;font-family:inherit">
              <option value="">Todos</option>
              <option value="ERROR" ${nivel === 'ERROR' ? 'selected' : ''}>ERROR</option>
              <option value="WARN" ${nivel === 'WARN' ? 'selected' : ''}>WARN</option>
              <option value="INFO" ${nivel === 'INFO' ? 'selected' : ''}>INFO</option>
            </select>
            <div class="search-wrap"><span class="icon">🔍</span><input type="text" id="ls" placeholder="Buscar..." value="${search.replace(/"/g,'&quot;')}" onchange="location='?search='+encodeURIComponent(this.value)+(document.querySelector('select')?.value?'&nivel='+document.querySelector('select').value:'')"></div>
          </div>
        </div>
        <table>
          <thead><tr><th style="width:64px">Nivel</th><th>Mensaje</th><th style="width:110px">Contacto</th><th style="width:120px">Contexto</th><th style="width:130px">Fecha</th></tr></thead>
          <tbody>${rows.length > 0 ? rowsHtml : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400)">No hay logs</td></tr>'}</tbody>
        </table>
      </div>`;

      res.send(layout('Logs', `<style>
.log-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.68rem;font-weight:600}
.badge-er{background:#fef2f2;color:var(--red)}
.badge-wa{background:#fef3c7;color:#d97706}
.badge-in{background:#e8f0fe;color:var(--blue)}
.log-row{cursor:pointer;transition:background .15s}
.log-row:hover td{background:#f5f7ff!important}
.msg-cell{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.8rem}
.ctx-cell{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ctx-cell code{font-size:.68rem;color:var(--gray-500);background:var(--gray-50);padding:2px 5px;border-radius:4px}
.date-cell{white-space:nowrap;font-size:.72rem;color:var(--gray-400)}
.hint{color:var(--gray-400);font-size:.75rem}

/* ─── MODAL ─── */
.log-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s;padding:20px}
.log-modal{background:#fff;border-radius:14px;width:100%;max-width:680px;max-height:85vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.2);animation:scaleIn .2s}
.log-modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--gray-200);position:sticky;top:0;background:#fff;z-index:1;border-radius:14px 14px 0 0}
.log-modal-header h3{font-size:.95rem;font-weight:700}
.log-modal-close{background:var(--gray-100);border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;color:var(--gray-500);transition:all .15s}
.log-modal-close:hover{background:var(--gray-200);color:var(--gray-700)}
.log-modal-body{padding:20px 22px}
.log-field{margin-bottom:16px}
.log-field:last-child{margin-bottom:0}
.log-field-label{font-size:.68rem;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.log-field-value{font-size:.85rem;color:var(--gray-800);line-height:1.6;word-break:break-word;white-space:pre-wrap}
.log-field-pre{font-size:.8rem;color:var(--gray-700);background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:12px 14px;overflow-x:auto;line-height:1.5;font-family:ui-monospace,monospace;max-height:260px;overflow-y:auto;white-space:pre;margin:0}
.log-field-small{font-size:.78rem;color:var(--gray-500);font-family:monospace}
</style>
<script>
const logsData = ${logsJson};
function openLog(id){const r=logsData.find(l=>l.id===id);if(!r)return;const d=document.createElement('div');d.className='log-modal-overlay';d.onclick=function(e){if(e.target===this)this.remove()};
const ctx=r.contexto?JSON.stringify(r.contexto,null,2):'';const badge=r.nivel==='ERROR'?'badge-er':r.nivel==='WARN'?'badge-wa':'badge-in';
d.innerHTML='<div class="log-modal">'+
'<div class="log-modal-header"><h3><span class="log-badge '+badge+'">'+r.nivel+'</span> Log #'+id+'</h3><button class="log-modal-close" onclick="this.closest(\\'.log-modal-overlay\\').remove()">✕</button></div>'+
'<div class="log-modal-body">'+
'<div class="log-field"><div class="log-field-label">Mensaje</div><div class="log-field-value">'+r.mensaje.replace(/</g,'&lt;')+'</div></div>'+
(ctx?'<div class="log-field"><div class="log-field-label">Contexto</div><pre class="log-field-pre">'+ctx.replace(/</g,'&lt;')+'</pre></div>':'')+
(r.contacto?'<div class="log-field"><div class="log-field-label">Contacto</div><div class="log-field-value">'+r.contacto.replace(/</g,'&lt;')+'</div></div>':'')+
'<div class="log-field"><div class="log-field-label">Fecha</div><div class="log-field-small">'+r.fecha+'</div></div>'+
'</div></div>';document.body.appendChild(d)}
</script>
${body}`, t));
    } catch (err) {
      res.status(500).send(layout('Logs', `<p style="color:var(--red)">Error: ${err.message}</p>`, t));
    }
  });

  /* ─── PROMPT CLASIFICADOR ─── */
  router.get('/prompt-categorias', auth, async (req, res) => {
    try {
      const result = await query("SELECT valor FROM prompts_config WHERE clave = 'clasificador_categorias'");
      const prompt = result.rows.length > 0 ? result.rows[0].valor : '';
      const t = req.adminToken;
      const toast = req.query.saved
        ? '<div class="toast toast-success">✅ Prompt guardado correctamente</div>'
        : req.query.error
          ? '<div class="toast toast-error">❌ Error al guardar el prompt</div>' : '';

      const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const body = `${toast}<div class="table-wrap">
        <div class="table-toolbar"><span style="font-weight:600;font-size:.85rem">🤖 Prompt del Clasificador IA</span></div>
        <form method="POST" action="/admin/prompt-categorias" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false" style="padding:16px">
          <div style="margin-bottom:12px">
            <label style="display:block;font-size:.78rem;font-weight:600;color:var(--gray-500);margin-bottom:6px">System prompt usado por GPT-4o mini para clasificar categorías:</label>
            <textarea name="prompt" style="width:100%;min-height:420px;padding:12px;border:1px solid var(--gray-300);border-radius:8px;font-family:ui-monospace,monospace;font-size:.78rem;line-height:1.6;resize:vertical;tab-size:2">${esc(prompt)}</textarea>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn-add" type="submit">💾 Guardar prompt</button>
            <span style="font-size:.72rem;color:var(--gray-400)">🔁 Se aplica inmediatamente a las próximas clasificaciones</span>
          </div>
        </form>
      </div>`;

      res.send(layout('Prompt Clasificador', body, t));
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/prompt-categorias', auth, async (req, res) => {
    try {
      const prompt = req.body.prompt || '';
      if (!prompt.trim()) {
        await query("DELETE FROM prompts_config WHERE clave = 'clasificador_categorias'");
      } else {
        await query("INSERT INTO prompts_config (clave, valor) VALUES ('clasificador_categorias', $1) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor", [prompt]);
      }
      invalidarPromptCache();
      res.redirect('/admin/prompt-categorias?saved=1');
    } catch (err) {
      res.redirect('/admin/prompt-categorias?error=1');
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

  const DESCRIPCIONES_FORMULAS = {
    divisor_volumetrico:  'Divide (largo × ancho × alto) para obtener el peso volumétrico en kg',
    factor_ft3:           'Convierte cm³ → ft³ para calcular cargos por volumen',
    flete_aereo_por_kg:   'Costo del flete aéreo por cada kg facturable',
    factor_seguro:        'Porcentaje del valor de la mercancía destinado al seguro (0.7%)',
    factor_empresa_manaus:'Cargo de gestión en Manaos, aplicado sobre el valor de la mercancía',
    factor_ganancia:      'Multiplicador de ganancia: (peso_bruto × tarifa_usd_kg) × este factor',
    nacional_peso_min:    'Peso mínimo (kg) para el cálculo del costo nacional',
    nacional_peso_max:    'Peso máximo (kg) para el cálculo del costo nacional',
    tasa_dolar:           'Tasa de cambio utilizada para convertir BRL → USD'
  };

  /* ─── FÓRMULAS (página personalizada con descripciones) ─── */
  function renderFormulasPage(rows, toast, t) {
    const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let html = toast + '<div class="table-wrap">';
    html += '<div class="table-toolbar"><span style="font-weight:600;font-size:.85rem">🧮 Fórmulas</span></div>';
    html += '<table><thead><tr><th>clave</th><th>valor</th><th>Descripción</th><th style="width:120px">Acciones</th></tr></thead><tbody>';

    for (const row of rows) {
      const desc = DESCRIPCIONES_FORMULAS[row.clave] || '';
      html += `<tr>
        <td><span style="font-weight:600;color:var(--gray-500)">${esc(row.clave)}</span></td>
        <td>
          <form class="inline" method="POST" action="/admin/formulas/${esc(row.clave)}/update" data-clave="${esc(row.clave)}" onsubmit="event.preventDefault();confirmFormulaUpdate(this)">
            <input type="number" step="any" name="valor" value="${esc(row.valor)}">
        </td>
        <td style="font-size:.78rem;color:var(--gray-500);max-width:360px">${desc ? esc(desc) : '<span style="color:var(--gray-400);font-style:italic">Sin descripción</span>'}</td>
        <td>
          <button class="btn-sm btn-save" type="submit">💾</button>
          </form>
          <form class="inline" method="POST" action="/admin/formulas/${esc(row.clave)}/delete" onsubmit="event.preventDefault();confirmDelete('¿Eliminar fórmula ${esc(row.clave)}?',this)">
            <button class="btn-sm btn-del" type="submit">🗑️</button>
          </form>
        </td>
      </tr>`;
    }

    html += '</tbody></table></div>';

    html += `<div style="margin-top:16px;padding:14px 18px;background:#f0f4ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.8rem;color:var(--gray-700);line-height:1.6">
      💡 <strong>Importante:</strong> Modificar el <strong>valor</strong> de una fórmula existente se refleja automáticamente en las cotizaciones.
      Agregar una nueva clave no tendrá efecto hasta que se agregue el código correspondiente en el motor — contacta a soporte para ello.
    </div>`;

    html += '<div class="add-form"><h3>➕ Agregar nueva fórmula</h3>';
    html += '<form class="fields" method="POST" action="/admin/formulas/add" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">';
    html += '<label>clave <input type="text" name="clave" required placeholder="ej: impuesto_extra"></label>';
    html += '<label>valor <input type="number" step="any" name="valor" required placeholder="0.00"></label>';
    html += '<button class="btn-add" type="submit">➕ Agregar</button>';
    html += '</form></div>';

    html += `<script>
function confirmFormulaUpdate(form){
  var input=form.querySelector('input[name="valor"]');
  var oldVal=input.defaultValue;
  var newVal=input.value;
  if(oldVal===newVal)return;
  var clave=form.getAttribute('data-clave')||'';
  var d=document.createElement('div');d.className='modal-overlay';
  d.innerHTML='<div class="modal"><h3>⚠\uFE0F Confirmar cambio</h3><p style="margin-bottom:12px">¿Est\u00E1s seguro de modificar <strong>'+clave+'</strong>?</p><div style="background:var(--gray-50);padding:12px 14px;border-radius:8px;margin-bottom:14px;font-size:.85rem"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--gray-500)">Valor actual:</span><span style="font-weight:600">'+oldVal+'</span></div><div style="display:flex;justify-content:space-between"><span style="color:var(--gray-500)">Nuevo valor:</span><span style="font-weight:600;color:var(--blue)">'+newVal+'</span></div></div><p style="font-size:.78rem;color:var(--gray-500);margin-bottom:16px">\uD83D\uDCA1 Las cotizaciones se actualizar\u00E1n con este cambio en tiempo real.</p><div class="actions"><button class="btn-cancel">Cancelar</button><button class="btn-confirm" style="background:var(--blue)">Confirmar</button></div></div>';
  d.querySelector('.btn-cancel').onclick=()=>d.remove();
  d.querySelector('.btn-confirm').onclick=()=>{d.remove();fetch(form.action,{method:form.method,body:new URLSearchParams(new FormData(form))}).then(()=>window.location.reload()).catch(()=>window.location.reload())};
  document.body.appendChild(d);
}
</script>`;

    return layout('Fórmulas', html, t);
  }

  router.get('/formulas', auth, async (req, res) => {
    try {
      const result = await query('SELECT * FROM formulas ORDER BY clave');
      const toast = req.query.saved
        ? '<div class="toast toast-success">✅ Cambios guardados</div>'
        : req.query.deleted
          ? '<div class="toast toast-error">🗑️ Fórmula eliminada</div>' : '';
      res.send(renderFormulasPage(result.rows, toast, req.adminToken));
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/formulas/add', auth, async (req, res) => {
    try {
      await query('INSERT INTO formulas (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO NOTHING', [req.body.clave, Number(req.body.valor)]);
      invalidateCache();
      res.redirect('/admin/formulas?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/formulas/:pk/update', auth, async (req, res) => {
    try {
      await query('UPDATE formulas SET valor = $1 WHERE clave = $2', [Number(req.body.valor), req.params.pk]);
      invalidateCache();
      res.redirect('/admin/formulas?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/formulas/:pk/delete', auth, async (req, res) => {
    try {
      await query('DELETE FROM formulas WHERE clave = $1', [req.params.pk]);
      invalidateCache();
      res.redirect('/admin/formulas?deleted=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  /* ─── TRAMOS BOA VISTA ─── */
  function renderBoaVistaPage(rows, toast, t) {
    const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const desc = (r) => r.hasta_cm != null
      ? 'Suma (largo+ancho+alto) ≤ ' + r.hasta_cm + ' cm'
      : 'Cualquier suma mayor al último tramo';
    let html = toast + '<div class="table-wrap">';
    html += '<div class="table-toolbar"><span style="font-weight:600;font-size:.85rem">📏 Tramos Boa Vista</span></div>';
    html += '<table><thead><tr><th>hasta_cm</th><th>precio_bs</th><th>Descripción</th><th style="width:120px">Acciones</th></tr></thead><tbody>';
    for (const row of rows) {
      html += `<tr>
        <td>${row.hasta_cm != null ? esc(String(row.hasta_cm)) : '<span style="color:var(--gray-400)">∞</span>'}</td>
        <td>
          <form class="inline" method="POST" action="/admin/tramos_boa_vista/${row.id}/update" data-id="${row.id}" onsubmit="event.preventDefault();confirmBoaVista(this)">
            <input type="number" step="any" name="hasta_cm" value="${row.hasta_cm != null ? esc(String(row.hasta_cm)) : ''}" placeholder="sin límite">
            <input type="number" step="any" name="precio_bs" value="${esc(String(row.precio_bs))}">
        </td>
        <td style="font-size:.78rem;color:var(--gray-500);max-width:300px">${esc(desc(row))}</td>
        <td>
          <button class="btn-sm btn-save" type="submit">💾</button>
          </form>
          <form class="inline" method="POST" action="/admin/tramos_boa_vista/${row.id}/delete" onsubmit="event.preventDefault();confirmDelete('¿Eliminar tramo ID ${row.id}?',this)">
            <button class="btn-sm btn-del" type="submit">🗑️</button>
          </form>
        </td>
      </tr>`;
    }
    html += '</tbody></table></div>';
    html += '<div style="margin-top:16px;padding:14px 18px;background:#f0f4ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.8rem;color:var(--gray-700);line-height:1.6">📏 <strong>Tramos Boa Vista</strong> — Define el costo del flete terrestre Boa Vista → frontera, según la <strong>suma de dimensiones</strong> (largo+ancho+alto) de la caja. Se aplica a TODAS las modalidades (Express, Terrestre y Aéreo). Modificar estos valores afecta las cotizaciones en tiempo real.</div>';
    html += '<div class="add-form"><h3>➕ Agregar tramo</h3>';
    html += '<form class="fields" method="POST" action="/admin/tramos_boa_vista/add" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">';
    html += '<label>hasta_cm <input type="number" step="any" name="hasta_cm" placeholder="sin límite (dejar vacío)"></label>';
    html += '<label>precio_bs <input type="number" step="any" name="precio_bs" required placeholder="0"></label>';
    html += '<button class="btn-add" type="submit">➕ Agregar</button></form></div>';
    html += `<script>
function confirmBoaVista(form){
  var hasta=form.querySelector('input[name="hasta_cm"]');
  var precio=form.querySelector('input[name="precio_bs"]');
  var oldHasta=hasta.defaultValue||'\\u221E';
  var newHasta=hasta.value||'\\u221E';
  var oldPrecio=precio.defaultValue;
  var newPrecio=precio.value;
  if(oldHasta===newHasta&&oldPrecio===newPrecio)return;
  var d=document.createElement('div');d.className='modal-overlay';
  d.innerHTML='<div class="modal"><h3>\\u26A0\\uFE0F Confirmar cambio</h3><p style="margin-bottom:12px">\\u00BFEst\\u00E1s seguro de modificar el tramo ID '+form.getAttribute('data-id')+'?</p><div style="background:var(--gray-50);padding:12px 14px;border-radius:8px;margin-bottom:14px;font-size:.85rem"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--gray-500)">hasta_cm:</span><span style="font-weight:600">'+oldHasta+' \\u2192 <span style="color:var(--blue)">'+newHasta+'</span></span></div><div style="display:flex;justify-content:space-between"><span style="color:var(--gray-500)">precio_bs:</span><span style="font-weight:600">'+oldPrecio+' \\u2192 <span style="color:var(--blue)">'+newPrecio+'</span></span></div></div><p style="font-size:.78rem;color:var(--gray-500);margin-bottom:16px">\\uD83D\\uDCA1 Las cotizaciones se actualizar\\u00E1n con este cambio en tiempo real.</p><div class="actions"><button class="btn-cancel">Cancelar</button><button class="btn-confirm" style="background:var(--blue)">Confirmar</button></div></div>';
  d.querySelector('.btn-cancel').onclick=()=>d.remove();
  d.querySelector('.btn-confirm').onclick=()=>{d.remove();fetch(form.action,{method:form.method,body:new URLSearchParams(new FormData(form))}).then(()=>window.location.reload()).catch(()=>window.location.reload())};
  document.body.appendChild(d);}
</script>`;
    return layout('Tramos Boa Vista', html, t);
  }

  router.get('/tramos_boa_vista', auth, async (req, res) => {
    try {
      const result = await query('SELECT * FROM tramos_boa_vista ORDER BY id');
      const toast = req.query.saved ? '<div class="toast toast-success">✅ Cambios guardados</div>' : req.query.deleted ? '<div class="toast toast-error">🗑️ Tramo eliminado</div>' : '';
      res.send(renderBoaVistaPage(result.rows, toast, req.adminToken));
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/tramos_boa_vista/add', auth, async (req, res) => {
    try {
      const hastaCm = req.body.hasta_cm === '' || req.body.hasta_cm == null ? null : Number(req.body.hasta_cm);
      await query('INSERT INTO tramos_boa_vista (hasta_cm, precio_bs) VALUES ($1, $2) ON CONFLICT DO NOTHING', [hastaCm, Number(req.body.precio_bs)]);
      invalidateCache();
      res.redirect('/admin/tramos_boa_vista?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/tramos_boa_vista/:pk/update', auth, async (req, res) => {
    try {
      const hastaCm = req.body.hasta_cm === '' || req.body.hasta_cm == null ? null : Number(req.body.hasta_cm);
      await query('UPDATE tramos_boa_vista SET hasta_cm = $1, precio_bs = $2 WHERE id = $3', [hastaCm, Number(req.body.precio_bs), Number(req.params.pk)]);
      invalidateCache();
      res.redirect('/admin/tramos_boa_vista?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/tramos_boa_vista/:pk/delete', auth, async (req, res) => {
    try {
      await query('DELETE FROM tramos_boa_vista WHERE id = $1', [Number(req.params.pk)]);
      invalidateCache();
      res.redirect('/admin/tramos_boa_vista?deleted=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  /* ─── TRAMOS GANANCIA ─── */
  function renderGananciaPage(rows, toast, t) {
    const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const desc = (r) => r.hasta_kg != null
      ? 'Peso bruto ≤ ' + r.hasta_kg + ' kg → $' + r.usd_kg + ' USD/kg'
      : 'Peso bruto mayor → $' + r.usd_kg + ' USD/kg';
    let html = toast + '<div class="table-wrap">';
    html += '<div class="table-toolbar"><span style="font-weight:600;font-size:.85rem">📊 Tramos Ganancia</span></div>';
    html += '<table><thead><tr><th>hasta_kg</th><th>usd_kg</th><th>Descripción</th><th style="width:120px">Acciones</th></tr></thead><tbody>';
    for (const row of rows) {
      html += `<tr>
        <td>${row.hasta_kg != null ? esc(String(row.hasta_kg)) : '<span style="color:var(--gray-400)">∞</span>'}</td>
        <td>
          <form class="inline" method="POST" action="/admin/tramos_ganancia/${row.id}/update" data-id="${row.id}" onsubmit="event.preventDefault();confirmGanancia(this)">
            <input type="number" step="any" name="hasta_kg" value="${row.hasta_kg != null ? esc(String(row.hasta_kg)) : ''}" placeholder="sin límite">
            <input type="number" step="any" name="usd_kg" value="${esc(String(row.usd_kg))}">
        </td>
        <td style="font-size:.78rem;color:var(--gray-500);max-width:300px">${esc(desc(row))}</td>
        <td>
          <button class="btn-sm btn-save" type="submit">💾</button>
          </form>
          <form class="inline" method="POST" action="/admin/tramos_ganancia/${row.id}/delete" onsubmit="event.preventDefault();confirmDelete('¿Eliminar tramo ID ${row.id}?',this)">
            <button class="btn-sm btn-del" type="submit">🗑️</button>
          </form>
        </td>
      </tr>`;
    }
    html += '</tbody></table></div>';
    html += '<div style="margin-top:16px;padding:14px 18px;background:#f0f4ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.8rem;color:var(--gray-700);line-height:1.6">📊 <strong>Tramos Ganancia</strong> — Define la tarifa en <strong>USD por kg</strong> para calcular la ganancia. A mayor peso, menor USD/kg. Se aplica a TODAS las modalidades (Express, Terrestre y Aéreo). Modificar estos valores afecta las cotizaciones en tiempo real.</div>';
    html += '<div class="add-form"><h3>➕ Agregar tramo</h3>';
    html += '<form class="fields" method="POST" action="/admin/tramos_ganancia/add" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">';
    html += '<label>hasta_kg <input type="number" step="any" name="hasta_kg" placeholder="sin límite (dejar vacío)"></label>';
    html += '<label>usd_kg <input type="number" step="any" name="usd_kg" required placeholder="0"></label>';
    html += '<button class="btn-add" type="submit">➕ Agregar</button></form></div>';
    html += `<script>
function confirmGanancia(form){
  var hasta=form.querySelector('input[name="hasta_kg"]');
  var usd=form.querySelector('input[name="usd_kg"]');
  var oldHasta=hasta.defaultValue||'\\u221E';
  var newHasta=hasta.value||'\\u221E';
  var oldUsd=usd.defaultValue;
  var newUsd=usd.value;
  if(oldHasta===newHasta&&oldUsd===newUsd)return;
  var d=document.createElement('div');d.className='modal-overlay';
  d.innerHTML='<div class="modal"><h3>\\u26A0\\uFE0F Confirmar cambio</h3><p style="margin-bottom:12px">\\u00BFEst\\u00E1s seguro de modificar el tramo ID '+form.getAttribute('data-id')+'?</p><div style="background:var(--gray-50);padding:12px 14px;border-radius:8px;margin-bottom:14px;font-size:.85rem"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--gray-500)">hasta_kg:</span><span style="font-weight:600">'+oldHasta+' \\u2192 <span style="color:var(--blue)">'+newHasta+'</span></span></div><div style="display:flex;justify-content:space-between"><span style="color:var(--gray-500)">usd_kg:</span><span style="font-weight:600">'+oldUsd+' \\u2192 <span style="color:var(--blue)">'+newUsd+'</span></span></div></div><p style="font-size:.78rem;color:var(--gray-500);margin-bottom:16px">\\uD83D\\uDCA1 Las cotizaciones se actualizar\\u00E1n con este cambio en tiempo real.</p><div class="actions"><button class="btn-cancel">Cancelar</button><button class="btn-confirm" style="background:var(--blue)">Confirmar</button></div></div>';
  d.querySelector('.btn-cancel').onclick=()=>d.remove();
  d.querySelector('.btn-confirm').onclick=()=>{d.remove();fetch(form.action,{method:form.method,body:new URLSearchParams(new FormData(form))}).then(()=>window.location.reload()).catch(()=>window.location.reload())};
  document.body.appendChild(d);}
</script>`;
    return layout('Tramos Ganancia', html, t);
  }

  router.get('/tramos_ganancia', auth, async (req, res) => {
    try {
      const result = await query('SELECT * FROM tramos_ganancia ORDER BY id');
      const toast = req.query.saved ? '<div class="toast toast-success">✅ Cambios guardados</div>' : req.query.deleted ? '<div class="toast toast-error">🗑️ Tramo eliminado</div>' : '';
      res.send(renderGananciaPage(result.rows, toast, req.adminToken));
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/tramos_ganancia/add', auth, async (req, res) => {
    try {
      const hastaKg = req.body.hasta_kg === '' || req.body.hasta_kg == null ? null : Number(req.body.hasta_kg);
      await query('INSERT INTO tramos_ganancia (hasta_kg, usd_kg) VALUES ($1, $2) ON CONFLICT DO NOTHING', [hastaKg, Number(req.body.usd_kg)]);
      invalidateCache();
      res.redirect('/admin/tramos_ganancia?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/tramos_ganancia/:pk/update', auth, async (req, res) => {
    try {
      const hastaKg = req.body.hasta_kg === '' || req.body.hasta_kg == null ? null : Number(req.body.hasta_kg);
      await query('UPDATE tramos_ganancia SET hasta_kg = $1, usd_kg = $2 WHERE id = $3', [hastaKg, Number(req.body.usd_kg), Number(req.params.pk)]);
      invalidateCache();
      res.redirect('/admin/tramos_ganancia?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/tramos_ganancia/:pk/delete', auth, async (req, res) => {
    try {
      await query('DELETE FROM tramos_ganancia WHERE id = $1', [Number(req.params.pk)]);
      invalidateCache();
      res.redirect('/admin/tramos_ganancia?deleted=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  /* ─── MODALIDADES ─── */
  const DESC_MODALIDADES = {
    peso_max_kg: 'Peso máximo permitido (kg)',
    dimension_max_cm: 'Dimensión máxima por lado (cm)',
    valor_max_rs: 'Valor máximo de la mercancía (R$)',
    tiempo_entrega_dias: 'Tiempo estimado de entrega (días)',
    valor_fijo_rs: 'Cargo fijo adicional que se suma al total (R$)',
    cargo_yhonatan_rs: 'Cargo de gestión operativa en origen (R$)',
    cargo_pickup_rs: 'Cargo por recogida en domicilio (R$)',
    cargo_manaus_bv_rs: 'Cargo flete Manaos → Boa Vista (R$)',
    id: 'Identificador interno de la fila',
    nombre: 'Nombre mostrado de la modalidad'
  };

  function renderModalidadesPage(rows, toast, t) {
    const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const grupos = {};
    for (const row of rows) {
      if (!grupos[row.modalidad]) grupos[row.modalidad] = [];
      grupos[row.modalidad].push(row);
    }

    let html = toast;
    const orden = ['EXPRESS', 'TERRESTRE', 'AEREO', 'AEREO_TRECHO'];

    for (const mod of orden) {
      const items = grupos[mod] || [];
      if (items.length === 0) continue;
      const nombreRow = items.find(r => r.clave === 'nombre');
      const nombre = nombreRow ? nombreRow.valor : mod;

      html += '<div class="table-wrap" style="margin-bottom:14px">';
      html += '<div class="table-toolbar"><span style="font-weight:600;font-size:.85rem">' + esc(nombre) + ' (' + mod + ')</span></div>';
      html += '<table><thead><tr><th>clave</th><th>valor</th><th>Descripción</th><th style="width:100px">Acciones</th></tr></thead><tbody>';

      for (const row of items) {
        const editable = row.clave !== 'id';
        const desc = DESC_MODALIDADES[row.clave] || '';

        html += '<tr>';
        html += '<td><span style="font-weight:600;color:var(--gray-500)">' + esc(row.clave) + '</span></td>';

        if (editable) {
          html += '<td><form class="inline" method="POST" action="/admin/modalidades/' + row.id + '/update" data-clave="' + esc(row.clave) + '" onsubmit="event.preventDefault();confirmModalidad(this)"><input type="text" name="valor" value="' + esc(String(row.valor)) + '"></td>';
          html += '<td style="font-size:.78rem;color:var(--gray-500);max-width:320px">' + (desc ? esc(desc) : '<span style="color:var(--gray-400);font-style:italic">Sin descripción</span>') + '</td>';
          html += '<td><button class="btn-sm btn-save" type="submit">💾</button></form>';
          html += '<form class="inline" method="POST" action="/admin/modalidades/' + row.id + '/delete" onsubmit="event.preventDefault();confirmDelete(\'¿Eliminar ' + esc(row.clave) + ' de ' + mod + '?\',this)"><button class="btn-sm btn-del" type="submit">🗑️</button></form></td>';
        } else {
          html += '<td><span>' + esc(String(row.valor)) + '</span></td>';
          html += '<td style="font-size:.78rem;color:var(--gray-500);max-width:320px">' + (desc ? esc(desc) : '') + '</td>';
          html += '<td><span style="color:var(--gray-400);font-size:.72rem">protegido</span></td>';
        }

        html += '</tr>';
      }

      html += '</tbody></table></div>';
    }

    html += '<div style="margin-top:16px;padding:14px 18px;background:#f0f4ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.8rem;color:var(--gray-700);line-height:1.6">';
    html += '📋 El motor elige automáticamente la modalidad en este orden:<br>';
    html += '1. <strong>Express</strong> — si cumple límites y la categoría es neutra<br>';
    html += '2. <strong>Terrestre</strong> — si cumple límites y la categoría es terrestre<br>';
    html += '3. <strong>Aéreo</strong> — sin límites de peso/dimensión/valor<br>';
    html += '4. <strong>Aéreo + Trecho</strong> — si el origen NO es Curitiba<br><br>';
    html += 'Las filas <em>nombre</em> e <em>id</em> no se pueden editar ni eliminar. Modificar los demás valores afecta las cotizaciones en tiempo real.</div>';

    html += '<div class="add-form"><h3>➕ Agregar nuevo parámetro</h3>';
    html += '<form class="fields" method="POST" action="/admin/modalidades/add" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">';
    html += '<label>modalidad <select name="modalidad" required><option value="EXPRESS">EXPRESS</option><option value="TERRESTRE">TERRESTRE</option><option value="AEREO">AEREO</option><option value="AEREO_TRECHO">AEREO_TRECHO</option></select></label>';
    html += '<label>clave <input type="text" name="clave" required placeholder="ej: peso_max_kg"></label>';
    html += '<label>valor <input type="text" name="valor" required placeholder="ej: 10"></label>';
    html += '<button class="btn-add" type="submit">➕ Agregar</button></form></div>';

    html += `<script>
function confirmModalidad(form){
  var i=form.querySelector('input[name="valor"]');
  var o=i.defaultValue;
  var n=i.value;
  if(o===n)return;
  var c=form.getAttribute('data-clave')||'';
  var d=document.createElement('div');d.className='modal-overlay';
  d.innerHTML='<div class="modal"><h3>⚠\\uFE0F Confirmar cambio</h3><p style="margin-bottom:12px">¿Estás seguro de modificar <strong>'+c+'</strong>?</p><div style="background:var(--gray-50);padding:12px 14px;border-radius:8px;margin-bottom:14px;font-size:.85rem"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--gray-500)">Valor actual:</span><span style="font-weight:600">'+o+'</span></div><div style="display:flex;justify-content:space-between"><span style="color:var(--gray-500)">Nuevo valor:</span><span style="font-weight:600;color:var(--blue)">'+n+'</span></div></div><p style="font-size:.78rem;color:var(--gray-500);margin-bottom:16px">💡 Las cotizaciones se actualizarán con este cambio en tiempo real.</p><div class="actions"><button class="btn-cancel">Cancelar</button><button class="btn-confirm" style="background:var(--blue)">Confirmar</button></div></div>';
  d.querySelector('.btn-cancel').onclick=()=>d.remove();
  d.querySelector('.btn-confirm').onclick=()=>{d.remove();fetch(form.action,{method:form.method,body:new URLSearchParams(new FormData(form))}).then(()=>window.location.reload()).catch(()=>window.location.reload())};
  document.body.appendChild(d)
}
</script>`;

    return layout('Modalidades', html, t);
  }

  router.get('/modalidades', auth, async (req, res) => {
    try {
      const result = await query('SELECT * FROM modalidades ORDER BY modalidades.modalidad, modalidades.clave');
      const toast = req.query.saved ? '<div class="toast toast-success">✅ Cambios guardados</div>' : req.query.deleted ? '<div class="toast toast-error">🗑️ Parámetro eliminado</div>' : '';
      res.send(renderModalidadesPage(result.rows, toast, req.adminToken));
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/modalidades/add', auth, async (req, res) => {
    try {
      await query('INSERT INTO modalidades (modalidad, clave, valor) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [req.body.modalidad, req.body.clave, String(req.body.valor)]);
      invalidateCache();
      res.redirect('/admin/modalidades?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/modalidades/:pk/update', auth, async (req, res) => {
    try {
      await query('UPDATE modalidades SET valor = $1 WHERE id = $2', [String(req.body.valor), Number(req.params.pk)]);
      invalidateCache();
      res.redirect('/admin/modalidades?saved=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  router.post('/modalidades/:pk/delete', auth, async (req, res) => {
    try {
      const row = await query('SELECT modalidad, clave FROM modalidades WHERE id = $1', [Number(req.params.pk)]);
      if (row.rows.length > 0 && (row.rows[0].clave === 'nombre' || row.rows[0].clave === 'id')) {
        return res.status(400).send(layout('Error', '<p style="color:var(--red)">No se puede eliminar ' + row.rows[0].clave + ' de ' + row.rows[0].modalidad + '</p>', req.adminToken));
      }
      await query('DELETE FROM modalidades WHERE id = $1', [Number(req.params.pk)]);
      invalidateCache();
      res.redirect('/admin/modalidades?deleted=1');
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  /* ─── CATEGORÍAS: eliminar extras ─── */
  router.post('/categorias/delete-extra', auth, async (req, res) => {
    try {
      const placeholders = CATEGORIAS_SEMILLA.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
      const values = CATEGORIAS_SEMILLA.flat();
      const deleted = await query(
        `DELETE FROM categorias WHERE (tipo, categoria) NOT IN (${placeholders})`,
        values
      );
      invalidateCache();
      const count = deleted.rowCount;
      res.redirect(`/admin/categorias?saved=${encodeURIComponent(`🗑️ ${count} categoría${count !== 1 ? 's' : ''} extra${count !== 1 ? 's' : ''} eliminada${count !== 1 ? 's' : ''}`)}`);
    } catch (err) {
      res.status(500).send(layout('Error', `<p style="color:var(--red)">Error: ${err.message}</p>`, req.adminToken));
    }
  });

  /* ─── TABLAS GENÉRICAS ─── */
  for (const [table, info] of Object.entries(TABLES)) {
    if (table === 'formulas' || table === 'tramos_boa_vista' || table === 'tramos_ganancia' || table === 'modalidades') continue;
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
          ? `<div class="toast toast-success">✅ ${req.query.saved === '1' ? 'Cambios guardados' : req.query.saved}</div>`
          : req.query.deleted
            ? `<div class="toast toast-error">🗑️ ${req.query.deleted === '1' ? 'Registro eliminado' : req.query.deleted}</div>` : '';

        let html = `${toast}<div class="table-wrap">`;
        html += `<div class="table-toolbar">
          <span style="font-weight:600;font-size:.85rem">${info.icon} ${info.title}</span>
          ${table === 'categorias' ? `<form class="inline" method="POST" action="/admin/categorias/delete-extra" onsubmit="event.preventDefault();confirmDelete('¿Eliminar todas las categorías adicionales (no incluidas en la semilla)?',this)"><button class="btn-sm btn-del" type="submit" style="font-size:.75rem">🗑️ Eliminar extras</button></form>` : ''}
          <div class="search-wrap">${showSearch ? '<span class="icon">🔍</span><input type="text" placeholder="Buscar..." oninput="filterTable(this)">' : ''}</div>
        </div>`;
        html += (table === 'categorias' ? `<div style="padding:6px 14px 10px;font-size:.75rem;color:var(--gray-500);line-height:1.5;border-bottom:1px solid var(--gray-200)">📋 <b>Nota:</b> Esta tabla es vocabulario para el clasificador IA. La <b>elegibilidad de servicios</b> se configura en <a href="/admin/categoria-servicios" style="color:var(--blue)">🚦 Matriz de Servicios</a> y el <b>mapeo término→categoría</b> en <a href="/admin/mapeo-categorias" style="color:var(--blue)">📖 Mapeo de Categorías</a>.<br>🌱 <b>Seed</b> = categorías predefinidas. <span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:6px;font-weight:600">⚠️ Extra</span> = agregadas manualmente. El botón <b>"Eliminar extras"</b> borra solo las <b>Extra</b>.</div>` : '');
        html += `<table><thead><tr>`;
        for (const col of cols) html += `<th>${col}</th>`;
        if (table === 'categorias') html += '<th style="width:55px;text-align:center">Origen</th>';
        html += `<th style="width:120px">Acciones</th></tr></thead><tbody>`;

        for (const row of rows) {
          const isSeed = table === 'categorias' && SEED_SET.has(`${row.tipo},${row.categoria}`);
          const rowTitle = table === 'categorias' ? (isSeed ? '🌱 Seed - Categoría predefinida' : '⚠️ Extra - Categoría agregada manualmente') : '';
          html += `<tr>`;
          for (const col of cols) {
            const val = row[col] === null ? '' : row[col];
            html += `<td>
              <form class="inline" method="POST" action="/admin/${table}/${row[pk]}/update" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">
                ${col === pk ? `<span style="font-weight:600;color:var(--gray-500)">${val}</span>`
                  : isNumeric[col]
                    ? `<input type="number" step="any" name="${col}" value="${val}"${rowTitle ? ` title="${rowTitle}"` : ''}>`
                    : `<input type="text" name="${col}" value="${val.replace(/"/g,'&quot;')}"${rowTitle ? ` title="${rowTitle}"` : ''}>`}
              </td>`;
            if (col === cols[cols.length - 1]) {
              if (table === 'categorias') {
                const badge = isSeed
                  ? '<span style="font-size:.68rem;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:10px;font-weight:600">Seed</span>'
                  : '<span style="font-size:.68rem;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-weight:600">Extra</span>';
                html += `<td style="text-align:center">${badge}</td>`;
              }
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

        html += `</tbody></table><div class="paginator"></div></div>`;

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
        html += `<script>renderPage(1,document.querySelector('.table-wrap'))</script>`;

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

  /* ─── CATEGORÍA × SERVICIO (Matriz de semáforos) ─── */
  const SERVICIOS = ['sedex', 'pac', 'latam'];
  const ESTADOS = { verde: '🟢 Verde', amarillo: '🟡 Amarillo', rojo: '🔴 Rojo' };

  router.get('/categoria-servicios', auth, async (req, res) => {
    const t = req.adminToken;
    const toast = req.query.saved
      ? '<div class="toast toast-success">✅ Matriz actualizada</div>'
      : req.query.error ? '<div class="toast toast-error">❌ Error al actualizar</div>' : '';
    const esc = (s) => String(s == null ? '' : s).replace(/</g,'&lt;').replace(/>/g,'&gt;');

    let html = toast;

    // Obtener categorías únicas
    const catResult = await query('SELECT DISTINCT categoria FROM categoria_servicios ORDER BY categoria');
    const categorias = catResult.rows.map(r => r.categoria);

    // Obtener estados actuales
    const svcResult = await query('SELECT * FROM categoria_servicios ORDER BY categoria, servicio');
    const matriz = {};
    for (const r of svcResult.rows) {
      if (!matriz[r.categoria]) matriz[r.categoria] = {};
      matriz[r.categoria][r.servicio] = { estado: r.estado, doc: r.documentacion || '' };
    }

    html += '<div class="table-wrap">';
    html += '<div class="table-toolbar"><span style="font-weight:600;font-size:.85rem">🚦 Matriz Categoría × Servicio</span></div>';
    html += '<table><thead><tr><th>Categoría</th>';
    for (const s of SERVICIOS) html += '<th style="text-align:center;text-transform:uppercase">🟢 ' + s + '</th>';
    html += '<th style="min-width:180px">Documentación</th>';
    html += '<th style="width:60px"></th></tr></thead><tbody>';

    for (const cat of categorias) {
      html += '<tr>';
      html += '<td><strong>' + esc(cat) + '</strong></td>';
      for (const s of SERVICIOS) {
        const celda = matriz[cat] && matriz[cat][s];
        const estado = celda ? celda.estado : 'verde';
        html += '<td style="text-align:center">';
        html += '<form class="inline" method="POST" action="/admin/categoria-servicios/update" style="justify-content:center">';
        html += '<input type="hidden" name="categoria" value="' + esc(cat) + '">';
        html += '<input type="hidden" name="servicio" value="' + s + '">';
        html += '<select name="estado" onchange="this.form.submit()" style="padding:3px 6px;border:1px solid var(--gray-300);border-radius:5px;font-size:.75rem">';
        for (const [val, label] of Object.entries(ESTADOS)) {
          html += '<option value="' + val + '"' + (estado === val ? ' selected' : '') + '>' + label + '</option>';
        }
        html += '</select></form></td>';
      }
      const doc = matriz[cat] && matriz[cat].sedex ? matriz[cat].sedex.doc : '';
      html += '<td>';
      html += '<form class="inline" method="POST" action="/admin/categoria-servicios/update-doc">';
      html += '<input type="hidden" name="categoria" value="' + esc(cat) + '">';
      html += '<input type="text" name="documentacion" value="' + esc(doc) + '" placeholder="FISPQ/MSDS..." style="width:160px;padding:3px 6px;border:1px solid var(--gray-300);border-radius:5px;font-size:.75rem">';
      html += '<button class="btn-sm btn-save" type="submit">💾</button></form></td>';
      html += '<td>';
      html += '<form method="POST" action="/admin/categoria-servicios/delete" onsubmit="event.preventDefault();confirmDelete(\'¿Eliminar categoría ' + esc(cat) + ' de la matriz?\',this)">';
      html += '<input type="hidden" name="categoria" value="' + esc(cat) + '">';
      html += '<button class="btn-sm btn-del" type="submit">🗑️</button></form></td>';
      html += '</tr>';
    }

    html += '</tbody></table></div>';

    // Formulario agregar categoría
    html += '<div class="add-form"><h3>➕ Agregar categoría a la matriz</h3>';
    html += '<form class="fields" method="POST" action="/admin/categoria-servicios/add">';
    html += '<label>categoría <input type="text" name="categoria" required placeholder="nueva_categoria"></label>';
    for (const s of SERVICIOS) {
      html += '<label>' + s + ' <select name="estado_' + s + '">';
      for (const [val, label] of Object.entries(ESTADOS)) html += '<option value="' + val + '"' + (val === 'verde' ? ' selected' : '') + '>' + label + '</option>';
      html += '</select></label>';
    }
    html += '<button class="btn-add" type="submit">➕ Agregar</button></form></div>';

    html += '<div style="margin-top:16px;padding:14px 18px;background:#f0f4ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.8rem;color:var(--gray-700);line-height:1.6">';
    html += '🚦 <strong>Matriz de servicios</strong> — Define qué categorías pueden ir por cada servicio.<br>';
    html += '🟢 <strong>Verde</strong> = Permitido | 🟡 <strong>Amarillo</strong> = Requiere documentación | 🔴 <strong>Rojo</strong> = No permitido<br>';
    html += '📋 Si una categoría requiere documento, escribí el nombre del documento en la columna "Documentación".<br>';
    html += '💡 El motor prueba servicios en orden: <strong>SEDEX → PAC → LATAM</strong>. Usa el primero que tenga todas las categorías en Verde o Amarillo.</div>';

    res.send(layout('Matriz de Servicios', html, t));
  });

  router.post('/categoria-servicios/update', auth, async (req, res) => {
    try {
      await query("UPDATE categoria_servicios SET estado = $1 WHERE categoria = $2 AND servicio = $3", [req.body.estado, req.body.categoria, req.body.servicio]);
      invalidateCache();
      res.redirect('/admin/categoria-servicios?saved=1');
    } catch { res.redirect('/admin/categoria-servicios?error=1'); }
  });

  router.post('/categoria-servicios/update-doc', auth, async (req, res) => {
    try {
      await query("UPDATE categoria_servicios SET documentacion = $1 WHERE categoria = $2 AND servicio = 'sedex'", [req.body.documentacion || '', req.body.categoria]);
      await query("UPDATE categoria_servicios SET documentacion = $1 WHERE categoria = $2 AND servicio = 'pac'", [req.body.documentacion || '', req.body.categoria]);
      await query("UPDATE categoria_servicios SET documentacion = $1 WHERE categoria = $2 AND servicio = 'latam'", [req.body.documentacion || '', req.body.categoria]);
      invalidateCache();
      res.redirect('/admin/categoria-servicios?saved=1');
    } catch { res.redirect('/admin/categoria-servicios?error=1'); }
  });

  router.post('/categoria-servicios/add', auth, async (req, res) => {
    try {
      const cat = req.body.categoria.toLowerCase().trim().replace(/\s+/g, '_');
      for (const s of SERVICIOS) {
        const estado = req.body['estado_' + s] || 'verde';
        await query("INSERT INTO categoria_servicios (categoria, servicio, estado) VALUES ($1, $2, $3) ON CONFLICT (categoria, servicio) DO NOTHING", [cat, s, estado]);
      }
      invalidateCache();
      res.redirect('/admin/categoria-servicios?saved=1');
    } catch { res.redirect('/admin/categoria-servicios?error=1'); }
  });

  router.post('/categoria-servicios/delete', auth, async (req, res) => {
    try {
      await query("DELETE FROM categoria_servicios WHERE categoria = $1", [req.body.categoria]);
      invalidateCache();
      res.redirect('/admin/categoria-servicios?saved=1');
    } catch { res.redirect('/admin/categoria-servicios?error=1'); }
  });

  /* ─── MAPEO DE CATEGORÍAS (diccionario editable) ─── */
  router.get('/mapeo-categorias', auth, async (req, res) => {
    const t = req.adminToken;
    const toast = req.query.saved
      ? '<div class="toast toast-success">✅ Mapeo guardado</div>'
      : req.query.deleted ? '<div class="toast toast-error">🗑️ Mapeo eliminado</div>'
      : req.query.error ? '<div class="toast toast-error">❌ Error</div>' : '';
    const esc = (s) => String(s == null ? '' : s).replace(/</g,'&lt;').replace(/>/g,'&gt;');

    // Obtener categorías disponibles para los selects
    const catResult = await query('SELECT DISTINCT categoria FROM categoria_servicios ORDER BY categoria');
    const categorias = catResult.rows.map(r => r.categoria);
    const catOptions = categorias.map(c => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('');

    const search = (req.query.search || '').toLowerCase().trim();
    let querySql = 'SELECT termino, categoria, restricciones FROM mapeo_categorias';
    const params = [];
    if (search) {
      querySql += ' WHERE termino ILIKE $1 OR categoria ILIKE $1';
      params.push('%' + search + '%');
    }
    querySql += ' ORDER BY termino LIMIT 200';

    const result = await query(querySql, params);
    const rows = result.rows;

    let html = toast;
    html += '<div class="table-wrap">';
    html += '<div class="table-toolbar">';
    html += '<span style="font-weight:600;font-size:.85rem">📖 Mapeo de Términos → Categorías</span>';
    html += '<div class="search-wrap"><span class="icon">🔍</span><input type="text" placeholder="Buscar término..." value="' + esc(search) + '" onchange="location=\'?search=\'+encodeURIComponent(this.value)"></div>';
    html += '</div>';
    html += '<table><thead><tr><th>Término</th><th>Categoría</th><th>Restricciones</th><th style="width:120px">Acciones</th></tr></thead><tbody>';

    for (const row of rows) {
      html += '<tr>';
      html += '<td><span style="font-weight:600;color:var(--gray-500)">' + esc(row.termino) + '</span></td>';
      html += '<td>';
      html += '<form class="inline" method="POST" action="/admin/mapeo-categorias/' + encodeURIComponent(row.termino) + '/update" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">';
      html += '<select name="categoria" style="padding:3px 6px;border:1px solid var(--gray-300);border-radius:5px;font-size:.75rem">';
      for (const c of categorias) {
        html += '<option value="' + esc(c) + '"' + (row.categoria === c ? ' selected' : '') + '>' + esc(c) + '</option>';
      }
      html += '</select>';
      html += '</td>';
      html += '<td><input type="text" name="restricciones" value="' + esc(row.restricciones) + '" placeholder="baterias,quimicos" style="width:160px;padding:3px 6px;border:1px solid var(--gray-300);border-radius:5px;font-size:.75rem"></td>';
      html += '<td>';
      html += '<button class="btn-sm btn-save" type="submit">💾</button></form>';
      html += '<form class="inline" method="POST" action="/admin/mapeo-categorias/' + encodeURIComponent(row.termino) + '/delete" onsubmit="event.preventDefault();confirmDelete(\'Eliminar mapeo para "' + esc(row.termino) + '"?\',this)">';
      html += '<button class="btn-sm btn-del" type="submit">🗑️</button></form></td>';
      html += '</tr>';
    }

    html += '</tbody></table></div>';

    html += '<div class="add-form"><h3>➕ Agregar mapeo</h3>';
    html += '<form class="fields" method="POST" action="/admin/mapeo-categorias/add" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false">';
    html += '<label>término <input type="text" name="termino" required placeholder="ej: drone con cámara"></label>';
    html += '<label>categoría <select name="categoria" required>' + catOptions + '</select></label>';
    html += '<label>restricciones <input type="text" name="restricciones" placeholder="baterias,quimicos"></label>';
    html += '<button class="btn-add" type="submit">➕ Agregar</button></form></div>';

    html += '<div style="margin-top:16px;padding:14px 18px;background:#f0f4ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.8rem;color:var(--gray-700);line-height:1.6">';
    html += '📖 <strong>Mapeo de términos</strong> — Si el Prompt Maestro pasa el nombre exacto de un producto como categoría, buscálo acá.<br>';
    html += '💡 <strong>Restricciones:</strong> Categorías adicionales separadas por coma. Ej: "baterias,quimicos"<br>';
    html += '🔁 El mapeo tiene prioridad sobre el clasificador IA y el diccionario.</div>';

    res.send(layout('Mapeo de Categorías', html, t));
  });

  router.post('/mapeo-categorias/add', auth, async (req, res) => {
    try {
      await query("INSERT INTO mapeo_categorias (termino, categoria, restricciones) VALUES ($1, $2, $3) ON CONFLICT (termino) DO NOTHING",
        [req.body.termino.toLowerCase().trim(), req.body.categoria, req.body.restricciones || '']);
      invalidateCache();
      res.redirect('/admin/mapeo-categorias?saved=1');
    } catch { res.redirect('/admin/mapeo-categorias?error=1'); }
  });

  router.post('/mapeo-categorias/:termino/update', auth, async (req, res) => {
    try {
      await query("UPDATE mapeo_categorias SET categoria = $1, restricciones = $2 WHERE termino = $3",
        [req.body.categoria, req.body.restricciones || '', req.params.termino]);
      invalidateCache();
      res.redirect('/admin/mapeo-categorias?saved=1');
    } catch { res.redirect('/admin/mapeo-categorias?error=1'); }
  });

  router.post('/mapeo-categorias/:termino/delete', auth, async (req, res) => {
    try {
      await query("DELETE FROM mapeo_categorias WHERE termino = $1", [req.params.termino]);
      invalidateCache();
      res.redirect('/admin/mapeo-categorias?deleted=1');
    } catch { res.redirect('/admin/mapeo-categorias?error=1'); }
  });

  /* ─── MENSAJES (plantillas) ─── */
  const INFO_MENSAJES = {
    mensaje_domestico_brasil: { icon: '🇧🇷', title: 'Doméstico — Brasil (ES)', desc: 'Cotización desde Brasil — Español', grupo: 'ES' },
    mensaje_domestico_venezuela: { icon: '🇻🇪', title: 'Doméstico — Venezuela (ES)', desc: 'Cotización comprando desde Venezuela — Español', grupo: 'ES' },
    mensaje_internacional: { icon: '🌎', title: 'Internacional UPS (ES)', desc: 'Cotización internacional — Español', grupo: 'ES' },
    mensaje_domestico_brasil_pt: { icon: '🇧🇷', title: 'Doméstico — Brasil (PT)', desc: 'Cotização desde o Brasil — Português', grupo: 'PT' },
    mensaje_domestico_venezuela_pt: { icon: '🇻🇪', title: 'Doméstico — Venezuela (PT)', desc: 'Cotização comprando da Venezuela — Português', grupo: 'PT' },
    mensaje_internacional_pt: { icon: '🌎', title: 'Internacional UPS (PT)', desc: 'Cotização internacional — Português', grupo: 'PT' },
    mensaje_domestico_brasil_en: { icon: '🇧🇷', title: 'Domestic — Brazil (EN)', desc: 'Quote from Brazil — English', grupo: 'EN' },
    mensaje_domestico_venezuela_en: { icon: '🇻🇪', title: 'Domestic — Venezuela (EN)', desc: 'Quote buying from Venezuela — English', grupo: 'EN' },
    mensaje_internacional_en: { icon: '🌎', title: 'International UPS (EN)', desc: 'International quote — English', grupo: 'EN' }
  };

  const DICTAMENES = {
    mensaje_domestico_brasil: '{{origen}} {{destino}} {{categoria}} {{cajas}} {{modalidad}} {{total_reales}} {{total_usd}} {{tiempo}} {{fecha_entrega}} {{agencia}} {{costo_nacional}} {{metodos_pago}} {{footer}}',
    mensaje_domestico_venezuela: '{{origen}} {{destino}} {{categoria}} {{cajas}} {{modalidad}} {{total}} {{tiempo}} {{fecha_entrega}} {{agencia}} {{costo_nacional}} {{metodos_pago}} {{footer}}',
    mensaje_internacional: '{{origen_linea}} {{destino_linea}} {{paquete}} {{opciones_envio}} {{sin_cotizaciones}} {{metodos_pago}} {{footer}}',
    mensaje_domestico_brasil_pt: '{{origen}} {{destino}} {{categoria}} {{cajas}} {{modalidad}} {{total_reales}} {{total_usd}} {{tiempo}} {{fecha_entrega}} {{agencia}} {{costo_nacional}} {{metodos_pago}} {{footer}}',
    mensaje_domestico_venezuela_pt: '{{origen}} {{destino}} {{categoria}} {{cajas}} {{modalidad}} {{total}} {{tiempo}} {{fecha_entrega}} {{agencia}} {{costo_nacional}} {{metodos_pago}} {{footer}}',
    mensaje_internacional_pt: '{{origen_linea}} {{destino_linea}} {{paquete}} {{opciones_envio}} {{sin_cotizaciones}} {{metodos_pago}} {{footer}}',
    mensaje_domestico_brasil_en: '{{origen}} {{destino}} {{categoria}} {{cajas}} {{modalidad}} {{total_reales}} {{total_usd}} {{tiempo}} {{fecha_entrega}} {{agencia}} {{costo_nacional}} {{metodos_pago}} {{footer}}',
    mensaje_domestico_venezuela_en: '{{origen}} {{destino}} {{categoria}} {{cajas}} {{modalidad}} {{total}} {{tiempo}} {{fecha_entrega}} {{agencia}} {{costo_nacional}} {{metodos_pago}} {{footer}}',
    mensaje_internacional_en: '{{origen_linea}} {{destino_linea}} {{paquete}} {{opciones_envio}} {{sin_cotizaciones}} {{metodos_pago}} {{footer}}'
  };

  router.get('/mensajes', auth, async (req, res) => {
    const t = req.adminToken;
    const toast = req.query.saved
      ? '<div class="toast toast-success">✅ Plantilla guardada correctamente</div>'
      : req.query.restored
        ? '<div class="toast toast-success">↩️ Plantilla restaurada al valor por defecto</div>'
        : req.query.error
          ? '<div class="toast toast-error">❌ Error al guardar la plantilla</div>' : '';
    const esc = (s) => String(s == null ? '' : s).replace(/</g,'&lt;').replace(/>/g,'&gt;');

    let rows = [];
    try {
      const result = await query('SELECT clave, valor, updated_at FROM plantillas_mensajes ORDER BY clave');
      rows = result.rows;
    } catch {}

    const dbMap = {};
    for (const r of rows) dbMap[r.clave] = r;

    let html = toast;

    var grupos = { ES: [], PT: [], EN: [] };
    for (const [clave, info] of Object.entries(INFO_MENSAJES)) {
      if (grupos[info.grupo]) grupos[info.grupo].push({ clave, info });
    }

    var etiquetas = { ES: '🇪🇸 Español', PT: '🇧🇷 Português', EN: '🇺🇸 English' };

    for (var g of ['ES', 'PT', 'EN']) {
      var items = grupos[g] || [];
      if (items.length === 0) continue;
      html += '<div style="margin-top:20px;margin-bottom:10px;font-size:.85rem;font-weight:700;color:var(--gray-600);display:flex;align-items:center;gap:8px">' + etiquetas[g] + ' <span style="font-size:.7rem;font-weight:400;color:var(--gray-400)">' + items.length + ' plantilla(s)</span></div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">';
      for (var item of items) {
        var clave = item.clave;
        var info = item.info;
        var dbRow = dbMap[clave];
        var preview = dbRow ? dbRow.valor.substring(0, 120).replace(/\n/g, '↵ ') : '(usando plantilla por defecto)';
        var updated = dbRow && dbRow.updated_at ? new Date(dbRow.updated_at).toLocaleString('es-VE') : '—';

        html += '<div class="card" style="display:flex;flex-direction:column">';
        html += '<h3>' + info.icon + ' ' + esc(info.title) + '</h3>';
        html += '<p>' + esc(info.desc) + '</p>';
        html += '<div style="font-size:.7rem;color:var(--gray-400);background:var(--gray-50);padding:8px 10px;border-radius:6px;margin-bottom:10px;font-family:monospace;white-space:pre-wrap;word-break:break-word;max-height:80px;overflow:hidden;line-height:1.4">' + esc(preview) + (preview.length >= 120 ? '…' : '') + '</div>';
        html += '<div style="margin-top:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
        html += '<a href="/admin/mensajes/' + clave + '" style="font-size:.75rem">✏️ Editar</a>';
        html += '<form method="POST" action="/admin/mensajes/' + clave + '/restaurar" onsubmit="event.preventDefault();confirmDelete(\'¿Restaurar plantilla ' + clave + ' a su valor por defecto?\',this)" style="display:inline">';
        html += '<button class="btn-sm btn-del" type="submit" style="font-size:.72rem">↩️ Restaurar</button>';
        html += '</form>';
        html += '<span style="font-size:.65rem;color:var(--gray-400);margin-left:auto">' + updated + '</span>';
        html += '</div></div>';
      }
      html += '</div>';
    }

    html += '<div style="margin-top:20px;padding:14px 18px;background:#f0f4ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.8rem;color:var(--gray-700);line-height:1.6">';
    html += '💡 Las plantillas usan variables <code>{{variable}}</code> y condicionales <code>{{#if variable}}...{{/if}}</code>. ';
    html += 'Si no hay plantilla guardada en la BD, se usa la plantilla por defecto del sistema.<br>';
    html += '📖 <strong>Cambia libremente</strong> textos, emojis y estructura. Las variables se reemplazan automáticamente.<br>';
    html += '🌐 El sistema selecciona automáticamente la plantilla según el campo <code>idioma</code> del JSON de entrada (<code>es</code>, <code>pt</code>, <code>en</code>). Si no está presente, usa Español.</div>';

    res.send(layout('Mensajes', html, t));
  });

  router.get('/mensajes/:clave', auth, async (req, res) => {
    const t = req.adminToken;
    const clave = req.params.clave;
    const info = INFO_MENSAJES[clave];
    if (!info) return res.status(404).send(layout('Error', '<p style="color:var(--red)">Plantilla no encontrada</p>', t));

    const esc = (s) => String(s == null ? '' : s).replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const toast = req.query.saved
      ? '<div class="toast toast-success">✅ Plantilla guardada correctamente</div>' : '';

    let valor = '';
    try {
      const result = await query('SELECT valor FROM plantillas_mensajes WHERE clave = $1', [clave]);
      if (result.rows.length > 0) valor = result.rows[0].valor;
    } catch {}

    if (!valor) {
      valor = PLANTILLAS_DEFAULT[clave] || '';
    }

    const dictamen = DICTAMENES[clave] || '';

    const body = `${toast}<div class="table-wrap">
      <div class="table-toolbar" style="flex-wrap:wrap;gap:8px">
        <span style="font-weight:600;font-size:.85rem">${info.icon} ${esc(info.title)}</span>
        <a href="/admin/mensajes" style="font-size:.75rem;color:var(--gray-500)">← Volver</a>
      </div>
      <form method="POST" action="/admin/mensajes/${clave}" onsubmit="return fetch(this.action,{method:this.method,body:new URLSearchParams(new FormData(this))}).then(()=>{window.location.reload()}).catch(()=>{window.location.reload()}),false" style="padding:16px">
        <div style="margin-bottom:12px">
          <label style="display:block;font-size:.78rem;font-weight:600;color:var(--gray-500);margin-bottom:6px">Plantilla:</label>
          <textarea name="valor" style="width:100%;min-height:360px;padding:12px;border:1px solid var(--gray-300);border-radius:8px;font-family:ui-monospace,monospace;font-size:.78rem;line-height:1.6;resize:vertical;tab-size:2">${esc(valor)}</textarea>
        </div>
        ${dictamen ? `<div style="margin-bottom:12px;padding:10px 14px;background:var(--gray-50);border-radius:8px;font-size:.76rem;color:var(--gray-500);line-height:1.6">📌 Variables disponibles: <code style="background:var(--gray-200);padding:1px 6px;border-radius:4px">${esc(dictamen)}</code></div>` : ''}
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn-add" type="submit">💾 Guardar plantilla</button>
          <span style="font-size:.72rem;color:var(--gray-400)">🔁 Los cambios se reflejan inmediatamente en las próximas cotizaciones</span>
        </div>
      </form>
    </div>`;

    res.send(layout('Editar Mensaje', body, t));
  });

  router.post('/mensajes/:clave', auth, async (req, res) => {
    try {
      const clave = req.params.clave;
      const valor = req.body.valor || '';
      if (!INFO_MENSAJES[clave]) return res.redirect('/admin/mensajes?error=1');

      if (!valor.trim()) {
        await query("DELETE FROM plantillas_mensajes WHERE clave = $1", [clave]);
      } else {
        await query("INSERT INTO plantillas_mensajes (clave, valor, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()", [clave, valor]);
      }
      invalidarPlantillasCache();
      res.redirect(`/admin/mensajes/${clave}?saved=1`);
    } catch (err) {
      res.redirect('/admin/mensajes?error=1');
    }
  });

  router.post('/mensajes/:clave/restaurar', auth, async (req, res) => {
    try {
      const clave = req.params.clave;
      if (!INFO_MENSAJES[clave]) return res.redirect('/admin/mensajes?error=1');
      await query("DELETE FROM plantillas_mensajes WHERE clave = $1", [clave]);
      invalidarPlantillasCache();
      res.redirect('/admin/mensajes?restored=1');
    } catch (err) {
      res.redirect('/admin/mensajes?error=1');
    }
  });

  return router;
}
