/* SimulHeures — ouverture d'un nouvel exercice (26/09/2026)
   Commun à heures (M1), paye (M2), module5 (Mizuki) et module6 (Zenji).
   Pose une seule question au moment d'ouvrir l'exercice suivant :
   - clôtures automatiques : le dernier jour de fin de semaine de chaque mois
     (dernier dimanche pour une semaine lundi → dimanche, dernier mardi pour
     une semaine mercredi → mardi…) ;
   - ou saisie manuelle : le module ouvre ensuite son propre écran de clôtures.
   Ne lit ni ne modifie aucune donnée : le module applique le choix.

   hsNouvelExercice.demander({
     titre:'Exercice 2027', couleur:'#2196a6',
     finSemaine:0,                       // jour JS de fin de semaine (0 = dimanche)
     texteManuel:'…',                    // facultatif
     auto:function(){…}, manuel:function(){…}
   });
   hsNouvelExercice.clotures(moisDebut, anneeDebut, finSemaine) → 12 dates ISO
*/
(function(){
  var ID='hs-nouvel-exercice';
  var JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* Dernier jour « finSemaine » (0-6) du mois (mois 0-11) */
  function dernier(annee,mois,finSemaine){
    var d=new Date(annee,mois+1,0,12);
    while(d.getDay()!==finSemaine)d.setDate(d.getDate()-1);
    return iso(d);
  }
  /* 12 clôtures mensuelles, du mois (0-11) de l'année donnés, dans l'ordre */
  function clotures(moisDebut,anneeDebut,finSemaine){
    var out=[];
    for(var i=0;i<12;i++){var m=(moisDebut+i)%12,a=anneeDebut+Math.floor((moisDebut+i)/12);out.push(dernier(a,m,finSemaine));}
    return out;
  }
  /* Le mois qui suit celui d'une date ISO → {mois, annee} */
  function moisSuivant(isoDate){var d=new Date(isoDate+'T12:00:00');d.setDate(1);d.setMonth(d.getMonth()+1);return {mois:d.getMonth(),annee:d.getFullYear()};}

  function fermer(){var o=document.getElementById(ID);if(o&&o.parentNode)o.parentNode.removeChild(o);try{document.body.style.overflow='';}catch(e){}}

  function demander(o){
    fermer();
    var coul=o.couleur||'#2196a6',fin=(o.finSemaine==null?0:o.finSemaine),jour=JOURS[fin];
    var debSem=JOURS[(fin+1)%7];
    var d=document.createElement('div');d.id=ID;d.setAttribute('role','dialog');d.setAttribute('aria-label',o.titre||'Nouvel exercice');
    d.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,14,22,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px 12px calc(16px + env(safe-area-inset-bottom,0px));font-family:inherit;overflow-y:auto';
    var carte=function(a,ico,tit,txt,principal){return '<button type="button" data-a="'+a+'" style="display:flex;gap:12px;align-items:flex-start;text-align:left;width:100%;margin:0;padding:14px;border-radius:14px;cursor:pointer;font:inherit;'
      +(principal?'border:2px solid '+coul+';background:#fff;':'border:1.5px solid #dfe4ea;background:#fafbfc;')+'">'
      +'<span style="font-size:24px;line-height:1">'+ico+'</span><span><b style="display:block;font-size:15px;color:#10202f;margin-bottom:3px">'+tit+'</b>'
      +'<span style="font-size:12.5px;color:#55606e;line-height:1.45">'+txt+'</span></span></button>';};
    d.innerHTML='<div style="width:100%;max-width:460px;margin:auto 0 0;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.45)">'
      +'<div style="background:linear-gradient(160deg,'+coul+',#0f1c2b);color:#fff;padding:18px">'
      +'<div style="font-size:13px;opacity:.85;font-weight:600">Nouvel exercice</div>'
      +'<div style="font-size:22px;font-weight:800;line-height:1.2">'+esc(o.titre||'')+'</div></div>'
      +'<div style="padding:16px 18px 6px;font-size:13.5px;color:#10202f;font-weight:700">'+esc(o.question||'Tes dates de clôture :')+'</div>'
      +'<div style="display:flex;flex-direction:column;gap:10px;padding:0 18px">'
      +carte('auto','📅',esc(o.titreAuto||'Automatiques'),o.texteAuto?esc(o.texteAuto):'Le dernier <b>'+jour+'</b> de chaque mois (ta semaine va du '+debSem+' au '+jour+'). Aucune semaine coupée en deux.',true)
      +carte('manuel','✏️',esc(o.titreManuel||'Je saisis mes dates'),esc(o.texteManuel||'Les dates automatiques sont préremplies, tu corriges celles de ton employeur.'),false)
      +'</div><div style="padding:12px 18px 18px;text-align:center"><button type="button" data-a="x" style="border:none;background:none;color:#7a8594;font-size:13px;font-weight:600;padding:8px;margin:0">Annuler</button></div></div>';
    d.addEventListener('click',function(e){
      var b=e.target&&e.target.closest?e.target.closest('[data-a]'):null;
      if(e.target===d){fermer();return;}
      if(!b)return;var a=b.getAttribute('data-a');
      fermer();
      try{if(a==='auto'&&o.auto)o.auto();else if(a==='manuel'&&o.manuel)o.manuel();}catch(err){}
    });
    document.body.appendChild(d);
    try{document.body.style.overflow='hidden';}catch(e){}
  }
  window.hsNouvelExercice={demander:demander,clotures:clotures,dernier:dernier,moisSuivant:moisSuivant,fermer:fermer,jour:function(n){return JOURS[n];}};
})();
