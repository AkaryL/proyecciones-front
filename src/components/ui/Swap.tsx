import { useContext, useState, type CSSProperties, type ReactNode } from 'react'
import { PaginaLista } from '../../lib/motion'

type SwapProps = {
  /** Etiqueta que se dibuja. */
  as?: 'p' | 'span' | 'h2' | 'div'
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * Texto que cambia con una elección de la persona (otro escenario, otro
 * ámbito…). Se usa con `key` igual a su contenido: al cambiar, React lo monta
 * de nuevo y entra con un fundido corto, así se nota qué cambió.
 *
 * Lo que ya venía al cargar la página no se anima. Por eso la clase se decide
 * una sola vez, al montar, y no cambia después: añadirla más tarde dispararía
 * la animación en lo que ya estaba en pantalla.
 */
export function Swap({ as: Tag = 'p', className = '', style, children }: SwapProps) {
  const lista = useContext(PaginaLista)
  const [entra] = useState(lista)
  return (
    <Tag className={`${className}${entra ? ' swap-in' : ''}`} style={style}>
      {children}
    </Tag>
  )
}
