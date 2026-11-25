import { useMemo, useState, type ReactNode } from 'react'
import type { PartyKey } from '../../data/parties'
import { PartyHighlightContext, type PartyHighlightValue } from './usePartyHighlight'

/**
 * Comparte entre la leyenda de partidos y las barras qué partido está resaltado.
 * Al tocar un partido en la leyenda, las barras de la sección atenúan a los demás.
 */
export function PartyHighlightProvider({ children }: { children: ReactNode }) {
  const [party, setParty] = useState<PartyKey | null>(null)
  const value = useMemo<PartyHighlightValue>(
    () => ({ party, toggle: (next) => setParty((current) => (current === next ? null : next)) }),
    [party],
  )
  return <PartyHighlightContext.Provider value={value}>{children}</PartyHighlightContext.Provider>
}
