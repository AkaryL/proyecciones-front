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
| `/territorio`   | Territorio    | `src/pages/TableroPage.tsx`      |
| `/comparativo`  | Comparativo   | `src/pages/TableroPage.tsx`      |
| `/login`        | Iniciar sesión | `src/pages/LoginPage.tsx`       |

El inicio de sesión tampoco tiene pantalla en el diseño: usa su mismo lenguaje
(el rótulo del inicio a escala, una tarjeta blanca, la píldora de sección y el
degradado de la franja en el botón). Se llega a él con el ícono de cerrar
sesión que cuelga bajo «FUENTES» en el menú. **Todavía no hay backend**: el
formulario solo revisa que los dos campos traigan algo y entra, y no se impide
abrir las demás páginas sin pasar por él. El punto de conexión es
`src/api/sesion.ts` (`iniciarSesion` y `cerrarSesion`).

Territorio y Comparativo tampoco tienen pantalla en el diseño: se muestran como
en el tablero del motor, con su propio código y sus filtros. El paquete del
tablero está copiado en `public/tablero/` y se incrusta en un iframe
(`src/components/tablero/TableroFrame.tsx`) al que se le quita su menú, su
encabezado y su pie. Para actualizarlo, se vuelve a copiar el paquete ahí.

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
    ui/          píldoras, círculos con ícono, títulos numerados, lista desplegable,
                 acordeón, cifra animada y texto que entra con fundido
  lib/           formato de cifras, reglas electorales, capas del mapa, movimiento
                 y navegación entre páginas
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
orilla. Si se cambian estos valores hay que regenerar `src/styles/tablero.css`
(`node scripts/tablero-css.mjs "ruta/al/paquete" src/styles/tablero.css`), que
los lee para sus puntos de quiebre.

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
