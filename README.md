# PE 2027 · Proyecciones Electorales — Panorama Integral Guadalajara

Front del sitio, construido con **React 19 + TypeScript + Vite**, calcado del diseño
`Proyecciones Electorales NOV_26.pdf` (artboard de 1440 px).

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # compilación de producción en dist/
npm run preview  # sirve dist/ para revisarlo
npm run lint
```

## Páginas

| Ruta            | Página        | Archivo                          |
| --------------- | ------------- | -------------------------------- |
| `/`             | Mapa          | `src/pages/MapaPage.tsx`         |
| `/diputaciones` | Diputaciones  | `src/pages/DiputacionesPage.tsx` |
| `/simulacion`   | Simulación    | `src/pages/SimulacionPage.tsx`   |
| `/fuentes`      | Fuentes       | `src/pages/FuentesPage.tsx`      |

Comparativo y Territorio aparecen en el menú pero aún no tienen página.

Fuentes no tiene pantalla en el diseño: usa el mismo encabezado y el contenido
completo del tablero del motor, tomado tal cual (su HTML ya armado) con
`node scripts/snapshot-tablero.mjs "ruta/al/paquete"` y pintado con sus propios
estilos adaptados (`src/styles/tablero.css`, generado por
`scripts/tablero-css.mjs`). Lo muestra `src/components/tablero/TableroContent.tsx`.

## Cómo está armado

```
src/
  styles/        tokens (colores, degradados, escala), tipografías y estilos base
  components/
    layout/      menú, pie, marco de página y encabezado (título + franja + lema)
    map/         mapa Leaflet con tratamiento oscuro y panel de filtros
    charts/      barra apilada, medidor semicircular y dona
    parties/     leyenda de partidos
    icons/       íconos vectoriales extraídos del diseño
    ui/          píldoras, círculos con ícono, títulos numerados
  pages/         una carpeta/archivo por página, con su hoja de estilos
  api/           el único acceso a la API del back: funciones y formas del contrato
  data/          contenido fijo del diseño (textos, grupos clave, acomodos)
  assets/        fondos, logotipos y piezas vectoriales tomadas del PDF
```

### Medidas y escala

Todo el CSS está escrito **en píxeles del diseño** (los mismos números del PDF).
Un plugin de PostCSS en `vite.config.ts` los convierte a `cqw`, de modo que el
sitio conserva las proporciones exactas del artboard a cualquier tamaño.

El tamaño con el que se muestra se controla con una sola variable en
`src/styles/tokens.css`:

```css
--frame-max: 960; /* 1440 = tamaño real del diseño · 960 = diseño al 67 % */
```

El contenido va centrado con ese ancho máximo; el menú, el fondo, el mapa y el
pie ocupan todo el ancho de la ventana. En ventanas más angostas el sitio se
encoge proporcionalmente.

### Tipografías

El diseño usa Gotham, Helvetica Neue, Arial Black y Myriad Pro, que son fuentes
comerciales. El sitio carga las alternativas libres más cercanas (medidas glifo
por glifo contra el PDF): Montserrat, Metropolis, Arimo y Source Sans 3. Los tres
rótulos del encabezado de cada página (título, franja y lema) son trazos
vectoriales del propio diseño, así que son idénticos al PDF.

Si se cuenta con la licencia web de Gotham, basta declarar sus `@font-face` en
`src/styles/fonts.css` y apuntar las variables `--font-gotham*` de `tokens.css`.

### Datos (los sirve el back)

Todos los datos vienen de la API del repositorio **`proyecciones-backend`**. El
front no guarda ninguna cifra: `src/api/` es el único lugar que habla con ella y
`src/api/types.ts` es el contrato (el back devuelve esas mismas formas).

```bash
cp .env.example .env.local        # VITE_API_URL, por omisión http://localhost:3400/api/proyecciones
# en el otro repositorio: npm start (y npm run sembrar la primera vez)
npm run dev
```

| Ruta de la API            | Qué trae                                               | Cuándo se pide          |
| ------------------------- | ------------------------------------------------------ | ----------------------- |
| `/escenarios`             | 18 escenarios × 3 boletas, ciudad y distritos          | al arrancar el sitio    |
| `/mapa`                   | secciones, límites, resultado 2024 y capas temáticas   | al entrar al mapa       |
| `/secciones/:escenario`   | predicción por sección de un escenario (dip. local)    | al elegir un escenario  |
| `/fuentes`                | contenido del tablero para la página Fuentes           | al entrar a Fuentes     |

`src/main.tsx` pide `/escenarios` **antes** de montar la aplicación e importa
`App` de forma dinámica después: varios módulos leen `DATOS` al importarse (las
opciones de los selectores, el escenario central del mapa), así que para cuando
se evalúan ya está lleno. Si la API no responde, o si su almacén está vacío, se
ve una pantalla que lo dice (`src/components/layout/Arranque.tsx`).

#### Regenerar el paquete desde el motor

La transformación «paquete del motor → JSON del contrato» todavía vive aquí; su
salida se importa al almacén del back (ver su README):

```bash
npm run data -- "ruta/al/paquete_del_tablero"      # escenarios, mapa y secciones
node scripts/snapshot-tablero.mjs "ruta/al/paquete" # fuentes.json
cd ../proyecciones-backend && npm run importar -- ../proyecciones-front
```

Esa salida (`public/data/`, `src/data/generated/`) ya no se versiona: es un paso
intermedio hacia el back.

#### Cifras que no salen del motor

- `src/api/diseno.ts` sustituye dos celdas (S0 · alcaldía y S1 · diputación
  local) por las cifras del PDF, que salió de una corrida anterior del motor y
  difiere en décimas. Con `USAR_CIFRAS_DEL_DISENO = false` se ven las del motor.
- Las tarjetas de voto del Mapa para todo el municipio (27.8 % y 33.1 %) son las
  del PDF: vienen de un modelo anterior y no existen en el paquete. Al elegir un
  distrito se muestran las del motor.
- El simulador de escenarios (`src/pages/simulacion/ScenarioSimulator.tsx`)
  sustituye al chat con IA del diseño, que no existe todavía.
- `src/data/*.ts` conserva el contenido fijo del diseño (textos, grupos clave).

### Qué es interactivo

- **Mapa**: selector de ámbito (municipio o distrito), filtros electorales y
  temáticos, vista por distritos o secciones, leyenda, etiqueta al pasar el
  cursor y ficha al tocar. Las tarjetas siguen al ámbito.
- **Diputaciones**: selector de escenario (la etiqueta del encabezado), círculos
  que llevan a cada distrito, leyenda que resalta un partido y mapa por tarjeta.
- **Simulación**: selector de escenario para el veredicto, mapa de grupos
  enlazado con la tabla y simulador (boleta, ámbito y escenario).

Sin tocar nada, cada página se ve como el PDF.

El mapa usa mosaicos de OpenStreetMap (© colaboradores de OpenStreetMap).
