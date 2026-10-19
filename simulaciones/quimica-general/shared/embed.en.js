/* Auto-alto para incrustación en iframe.
   Cuando el simulador corre dentro de un iframe, mide su contenido y avisa a la
   página anfitriona (Google Sites, Moodle, etc.) mediante postMessage para que
   ésta ajuste el alto del iframe. Así el marco sigue al contenido responsivo en
   lugar de recortarlo con un alto fijo. Sin efecto si no está incrustado. */
(function(){
  var inIframe; try{ inIframe = window.self!==window.top; }catch(e){ inIframe=true; }
  if(!inIframe) return;

  var last=0;
  function send(){
    var h=Math.max(
      document.documentElement.scrollHeight,
      document.body?document.body.scrollHeight:0
    );
    if(Math.abs(h-last)<8) return;   // evita ruido/bucles por 1-2 px
    last=h;
    try{ window.parent.postMessage({labQuimicaHeight:h, from:"laboratorio-virtual-quimica"}, "*"); }catch(e){}
  }

  // enviar en los momentos en que el alto puede cambiar
  window.addEventListener("load", send);
  window.addEventListener("resize", send);
  document.addEventListener("DOMContentLoaded", send);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(send);

  // cambios de pestaña, toggles, etc. mutan el DOM → observarlos
  if("ResizeObserver" in window){
    try{ new ResizeObserver(send).observe(document.documentElement); }catch(e){}
  }
  if("MutationObserver" in window){
    try{ new MutationObserver(send).observe(document.body||document.documentElement,
      {subtree:true, childList:true, attributes:true}); }catch(e){}
  }
  // red de seguridad: reintentos espaciados los primeros segundos
  [200,600,1200,2500].forEach(function(t){ setTimeout(send, t); });
})();
