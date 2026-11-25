/** Datos de la página "Mapa" (PE 2027 · Proyecciones Electorales). */
import { DATOS, escenarioPorId } from '../api'
import { miles, millones, porcentaje } from '../lib/format'

export type PartyProjection = {
  party: 'mc' | 'morena'
  /** Porcentaje proyectado, tal como se muestra. */
  value: string
  caption: [string, string]
}

export type TerritoryStat = {
  value: string
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
  { party: 'mc', value: '27.8%', caption: CAPTION },
  { party: 'morena', value: '33.1%', caption: CAPTION },
]

/** Tarjetas de voto del ámbito elegido ('' = todo el municipio, o un distrito). */
export function partyProjections(ambito: string): PartyProjection[] {
  if (!ambito) return CITY_PROJECTIONS
  const { partidos } = escenarioPorId(MAP_SCENARIO).boletas.dip.distritos[ambito]
  return [
    { party: 'mc', value: porcentaje(partidos.MC), caption: CAPTION },
    { party: 'morena', value: porcentaje(partidos.MORENA), caption: CAPTION },
  ]
}

/** Tarjetas de territorio del ámbito: secciones electorales y habitantes (Censo 2020). */
export function territoryStats(ambito: string): TerritoryStat[] {
  const distrito = DATOS.distritos.find((d) => d.id === ambito)
  const de = distrito ? `del Distrito ${distrito.id}` : 'de Guadalajara'
  return [
    { value: miles(distrito ? distrito.secciones : DATOS.secciones), label: 'Secciones', sublabel: de, tone: 'accent' },
    { value: millones(distrito ? distrito.habitantes : DATOS.habitantes), label: 'Índice', sublabel: de, tone: 'plain' },
  ]
}

/** Encuadre del mapa principal: centro [lat, lng], zoom al tamaño del diseño y nivel de mosaicos. */
export const MAIN_MAP_VIEW = {
  center: [20.4812, -103.5211] as [number, number],
  zoom: 8.521,
  tileZoom: 8,
}
