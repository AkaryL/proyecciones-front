/**
 * Lo que pinta la página de Diputaciones para un escenario: toma las cifras
 * del motor y las deja en la forma y con los textos del diseño.
 */
import { DATOS, type Bloque, type Boleta, type Escenario } from '../../api'
import type { IconName } from '../../components/icons/iconPaths'
import { DEFAULT_SCENARIO, DISTRICT_LAYOUT, type DistrictTune } from '../../data/diputaciones'
import type { BarSegment, PartyTone } from '../../data/parties'
import { BLOQUE, BLOQUES, barraPorPartido, distritosPorLider, listaDistritos, veredicto, type Veredicto } from '../../lib/electoral'
import { decimal, porcentaje, porcentajeEntero } from '../../lib/format'

/** Nombre corto para titulares («Ventaja Morena»). */
const CORTO: Record<Bloque, string> = { MORENA_ALIADOS: 'Morena', MC: 'MC', PAN_PRI: 'PAN/PRI' }

/** «Corte 2026-11-03 · escenario base S0» */
export function chipLabel(escenario: Escenario): string {
  const corte = `Corte ${DATOS.meta.corte}`
  return escenario.id === DEFAULT_SCENARIO ? `${corte} · escenario base ${escenario.id}` : `${corte} · escenario ${escenario.id} · ${escenario.rotulo}`
}

/* ------------------------------------------------------------------ */
/* Alcaldía                                                            */
/* ------------------------------------------------------------------ */

export type MayorBallot = {
  /** Medianas de Morena y aliados y de MC (los dos círculos). */
  leaders: [string, string]
  /** Tono de quien queda primero en más corridas. */
  tone: PartyTone
  winShare: string
  winShareNote: [string, string]
  headline: string
  note: string
}

function titular(v: Veredicto): string {
  if (v.nivel === 'empate') return 'Empate técnico'
  return `${v.nivel === 'gana' ? 'Gana' : 'Ventaja'} ${CORTO[v.lider]}`
}

export function mayorBallot(escenario: Escenario): MayorBallot {
  const { bloques, gana } = escenario.boletas.ayun
  const v = veredicto(gana)
  const punteros = [...BLOQUES].sort((a, b) => bloques[b][1] - bloques[a][1]).slice(0, 2)
  return {
    leaders: [decimal(bloques.MORENA_ALIADOS[1]), decimal(bloques.MC[1])],
    tone: BLOQUE[v.lider].tone,
    winShare: porcentajeEntero(v.p),
    winShareNote: ['de las corridas gana', BLOQUE[v.lider].nombre],
    headline: titular(v),
    note: punteros.map((bloque) => `${BLOQUE[bloque].nombre} ${porcentaje(bloques[bloque][1])}`).join(' · '),
  }
}

/* ------------------------------------------------------------------ */
/* Diputación local y federal: un círculo por distrito                 */
/* ------------------------------------------------------------------ */

export type DistrictChip = { id: string; tone: PartyTone; probability: string; title: string }

export type DistrictBallot = {
  kind: 'local' | 'federal'
  title: string
  icon: IconName
  districts: DistrictChip[]
  /** Parte resaltada del titular («3 de 4»), su tono y el resto (« distritos»). */
  headline: [string, string]
  headlineTone: PartyTone
  note: string
}

const BALLOTS: { kind: DistrictBallot['kind']; boleta: Boleta; title: string; icon: IconName }[] = [
  { kind: 'local', boleta: 'dip', title: 'DIPUTACIÓN LOCAL', icon: 'ballot' },
  { kind: 'federal', boleta: 'fed', title: 'DIPUTACIÓN FEDERAL', icon: 'bank' },
]

export function districtBallots(escenario: Escenario): DistrictBallot[] {
  return BALLOTS.map(({ kind, boleta, title, icon }) => {
    const { distritos } = escenario.boletas[boleta]
    const grupos = distritosPorLider(distritos)
    const [principal, ...resto] = grupos
    const todos = principal.distritos.length === DATOS.distritos.length
    return {
      kind,
      title,
      icon,
      districts: DATOS.distritos.map((info) => {
        const v = veredicto(distritos[info.id].gana)
        return {
          id: info.id,
          tone: BLOQUE[v.lider].tone,
          probability: porcentajeEntero(v.p),
          title: `Distrito ${info.id}: ${BLOQUE[v.lider].nombre} queda primero en ${porcentaje(v.p)} de las corridas`,
        }
      }),
      headline: [`${principal.distritos.length} de ${DATOS.distritos.length}`, ' distritos'],
      headlineTone: BLOQUE[principal.bloque].tone,
      note: todos
        ? `${BLOQUE[principal.bloque].nombre} en todos los distritos`
        : [BLOQUE[principal.bloque].nombre, ...resto.map((grupo) => `${BLOQUE[grupo.bloque].nombre} gana ${listaDistritos(grupo.distritos)}`)].join(' · '),
    }
  })
}

/* ------------------------------------------------------------------ */
/* Ayuntamiento: barras por candidatura y medidor                      */
/* ------------------------------------------------------------------ */

export type CouncilRow = {
  party: 'morena' | 'mc' | 'pan-pri'
  tone: PartyTone
  label: string
  /** Ancho de la barra en px del diseño (el riel de 340 px equivale a 50 %). */
  barWidth: number
}

const TRACK_WIDTH = 340
const TRACK_MAX = 50

const COUNCIL: { bloque: Bloque; party: CouncilRow['party']; tone: PartyTone }[] = [
  { bloque: 'MORENA_ALIADOS', party: 'morena', tone: 'morena' },
  { bloque: 'MC', party: 'mc', tone: 'mc' },
  { bloque: 'PAN_PRI', party: 'pan-pri', tone: 'pan-navy' },
]

export function councilRows(escenario: Escenario): CouncilRow[] {
  const { bloques } = escenario.boletas.ayun
  return COUNCIL.map(({ bloque, party, tone }) => {
    const value = bloques[bloque][1]
    return { party, tone, label: porcentaje(value), barWidth: Number(((Math.min(value, TRACK_MAX) / TRACK_MAX) * TRACK_WIDTH).toFixed(1)) }
  })
}

export type CouncilGauge = {
  share: number
  tone: PartyTone
  label: string
  caption: string
  subcaption: string
  /** Aviso bajo el medidor; `tie` usa el estilo ámbar del diseño. */
  chip: { text: string; icon: IconName; tie: boolean }
}

export function councilGauge(escenario: Escenario): CouncilGauge {
  const v = veredicto(escenario.boletas.ayun.gana)
  const nombre = BLOQUE[v.lider].nombre
  return {
    share: v.p / 100,
    tone: BLOQUE[v.lider].tone,
    label: porcentajeEntero(v.p),
    caption: `gana ${nombre}`,
    subcaption: 'de las corridas',
    chip:
      v.nivel === 'empate'
        ? { text: 'EMPATE TÉCNICO · EL VOLADO', icon: 'coin', tie: true }
        : { text: `${v.nivel === 'gana' ? 'GANA' : 'VENTAJA'} · ${nombre.toUpperCase()}`, icon: 'trophy', tie: false },
  }
}

/* ------------------------------------------------------------------ */
/* Tarjetas de distrito                                                */
/* ------------------------------------------------------------------ */

export type District = {
  id: string
  name: string
  sections: string
  local: BarSegment[]
  federal: BarSegment[]
  tune: DistrictTune
}

export function districts(escenario: Escenario): District[] {
  return DATOS.distritos.map((info) => {
    const layout = DISTRICT_LAYOUT[info.id] ?? { tune: {}, priTone: 'pri-bright' as PartyTone }
    return {
      id: info.id,
      name: `Distrito ${info.id}`,
      sections: `${info.secciones} secciones`,
      local: barraPorPartido(escenario.boletas.dip.distritos[info.id].partidos, layout.priTone),
      federal: barraPorPartido(escenario.boletas.fed.distritos[info.id].partidos, layout.priTone),
      tune: layout.tune,
    }
  })
}
