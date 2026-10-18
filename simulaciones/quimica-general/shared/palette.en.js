/* Paleta de colores compartida para los dibujos en <canvas> y SVG de la suite.
   Expone window.LAB_PALETTE con getters que devuelven la variante clara u oscura
   según si <body> tiene la clase "dark" en el momento de leer el color, de modo
   que cada repintado tras cambiar el tema use automáticamente el contraste correcto.
   Los respaldos locales en cada módulo (usados solo si este script no cargó)
   corresponden a la variante clara. */
(function(){
  const light = {
    purple:      "#7654a4",
    purpleLight: "#8a63c9",
    orange:      "#d98a2b",
    danger:      "#a23e3e",
    success:     "#2c7a52",
    accent:      "#2989b3",
    carbon:      "#404750",
    nearWhite:   "#f4f6f8",
    labelLight:  "#f4f7fa",
    muted:       "#667085"
  };
  const dark = {
    purple:      "#9d82c9",
    purpleLight: "#b49bd5",
    orange:      "#e3a35b",
    danger:      "#d47c78",
    success:     "#5cb587",
    accent:      "#56afd2",
    carbon:      "#4a525c",
    nearWhite:   "#f4f6f8",
    labelLight:  "#f4f7fa",
    muted:       "#aab4bf"
  };
  const cur = () => (document.body && document.body.classList.contains("dark")) ? dark : light;
  const pal = {};
  Object.keys(light).forEach(k => Object.defineProperty(pal, k, { get: () => cur()[k] }));
  window.LAB_PALETTE = pal;
})();
