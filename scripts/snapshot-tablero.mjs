#!/usr/bin/env node
/**
 * Toma el contenido ya armado de una página del tablero del motor (el HTML que
 * pinta su propio JavaScript con sus JSON) y lo guarda como datos del front.
 *
 *   node scripts/snapshot-tablero.mjs [carpeta_del_tablero]
 *
 * Abre la página en Chrome sin ventana, espera a que termine de pintarse y
 * guarda cada sección en src/data/generated/<pagina>.json. Sirve para las
 * páginas de documentación (Fuentes), cuyo contenido no depende de filtros.
 * Necesita Chrome instalado (variable CHROME para otra ruta).
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PROJECT = path.resolve(HERE, '..')
const SOURCE = path.resolve(process.argv[2] ?? process.env.TABLERO_DIR ?? path.join(PROJECT, '..', 'SUBIR_ESTE_tablero_2026-11-24_final'))
const OUT = path.join(PROJECT, 'src', 'data', 'generated')
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const PAGES = [{ archivo: 'fuentes.html', salida: 'fuentes.json' }]

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}

const server = http.createServer((req, res) => {
  const file = path.join(SOURCE, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(SOURCE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404)
    res.end()
    return
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
try {
  for (const { archivo, salida } of PAGES) {
    const tab = await browser.newPage()
    await tab.setViewport({ width: 1440, height: 1000 })
    await tab.goto(`${base}/${archivo}`, { waitUntil: 'networkidle2', timeout: 90000 })
    await tab.waitForSelector('main.pp-main section.pp-sec', { timeout: 60000 })
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const secciones = await tab.evaluate(() => {
      /** Rutas del sitio nuevo para los enlaces entre páginas del tablero. */
      const RUTAS = { index: '/', diputaciones: '/diputaciones', comparativo: '/comparativo', territorio: '/territorio', simulacion: '/simulacion', monitoreo: '/monitoreo', fuentes: '/fuentes' }
      const main = document.querySelector('main.pp-main')
      main.querySelectorAll('script, style, noscript').forEach((el) => el.remove())
      for (const el of main.querySelectorAll('*')) {
        for (const attr of [...el.attributes]) if (attr.name.startsWith('on')) el.removeAttribute(attr.name)
      }
      for (const a of main.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href')
        const interna = /^([a-z]+)\.html(#.*)?$/.exec(href)
        if (interna && RUTAS[interna[1]]) {
          // el estado (#b=…&e=…) era del tablero anterior; un ancla de sección sí se conserva
          const ancla = interna[2] && !interna[2].includes('=') ? interna[2] : ''
          a.setAttribute('href', RUTAS[interna[1]] + ancla)
          a.setAttribute('data-ruta', '')
        } else if (/^https?:/.test(href)) {
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
        } else if (!href.startsWith('#')) {
          a.removeAttribute('href')
        }
      }
      // Las medidas en px pasan a --tu (un píxel del tablero ya escalado al sitio nuevo).
      const escalar = (css) => css.replace(/(-?\d*\.?\d+)px\b/g, (_, n) => (Number(n) === 0 ? '0' : `calc(${n} * var(--tu))`))
      const medida = (el) => {
        const w = el.getAttribute('width')
        const h = el.getAttribute('height')
        return /^\d/.test(w ?? '') && /^\d/.test(h ?? '') ? `width:calc(${parseFloat(w)} * var(--tu));height:calc(${parseFloat(h)} * var(--tu));` : ''
      }
      for (const el of main.querySelectorAll('[style]')) el.setAttribute('style', escalar(el.getAttribute('style')))
      for (const svg of main.querySelectorAll('svg')) if (medida(svg)) svg.setAttribute('style', medida(svg) + (svg.getAttribute('style') ?? ''))
      // los logotipos se sustituyen en el front por los del diseño
      for (const img of main.querySelectorAll('img')) {
        const nombre = (img.getAttribute('src') || '').split('/').pop().replace(/\.\w+$/, '')
        img.setAttribute('data-logo', nombre)
        img.setAttribute('style', medida(img) + (img.getAttribute('style') ?? ''))
        img.removeAttribute('src')
      }
      // las ayudas emergentes del tablero pasan a ser el título del elemento
      for (const el of main.querySelectorAll('[data-pp-tip]')) if (!el.title) el.title = el.getAttribute('data-pp-tip')
      return [...main.querySelectorAll(':scope > section.pp-sec')].map((section) => ({ id: section.id, html: section.innerHTML }))
    })

    fs.mkdirSync(OUT, { recursive: true })
    const texto = JSON.stringify({ origen: archivo, secciones })
    fs.writeFileSync(path.join(OUT, salida), texto)
    console.log(`${archivo} → src/data/generated/${salida} · ${secciones.length} secciones · ${(texto.length / 1024).toFixed(0)} KB`)
    await tab.close()
  }
} finally {
  await browser.close()
  server.close()
}
