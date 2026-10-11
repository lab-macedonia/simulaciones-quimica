# Simulador de configuración electrónica

Recurso web autocontenido para GitHub Pages orientado a química general. Trabaja con los **118 elementos** y conecta notación espectroscópica con diagramas orbitales.

## Funciones
- selección desde tabla periódica, nombre, símbolo o Z
- configuración electrónica completa
- notación reducida con gas noble
- diagramas orbitales con cajas y flechas
- conteo de electrones desapareados y clasificación paramagnética/diamagnética dentro del modelo
- llenado Aufbau paso a paso
- explicación de Pauli y Hund
- cálculo didáctico de aniones y cationes
- retirada de electrones del nivel principal más alto para cationes, útil en metales de transición
- excepciones de configuración frecuentes (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt, Au y algunas actínidas)
- advertencia para configuraciones de elementos superpesados
- mini‑quiz

## Alcance
El programa usa un modelo educativo de orbitales atómicos y el orden de Madelung/Aufbau. Las configuraciones excepcionales más relevantes para cursos introductorios se corrigen mediante una tabla interna. Para elementos superpesados y estados iónicos poco comunes, la salida debe entenderse como una aproximación didáctica y conviene contrastarla con una base de datos especializada.

## GitHub Pages
1. Cree un repositorio.
2. Suba todos los archivos manteniendo la estructura.
3. En `Settings → Pages`, seleccione `Deploy from a branch`.
4. Use la rama `main` y la carpeta `/ (root)`.

## Estructura
```text
simulador-configuracion-electronica/
├── index.html
├── css/styles.css
├── js/app.js
├── data/elements.js
├── README.md
└── LICENSE
```

## Licencia
MIT.
