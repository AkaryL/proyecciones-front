// Adapta css/pp.css del tablero para usarse dentro del sitio nuevo.  uso: node mkcss.mjs <carpeta> <salida.css>
import fs from 'node:fs'
import path from 'node:path'
const [, , root, out] = process.argv
let css = fs.readFileSync(path.join(root, 'css', 'pp.css'), 'utf8').replace(/^﻿/, '')
css = css.replace(/\/\*[\s\S]*?\*\//g, '') // sin comentarios

// reglas de primer nivel
const rules = []
let i = 0
while (i < css.length) {
  const open = css.indexOf('{', i)
  if (open < 0) break
  const semi = css.indexOf(';', i)
  if (semi >= 0 && semi < open && css.slice(i, semi).trim().startsWith('@')) { i = semi + 1; continue } // @import
  let depth = 0, j = open
  for (; j < css.length; j++) { if (css[j] === '{') depth++; else if (css[j] === '}') { depth--; if (!depth) break } }
  rules.push({ sel: css.slice(i, open).trim().replace(/\s+/g, ' '), body: css.slice(open + 1, j).trim() })
  i = j + 1
}
// Globales: lo que empieza por un elemento (svg, img, a, button…) o por el comodín alcanzaría a
// todo el sitio, no solo al contenido del tablero. Cada selector de una lista se evalúa por separado.
const GLOBAL = /^(\*|[a-z][a-z0-9]*(?![\w-])|:focus-visible|\[hidden\]|\.leaflet)/
const SHELL = /\.pp-(nav|pie|heroe|pagina|errores|cargando|viendo|chat|mapa|panel|kfila|selector)\b/
const kept = []
const dropped = []
for (const r of rules) {
  if (r.sel.startsWith('@media')) {
    // «menos movimiento»: se conserva, pero solo para el contenido del tablero
    if (/prefers-reduced-motion/.test(r.sel)) kept.push({ sel: r.sel, body: r.body.replace(/(^|\})\s*\*\s*\{/g, '$1.tablero *{') })
    else dropped.push(r.sel)
    continue
  }
  if (r.sel.startsWith('@keyframes') || r.sel === ':root') { kept.push(r); continue }
  const parts = r.sel.split(',').map((s) => s.trim()).filter((s) => !GLOBAL.test(s) && !SHELL.test(s))
  if (!parts.length) { dropped.push(r.sel.slice(0, 60)); continue }
  kept.push({ sel: parts.join(',\n'), body: r.body })
}
const fmt = (r) => r.sel.startsWith('@media') ? `${r.sel} {\n${r.body}\n}` : `${r.sel} {\n  ${r.body.split(';').map((d) => d.trim()).filter(Boolean).join(';\n  ')};\n}`
const HEAD = `/*
 * GENERADO a partir de css/pp.css del tablero del motor (su sistema de componentes pp-*).
 * Se usa para pintar el contenido que se toma tal cual de ese tablero (ver
 * scripts/snapshot-tablero.mjs). Cambios frente al original: sin reglas globales
 * ni de su menú/encabezado/pie, sin puntos de quiebre, tokens dentro de .tablero y
 * cada medida en --tu (un píxel del tablero ya escalado al sitio; ver TableroContent.css).
 */
`
const escalar = (s) => s.replace(/(-?\d*\.?\d+)px\b/g, (_, n) => (Number(n) === 0 ? '0' : `calc(${n} * var(--tu))`))

// Las condiciones de @container no admiten variables, y la escala del sitio depende del ancho de
// la ventana (un px del tablero mide ZOOM × ancho del frame / 1440). Cada regla se repite por
// tramos de ancho de ventana, con sus px llevados a px reales con la escala de ese tramo.
const ZOOM = 1.18 // --tablero-zoom (TableroContent.css)
const tokens = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
const token = (nombre, porDefecto) => Number(new RegExp(`--frame-${nombre}:\\s*([\\d.]+)`).exec(tokens)?.[1] ?? porDefecto)
const FRAME = { share: token('share', 1), min: token('min', 0), max: token('max', 1440) }
/** Ancho del artboard para un ancho de ventana: la misma cuenta que --frame-w (PageShell.css). */
const frame = (ventana) => Math.min(ventana, Math.max(FRAME.min, Math.min(FRAME.share * ventana, FRAME.max)))
const TOPE = Math.ceil(FRAME.max / FRAME.share) // ventana a partir de la cual el artboard ya no crece
const tramos = []
for (let desde = 0, hasta = 360; desde < TOPE; desde = hasta, hasta = Math.min(TOPE, Math.round(hasta * 1.1))) {
  tramos.push({ desde, hasta, ancho: frame(desde ? Math.sqrt(desde * hasta) : hasta) })
  if (hasta === TOPE) break
}
tramos.push({ desde: TOPE, hasta: Infinity, ancho: FRAME.max })
const porTramos = (r) =>
  tramos
    .map(({ desde, hasta, ancho }) => {
      const escala = (ZOOM * ancho) / 1440
      const condicion = r.sel.replace(/(\d*\.?\d+)px\b/g, (_, n) => `${Math.round(Number(n) * escala)}px`)
      const ventana = [desde ? `(min-width:${desde}px)` : '', hasta === Infinity ? '' : `(max-width:${hasta - 0.02}px)`].filter(Boolean).join(' and ')
      return `@media ${ventana} {\n${condicion} {\n${r.body}\n}\n}`
    })
    .join('\n\n')

for (const r of kept) {
  r.body = escalar(r.body)
  if (!r.sel.startsWith('@')) r.sel = escalar(r.sel)
}
const text = kept
  .map((r) => (r.sel.startsWith('@container') ? porTramos(r) : fmt(r)))
  .join('\n\n')
  .replace(/:root \{/, '.tablero {')
fs.writeFileSync(out, HEAD + text + '\n')
console.log('reglas', rules.length, 'conservadas', kept.length, 'descartadas', dropped.length)
console.log('descartadas:', [...new Set(dropped)].join(' | ').slice(0, 2500))
const grab = (re) => kept.filter((r) => re.test(r.sel)).map((r) => `${r.sel} { ${r.body} }`).join('\n').slice(0, 1600)
console.log('\n', grab(/^\.pp-(main|sec|tag|h2|lead|cab|cab__n)$/))
