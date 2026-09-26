/**
 * CONTRATS — plusieurs contrats en parallèle dans Mizuki (C6)
 * Contrat 1 = clés historiques (M5_CONTRACT, M5_DATA_2026…), sans migration.
 * Contrats 2 et 3 = mêmes clés préfixées : M5_C2_CONTRACT, M5_C2_DATA_2026…
 * Le contrat actif est fixé au chargement de la page ; changer de contrat recharge la page.
 * Clés communes à tous les contrats : prénom, réglages d'affichage, jours fériés.
 */
(function(global){
'use strict';
var MAX=3, K_ACTIVE='M5_ACTIVE_CONTRACT', K_NOMS='M5_CONTRATS_NOMS';
function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function set(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function active(){var n=parseInt(get(K_ACTIVE),10);return (n>=1&&n<=MAX)?n:1;}
var ACTIVE=active();
function keyFor(n,name){return n===1?name:name.replace(/^M5_/,'M5_C'+n+'_');}
function key(name){return keyFor(ACTIVE,name);}
function exists(n){try{var c=JSON.parse(get(keyFor(n,'M5_CONTRACT'))||'null');return !!(c&&c.hoursBase>0);}catch(e){return false;}}
function noms(){try{return JSON.parse(get(K_NOMS)||'{}')||{};}catch(e){return {};}}
function nom(n){var m=noms();if(m[n])return m[n];
  try{var c=JSON.parse(get(keyFor(n,'M5_CONTRACT'))||'null');if(c&&c.ccnNom)return c.ccnNom;}catch(e){}
  return 'Contrat '+n;}
function list(){var r=[];for(var n=1;n<=MAX;n++)if(exists(n)||n===ACTIVE)r.push(n);return r;}
function existing(){var r=[];for(var n=1;n<=MAX;n++)if(exists(n))r.push(n);return r;}
function switchTo(n){set(K_ACTIVE,String(n));location.reload();}
function add(){
  var free=0;for(var n=2;n<=MAX;n++)if(!exists(n)&&n!==ACTIVE){free=n;break;}
  if(!free){alert('Tu peux suivre jusqu\u2019à '+MAX+' contrats.');return;}
  var t=prompt('Nom de ce nouveau contrat (ex : Ménage, Restaurant)','Contrat '+free);
  if(t===null)return;
  var m=noms();m[free]=(t.trim()||('Contrat '+free)).slice(0,30);set(K_NOMS,JSON.stringify(m));
  switchTo(free);
}
function rename(n){var t=prompt('Nom du contrat',nom(n));if(t===null)return;
  var m=noms();m[n]=(t.trim()||('Contrat '+n)).slice(0,30);set(K_NOMS,JSON.stringify(m));location.reload();}
function remove(n){
  if(n===1)return;
  if(!confirm('Supprimer « '+nom(n)+' » et toutes ses saisies ?\n\nPense à faire une copie de sauvegarde avant (menu → 💾).'))return;
  var pre='M5_C'+n+'_',ks=[];
  for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(pre)===0)ks.push(k);}
  ks.forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
  var m=noms();delete m[n];set(K_NOMS,JSON.stringify(m));
  switchTo(1);
}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* Bandeau de choix du contrat : visible dès qu'il y a 2 contrats (ou un nouveau en cours de création) */
function renderStrip(){
  var l=list();if(l.length<2)return;
  var h=document.querySelector('header.m5-header');if(!h)return;
  var d=document.createElement('div');d.id='m5-contrats';
  d.style.cssText='display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:rgba(108,63,197,0.08);border-bottom:1px solid rgba(108,63,197,0.18);-webkit-overflow-scrolling:touch';
  var html='';
  l.forEach(function(n){var on=n===ACTIVE;
    html+='<button type="button" data-n="'+n+'" style="flex-shrink:0;border-radius:999px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;'
      +(on?'background:#6C3FC5;color:#fff;border:1px solid #6C3FC5;':'background:#fff;color:#6C3FC5;border:1px solid rgba(108,63,197,0.45);')+'">'
      +esc(nom(n))+(on&&!exists(n)?' (à configurer)':'')+(on?' <span data-r="'+n+'" aria-label="Renommer" style="opacity:.8;margin-left:4px">✎</span>':'')+'</button>';});
  if(existing().length<MAX&&exists(ACTIVE))html+='<button type="button" data-add="1" style="flex-shrink:0;border-radius:999px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;background:transparent;color:#6C3FC5;border:1px dashed rgba(108,63,197,0.55)">+ Contrat</button>';
  d.innerHTML=html;
  d.addEventListener('click',function(e){
    var r=e.target.closest('[data-r]');if(r){e.stopPropagation();rename(+r.getAttribute('data-r'));return;}
    if(e.target.closest('[data-add]')){add();return;}
    var b=e.target.closest('[data-n]');if(b&&+b.getAttribute('data-n')!==ACTIVE)switchTo(+b.getAttribute('data-n'));
  });
  h.parentNode.insertBefore(d,h.nextSibling);
}
/* Dans « Mon contrat » : ajouter / supprimer un contrat */
function renderModal(){
  var m=document.querySelector('#modal-contract .m5-modal');if(!m)return;
  var d=document.createElement('div');
  d.id='m5-multi-contrat';
  d.style.cssText='margin-top:16px;padding:14px 12px;border-radius:12px;background:rgba(108,63,197,0.06);border:1.5px solid rgba(108,63,197,0.25);font-size:13px';
  var h='<div style="font-weight:700;margin-bottom:4px">👥 Plusieurs employeurs ?</div>'
    +'<div style="opacity:.75;font-size:12px;margin-bottom:10px">Chaque contrat a ses heures, sa convention et ses heures complémentaires, calculées séparément.</div>';
  if(existing().length<MAX&&exists(ACTIVE))h+='<button type="button" class="m5-btn m5-btn-full" data-add="1" style="margin-bottom:8px">+ Ajouter un contrat</button>';
  if(ACTIVE!==1)h+='<button type="button" class="m5-btn m5-btn-full" data-del="1" style="color:#c0392b">Supprimer « '+esc(nom(ACTIVE))+' »</button>';
  d.innerHTML=h;
  d.addEventListener('click',function(e){if(e.target.closest('[data-add]'))add();if(e.target.closest('[data-del]'))remove(ACTIVE);});
  /* Juste sous « Enregistrer », avant la zone danger : visible sans tout faire défiler */
  var save=m.querySelector('button[onclick*="saveContract"]');
  if(save&&save.parentNode)save.parentNode.insertBefore(d,save.nextSibling);else m.appendChild(d);
}

/* ── Vue d'ensemble (dès 2 contrats) : heures saisies par contrat + total + repère 48 h ── */
function pad(n){return ('0'+n).slice(-2);}
function dk(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function allData(n){ /* toutes les années du contrat n, fusionnées */
  var pre=keyFor(n,'M5_DATA_'),out={};
  for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);
    if(k&&k.indexOf(pre)===0&&/^\d{4}$/.test(k.slice(pre.length))){
      try{var o=JSON.parse(localStorage.getItem(k))||{};for(var d in o)out[d]=o[d];}catch(e){}}}
  return out;}
function sumRange(data,a,b){var t=0;
  for(var d in data){if(d<a||d>b)continue;var e=data[d];
    if(e&&(e.type==='day'||e.type==='week')&&e.worked>0)t+=e.worked;}
  return Math.round(t*100)/100;}
function fmtH(h){var hh=Math.floor(h),mm=Math.round((h-hh)*60);if(mm===60){hh++;mm=0;}return hh+' h'+(mm?' '+pad(mm):'');}
function base(n){try{var c=JSON.parse(get(keyFor(n,'M5_CONTRACT'))||'null');return c&&c.hoursBase>0?c.hoursBase:0;}catch(e){return 0;}}
function renderOverview(){
  var ex=existing();if(ex.length<2)return;
  var strip=document.getElementById('m5-contrats');if(!strip)return;
  var t=new Date();t.setHours(12,0,0,0);
  var mon=new Date(t);mon.setDate(t.getDate()-((t.getDay()+6)%7));var sun=new Date(mon);sun.setDate(mon.getDate()+6);
  var wa=dk(mon),wb=dk(sun),ma=dk(new Date(t.getFullYear(),t.getMonth(),1)),mb=dk(new Date(t.getFullYear(),t.getMonth()+1,0));
  var rows='',tw=0,tm=0;
  ex.forEach(function(n){var d=allData(n),w=sumRange(d,wa,wb),m=sumRange(d,ma,mb),b=base(n);tw+=w;tm+=m;
    rows+='<tr'+(n===ACTIVE?' style="font-weight:700"':'')+'><td style="padding:5px 4px">'+esc(nom(n))+'</td>'
      +'<td style="padding:5px 4px;text-align:right;white-space:nowrap">'+fmtH(w)+(b?' <span style="opacity:.55;font-weight:400">/ '+fmtH(b)+'</span>':'')+'</td>'
      +'<td style="padding:5px 4px;text-align:right;white-space:nowrap">'+fmtH(m)+'</td></tr>';});
  tw=Math.round(tw*100)/100;tm=Math.round(tm*100)/100;
  var over=tw>48;
  var c=document.createElement('div');c.id='m5-ensemble';
  c.style.cssText='margin:10px 12px 0;padding:12px 14px;border-radius:14px;background:#fff;border:1px solid rgba(108,63,197,0.22);font-size:13px;color:#2a2340';
  c.innerHTML='<div style="font-weight:800;margin-bottom:6px">Vue d\u2019ensemble de tes contrats</div>'
    +'<table style="width:100%;border-collapse:collapse"><thead><tr style="font-size:11.5px;opacity:.65">'
    +'<th style="text-align:left;padding:2px 4px;font-weight:600">Contrat</th>'
    +'<th style="text-align:right;padding:2px 4px;font-weight:600">Cette semaine / base</th>'
    +'<th style="text-align:right;padding:2px 4px;font-weight:600">Ce mois</th></tr></thead><tbody>'+rows
    +'<tr style="border-top:1px solid rgba(108,63,197,0.25);font-weight:800"><td style="padding:6px 4px">Total</td>'
    +'<td style="padding:6px 4px;text-align:right">'+fmtH(tw)+'</td><td style="padding:6px 4px;text-align:right">'+fmtH(tm)+'</td></tr></tbody></table>'
    +'<div style="margin-top:10px;padding:9px 11px;border-radius:10px;font-size:12px;line-height:1.45;'
    +(over?'background:#fff3e0;color:#b34700;border:1px solid #ffb74d':'background:rgba(108,63,197,0.06);color:#4a3f66')+'">'
    +'Tous employeurs confondus, la durée maximale de travail est de 48 h par semaine '
    +'(art. '+(global.LegiRef&&LegiRef.html?LegiRef.html('L3121-20'):'L3121-20')+' et L8261-1 du Code du travail). '
    +'Total saisi cette semaine : <b>'+fmtH(tw)+'</b>.'+(over?' Ce total dépasse 48 h.':'')+'</div>'
    +'<div style="margin-top:6px;font-size:11px;opacity:.6">Semaine du lundi au dimanche. Les heures complémentaires se calculent contrat par contrat, dans chaque contrat. Données indicatives.</div>';
  strip.parentNode.insertBefore(c,strip.nextSibling);
}
function boot(){try{renderStrip();renderModal();}catch(e){}try{renderOverview();}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

global.M5_key=key;
global.M5_Contrats={active:ACTIVE,key:key,keyFor:keyFor,exists:exists,nom:nom,list:list,existing:existing,switchTo:switchTo,add:add};
})(window);
