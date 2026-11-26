import { useEffect, useState } from 'react'
import { DATOS, getFuentes, type TableroSection } from '../api'
import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import { TableroContent } from '../components/tablero/TableroContent'

/**
 * Fuentes: de dónde sale cada cifra, el método del motor, sus supuestos y sus
 * límites. No tiene pantalla en el diseño: usa el mismo encabezado y el
 * contenido completo del tablero del motor.
 *
 * El contenido pesa, así que se pide a la API al entrar a la página y no en el
 * arranque del sitio.
 */
export function FuentesPage() {
  const [secciones, setSecciones] = useState<TableroSection[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    getFuentes()
      .then((datos) => {
        if (vigente) setSecciones(datos)
      })
      .catch((falla: unknown) => {
        console.error(falla)
        if (vigente) setError(falla instanceof Error ? falla.message : String(falla))
      })
    return () => {
      vigente = false
    }
  }, [])

  return (
    <PageShell variant="documento">
      <div className="frame">
        <PageHero
          variant="documento"
          title="FUENTES 2027"
          banner="DATOS, MÉTODO Y LÍMITES"
          chip={{ icon: 'calendar', text: `Corte ${DATOS.meta.corte} · motor ${DATOS.meta.motor}`, font: 'helvetica' }}
        />
        {error ? (
          <p style={{ padding: '32px 0', textAlign: 'center', font: '15px/1.5 system-ui, sans-serif', opacity: 0.7 }}>
            No se pudo cargar el documento de fuentes: {error}
          </p>
        ) : null}
        <TableroContent sections={secciones ?? []} />
      </div>
    </PageShell>
  )
}
