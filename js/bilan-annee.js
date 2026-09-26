/* SimulHeures — bilan de fin d'année (26/09/2026)
   Commun à heures, paye, module5 (Mizuki) et module6 (Zenji). Pas dans Fox.
   Affiche « Mon année AAAA » au moment de passer à l'exercice suivant, avec un
   bouton pour l'enregistrer en image (partage ou téléchargement : l'utilisateur
   choisit ce qu'il en fait). Ne lit ni ne modifie aucune donnée : chaque module
   calcule ses chiffres et les passe ici.

   hsBilanAnnee.ouvrir({
     annee:'2026', module:'Compteur annuel', couleur:'#2196a6',
     image:'../images/xxx.png',            // facultatif
     lignes:[['Heures sup', '187h'], ...],
     note:'…',                             // facultatif
     continuer:{libelle:'Ouvrir 2027', action:function(){…}}  // facultatif
   });
*/
(function(){
  var ID='hs-bilan-annee';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fermer(){var o=document.getElementById(ID);if(o&&o.parentNode)o.parentNode.removeChild(o);try{document.body.style.overflow='';}catch(e){}}

  function chargerImage(src){return new Promise(function(ok){if(!src)return ok(null);var i=new Image();i.onload=function(){ok(i);};i.onerror=function(){ok(null);};i.src=src;});}
  function coupe(ctx,txt,max){var mots=String(txt).split(' '),l=[],c='';
    mots.forEach(function(m){var t=c?c+' '+m:m;if(ctx.measureText(t).width>max&&c){l.push(c);c=m;}else c=t;});if(c)l.push(c);return l;}

  /* Image 1080 px de large, hauteur adaptée au nombre de lignes, dessinée sans bibliothèque */
  function dessiner(o){
    return chargerImage(o.image).then(function(img){
      var F='system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
      var W=1080,lignes=(o.lignes||[]).slice(0,9),by=330,pas=96,bh=lignes.length*pas+70,H=Math.max(1080,by+bh+200);
      var cv=document.createElement('canvas');cv.width=W;cv.height=H;
      var x=cv.getContext('2d'),coul=o.couleur||'#2196a6';
      var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,coul);g.addColorStop(1,'#0f1c2b');
      x.fillStyle=g;x.fillRect(0,0,W,H);
      var iw=0;
      if(img){var ih=250;iw=img.width*ih/img.height;if(iw>280){iw=280;ih=img.height*iw/img.width;}x.drawImage(img,W-iw-60,50+(250-ih)/2,iw,ih);}
      var maxT=W-70-(iw?iw+90:70);
      x.fillStyle='#fff';x.textBaseline='top';
      x.font='700 42px '+F;x.fillText(coupe(x,o.module||'',maxT)[0],70,92);
      var fs=100;do{x.font='800 '+fs+'px '+F;fs-=4;}while(x.measureText('Mon année '+o.annee).width>maxT&&fs>50);
      x.fillText('Mon année '+o.annee,70,150);
      var bx=60,bw=W-120,r=40;
      x.fillStyle='rgba(255,255,255,0.96)';
      x.beginPath();x.moveTo(bx+r,by);x.arcTo(bx+bw,by,bx+bw,by+bh,r);x.arcTo(bx+bw,by+bh,bx,by+bh,r);x.arcTo(bx,by+bh,bx,by,r);x.arcTo(bx,by,bx+bw,by,r);x.closePath();x.fill();
      var y=by+48;
      lignes.forEach(function(l,i){
        x.fillStyle='#55606e';x.font='500 38px '+F;x.fillText(coupe(x,l[0],520)[0],bx+50,y+6);
        x.fillStyle='#10202f';x.font='800 48px '+F;x.textAlign='right';x.fillText(String(l[1]),bx+bw-50,y);x.textAlign='left';
        y+=pas;
        if(i<lignes.length-1){x.fillStyle='rgba(16,32,47,0.08)';x.fillRect(bx+50,y-28,bw-100,2);}
      });
      x.fillStyle='rgba(255,255,255,0.9)';x.font='700 36px '+F;x.fillText('SimulHeures',70,H-120);
      x.font='400 28px '+F;x.fillStyle='rgba(255,255,255,0.65)';x.fillText('Chiffres indicatifs, calculés à partir de mes saisies',70,H-72);
      return cv;
    });
  }
  function enregistrer(o,btn){
    var t=btn.textContent;btn.disabled=true;btn.textContent='Préparation…';
    dessiner(o).then(function(cv){
      cv.toBlob(function(b){
        btn.disabled=false;btn.textContent=t;if(!b)return;
        var nom='simulheures-mon-annee-'+o.annee+'.png';
        try{var f=new File([b],nom,{type:'image/png'});
          if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Mon année '+o.annee}).catch(function(){});return;}
        }catch(e){}
        var u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=nom;document.body.appendChild(a);a.click();
        setTimeout(function(){a.remove();URL.revokeObjectURL(u);},400);
      },'image/png');
    }).catch(function(){btn.disabled=false;btn.textContent=t;});
  }

  function ouvrir(o){
    if(!o||!o.lignes||!o.lignes.length){if(o&&o.continuer&&o.continuer.action)o.continuer.action();return;}
    fermer();
    var coul=o.couleur||'#2196a6';
    var d=document.createElement('div');d.id=ID;d.setAttribute('role','dialog');d.setAttribute('aria-label','Mon année '+o.annee);
    d.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,14,22,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px 12px calc(16px + env(safe-area-inset-bottom,0px));font-family:inherit;-webkit-overflow-scrolling:touch;overflow-y:auto';
    var h='<div style="width:100%;max-width:460px;margin:auto 0 0;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.45)">'
      +'<div style="background:linear-gradient(160deg,'+coul+',#0f1c2b);color:#fff;padding:18px 18px 16px;display:flex;gap:12px;align-items:center">'
      +'<div style="flex:1;min-width:0"><div style="font-size:13px;opacity:.85;font-weight:600">'+esc(o.module)+'</div>'
      +'<div style="font-size:26px;font-weight:800;line-height:1.15">Mon année '+esc(o.annee)+'</div></div>'
      +(o.image?'<img src="'+esc(o.image)+'" alt="" style="height:64px;width:auto;flex-shrink:0" onerror="this.remove()">':'')+'</div>'
      +'<div style="padding:6px 18px 4px">';
    o.lignes.forEach(function(l,i){h+='<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:10px 0;'+(i?'border-top:1px solid #eef1f4;':'')+'">'
      +'<span style="font-size:13.5px;color:#55606e">'+esc(l[0])+'</span><b style="font-size:16px;color:#10202f;white-space:nowrap">'+esc(l[1])+'</b></div>';});
    h+='</div><div style="padding:0 18px;font-size:11.5px;color:#7a8594;line-height:1.45">'+esc(o.note||'Chiffres indicatifs, calculés à partir de tes saisies.')+'</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px;padding:14px 18px 18px">'
      +'<button type="button" data-a="img" style="padding:12px;border-radius:12px;border:1.5px solid '+coul+';background:#fff;color:'+coul+';font-weight:800;font-size:14.5px;margin:0">📷 Enregistrer en image</button>'
      +(o.continuer?'<button type="button" data-a="go" style="padding:12px;border-radius:12px;border:none;background:'+coul+';color:#fff;font-weight:800;font-size:14.5px;margin:0">'+esc(o.continuer.libelle)+' →</button>':'')
      +'<button type="button" data-a="x" style="padding:8px;border:none;background:none;color:#7a8594;font-size:13px;font-weight:600;margin:0">'+(o.continuer?'Plus tard':'Fermer')+'</button></div></div>';
    d.innerHTML=h;
    d.addEventListener('click',function(e){
      var a=e.target&&e.target.getAttribute&&e.target.getAttribute('data-a');
      if(e.target===d){fermer();return;}
      if(a==='img')enregistrer(o,e.target);
      else if(a==='go'){fermer();try{o.continuer.action();}catch(err){}}
      else if(a==='x')fermer();
    });
    document.body.appendChild(d);
    try{document.body.style.overflow='hidden';}catch(e){}
  }
  window.hsBilanAnnee={ouvrir:ouvrir,fermer:fermer,image:dessiner};
})();
