import { DATOS } from '../api'
import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import { TableroContent, type TableroSection } from '../components/tablero/TableroContent'
import fuentes from '../data/generated/fuentes.json'

const SECTIONS = (fuentes as { secciones: TableroSection[] }).secciones

/**
 * Fuentes: de dónde sale cada cifra, el método del motor, sus supuestos y sus
 * límites. No tiene pantalla en el diseño: usa el mismo encabezado y el
 * contenido completo del tablero del motor.
 */
export function FuentesPage() {
  return (
    <PageShell variant="documento">
      <div className="frame">
        <PageHero
          variant="documento"
          title="FUENTES 2027"
          banner="DATOS, MÉTODO Y LÍMITES"
          chip={{ icon: 'calendar', text: `Corte ${DATOS.meta.corte} · motor ${DATOS.meta.motor}`, font: 'helvetica' }}
        />
        <TableroContent sections={SECTIONS} />
      </div>
    </PageShell>
  )
}
