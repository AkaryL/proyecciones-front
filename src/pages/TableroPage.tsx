import { useState } from 'react'
import { DATOS } from '../api'
import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import { TableroFrame } from '../components/tablero/TableroFrame'

type TableroPageProps = {
  /** Página del tablero del motor que se muestra. */
  pagina: 'territorio' | 'comparativo'
  /** Rótulos del encabezado mientras carga el tablero (después se usan los suyos). */
  titulo: string
  franja: string
}

/**
 * Páginas sin pantalla en el diseño que se muestran como en el tablero del
 * motor: su contenido y sus filtros son los suyos; el menú, el encabezado y el
 * pie son los de este sitio.
 */
export function TableroPage({ pagina, titulo, franja }: TableroPageProps) {
  const [titulos, setTitulos] = useState({ titulo, franja })
  return (
    <PageShell variant="documento" title={pagina === 'territorio' ? 'Territorio' : 'Comparativo'}>
      <div className="frame">
        <PageHero
          variant="documento"
          title={titulos.titulo}
          banner={titulos.franja}
          chip={{ icon: 'calendar', text: `Corte ${DATOS.meta.corte} · motor ${DATOS.meta.motor}`, font: 'helvetica' }}
        />
        <TableroFrame key={pagina} pagina={pagina} onTitulos={setTitulos} />
      </div>
    </PageShell>
  )
}
