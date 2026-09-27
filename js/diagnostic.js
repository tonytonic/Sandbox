/* SimulHeures — rapport technique pour « Nous contacter » (01/10/2026)
   hsDiagnostic() → Promise<string> : un texte court que l'utilisateur peut joindre à son mail.
   Contenu TECHNIQUE uniquement : version, appareil, stockage, état des exercices (dates, nombres
   de jours saisis), réglages de calcul, migrations, dernières erreurs.
   Jamais : prénom, e-mail, nom des contrats ou des employeurs, taux horaire, montants, notes,
   textes saisis, ni aucune adresse de dépôt de code. */
(function(){
  var re=/^\d{4}-\d{2}-\d{2}$/;
  function jget(k){try{var v=localStorage.getItem(k);return v===null?null:JSON.parse(v);}catch(e){return undefined;}}
  function cles(rx){var o=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i),m=rx.exec(k||'');if(m)o.push(m);}return o;}
  function fr(d){return d&&re.test(d)?d.split('-').reverse().join('/'):'?';}
  function nbDates(o){return o&&typeof o==='object'?Object.keys(o).filter(function(k){return re.test(k)||/^\d{4}-W\d{2}$/.test(k);}).length:0;}
  function systeme(){var u=navigator.userAgent||'',m;
    if((m=/iPhone OS (\d+)[_.](\d+)/.exec(u)))return 'iPhone · iOS '+m[1]+'.'+m[2];
    if((m=/iPad.*OS (\d+)[_.](\d+)/.exec(u)))return 'iPad · iPadOS '+m[1]+'.'+m[2];
    if((m=/Android (\d+(\.\d+)?)/.exec(u)))return 'Android '+m[1];
    if(/Macintosh/.test(u))return navigator.maxTouchPoints>1?'iPad (mode ordinateur)':'Mac';
    if(/Windows/.test(u))return 'Windows';return 'Autre';}
  function navig(){var u=navigator.userAgent||'',m;
    if((m=/(?:CriOS|Chrome)\/(\d+)/.exec(u))&&!/Edg\//.test(u))return 'Chrome '+m[1];
    if((m=/Edg\/(\d+)/.exec(u)))return 'Edge '+m[1];
    if((m=/(?:FxiOS|Firefox)\/(\d+)/.exec(u)))return 'Firefox '+m[1];
    if((m=/Version\/(\d+(\.\d+)?).*Safari/.exec(u)))return 'Safari '+m[1];
    return '?';}
  function versionSW(){return new Promise(function(res){var sw=navigator.serviceWorker;
    if(!sw||!sw.controller||!window.MessageChannel){res('');return;}
    var ch=new MessageChannel(),t=setTimeout(function(){res('');},1500);
    ch.port1.onmessage=function(ev){clearTimeout(t);res((ev.data&&ev.data.version)||'');};
    try{sw.controller.postMessage({type:'SH_VERSION'},[ch.port2]);}catch(e){clearTimeout(t);res('');}});}

  window.hsDiagnostic=async function(){
    var L=[],A=function(s){L.push(s);};
    var st=(navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches))?'appli installée':'navigateur';
    A('RAPPORT TECHNIQUE — '+new Date().toLocaleString('fr-FR'));
    // ── Appli et appareil
    var v=await versionSW(),nbCache='?',attente=false;
    try{if(window.caches){var ks=await caches.keys(),c=ks.filter(function(k){return /^heuressup-cache-v/.test(k);}).sort().pop();
      if(!v&&c)v=c.replace('heuressup-cache-','')+' (cache)';if(c){nbCache=(await (await caches.open(c)).keys()).length;}}}catch(e){}
    try{var reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();attente=!!(reg&&(reg.waiting||reg.installing));}catch(e){}
    A('Version : '+(v||'inconnue')+(attente?' (mise à jour en attente)':'')+' · '+st);
    A('Appareil : '+systeme()+' · '+navig()+' · écran '+screen.width+'×'+screen.height+' · '+(navigator.onLine?'en ligne':'hors ligne'));
    var sz=0;try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);sz+=(k.length+(localStorage.getItem(k)||'').length)*2;}}catch(e){}
    var prot='?';try{if(navigator.storage&&navigator.storage.persisted)prot=(await navigator.storage.persisted())?'protégé':'non protégé';}catch(e){}
    A('Stockage : '+Math.round(sz/1024)+' Ko · '+localStorage.length+' clés · '+prot+' · fichiers hors ligne : '+nbCache);
    var bad=[];for(var j=0;j<localStorage.length;j++){var kk=localStorage.key(j),vv=localStorage.getItem(kk)||'';if(/^\s*[\[{]/.test(vv)){try{JSON.parse(vv);}catch(e){bad.push(kk);}}}
    A('Données illisibles : '+(bad.length?bad.join(', '):'aucune'));
    var lb=(localStorage.getItem('SH_LAST_BACKUP')||'').slice(0,10);
    A('Dernière sauvegarde : '+(lb?fr(lb):'aucune'));
    var idcc=localStorage.getItem('CCN_IDCC');A('CCN du menu : '+(jget('CCN_CUSTOM')?'accord personnalisé':idcc?'IDCC '+idcc:'droit commun'));

    // ── Compteur annuel (M1)
    var ex=cles(/^EXERCISE_START_(\d{4})$/).map(function(m){return m[1];}).sort();
    if(ex.length){A('');A('[Compteur annuel] exercice ouvert : '+(localStorage.getItem('ACTIVE_YEAR_SUFFIX')||'?'));
      ex.forEach(function(y){var d=jget('DATA_REPORT_'+y),deb=(localStorage.getItem('EXERCISE_START_'+y)||'').slice(0,10),fin=(localStorage.getItem('ANNUAL_DATE_'+y)||'').slice(0,10),cl=jget('CLOSURES_REPORT_'+y),hors=0;
        if(d&&typeof d==='object')Object.keys(d).forEach(function(dk){if(re.test(dk)&&re.test(deb)&&re.test(fin)&&(dk<deb||dk>fin))hors++;});
        A('  '+y+' : '+fr(deb)+' → '+fr(fin)+' · '+nbDates(d)+' jours · '+(Array.isArray(cl)?cl.length:0)+' clôtures'+(hors?' · '+hors+' hors exercice':'')+(localStorage.getItem('AUTO_FERIE_'+y)==='true'?' · fériés auto':'')+(d===undefined?' · ILLISIBLE':''));});}

    // ── Heures mensualisées (M2)
    var ys=cles(/^CA_HS_TRACKER_V1_DATA_(\d{4})$/).map(function(m){return m[1];}).sort();
    if(ys.length){var s2=jget('CA_HS_TRACKER_V1_SETTINGS')||{};A('');A('[Heures mensualisées] premier mois de l\'exercice : '+(parseInt(s2.exoMois,10)||1));
      ys.forEach(function(y){var d=jget('CA_HS_TRACKER_V1_DATA_'+y),mois=0,jours=0;if(d&&typeof d==='object')Object.keys(d).forEach(function(mk){if(/^\d{4}-\d{2}$/.test(mk)){mois++;jours+=Object.keys((d[mk]||{}).days||{}).length;}});
        var ch=localStorage.getItem('M2_RELIQUAT_CHOIX_'+y),vers=localStorage.getItem('M2_RELIQUAT_VERS_'+y);
        A('  '+y+' : '+mois+' mois · '+jours+' jours'+(ch?' · reste '+(ch==='report'?'reporté':vers?'reporté dans '+vers:'gardé'):'')+(d===undefined?' · ILLISIBLE':''));});}

    // ── Mizuki (M5) — ni nom de contrat, ni taux, ni montant
    var nb5=0;[1,2,3].forEach(function(n){var p=n===1?'M5_':'M5_C'+n+'_',c=jget(p+'CONTRACT');if(!c||!(c.hoursBase>0))return;
      if(!nb5){A('');A('[Mizuki] contrat affiché : '+(localStorage.getItem('M5_ACTIVE_CONTRACT')||'1'));}nb5++;
      var yrs=cles(new RegExp('^'+p+'DATA_(\\d{4})$')).map(function(m){return m[1];}).sort(),info=[];
      yrs.forEach(function(y){info.push(y+' : '+nbDates(jget(p+'DATA_'+y))+' saisies');});
      var cl=Object.values(c.cloturesDates||{}).filter(Boolean).sort(),hist=jget(p+'EXERCICES')||{},rep=jget(p+'REPORT_EXOS')||{};
      A('  Contrat '+n+' : mode '+(c.modeCalcul||'HEBDO')+' · unité '+((c.dureeContrat&&c.dureeContrat.unite)||'S')+' · '+(c.idcc>0?'IDCC '+c.idcc:'droit commun')+' · plafond '+Math.round((c.cap||0.1)*100)+' %'
        +' · exercice '+fr(c.exerciceStart)+' → '+fr(cl[cl.length-1])+' · '+Object.keys(hist).length+' exercice(s) passé(s) · '+Object.keys(rep).length+' choix de report');
      if(info.length)A('    '+info.join(' · '));});

    // ── Zenji (M6)
    var reg=localStorage.getItem('M6_REGIME');
    if(reg){A('');A('[Zenji] régime : '+reg);
      ['forfait_jours','forfait_heures','cadre_dirigeant'].forEach(function(r){var c=jget('M6_'+r+'_CONTRACT');if(!c)return;
        var yrs=cles(new RegExp('^M6_'+r+'_(\\d{4})_DATA$')).map(function(m){return m[1];}).sort();
        A('  '+r+' : exercice en cours '+(c.dateDebutExercice?fr(c.dateDebutExercice)+' → '+fr(c.dateFinExercice):'année civile')+' · plafond '+(c.plafond||'—'));
        yrs.forEach(function(y){var sn=jget('M6_'+r+'_'+y+'_CONTRACT')||{},d=jget('M6_'+r+'_'+y+'_DATA');
          A('    '+y+' : '+(sn.dateDebutExercice?fr(sn.dateDebutExercice)+' → '+fr(sn.dateFinExercice):'année civile')+' · '+nbDates(d)+' saisies');});});}

    // ── Autres modules (présence seulement)
    var autres=[];
    if(cles(/^DTE_/).length)autres.push('M4');
    if(cles(/^M7_|^MIMIZUKU/i).length)autres.push('M7');
    if(localStorage.getItem('TAIKO_V1'))autres.push('Taiko');
    if(cles(/^FOX_|^RPG_/i).length)autres.push('Fox');
    if(autres.length){A('');A('Autres modules utilisés : '+autres.join(', '));}

    // ── Migrations et erreurs
    var mig=['M6_MIGR_EXO_V1','M6_EXO_CONTRATS_V1','M6_EXO_NOM_V2','M6_EXO_ALIGN_V4'].filter(function(k){return localStorage.getItem(k);});
    A('');A('Migrations faites : '+(mig.length?mig.join(', '):'aucune'));
    var er=jget('SH_ERR_LOG');
    if(Array.isArray(er)&&er.length){A('Dernières erreurs :');er.slice(-10).forEach(function(x){A('  '+x.d+' · '+x.p+' · '+x.m+(x.f?' ('+x.f+':'+x.l+')':''));});}
    else A('Dernières erreurs : aucune');
    return L.join('\n');
  };
})();
