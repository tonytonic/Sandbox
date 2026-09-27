/* SimulHeures — journal des erreurs techniques (01/10/2026)
   Garde sur l'appareil les 10 dernières erreurs JavaScript (message, fichier, ligne, page, date)
   pour le rapport technique de « Nous contacter ». Rien n'est envoyé : l'utilisateur choisit
   de joindre le rapport à son mail. Aucune donnée saisie n'y figure. */
(function(){
  var K='SH_ERR_LOG',MAX=10;
  function court(s,n){s=String(s==null?'':s).replace(/\s+/g,' ');return s.length>n?s.slice(0,n)+'…':s;}
  function fichier(u){try{return String(u||'').split('?')[0].split('/').slice(-2).join('/');}catch(e){return '';}}
  function noter(msg,src,ligne){
    try{
      var l=JSON.parse(localStorage.getItem(K)||'[]');if(!Array.isArray(l))l=[];
      var page=fichier(location.pathname)||'?',n=new Date(),z=function(x){return ('0'+x).slice(-2);},e={d:n.getFullYear()+'-'+z(n.getMonth()+1)+'-'+z(n.getDate())+' '+z(n.getHours())+':'+z(n.getMinutes()),p:page,m:court(msg,140),f:fichier(src),l:ligne||0};
      var der=l[l.length-1];if(der&&der.m===e.m&&der.p===e.p)return;   // pas de doublon en rafale
      l.push(e);while(l.length>MAX)l.shift();localStorage.setItem(K,JSON.stringify(l));
    }catch(x){}
  }
  window.addEventListener('error',function(ev){noter(ev.message||(ev.error&&ev.error.message)||'Erreur',ev.filename,ev.lineno);});
  window.addEventListener('unhandledrejection',function(ev){var r=ev.reason;noter('Promesse : '+((r&&r.message)||r),'',0);});
})();
