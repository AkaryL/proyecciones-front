import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { cargarDatos } from './api'
import { FalloArranque, SinDatos } from './components/layout/Arranque'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'

const root = createRoot(document.getElementById('root')!)

/**
 * Arranque: primero los datos, luego la aplicación.
 *
 * Varios módulos leen `DATOS` al importarse (las opciones de los selectores,
 * el escenario central del mapa…), así que `App` se importa de forma dinámica
 * DESPUÉS de que la API respondió. Si se importara arriba, esos módulos se
 * evaluarían con `DATOS` todavía sin asignar.
 */
async function arrancar() {
  let datos
  try {
    datos = await cargarDatos()
  } catch (error) {
    console.error(error)
    root.render(<FalloArranque detalle={error instanceof Error ? error.message : String(error)} />)
    return
  }

  // almacén del back vacío: no hay distritos ni escenarios de los que colgar nada
  if (!datos.distritos.length) {
    root.render(<SinDatos />)
    return
  }

  const { default: App } = await import('./App')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void arrancar()
