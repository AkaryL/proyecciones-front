import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import './PaginaCargando.css'

type Props = {
  /** Nombre de la página para la pestaña del navegador. */
  nombre: string
  titulo: string
  franja: string
}

/**
 * Lo que se ve mientras llega el código de una página que se carga aparte (las
 * del tablero traen la capa de datos del motor, que pesa): el mismo marco y el
 * mismo encabezado que tendrá, con un aviso de carga en lugar del contenido.
 */
export function PaginaCargando({ nombre, titulo, franja }: Props) {
  return (
    <PageShell variant="documento" title={nombre}>
      <div className="frame">
        <PageHero variant="documento" title={titulo} banner={franja} chip={{ icon: 'calendar', text: 'Cargando…', font: 'helvetica' }} />
        <p className="pagina-cargando" aria-busy="true">
          Cargando…
        </p>
      </div>
    </PageShell>
  )
}
