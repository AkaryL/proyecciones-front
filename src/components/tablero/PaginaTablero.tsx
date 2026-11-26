import type { ReactNode } from 'react'
import { D, N } from '../../motor'
import type { EstadoCarga } from '../../motor/hooks'
import { PageHero } from '../layout/PageHero'
import { PageShell } from '../layout/PageShell'
import { Vacio } from './kit/tarjetas'
import { TipLayer } from './kit/TipLayer'
import './tablero-sitio.css'

type Props = {
  /** Clave de la página en los nombres del tablero: de ahí salen su título y su franja. */
  clave: 'territorio' | 'comparativo' | 'fuentes'
  /** Nombre para la pestaña del navegador. */
  nombre: string
  carga: EstadoCarga
  /** Lo que se lee mientras llegan los datos. */
  leyendo: string
  /** Lo que se dice si no llegó el archivo principal del motor. */
  sinDatos: { k: string; t: string; x: string }
  /** El contenido de la página; se pinta cuando los datos ya están. */
  children: ReactNode
}

/**
 * Marco de las páginas que vienen del tablero del motor (Territorio,
 * Comparativo, Fuentes): el menú y el encabezado del sitio, y debajo el
 * contenido con los estilos del tablero y su tooltip. Mientras cargan los datos
 * muestra el aviso; si falta el archivo principal, lo dice.
 */
export function PaginaTablero({ clave, nombre, carga, leyendo, sinDatos, children }: Props) {
  const pagina = N.pagina(clave)
  const listo = carga === 'listo'
  return (
    <PageShell variant="documento" title={nombre}>
      <div className="frame">
        <PageHero variant="documento" title={pagina.titulo} banner={pagina.pildora} chip={{ icon: 'calendar', text: listo ? `Corte ${D.corte()} · motor ${D.meta()?.version}` : 'Cargando…', font: 'helvetica' }} />
        <TipLayer className="tablero tablero--pagina">
          {carga === 'cargando' ? <div className="pp-cargando">{leyendo}</div> : null}
          {carga === 'falta' ? <Vacio k={sinDatos.k} t={sinDatos.t} x={sinDatos.x} /> : null}
          {listo ? children : null}
        </TipLayer>
      </div>
    </PageShell>
  )
}
