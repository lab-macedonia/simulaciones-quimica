# Simulador interactivo de enlaces σ y π

Recurso educativo web para explorar la relación entre:

- enlace simple, doble y triple;
- enlaces sigma (σ) y pi (π);
- hibridación `sp³`, `sp²` y `sp`;
- geometría molecular;
- ángulos ideales de enlace;
- orbitales `p` no hibridados;
- restricción de la rotación alrededor del enlace carbono–carbono.

El simulador está desarrollado solo con **HTML, CSS y JavaScript**, por lo que puede publicarse directamente mediante **GitHub Pages** sin instalar dependencias.

## Contenidos

### Enlace simple: etano, C₂H₆

- 1 enlace σ
- 0 enlaces π
- hibridación `sp³`
- geometría tetraédrica
- ángulo ideal: 109,5°
- rotación C–C relativamente libre

### Enlace doble: eteno, C₂H₄

- 1 enlace σ
- 1 enlace π
- hibridación `sp²`
- geometría trigonal plana
- ángulo ideal: 120°
- 1 orbital `p` no hibridado por carbono
- rotación C=C restringida

### Enlace triple: etino, C₂H₂

- 1 enlace σ
- 2 enlaces π
- hibridación `sp`
- geometría lineal
- ángulo ideal: 180°
- 2 orbitales `p` no hibridados por carbono

## Funciones del simulador

- selección de enlace simple, doble o triple;
- visualización de enlaces σ y π;
- visualización de orbitales;
- animación del solapamiento;
- indicación de hibridación;
- geometría y ángulo ideal;
- demostración de rotación C–C;
- tabla comparativa;
- secuencia conceptual de aprendizaje;
- mini‑quiz autocorregible;
- diseño adaptable a computador, tablet y teléfono;
- modo claro/oscuro.

## Estructura del repositorio

```text
simulador-enlaces-sigma-pi/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── simulator.js
├── assets/
├── README.md
├── LICENSE
└── .gitignore
```

## Publicar en GitHub Pages

1. Crear un repositorio nuevo en GitHub.
2. Subir todos los archivos manteniendo esta estructura.
3. Abrir **Settings** del repositorio.
4. Ir a **Pages**.
5. En **Build and deployment**, elegir:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
6. Guardar.

Después de unos instantes, GitHub mostrará la URL pública del recurso. Normalmente tendrá la forma:

```text
https://TU-USUARIO.github.io/simulador-enlaces-sigma-pi/
```

## Uso local

También puede ejecutarse localmente.

La forma más simple es abrir `index.html` en un navegador moderno.

Para desarrollo, puede utilizarse cualquier servidor local sencillo, por ejemplo:

```bash
python -m http.server 8000
```

y luego abrir:

```text
http://localhost:8000
```

## Integración en plataformas educativas

La URL de GitHub Pages puede incorporarse como enlace en:

- Moodle
- Google Classroom
- Google Sites
- Canvas LMS
- Microsoft Teams
- códigos QR en guías o manuales de laboratorio

## Objetivos de aprendizaje sugeridos

Al finalizar la actividad, el estudiante debería ser capaz de:

1. distinguir enlaces σ y π;
2. relacionar orden de enlace con número de enlaces σ y π;
3. asociar `sp³`, `sp²` y `sp` con geometrías moleculares;
4. reconocer los ángulos ideales de cada geometría;
5. explicar la restricción de rotación producida por un enlace π;
6. identificar el número de orbitales `p` no hibridados en cada tipo de hibridación.

## Nota conceptual

Los orbitales mostrados son representaciones didácticas. Las superficies dibujadas no deben interpretarse como fronteras físicas rígidas de la densidad electrónica. Los valores angulares corresponden a geometrías ideales y pueden variar en moléculas reales.

## Licencia

Este proyecto se distribuye bajo licencia MIT. Puedes modificarlo, adaptarlo y reutilizarlo para fines educativos.
