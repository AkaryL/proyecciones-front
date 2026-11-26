/** Datos de la página "Mapa" (PE 2027 · Proyecciones Electorales). */
import { DATOS, escenarioPorId } from '../api'
import { miles, millones } from '../lib/format'

export type PartyProjection = {
  party: 'mc' | 'morena'
  /** Porcentaje proyectado. */
  value: number
  caption: [string, string]
}

export type TerritoryStat = {
  value: number
  /** Cómo se escribe la cifra («985», «1.37 M»). */
  format: (value: number) => string
  label: string
  sublabel: string
  /** `accent` pinta la cifra en aqua; `plain` en blanco. */
  tone: 'accent' | 'plain'
}

/** Escenario cuyas proyecciones usa la página: el central del motor. */
export const MAP_SCENARIO = DATOS.meta.central

const CAPTION: [string, string] = ['Diputado local', 'Proyecciones 2027']

/**
 * Tarjetas del municipio completo, con las cifras del diseño. Las de voto son
 * del modelo anterior al motor vigente (no se pueden recalcular con sus datos);
 * las otras dos coinciden con los datos: 985 secciones y 1.37 M de habitantes.
 */
const CITY_PROJECTIONS: PartyProjection[] = [
  { party: 'mc', value: 27.8, caption: CAPTION },
  { party: 'morena', value: 33.1, caption: CAPTION },
]

/** Tarjetas de voto del ámbito elegido ('' = todo el municipio, o un distrito). */
export function partyProjections(ambito: string): PartyProjection[] {
  if (!ambito) return CITY_PROJECTIONS
  const { partidos } = escenarioPorId(MAP_SCENARIO).boletas.dip.distritos[ambito]
  return [
    { party: 'mc', value: partidos.MC, caption: CAPTION },
    { party: 'morena', value: partidos.MORENA, caption: CAPTION },
  ]
}

/** Tarjetas de territorio del ámbito: secciones electorales y habitantes (Censo 2020). */
export function territoryStats(ambito: string): TerritoryStat[] {
  const distrito = DATOS.distritos.find((d) => d.id === ambito)
  const de = distrito ? `del Distrito ${distrito.id}` : 'de Guadalajara'
  return [
    { value: distrito ? distrito.secciones : DATOS.secciones, format: miles, label: 'Secciones', sublabel: de, tone: 'accent' },
    { value: distrito ? distrito.habitantes : DATOS.habitantes, format: millones, label: 'Índice', sublabel: de, tone: 'plain' },
  ]
}
