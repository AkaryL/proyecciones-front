// Adapta css/pp.css del tablero para usarse dentro del sitio nuevo.
// uso: node scripts/tablero-css.mjs <carpeta del paquete del tablero> src/styles/tablero.css
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
// Del marco del tablero solo se descarta lo que aquí pone el propio sitio (menú, encabezado, pie). La barra «Estás viendo»
// (.pp-ctx), los chips bajo ella (.pp-heroe-chips) y el aviso de carga sí se usan en las páginas hechas en React.
const SHELL = /\.pp-(nav|pie|heroe(?!-chips)|pagina|errores|viendo|chat|mapa|panel|selector)\b/
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
 * GENERADO por scripts/tablero-css.mjs a partir de css/pp.css del tablero del motor (su
 * sistema de componentes pp-*). No se edita a mano. Lo usan las páginas que vienen de
 * ese tablero (Territorio, Comparativo, Fuentes), cuyos componentes de React escriben
 * las mismas clases (src/components/tablero/kit). Cambios frente al original: sin reglas
 * globales ni de su menú/encabezado/pie, sin puntos de quiebre, tokens dentro de .tablero
 * y cada medida en --tu (un píxel del tablero ya escalado al sitio). No se importa
 * directo: lo trae src/components/tablero/tablero-sitio.css, que le pone encima los
 * ajustes del sitio.
 */
`
const escalar = (s) => s.replace(/(-?\d*\.?\d+)px\b/g, (_, n) => (Number(n) === 0 ? '0' : `calc(${n} * var(--tu))`))

// Las condiciones de @container no admiten variables (--tu), pero sí unidades relativas, que se
// miden contra el propio contenedor consultado: sus px se pasan a `em` de ese contenedor, cuyo
// cuerpo de letra ya va en --tu. Así el umbral sigue a la escala del sitio a cualquier ancho.
// Cuerpo de letra (px del tablero) de cada contenedor que el tablero consulta:
//   .pp-apil__s  → 10 (lo fija su propia regla: «font: 800 10px»)
//   .pp-tpos     → 16 (el del documento en el tablero; aquí lo fija tablero-sitio.css)
const CUERPO_CONTENEDOR = [
  { de: /\.pp-apil/, px: 10 },
  { de: /\.pp-tpos/, px: 16 },
]
const enEm = (r) => {
  const cuerpo = CUERPO_CONTENEDOR.find((c) => c.de.test(r.body))
  if (!cuerpo) throw new Error(`No sé el cuerpo de letra del contenedor de: ${r.sel} { ${r.body.slice(0, 60)}… }`)
  const condicion = r.sel.replace(/(\d*\.?\d+)px\b/g, (_, n) => `${Number((Number(n) / cuerpo.px).toFixed(4))}em`)
  return `${condicion} {\n${r.body}\n}`
}
// Dentro de un SVG con viewBox, los px de una regla son unidades del dibujo: ya crecen con él. Si
// además se multiplicaran por --tu, los textos de las gráficas crecerían dos veces con la ventana.
// Se dejan como están, en mayúsculas (PX) para que el plugin de px → cqw del sitio no los toque.
const DIBUJO = /\.pp-serie text|\.pp-med__num|\.pp-dona__num/
for (const r of kept) {
  r.body = DIBUJO.test(r.sel) ? r.body.replace(/(\d)px\b/g, '$1PX') : escalar(r.body)
  if (!r.sel.startsWith('@')) r.sel = escalar(r.sel)
}
const text = kept
  .map((r) => (r.sel.startsWith('@container') ? enEm(r) : fmt(r)))
  .join('\n\n')
  .replace(/:root \{/, '.tablero {')
fs.writeFileSync(out, HEAD + text + '\n')
console.log('reglas', rules.length, 'conservadas', kept.length, 'descartadas', dropped.length)
console.log('descartadas:', [...new Set(dropped)].join(' | ').slice(0, 2500))
const grab = (re) => kept.filter((r) => re.test(r.sel)).map((r) => `${r.sel} { ${r.body} }`).join('\n').slice(0, 1600)
console.log('\n', grab(/^\.pp-(main|sec|tag|h2|lead|cab|cab__n)$/))
