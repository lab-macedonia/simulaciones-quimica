# Explorador interactivo de propiedades periódicas

Simulador web autocontenido para GitHub Pages. Incluye los **118 elementos**, tabla periódica interactiva, comparación, gráfico vs. número atómico, tendencias y desafíos.

## Propiedades incluidas

### Datos cuantitativos embebidos
- masa atómica
- radio covalente
- radio de van der Waals
- radio atómico aproximado del conjunto RDKit (`Rb0`)
- período / número de niveles
- electrones externos

### Modelos e índices didácticos
- carga nuclear efectiva aproximada mediante reglas de Slater
- apantallamiento aproximado
- tendencia de primera ionización
- tendencia de electronegatividad
- tendencia de afinidad electrónica
- carácter metálico y no metálico
- reactividad metálica y no metálica

Los campos llamados **índice** no son valores experimentales: se diseñaron para explorar direcciones y relaciones conceptuales sin fingir una precisión que el modelo no posee.

## Radio iónico
No se asigna un único radio iónico por elemento porque depende de la carga, el estado de oxidación y el número de coordinación. El simulador lo explica conceptualmente para evitar una simplificación incorrecta.

## Uso
Abra `index.html` directamente o publique la carpeta mediante GitHub Pages. No hay dependencias externas.

## GitHub Pages
1. Cree un repositorio.
2. Suba el contenido de esta carpeta a la rama `main`.
3. `Settings → Pages`.
4. Seleccione `Deploy from a branch`, `main`, `/ (root)`.

## Fuentes y metodología
Los datos básicos de masa y radios se generaron en la construcción del recurso usando `RDKit.Chem.GetPeriodicTable()`. La estructura de la tabla sigue la organización periódica convencional. Los índices de tendencia se calculan localmente y están identificados como modelos. Para contrastar valores experimentales de electronegatividad, energía de ionización, afinidad electrónica y radios, se recomienda PubChem Periodic Table.

## Licencia
MIT para el código del simulador. Revise siempre las condiciones de las fuentes externas si incorpora nuevos conjuntos de datos.
