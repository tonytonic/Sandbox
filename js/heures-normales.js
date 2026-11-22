/* ═══════════════════════════════════════════════════════════════════════
   HEURES NORMALES — compteur annuel (M1) et heures mensualisées (M2)
   22/11/2026 (Sandbox)

   Option « Afficher aussi mes heures normales », CACHÉE PAR DÉFAUT.
   Les heures normales sont POUR INFORMATION : elles ne modifient jamais le
   calcul des heures sup (contingent, majorations, Fox, M4 lisent toujours les
   mêmes données qu'avant). Elles servent seulement à voir « 35 h normales +
   4 h sup = 39 h » sur la semaine.

   Trois façons de les donner, de la plus précise à la plus rapide :
   1. au jour      : dans la fenêtre du jour (« Heures normales ce jour ») ;
   2. à la semaine : bandeau sous chaque semaine du calendrier (« 35 h ✓ ») ;
   3. Taiko        : si un planning existe, les heures prévues pré-remplissent
                     les jours (clé TAIKO_HEURES publiée par taiko.html).
   Priorité : total saisi pour la semaine > jours saisis > planning Taiko.

   22/11/2026 (2) : le total de la semaine se donne en HEURES TRAVAILLÉES
   (heures sup comprises), comme M5 : 40 h = 35 h normales + 5 h sup, et les
   5 h deviennent les heures sup de la semaine (cfg.setWeekHS) : les heures
   sup saisies jour par jour cette semaine sont remplacées par l'excédent, mis
   sur un seul jour. Le total fait foi : le ressaisir remplace, sans cumuler. Récap par PÉRIODE DE PAIE (clôtures du module, cfg.getPeriod)
   avec la base mensualisée (seuil × 52 / 12, 151,67 h pour 35 h) et un brut
   estimé dans la zone Valeur € du module seulement (pas de montant dans le calendrier).

   Stockage : une clé à part par module ({v,d:{iso:h},w:{iso début semaine:h}}),
   jamais dans les données d'heures sup existantes.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var C=null, S={v:1,d:{},w:{}}, uid=0;

function load(){
  try{var o=JSON.parse(localStorage.getItem(C.storeKey)||'null');
    if(o&&typeof o==='object'){S={v:1,d:o.d||{},w:o.w||{}};}}catch(e){}
}
function save(){
  try{
    if(!Object.keys(S.d).length&&!Object.keys(S.w).length)localStorage.removeItem(C.storeKey);
    else localStorage.setItem(C.storeKey,JSON.stringify(S));
  }catch(e){}
}
function taiko(){
  try{var o=JSON.parse(localStorage.getItem('TAIKO_HEURES')||'null');return (o&&o.h)||null;}catch(e){return null;}
}

/* ── dates ── */
function pISO(s){var a=s.split('-');return new Date(+a[0],+a[1]-1,+a[2],12);}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function addD(s,n){var d=pISO(s);d.setDate(d.getDate()+n);return iso(d);}
function weekStart(s){
  var ds=C.getDs()||1, dsJS=ds===7?0:ds, d=pISO(s);
  d.setDate(d.getDate()-((d.getDay()-dsJS+7)%7));return iso(d);
}
function weekDays(ws){var o=[];for(var i=0;i<7;i++)o.push(addD(ws,i));return o;}
var MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function dCourt(s){var d=pISO(s);return d.getDate()+' '+MOIS[d.getMonth()];}

/* ── formats ── */
function fh(h){h=Math.round((+h||0)*60);var H=Math.floor(h/60),M=h%60;return H+'h'+(M?String(M).padStart(2,'0'):'');}
function seuil(){var s=+C.getSeuil();return s>0?s:35;}
function jourHabituel(){return Math.round(seuil()/5*100)/100;}
function baseMens(){return Math.round(seuil()*52/12*100)/100;}
function eur(v){return (Math.round(v*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+'\u00a0€';}
function rate(){try{var r=+(C.getRate&&C.getRate());return r>0?r:0;}catch(e){return 0;}}
function hsBrut(h){try{return h>0&&C.hsBrut?(+C.hsBrut(h)||0):0;}catch(e){return 0;}}
function inRange(s,a,b){return s>=a&&s<=b;}

/* ── valeurs ── */
function dayVal(s){
  if(S.d[s]!=null)return {v:+S.d[s],src:'jour'};
  /* absence ou congé saisi dans le module : le planning Taiko ne compte pas ce jour-là */
  try{if(C.isAbsent&&C.isAbsent(s))return {v:0,src:'jour'};}catch(e){}
  var t=taiko();if(t&&t[s]!=null)return {v:+t[s],src:'taiko'};
  return null;
}
function weekVal(ws){
  var hs=0,days=weekDays(ws);
  days.forEach(function(s){hs+=(+C.getHS(s)||0);});
  hs=Math.round(hs*100)/100;
  if(S.w[ws]!=null)return {v:+S.w[ws],src:'semaine',hs:hs,n:7};
  var v=0,n=0,src='';
  days.forEach(function(s){var x=dayVal(s);if(x){v+=x.v;n++;src=(src&&src!==x.src)?'mixte':x.src;}});
  if(!n)return {v:null,src:'',hs:hs,n:0};
  return {v:Math.round(v*100)/100,src:src,hs:hs,n:n};
}

function enabled(){try{return !!C.isOn();}catch(e){return false;}}

/* ── styles ── */
function css(){
  if(document.getElementById('nhCss'))return;
  var dark=C.theme==='dark', a=C.accent||'#2196a6';
  var st=document.createElement('style');st.id='nhCss';
  st.textContent=
  '.nh-cell{display:block;font-size:10px;line-height:1.15;font-weight:600;opacity:.85;color:'+(dark?'#cfe9ee':'#2e5560')+'}'+
  '.nh-cell .nh-tk{font-weight:400;opacity:.75}'+
  '.nh-week{grid-column:1/-1;display:flex;justify-content:flex-end;margin:-2px 0 2px;padding:0;min-height:0;background:none;border:none}'+
  '.nh-week .nh-wbtn{width:auto!important;margin:0!important;padding:3px 10px!important;min-height:0!important;border-radius:99px!important;font-size:11px!important;font-weight:600;line-height:1.3;box-shadow:none!important;'+
    'background:'+(dark?'rgba(255,255,255,.07)':'#eef4f7')+'!important;border:1px solid '+(dark?'rgba(255,255,255,.16)':'#c9d8e0')+'!important;color:'+(dark?'#e6eef0':'#26424a')+'!important}'+
  '.nh-week .nh-wbtn b{color:'+a+'}.nh-week .nh-wbtn.nh-vide{opacity:.7}.nh-week .nh-warn{color:#e67e22}'+
  '.nh-mois summary{cursor:pointer;list-style:none;font-weight:600}.nh-mois summary::-webkit-details-marker{display:none}'+
  '.nh-mois summary:after{content:" ▾";opacity:.6}.nh-mois[open] summary:after{content:" ▴"}.nh-mois .nh-det{margin-top:6px}'+
  '.nh-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px}'+
  '.nh-box{background:#fff;color:#1d2a30;border-radius:18px;max-width:380px;width:100%;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.35);font-size:14px;max-height:90vh;overflow:auto}'+
  '.nh-box h3{margin:0 0 4px;font-size:16px}.nh-box .nh-sub{color:#5d6b70;font-size:12px;margin-bottom:12px}'+
  '.nh-box .nh-q{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}'+
  '.nh-box .nh-q button{flex:1 1 auto;width:auto;margin:0;padding:8px 10px;border-radius:12px;border:1px solid #c9d8e0;background:#f4f8fb;color:#1d2a30;font-size:13px;font-weight:600}'+
  '.nh-box .nh-in{display:flex;gap:8px;align-items:center;margin:8px 0}'+
  '.nh-box .nh-in input{flex:1;min-width:0;text-align:center;padding:10px;border-radius:10px;border:1px solid #c9d8e0;font-size:16px;color:#1d2a30;background:#fff}'+
  '.nh-box .nh-act{display:flex;flex-direction:column;gap:6px;margin-top:10px}'+
  '.nh-box .nh-act button{margin:0;width:100%;padding:11px;border-radius:12px;border:none;font-size:14px;font-weight:700}'+
  '.nh-box .nh-ok{background:'+a+';color:#fff}.nh-box .nh-sec{background:#eef2f4;color:#1d2a30}.nh-box .nh-del{background:#fdecea;color:#c0392b}'+
  '.nh-box .nh-note{font-size:12px;color:#5d6b70;margin-top:6px}'+
  '.nh-daybox{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:'+(dark?'rgba(255,255,255,.06)':'#f4f8fb')+';border:1px solid '+(dark?'rgba(255,255,255,.14)':'#dde6ec')+'}'+
  '.nh-daybox .nh-t{font-size:12px;font-weight:700;margin-bottom:6px}'+
  '.nh-daybox .nh-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}'+
  '.nh-daybox .nh-row button{width:auto;flex:1 1 auto;margin:0;padding:7px 9px;border-radius:10px;font-size:12px}'+
  (dark?'':'.nh-daybox .nh-row button[data-v]{background:#fff;border:1px solid #c9d8e0;color:#1d2a30;font-weight:600}')+
  '.nh-in{display:flex!important;flex-direction:row!important;gap:8px;align-items:center;margin:8px 0}'+
  '.nh-in input{display:block;flex:1 1 0!important;width:auto!important;min-width:0!important;margin:0!important;text-align:center}'+
  '.nh-in b{display:inline!important;flex:none;margin:0;font-size:13px}'+
  '.nh-daybox .nh-in input{padding:8px;border-radius:10px;font-size:16px}'+
  '.nh-toggle{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;margin:10px 0;font-size:13px;line-height:1.35;cursor:pointer;'+
    'background:'+(dark?'rgba(255,255,255,.05)':'#f4f8fb')+';border:1px solid '+(dark?'rgba(255,255,255,.12)':'#dde6ec')+'}'+
  '.nh-toggle input{width:auto;margin:2px 0 0;flex:none}.nh-toggle small{display:block;opacity:.7;font-size:11px}'+
  '.nh-mois{margin:8px 0 0;padding:8px 12px;border-radius:12px;font-size:12px;line-height:1.4;'+
    'background:'+(dark?'rgba(255,255,255,.05)':'#f4f8fb')+';color:'+(dark?'#e6eef0':'#26424a')+'}';
  document.head.appendChild(st);
}

/* ── fenêtre générique ── */
function modal(html,onReady){
  var ov=document.createElement('div');ov.className='nh-ov';
  ov.innerHTML='<div class="nh-box" role="dialog" aria-modal="true">'+html+'</div>';
  ov.addEventListener('click',function(e){if(e.target===ov)close();});
  function close(){if(ov.parentNode)ov.parentNode.removeChild(ov);}
  document.body.appendChild(ov);if(onReady)onReady(ov.firstChild,close);return close;
}
function hmInputs(id,v){
  var H='',M='';if(v!=null){var t=Math.round(v*60);H=Math.floor(t/60);M=t%60||'';}
  return '<div class="nh-in"><input id="'+id+'H" type="number" inputmode="numeric" min="0" max="80" placeholder="0" value="'+H+'"><b>h</b>'+
         '<input id="'+id+'M" type="number" inputmode="numeric" min="0" max="59" placeholder="00" value="'+M+'"><b>min</b></div>';
}
function readHM(box,id){
  var h=box.querySelector('#'+id+'H').value, m=box.querySelector('#'+id+'M').value;
  if(h===''&&m==='')return null;
  var v=(+h||0)+(+m||0)/60;return Math.round(v*100)/100;
}
function setHM(box,id,v){var t=Math.round(v*60);box.querySelector('#'+id+'H').value=Math.floor(t/60);box.querySelector('#'+id+'M').value=(t%60)||'';}
function toast(m,t){try{(C.toast||window.toast)(m,t||'info');}catch(e){}}

/* ── calendrier : texte des cases + bandeaux semaine ── */
function cellHTML(s){
  if(!enabled())return '';
  var ws=weekStart(s);
  if(S.d[s]==null&&S.w[ws]!=null)return '';
  var x=dayVal(s);if(!x)return '';
  if(!x.v&&S.d[s]==null)return '';
  return '<span class="nh-cell">'+(x.src==='taiko'?'<span class="nh-tk">太 </span>':'')+fh(x.v)+'</span>';
}
function weekHTML(ws){
  var w=weekVal(ws), lim=seuil();
  if(w.v==null)return w.hs?'Total semaine · <b>'+fh(w.hs)+'</b> sup saisies':'Total semaine ?';
  var tot=w.v+w.hs;
  return 'Total semaine · <b>'+fh(tot)+'</b>'+(w.hs?' dont '+fh(w.hs)+' sup':'')+(w.src==='taiko'||w.src==='mixte'?' 太':'')+
    (w.v>lim+0.001?' <span class="nh-warn">⚠️</span>':'');
}
function decorate(cal){
  if(!cal)return;
  Array.prototype.slice.call(cal.querySelectorAll('.nh-week')).forEach(function(n){n.remove();});
  var old=document.getElementById('nhMois');if(old)old.remove();
  if(!enabled())return;
  css();
  var kids=Array.prototype.slice.call(cal.children).filter(function(n){
    return !n.classList.contains('weekday')&&n.id!=='calGuide'&&!n.classList.contains('nh-week')&&!/^1 ?\/ ?-1$/.test(n.style.gridColumn||'');
  });
  var rows=[];
  for(var i=0;i<kids.length;i+=7)rows.push(kids.slice(i,i+7));
  var semaines=[];
  rows.forEach(function(r){
    var ws=null;
    for(var j=0;j<r.length;j++){var s=r[j].getAttribute('data-iso');if(s){ws=addD(s,-j);break;}}
    if(!ws)return;
    var b=document.createElement('div');b.className='nh-week';
    var w=weekVal(ws),bt=document.createElement('button');bt.type='button';bt.className='nh-wbtn';
    if(w.v==null)bt.classList.add('nh-vide');
    bt.innerHTML=weekHTML(ws);bt.onclick=function(){openWeek(ws);};b.appendChild(bt);
    var last=r[r.length-1];
    if(last.nextSibling)cal.insertBefore(b,last.nextSibling);else cal.appendChild(b);
    semaines.push(ws);
  });
  /* récap de la PÉRIODE DE PAIE affichée (clôtures du module) */
  try{periodCard(cal);}catch(e){}
}

/* ── récap de la période de paie ──
   Les heures sup et leurs montants suivent les clôtures du module (ex. période de
   décembre close le 13/12) ; la base payée reste la base mensualisée. */
function periodCard(cal){
  var P=C.getPeriod&&C.getPeriod();if(!P||!P.start||!P.end)return;
  var a=P.start,b=P.end,nv=0,hs=0,vides=0,hsB=0,ws=weekStart(a),guard=0;
  while(ws<=b&&guard++<10){
    var days=weekDays(ws).filter(function(s){return inRange(s,a,b);});
    var whs=0;days.forEach(function(s){whs+=(+C.getHS(s)||0);});
    hs+=whs;
    var w=weekVal(ws);
    if(w.v==null)vides++;
    else if(w.src==='semaine')nv+=w.v*days.length/7;
    else days.forEach(function(s){var x=(S.w[ws]==null)?dayVal(s):null;if(x)nv+=x.v;});
    ws=addD(ws,7);
  }
  nv=Math.round(nv*100)/100;hs=Math.round(hs*100)/100;
  var box=document.createElement('details');box.id='nhMois';box.className='nh-mois';if(periodCard.open)box.open=true;
  box.addEventListener('toggle',function(){periodCard.open=box.open;});
  box.innerHTML='<summary>🕘 Période du '+dCourt(a)+' au '+dCourt(b)+' · '+fh(nv+hs)+' travaillées</summary><div class="nh-det">'+
    fh(nv)+' normales + '+fh(hs)+' sup = <b>'+fh(nv+hs)+'</b>'+
    (vides?'<br><span style="opacity:.75">'+vides+' semaine'+(vides>1?'s':'')+' sans total indiqué.</span>':'')+
    '<br>Base payée chaque mois : <b>'+fh(baseMens())+'</b> ('+fh(seuil())+' × 52 ÷ 12), quel que soit le nombre de semaines de la période.'+
    '<br><span style="opacity:.6;font-size:11px">Pour information : seul le bulletin de paie fait foi.</span></div>';
  cal.parentNode.insertBefore(box,cal.nextSibling);
}

/* jour où ajouter les heures sup de la semaine : dernier jour avec des heures
   (saisies ou Taiko), sinon le 5e jour de la semaine ; jamais un jour verrouillé */
function jourHS(ws){
  var days=weekDays(ws).filter(function(s){return !(C.isLocked&&C.isLocked(s));});
  for(var i=days.length-1;i>=0;i--){var x=dayVal(days[i]);if(x&&x.v>0)return days[i];}
  var cinq=addD(ws,4);return days.indexOf(cinq)>=0?cinq:(days[days.length-1]||null);
}
var JOURS=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];

/* ── fenêtre semaine ── */
function openWeek(ws){
  var days=weekDays(ws), w=weekVal(ws), lim=seuil();
  if(C.isLocked&&days.every(function(s){return C.isLocked(s);})){toast('🔒 Période verrouillée','warn');return;}
  var t=taiko(),tk=0,tkn=0;
  if(t)days.forEach(function(s){if(t[s]!=null){tk+=+t[s];tkn++;}});
  var libres=days.filter(function(s){return !(C.isLocked&&C.isLocked(s));});
  var bloq=0;days.forEach(function(s){if(libres.indexOf(s)<0)bloq+=(+C.getHS(s)||0);});
  /* ce qui est saisi jour par jour et sera remplacé */
  var nJ=days.filter(function(s){return S.d[s]!=null;}).length, hsJ=0, nHS=0;
  libres.forEach(function(s){var h=+C.getHS(s)||0;if(h){hsJ+=h;nHS++;}});
  var cible=jourHS(ws), id='nhW'+(++uid);
  var tot0=w.v!=null?Math.round((w.v+w.hs)*100)/100:lim+w.hs;
  var opts=libres.map(function(s){return '<option value="'+s+'"'+(s===cible?' selected':'')+'>'+JOURS[pISO(s).getDay()]+' '+dCourt(s)+'</option>';}).join('');
  var remplace=(nJ||nHS)&&S.w[ws]==null;
  modal(
    '<h3>🕘 Total de la semaine</h3>'+
    '<div class="nh-sub">Du '+dCourt(ws)+' au '+dCourt(days[6])+' · heures travaillées, heures sup comprises</div>'+
    '<div class="nh-q"><button data-v="'+lim+'">'+fh(lim)+' (semaine habituelle)</button>'+
      (tkn?'<button data-v="'+(Math.round(tk*100)/100)+'">太 Taiko : '+fh(tk)+'</button>':'')+
      '<button data-v="0">0 h (pas travaillé)</button></div>'+
    hmInputs(id,tot0)+
    '<div class="nh-calc nh-note" style="font-weight:600;color:#1d2a30"></div>'+
    '<div class="nh-jour" style="display:none;margin:6px 0"><div class="nh-note" style="margin:0 0 4px">Mettre les heures sup sur :</div>'+
      '<select class="nh-sel" style="width:100%;padding:9px;border-radius:10px;border:1px solid #c9d8e0;font-size:15px;background:#fff;color:#1d2a30">'+opts+'</select></div>'+
    (remplace?'<div class="nh-note" style="color:#c0392b;font-weight:600">⚠️ Ce total remplace ce que tu as saisi jour par jour cette semaine'+
      (nHS?' : '+fh(hsJ)+' d’heures sup sur '+nHS+' jour'+(nHS>1?'s':''):'')+(nJ?(nHS?' et ':' : ')+'les heures normales de '+nJ+' jour'+(nJ>1?'s':''):'')+'.</div>':'')+
    (bloq?'<div class="nh-note">'+fh(bloq)+' d’heures sup sont dans une période verrouillée : elles sont gardées et comptées.</div>':'')+
    '<div class="nh-note">Le total fait foi : les heures sup de la semaine sont remplacées par l’excédent, sur un seul jour. Le saisir à nouveau le remplace, sans cumuler.</div>'+
    '<div class="nh-act"><button class="nh-ok">'+(remplace?'Remplacer la semaine':'Valider')+'</button>'+
      (S.w[ws]!=null?'<button class="nh-sec nh-detail">Revenir au détail jour par jour</button>':'')+
      '<button class="nh-sec nh-cancel">Annuler</button></div>',
    function(box,close){
      var calc=box.querySelector('.nh-calc'),jr=box.querySelector('.nh-jour'),sel=box.querySelector('.nh-sel');
      function plan(){
        var v=readHM(box,id);
        if(v==null){calc.textContent='';jr.style.display='none';return null;}
        var exc=Math.max(0,Math.round((v-lim)*100)/100), put=Math.max(0,Math.round((exc-bloq)*100)/100);
        var nv=Math.round((v-Math.max(exc,bloq))*100)/100;if(nv<0)nv=0;
        calc.textContent=fh(nv)+' normales + '+fh(Math.max(exc,bloq))+' sup'+(put?' ('+fh(put)+' le jour choisi)':'');
        jr.style.display=put?'':'none';
        return {v:v,put:put,nv:nv};
      }
      Array.prototype.forEach.call(box.querySelectorAll('.nh-q button'),function(b){b.onclick=function(){setHM(box,id,+b.getAttribute('data-v'));plan();};});
      Array.prototype.forEach.call(box.querySelectorAll('.nh-in input'),function(i){i.addEventListener('input',plan);});
      plan();
      box.querySelector('.nh-cancel').onclick=close;
      var det=box.querySelector('.nh-detail');
      if(det)det.onclick=function(){delete S.w[ws];save();close();C.refresh();};
      box.querySelector('.nh-ok').onclick=function(){
        var p=plan();if(!p){toast('Indique un nombre d’heures','warn');return;}
        if(p.v>80){toast('⛔ Plus de 80 h : vérifie la saisie','error');return;}
        var map={},j=p.put?(sel&&sel.value):null;
        if(p.put&&!j){toast('⛔ Aucun jour libre pour les heures sup','error');return;}
        libres.forEach(function(s){map[s]=0;});if(j)map[j]=p.put;
        var ok=false;try{ok=!C.setWeekHS||C.setWeekHS(map)!==false;}catch(e){ok=false;}
        if(!ok){toast('⛔ Heures sup non enregistrées (période verrouillée ?)','error');return;}
        S.w[ws]=p.nv;days.forEach(function(s){delete S.d[s];});save();close();C.refresh();
        toast('✅ '+fh(p.nv)+' normales'+(p.put?' + '+fh(p.put)+' sup le '+dCourt(j):'')+' — semaine remplacée','success');
      };
    });
}

/* ── encart dans la fenêtre du jour ── */
function fillDayBox(s,boxEl){
  var host=boxEl||document.getElementById(C.dayBoxId);
  if(!host)return;
  if(!enabled()||!s){host.innerHTML='';host.style.display='none';return;}
  css();host.style.display='';host.className='nh-daybox';
  var x=dayVal(s), ws=weekStart(s), t=taiko(), tk=t&&t[s]!=null?+t[s]:null, id='nhD'+(++uid);
  var cur=S.d[s]!=null?+S.d[s]:null;
  host.innerHTML='<div class="nh-t">🕘 Heures normales ce jour'+(S.w[ws]!=null?' <span style="font-weight:400;opacity:.75">(semaine saisie en total : '+fh(S.w[ws])+')</span>':(x&&x.src==='taiko'?' <span style="font-weight:400;opacity:.75">(planning Taiko)</span>':''))+'</div>'+
    '<div class="nh-row"><button type="button" data-v="'+jourHabituel()+'">'+fh(jourHabituel())+'</button>'+
    (tk!=null?'<button type="button" data-v="'+tk+'">太 '+fh(tk)+'</button>':'')+
    '<button type="button" data-v="0">0 h</button></div>'+
    hmInputs(id,cur!=null?cur:(x?x.v:null))+
    '<div class="nh-row"><button type="button" class="nh-save" style="background:'+(C.accent||'#2196a6')+';color:#fff;font-weight:700">Enregistrer les heures normales</button>'+
    (cur!=null?'<button type="button" class="nh-clear secondary">Effacer</button>':'')+'</div>';
  host.querySelectorAll('.nh-row button[data-v]').forEach(function(b){b.onclick=function(){setHM(host,id,+b.getAttribute('data-v'));};});
  host.querySelector('.nh-save').onclick=function(){
    var v=readHM(host,id);if(v==null){toast('Indique un nombre d’heures','warn');return;}
    if(v>24){toast('⛔ Plus de 24 h sur une journée','error');return;}
    var had=S.w[ws]!=null;S.d[s]=v;if(had)delete S.w[ws];save();
    if(C.closeDay)C.closeDay();C.refresh();
    toast(had?'✅ Enregistré — total de la semaine recalculé jour par jour':'✅ Heures normales enregistrées','success');
  };
  var cl=host.querySelector('.nh-clear');
  if(cl)cl.onclick=function(){delete S.d[s];save();if(C.closeDay)C.closeDay();C.refresh();toast('Heures normales du jour effacées','info');};
}

/* Saisie « Heures travaillées » : le reste après les heures sup = heures normales */
function fromWorked(s,worked,hs){
  if(!enabled()||!s)return;
  var v=Math.max(0,Math.round((+worked-(+hs||0))*100)/100);
  var ws=weekStart(s);S.d[s]=v;if(S.w[ws]!=null)delete S.w[ws];save();
}

/* ── interrupteur (réglages) ── */
function toggleHTML(){
  return '<label class="nh-toggle"><input type="checkbox" id="nhToggle"'+(enabled()?' checked':'')+'>'+
    '<span><b>🕘 Afficher aussi mes heures normales</b><small>Pour voir chaque semaine tes heures normales à côté de tes heures sup. '+
    'Pour information : ça ne change pas le calcul des heures sup.</small></span></label>';
}
function mountToggle(host){
  if(!host)return;css();host.innerHTML=toggleHTML();
  var cb=host.querySelector('#nhToggle');
  cb.onchange=function(){C.setOn(cb.checked);C.refresh();
    toast(cb.checked?'🕘 Heures normales affichées sous chaque semaine':'Heures normales masquées (rien n’est effacé)','info');};
}

window.HeuresNormales={
  init:function(cfg){C=cfg;load();css();if(cfg.toggleHost)mountToggle(document.getElementById(cfg.toggleHost));},
  enabled:enabled, cellHTML:cellHTML, decorate:decorate, fillDayBox:fillDayBox, fromWorked:fromWorked,
  openWeek:openWeek, weekStart:weekStart, weekVal:weekVal, baseMensuelle:baseMens,
  exportData:function(){return (Object.keys(S.d).length||Object.keys(S.w).length)?JSON.parse(JSON.stringify(S)):null;},
  importData:function(o){if(o&&typeof o==='object'){load();Object.assign(S.d,o.d||{});Object.assign(S.w,o.w||{});save();}},
  reload:function(){load();},
  mount:function(id){mountToggle(document.getElementById(id));}
};
})();
