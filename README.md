# Simulaciones de Química · Laboratorio MACEDONIA

Colección de simulaciones interactivas para la enseñanza de la química, desarrolladas en el **Laboratorio MACEDONIA** de la Universidad Metropolitana de Ciencias de la Educación (UMCE), Chile. Se publican con GitHub Pages en la carpeta [`simulaciones/`](simulaciones/index.html).

## Simulaciones por área

### Química orgánica
| Simulación | Descripción |
|---|---|
| [Mecanismos SN1 · SN2 · E1 · E2](simulaciones/quimica-organica/mecanismos-sn-e/) | Geometrías 3D, flechas de electrones, orbitales, perfiles de energía y predictor de mecanismo. |

### Química general
Cada simulación es independiente; no hay portada de colección ni seguimiento de progreso.

| Simulación | Descripción |
|---|---|
| [AtomLab: modelos atómicos](simulaciones/quimica-general/atomlab/) | Modelos atómicos, Millikan, Davisson–Germer y espectro del H. |
| [Configuración electrónica](simulaciones/quimica-general/configuracion-electronica/) | Orbitales, notación completa/reducida e iones. |
| [Propiedades periódicas](simulaciones/quimica-general/propiedades-periodicas/) | Siete propiedades con datos de referencia y gráfico interactivo. |
| [LewisLab](simulaciones/quimica-general/lewislab/) | Estructuras de Lewis, cargas formales, resonancia y polaridad. |
| [GeoMol](simulaciones/quimica-general/geomol/) | Geometría molecular VSEPR en 3D y polaridad. |
| [Enlaces sigma y pi](simulaciones/quimica-general/sigma-pi/) | Hibridación y enlaces simples, dobles y triples; benceno. |
| [Ensayo a la llama y transiciones cuánticas](simulaciones/quimica-general/ensayo-a-la-llama/) | Color de la llama y transiciones electrónicas. |
| [Electrólisis del agua 3D](simulaciones/quimica-general/electrolisis-agua/) | Celda electrolítica, semirreacciones y vista molecular. |

### Química inorgánica
| Simulación | Descripción |
|---|---|
| [Isomería · Laboratorio 3D](simulaciones/quimica-inorganica/isomeria-complejos/) | Isomería cis/trans y fac/mer en complejos; argumento de Werner. |
| [Quiralidad Δ / Λ en complejos](simulaciones/quimica-inorganica/quiralidad-delta-lambda/) | Quiralidad Δ/Λ en complejos de coordinación. |

## Estructura del repositorio

```
simulaciones/
├── index.html                  Portada con las tres áreas
├── _kit/                       Kit común: lección guiada, captura, ayuda, tema
├── quimica-organica/
│   └── mecanismos-sn-e/
├── quimica-general/
│   ├── atomlab/ configuracion-electronica/ propiedades-periodicas/
│   ├── lewislab/ geomol/ sigma-pi/
│   ├── shared/                         (estilos y utilidades comunes de esos seis módulos)
│   ├── ensayo-a-la-llama/
│   └── electrolisis-agua/
└── quimica-inorganica/
    ├── isomeria-complejos/
    └── quiralidad-delta-lambda/
```

Cada simulación vive en su propia carpeta y usa rutas relativas, por lo que funciona igual en la raíz del dominio o bajo `usuario.github.io/repositorio/`.

## Cómo se desarrollaron

Las simulaciones se trabajaron **inicialmente con Gemini y ChatGPT**, y posteriormente se **optimizaron y mejoraron con Claude** (Anthropic): revisión del contenido químico, corrección de errores, mejoras de interfaz, accesibilidad y rendimiento. La dirección pedagógica, la selección de contenidos y la validación química estuvieron a cargo del Laboratorio MACEDONIA.

Aunque se usó asistencia de IAGen, se recomienda que docentes y estudiantes contrasten los datos con fuentes de referencia (por ejemplo, IUPAC, CRC Handbook, NIST).

## Funciones comunes

Todas las simulaciones comparten un kit de interfaz (`simulaciones/_kit/`) que ofrece, según el caso:

- **Lección guiada por etapas** (botón del libro o tecla `L`): cada etapa mueve la propia simulación (pestaña, molécula, experimento) y resalta la zona relevante; con pausa, avance, retroceso y velocidad.
- **Captura PNG** de la vista actual, **pantalla completa**, **tema claro/oscuro** y **ayuda con atajos** (`?`).
- Predictores y desafíos: mecanismo (SN/E), muestra problema (ensayo a la llama), contador de isómeros de Werner (isomería) y reto Δ/Λ (quiralidad).

El **Simulador SN1 · SN2 · E1 · E2** es la referencia de nivel de detalle; la **Electrólisis del agua** se reconstruyó completa sobre el kit y las demás incorporan estas funciones sobre su interfaz existente.

## Requisitos y notas técnicas

- Navegador moderno con WebGL (Chrome, Edge, Firefox, Safari), en computador, tablet o celular.
- **Ninguna simulación depende de CDN ni de internet**: Three.js, Tailwind (compilado), Lucide y las fuentes (Inter, JetBrains Mono) están incluidos en cada carpeta `vendor/`.

## Uso local

```bash
git clone https://github.com/lab-macedonia/lab-macedonia.github.io.git
cd lab-macedonia.github.io
python3 -m http.server 8000
# abrir http://localhost:8000/simulaciones/
```

## Licencia

Distribuido bajo licencia **MIT**. Consulta el archivo [LICENSE](LICENSE). Las librerías de terceros incluidas en las carpetas `vendor/` (Three.js, Tailwind CSS y OrbitControls: MIT; Lucide: ISC; Inter y JetBrains Mono: SIL OFL 1.1) conservan sus propias licencias.

## Créditos

Laboratorio MACEDONIA · Universidad Metropolitana de Ciencias de la Educación (UMCE), Chile.
