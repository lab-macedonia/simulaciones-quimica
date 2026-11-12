# Crear una simulación MSim nueva

Herramientas con las que se construyeron las 16 simulaciones de física, ciencias de la Tierra y biología (noviembre de 2026). Requieren Node y, para la prueba en navegador, Microsoft Edge (o Chrome con `PW_CHANNEL=chrome`) y `npm install`.

## Archivos

| Archivo | Qué hace |
|---|---|
| `fichas/<sim>.js` | Datos de la simulación: área, OA del Mineduc, ruta de aprendizaje, color e ícono, título, descripción y etiquetas para la portada, y la guía docente (objetivos, conocimientos previos, actividad, errores frecuentes, preguntas de desarrollo), en español e inglés. |
| `pares/<sim>.js` | Traducciones `[español, inglés]` de los textos de `app.js` (sin comillas). |
| `tr.js` | Convierte los pares en el diccionario `app.i18n.json` que usa `tools\i18n.ps1`; avisa qué textos quedaron sin traducir y qué pares no se usaron. |
| `nuevo.js` | Genera `index.html`, `index.en.html`, `sim.css` y las guías docentes ES/EN (etapas y banco de preguntas salen de `app.js` y `app.en.js`). |
| `probar.js` | Abre la simulación en Edge (ES y EN), recorre las etapas, abre las pestañas, mueve los controles y reporta errores de JavaScript; opcionalmente guarda capturas. |
| `hacer.ps1` | Ejecuta todo lo anterior para una simulación. |
| `registrar.js` | Agrega las simulaciones de `fichas/` al currículo, a los títulos y rutas de `kit/aula.js`, a la portada y al índice de guías (no duplica lo ya registrado). |

## Pasos

1. Escribe `simulaciones/<area>/<sim>/app.js` en español sobre `kit/msim.js` (modelo: cualquier simulación de `fisica/` o `ciencias-tierra/`) y `practica.js` con problemas y predicciones bilingües (ver el README principal).
2. Crea `fichas/<sim>.js` (copia una existente) y `pares/<sim>.js` con las traducciones.
3. `powershell -ExecutionPolicy Bypass -File tools\nueva-sim\hacer.ps1 -Id <area>/<sim> -Shots` — repite hasta que no falten traducciones ni haya errores; revisa las capturas en `tools\nueva-sim\shots`.
4. `node tools\nueva-sim\registrar.js`
5. `powershell -ExecutionPolicy Bypass -File tools\instalar-aula.ps1` y `node tools\guias-aula.js`
6. `npm run check`, `powershell -ExecutionPolicy Bypass -File tools\verificar.ps1` y `npm run smoke` (con `$env:CHROMIUM` apuntando a `msedge.exe` si Playwright no tiene su navegador).
7. Agrega la simulación al README (tabla del área y conteos).

## Consejos

- Las predicciones (`predict` en `practica.js`) no van en la etapa 0, en la última ni en dos etapas seguidas: la explicación aparece al empezar la etapa siguiente y una pregunta nueva la reemplaza.
- Los paneles flotantes tapan el lado izquierdo del visor: pon el `target` de la cámara con x negativa (≈ −1,5) y deja la escena entre x ≈ −4 y 8.
- `calc`, `measures` y `hud` se llaman antes de `build`: no supongas que la escena ya existe.
- En `jsdom` (prueba de humo) los deslizadores no limitan su valor al rango: acota los índices que dependan de un control.
- Un área nueva también debe agregarse en `tools\guias-aula.js`, `tools\verificar.ps1`, `tools\instalar-aula.ps1`, `kit\curriculo-pagina.js` y en `AREA` de `nuevo.js` y `registrar.js`.
- Al regenerar una guía con `nuevo.js` se pierde su sección «Herramientas de aula»; vuelve a ejecutar `node tools\guias-aula.js`.
