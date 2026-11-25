import { createContext, useContext } from 'react'
import type { PartyKey } from '../../data/parties'

export type PartyHighlightValue = {
  /** Partido resaltado (el resto de las barras se atenúa) o null. */
  party: PartyKey | null
  toggle: (party: PartyKey) => void
}

export const PartyHighlightContext = createContext<PartyHighlightValue>({ party: null, toggle: () => {} })

/** Partido resaltado desde la leyenda (ver PartyHighlightProvider). */
export function usePartyHighlight() {
  return useContext(PartyHighlightContext)
}
