import type { ReactNode } from 'react'
import { API } from '../../api'

/**
 * Pantallas de arranque: lo que se ve cuando el sitio no puede pintarse
 * todavía. No usan los estilos del diseño a propósito, porque si esto sale
 * puede ser que ni los datos ni las fuentes hayan cargado.
 */
function Pantalla({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeContent: 'center',
        justifyItems: 'center',
        gap: '12px',
        padding: '32px',
        textAlign: 'center',
        font: '16px/1.6 system-ui, sans-serif',
        color: '#2b2b40',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '22px' }}>{titulo}</h1>
      {children}
    </div>
  )
}

const codigo = { background: '#f1f1f6', borderRadius: '4px', padding: '1px 5px' }

/** La API no respondió: casi siempre es que el back no está levantado. */
export function FalloArranque({ detalle }: { detalle: string }) {
  return (
    <Pantalla titulo="No se pudieron cargar los datos">
      <p style={{ margin: 0 }}>
        La API de Proyecciones no respondió en <code style={codigo}>{API}</code>.
      </p>
      <p style={{ margin: 0, opacity: 0.7 }}>
        Levanta el back (<code style={codigo}>npm start</code> en <code style={codigo}>proyecciones-backend</code>) o
        revisa <code style={codigo}>VITE_API_URL</code>.
      </p>
      <p style={{ margin: 0, opacity: 0.5, fontSize: '13px' }}>{detalle}</p>
    </Pantalla>
  )
}

/**
 * La API respondió, pero su almacén está vacío: no hay ningún corte del motor.
 * El sitio entero se arma a partir de los distritos y los escenarios de ese
 * corte, así que en lugar de pintar pantallas en cero se dice qué falta.
 */
export function SinDatos() {
  return (
    <Pantalla titulo="No hay ningún corte cargado">
      <p style={{ margin: 0 }}>
        La API respondió, pero su almacén está vacío: no hay escenarios ni distritos que pintar.
      </p>
      <p style={{ margin: 0, opacity: 0.7 }}>
        En <code style={codigo}>proyecciones-backend</code>: <code style={codigo}>npm run sembrar</code> carga el último
        corte conocido, o <code style={codigo}>npm run importar -- &lt;paquete&gt;</code> carga uno nuevo.
      </p>
      <p style={{ margin: 0, opacity: 0.5, fontSize: '13px' }}>{API}/estado dice qué hay cargado.</p>
    </Pantalla>
  )
}
