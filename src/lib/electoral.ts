import { DATOS, type Ambito, type Bloque, type Partido } from '../api'
import type { BarSegment, PartyTone } from '../data/parties'
import { entero } from './format'

/** Orden en que el diseño lista las candidaturas. */
export const BLOQUES: Bloque[] = ['MORENA_ALIADOS', 'MC', 'PAN_PRI']

export const BLOQUE: Record<Bloque, { nombre: string; titular: string; tone: PartyTone; color: string }> = {
  MORENA_ALIADOS: { nombre: 'Morena y aliados', titular: 'MORENA + ALIADOS', tone: 'morena', color: '#c30344' },
  MC: { nombre: 'MC', titular: 'MC', tone: 'mc', color: '#ff8231' },
  PAN_PRI: { nombre: 'PAN/PRI', titular: 'PAN + PRI', tone: 'pan', color: '#0064b9' },
}

export const PARTIDO: Record<Partido, { nombre: string; tone: PartyTone; color: string }> = {
  MC: { nombre: 'MC', tone: 'mc', color: '#ff8231' },
  MORENA: { nombre: 'Morena', tone: 'morena', color: '#c30344' },
  PAN: { nombre: 'PAN', tone: 'pan', color: '#0064b9' },
  PRI: { nombre: 'PRI', tone: 'pri-bright', color: '#00ac52' },
  PVEM: { nombre: 'PVEM', tone: 'pvem', color: '#7cc957' },
  PT: { nombre: 'PT', tone: 'pt', color: '#ff3737' },
  HAG_FUT: { nombre: 'Hagamos/Futuro', tone: 'neutral', color: '#7d5ba6' },
}

export type Veredicto = {
  /** Candidatura que queda primero en más corridas y en qué parte de ellas. */
  lider: Bloque
  p: number
  segundo: Bloque
  p2: number
  /** «gana» (≥ 80 % de las corridas), «ventaja» (≥ 60 %) o «empate» técnico. */
  nivel: 'gana' | 'ventaja' | 'empate'
}

/** Regla del motor para nombrar a quien va adelante en una elección. */
export function veredicto(gana: Record<Bloque, number>): Veredicto {
  const orden = [...BLOQUES].sort((a, b) => gana[b] - gana[a])
  const [lider, segundo] = orden
  const p = gana[lider]
  const { umbral } = DATOS
  return { lider, p, segundo, p2: gana[segundo], nivel: p >= umbral.gana ? 'gana' : p >= umbral.ventaja ? 'ventaja' : 'empate' }
}

/** «Gana Morena y aliados» · «Ventaja MC» · «Empate técnico» */
export function textoVeredicto(v: Veredicto): string {
  if (v.nivel === 'empate') return 'Empate técnico'
  return `${v.nivel === 'gana' ? 'Gana' : 'Ventaja'} ${BLOQUE[v.lider].nombre}`
}

/** Partidos que se dibujan en las barras por distrito (Hagamos/Futuro queda en el tramo gris). */
const PARTIDOS_BARRA: Partido[] = ['MC', 'MORENA', 'PAN', 'PRI', 'PVEM', 'PT']

/** A partir de este porcentaje la cifra va dentro del segmento; si no, debajo. */
const MINIMO_CON_ROTULO = 8

/**
 * Barra apilada por partido de un ámbito, como la del diseño: de mayor a menor,
 * con el nombre y la cifra dentro de los segmentos grandes.
 */
export function barraPorPartido(partidos: Ambito['partidos'], tonoPri: PartyTone = 'pri-bright'): BarSegment[] {
  return [...PARTIDOS_BARRA]
    .sort((a, b) => partidos[b] - partidos[a])
    .map((partido) => {
      const value = entero(partidos[partido])
      const tone = partido === 'PRI' ? tonoPri : PARTIDO[partido].tone
      return value >= MINIMO_CON_ROTULO ? { tone, value, label: `${PARTIDO[partido].nombre} ${value}` } : { tone, value, note: String(value) }
    })
}

/** Distritos que encabeza cada candidatura en una boleta. */
export function distritosPorLider(distritos: Record<string, Ambito>): { bloque: Bloque; distritos: string[] }[] {
  const grupos = new Map<Bloque, string[]>()
  for (const info of DATOS.distritos) {
    const { lider } = veredicto(distritos[info.id].gana)
    grupos.set(lider, [...(grupos.get(lider) ?? []), info.id])
  }
  return [...grupos.entries()].map(([bloque, lista]) => ({ bloque, distritos: lista })).sort((a, b) => b.distritos.length - a.distritos.length)
}

/** «el D8» · «el D8 y el D9» · «el D8, el D9 y el D11» */
export function listaDistritos(ids: string[]): string {
  const partes = ids.map((id) => `el D${id}`)
  if (partes.length <= 1) return partes.join('')
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
}
