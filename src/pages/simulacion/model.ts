/**
 * Veredicto del motor para un escenario (diputación local), con los textos y
 * la forma que usa la tarjeta del diseño. Las cifras van como números: la
 * página las escribe (y las anima al cambiar de escenario).
 */
import { DATOS, type Bloque, type Escenario } from '../../api'
import type { PartyTone } from '../../data/parties'
import { BLOQUE, veredicto } from '../../lib/electoral'

export const DEFAULT_SCENARIO = DATOS.meta.central

/** «Escenario S1 · Inercia (central)» */
export const scenarioLabel = (escenario: Escenario) => `Escenario ${escenario.id} · ${escenario.rotulo}`

/** Escenarios del selector; se avisa cuáles no mueven la diputación local. */
export const SCENARIO_OPTIONS = DATOS.escenarios.map((escenario) => ({
  value: escenario.id,
  badge: escenario.id,
  label: escenario.rotulo,
  hint: escenario.afecta.length > 0 && !escenario.afecta.includes('dip') ? 'No mueve la diputación local: igual al central' : undefined,
}))

export type ProjectedVote = {
  party: 'morena' | 'mc' | 'pan-pri'
  tone: PartyTone
  /** Mediana proyectada (%). */
  value: number
  /** Cambio frente a S0, en puntos (solo en las filas que lo muestran). */
  delta?: number
  /** Rango P10–P90 (%), si aplica. */
  range?: [number, number]
}

export type Verdict = {
  title: string
  tone: PartyTone
  /** Parte de las corridas (%) en que queda primero el favorito. */
  probability: number
  probabilityCaption: string
  chartTitle: string
  /** Escala del eje: de 0 a `axisMax` %, con una marca cada `axisStep`. */
  axisMax: number
  axisStep: number
  votes: ProjectedVote[]
}

/** Filas del diseño: las dos primeras llevan cambio frente a S0 y rango; PAN/PRI solo su mediana. */
const ROWS: { bloque: Bloque; party: ProjectedVote['party']; tone: PartyTone; detail: boolean }[] = [
  { bloque: 'MORENA_ALIADOS', party: 'morena', tone: 'morena', detail: true },
  { bloque: 'MC', party: 'mc', tone: 'mc', detail: true },
  { bloque: 'PAN_PRI', party: 'pan-pri', tone: 'pan', detail: false },
]

export function verdict(escenario: Escenario): Verdict {
  const { bloques, gana, delta } = escenario.boletas.dip
  const v = veredicto(gana)
  const titular = BLOQUE[v.lider].titular
  return {
    title: v.nivel === 'empate' ? 'EMPATE TÉCNICO' : `${v.nivel === 'gana' ? 'GANA' : 'VENTAJA'} ${titular}`,
    tone: BLOQUE[v.lider].tone,
    probability: v.p,
    probabilityCaption: 'probabilidad del favorito',
    chartTitle: 'VOTO LOCAL PROYECTADO · MEDIANA Y RANGO P10–P90',
    axisMax: 60,
    axisStep: 10,
    votes: ROWS.map(({ bloque, party, tone, detail }) => {
      const [p10, p50, p90] = bloques[bloque]
      return { party, tone, value: p50, ...(detail ? { delta: delta[bloque], range: [p10, p90] as [number, number] } : {}) }
    }),
  }
}
