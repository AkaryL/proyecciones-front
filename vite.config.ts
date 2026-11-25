import react from '@vitejs/plugin-react'
import type { Plugin as PostcssPlugin } from 'postcss'
import { defineConfig } from 'vite'

/** Ancho del artboard del diseño (Proyecciones Electorales NOV_26.pdf). */
const DESIGN_WIDTH = 1440

/**
 * Las hojas de estilo se escriben en píxeles del diseño (1440 px de ancho).
 * Este plugin convierte cada `px` a `cqw` (unidad relativa al ancho del `.frame`
 * que contiene al elemento; ver src/styles/base.css), así toda la interfaz
 * conserva las proporciones del diseño a cualquier tamaño.
 * Usa `PX` en mayúsculas cuando se necesite un píxel real, sin escalar.
 */
function designPx(): PostcssPlugin {
  return {
    postcssPlugin: 'design-px-to-cqw',
    Declaration(decl) {
      if (decl.source?.input.file?.includes('node_modules')) return
      if (!decl.value.includes('px')) return
      decl.value = decl.value.replace(/(-?\d*\.?\d+)px\b/g, (_, n: string) => {
        const value = Number.parseFloat(n)
        return value === 0 ? '0' : `${Number(((value / DESIGN_WIDTH) * 100).toFixed(5))}cqw`
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: { plugins: [designPx()] },
  },
  build: {
    rolldownOptions: {
      output: {
        // Las librerías van en archivos aparte: cambian poco y el navegador las guarda en caché.
        codeSplitting: {
          groups: [
            { name: 'leaflet', test: /node_modules[\\/]leaflet/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
