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
| `/comparativo`  | Comparativo   | `src/pages/comparativo/ComparativoPage.tsx` |
| `/territorio`   | Territorio    | `src/pages/territorio/TerritorioPage.tsx`   |
| `/fuentes`      | Fuentes       | `src/pages/fuentes/FuentesPage.tsx`         |
| `/login`        | Iniciar sesión | `src/pages/LoginPage.tsx`       |

El inicio de sesión tampoco tiene pantalla en el diseño: usa su mismo lenguaje
(el rótulo del inicio a escala, una tarjeta blanca, la píldora de sección y el
degradado de la franja en el botón). Se llega a él con el ícono de cerrar
sesión que cuelga bajo «FUENTES» en el menú. **Todavía no hay backend**: el
formulario solo revisa que los dos campos traigan algo y entra, y no se impide
abrir las demás páginas sin pasar por él. El punto de conexión es
`src/api/sesion.ts` (`iniciarSesion` y `cerrarSesion`).

### Territorio, Comparativo y Fuentes

Estas tres no tienen pantalla en el diseño: traen el contenido del tablero del
motor (el de Trino), con el menú, el encabezado y el pie de este sitio. Están
hechas en React, con el mismo contenido, los mismos filtros y las mismas ayudas
que el original (se compararon con él texto por texto, tooltips incluidos).

| Página      | Qué responde                               | Qué se elige                                   |
| ----------- | ------------------------------------------ | ---------------------------------------------- |
| Territorio  | dónde se gana y dónde se pierde            | boleta, escenario, distrito, zona, listas      |
| Comparativo | ¿coinciden el modelo y las encuestas?      | escenario, filtro de encuestas, persona        |
| Fuentes     | ¿de dónde sale cada cifra?                 | pestañas de supuestos y de fichas, índice      |

- Lo que se está viendo va en la dirección (`/territorio?b=dip&e=S4&d=8&z=D8-C5`):
  se conserva al recargar y se puede compartir. Boleta, escenario y distrito,
  además, acompañan de una página a otra mientras dura la visita.
- `src/components/tablero/kit/` es el sistema de componentes del tablero en
  React: tarjetas, tablas de ranking, tabla y gráfica oscuras (un punto y su
  fila se resaltan juntos), barras por partido, filtros, la barra «Estás
  viendo», el tooltip… Cada componente escribe las mismas clases `pp-*` que el
  original, y por eso sirven sus estilos.
- `src/components/tablero/PaginaTablero.tsx` es el marco común de las tres y el
  que trae los estilos: `tablero-sitio.css` importa primero los del tablero
  (`src/styles/tablero.css`, **generado**, no se edita) y después los ajustes
  del sitio. Se regenera con
  `node scripts/tablero-css.mjs "ruta/al/paquete" src/styles/tablero.css`.
- `src/motor/` es la capa de datos: `vendor/pp-datos.js` y `vendor/nombres.js`
  son los módulos de cálculo y de nombres del propio tablero, tal cual (no
  tienen interfaz; se actualizan copiándolos del paquete), `index.ts` los expone
  con sus formatos y `hooks.ts` trae la carga y el estado. Leen los JSON del
  motor de `public/data/motor/`, que copia `npm run data`. **Para conectar el
  backend** basta darle a `D.configurar(...)` (en `index.ts`) un `lector` que
  traiga cada archivo de la API.
- El código y los estilos de estas páginas se cargan solo al entrar a ellas.
- Ocupan **todo el ancho del marco** (las páginas del diseño dejan 90 px a cada
  lado): es lo que piden sus tablas más anchas. **Ninguna tabla se desliza de
  lado**: cada una calcula el ancho que necesita (`anchoNecesario` en
  `kit/util.ts`) y, si hay menos, se encoge entera (letra, columnas y márgenes)
  hasta caber. Hoy solo pasa con la serie de Comparativo (al 92 %) y, apenas,
  con las tablas de zonas y de secciones de Territorio (al 98 %). Al agregar una
  columna hay que darle el ancho de su contenido más largo, para que no se
  encime con la de al lado.

Dos diferencias a propósito frente al original, en Fuentes: las notas «Huella de
los archivos» (Validación) y «Dónde se publicó» (Fichas de encuestas) allá salen
vacías por un descuido de su código; aquí muestran lo que debían decir.

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
    ui/          píldoras, círculos con ícono, títulos numerados, lista desplegable,
                 acordeón, cifra animada y texto que entra con fundido
    tablero/     marco y sistema de componentes de las páginas del tablero (kit/)
  lib/           formato de cifras, reglas electorales, capas del mapa, movimiento
                 y navegación entre páginas
  motor/         capa de datos del motor para las páginas del tablero (vendor/ = sus
                 módulos de cálculo y nombres, sin tocar)
  pages/         una carpeta/archivo por página, con su hoja de estilos
  data/          los datos que muestra cada página (listos para conectarse a una API)
  assets/        fondos, logotipos y piezas vectoriales tomadas del PDF
```

### Medidas y escala

Todo el CSS está escrito **en píxeles del diseño** (los mismos números del PDF).
Un plugin de PostCSS en `vite.config.ts` los convierte a `cqw`, de modo que el
sitio conserva las proporciones exactas del artboard a cualquier tamaño.

El tamaño con el que se muestra se controla con tres variables en
`src/styles/tokens.css`:

```css
--frame-share: 0.8; /* parte del ancho de la ventana que ocupa el diseño (1 = de orilla a orilla) */
--frame-min: 960;   /* en ventanas angostas no baja de este ancho; si la ventana es menor, la llena */
--frame-max: 1920;  /* tope en monitores muy anchos */
```

El contenido va centrado, con las proporciones exactas del PDF, y ocupa el 80 %
del ancho de la ventana; el menú, el fondo, el mapa y el pie van de orilla a
orilla. Las páginas del tablero siguen la misma escala: sus estilos miden todo
en `--tu` (un píxel del tablero llevado a la escala del sitio, con el aumento
`--tablero-zoom` de `tablero-sitio.css`).

### Movimiento

Las animaciones comparten duraciones y curvas (`--dur-*` y `--ease-*` en
`tokens.css`, repetidas en `src/lib/motion.ts` para lo que se anima desde
JavaScript):

| Qué                         | Cómo                                                            |
| --------------------------- | --------------------------------------------------------------- |
| Listas, leyenda, ficha      | entran en 180 ms y salen más rápido (120 ms); `usePresence`     |
| Acordeón (mapa de distrito) | `Collapse`: rejilla de `0fr` a `1fr`, 320 ms, sin medir alturas |
| Cifras                      | `AnimatedNumber`: recorren los valores intermedios en 520 ms    |
| Barras, donas, medidor      | cada partido se desliza a su nuevo lugar (transición CSS)       |
| Textos que cambian          | `Swap`: fundido corto, solo en lo que cambió                    |
| Cambio de página            | View Transitions del navegador (`useGo`)                        |
| Bloques al bajar la página  | `data-reveal`: aparecen una sola vez al entrar en pantalla      |

Al cargar, cada página se ve quieta e igual al PDF: solo se mueve lo que cambia
después. Con «reducir movimiento» activado en el sistema todo pasa sin animación.

### Tipografías

El diseño usa Gotham, Helvetica Neue, Arial Black y Myriad Pro, que son fuentes
comerciales. El sitio carga las alternativas libres más cercanas (medidas glifo
por glifo contra el PDF): Montserrat, Metropolis, Arimo y Source Sans 3. Los tres
rótulos del encabezado de Diputaciones y Simulación (título, franja y lema) son
trazos vectoriales del propio diseño, así que son idénticos al PDF. En el Mapa y
en las páginas sin pantalla en el diseño el título y la franja son texto,
ajustado al ancho de la franja (`FitLines` y `FitText` en
`src/components/layout/FitText.tsx`, usados por `PageHero.tsx`).

Si se cuenta con la licencia web de Gotham, basta declarar sus `@font-face` en
`src/styles/fonts.css` y apuntar las variables `--font-gotham*` de `tokens.css`.

### Datos (sin backend todavía)

El sitio es interactivo pero solo front: lee archivos estáticos generados a
partir del paquete del motor v8.1 (el tablero anterior).

```bash
npm run data -- "ruta/al/paquete_del_tablero"   # regenera los datos
```

| Archivo                                | Qué trae                                               | Cómo se carga         |
| -------------------------------------- | ------------------------------------------------------ | --------------------- |
| `src/data/generated/escenarios.json`   | 18 escenarios × 3 boletas, ciudad y distritos          | dentro del bundle     |
| `public/data/mapa.json`                | secciones, límites, resultado 2024 y capas temáticas   | `fetch` al usarse     |
| `public/data/secciones/S*.json`        | predicción por sección de cada escenario (dip. local)  | `fetch` al usarse     |
| `public/data/motor/*`                  | los JSON del motor tal cual, para Territorio, Comparativo y Fuentes (16 MB) | `fetch` al usarse |

Todo el acceso pasa por `src/api/` (`index.ts` y las formas en `types.ts`): para
conectar una API basta con reescribir esas funciones.

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
  cursor y ficha al tocar. Las tarjetas siguen al ámbito. Abre encuadrado en
  Guadalajara (cabe completa en una pantalla, sin que la tapen el panel ni la
  leyenda), vuela al distrito que se elija y «Restablecer mapa» lo regresa.
- **Diputaciones**: selector de escenario (la etiqueta del encabezado), círculos
  que llevan a cada distrito, leyenda que resalta un partido y mapa por tarjeta
  (se pueden tener varios abiertos a la vez).
- **Simulación**: selector de escenario para el veredicto, mapa de grupos
  enlazado con la tabla y simulador (boleta, ámbito y escenario).
- **Territorio**: boleta, escenario y distrito; orden de las zonas, zona
  abierta (con su escalera de escenarios), pestañas de la ciudad, listas de
  secciones y ruta de votos.
- **Comparativo**: escenario, filtro de encuestas (lo comparten la serie y la
  lista de mediciones), gráficas en que cada punto se enlaza con su fila, y
  persona de la tabla de aprobación.
- **Fuentes**: índice que salta a cada sección, pestañas de supuestos y de
  fichas de encuestas, enlaces a las publicaciones.

Sin tocar nada, cada página se ve como el PDF, salvo tres cambios pedidos:

- El encabezado del Mapa dice «PROYECCIONES ELECTORALES» como título y «2027» en
  la franja (en el PDF: «PE 2027» sobre «PROYECCIONES ELECTORALES»). El título
  va en dos líneas del mismo cuerpo, cada una al ancho exacto de la franja, y
  ocupa el mismo espacio que «PE 2027»: el resto de la página no se mueve.
- El mapa abre ajustado a Guadalajara (en el PDF aparece todo el occidente del
  país).
- Los enlaces del menú se reparten a todo el ancho de la ventana, y bajo el
  último cuelga el ícono de cerrar sesión (no está en el PDF).

El mapa usa mosaicos de OpenStreetMap (© colaboradores de OpenStreetMap).
