/* Utilidades compartidas de dibujo y aleatoriedad para los simuladores.
   Consolida funciones que estaban duplicadas en varios módulos:
   - shuffle (barajado Fisher–Yates, usada por los cuatro quiz)
   - utilidades de color hex (mezcla, aclarar, oscurecer) usadas por los motores 3D */
(function(){
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function hex2rgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  function rgb2hex(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;}
  function mix(hex,target,t){const a=hex2rgb(hex),b=hex2rgb(target);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}
  window.LabUtils={shuffle,hex2rgb,rgb2hex,mix,lighten:(h,t)=>mix(h,"#ffffff",t),darken:(h,t)=>mix(h,"#000000",t)};
})();
