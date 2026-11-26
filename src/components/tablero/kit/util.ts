/**
 * Utilidades del sistema de componentes del tablero que no son componentes:
 * el atributo del tooltip, las medidas en px del tablero y el armado de las
 * partes de una barra.
 */
import type { CSSProperties } from 'react'
import { N, color, colorSobre, esNum, tintaSobre, type Json } from '../../../motor'

/** Atributo del tooltip del tablero: lo muestra `TipLayer` al pasar el cursor, enfocar o tocar. */
export const tip = (texto: string | null | undefined) => (texto ? { 'data-pp-tip': texto } : {})

/** Estilos en px del tablero: los números se escalan con --tu, como todo su CSS. */
export const tu = (vars: Record<string, number | string>): CSSProperties =>
  Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === 'number' ? `calc(${v} * var(--tu))` : v])) as CSSProperties

/** % mínimo de un segmento para llevar su cifra dentro de la barra apilada. */
export const ROTULO_MIN = 8

/** Tamaño del rótulo dentro de un segmento según lo largo del texto (clases `pp-apil__l--1…6`). */
export const tallaRotulo = (largo: string) => (largo.length <= 6 ? 1 : largo.length <= 8 ? 2 : largo.length <= 11 ? 3 : largo.length <= 14 ? 4 : largo.length <= 18 ? 5 : 6)

/** Una parte de una barra: partido o coalición (`clave`) o un nombre y color propios. */
export type Parte = { clave?: string; valor: number | null | undefined; nombre?: string; color?: string; sobre?: string }
export type ParteLista = { clave?: string; valor: number; nombre: string; color: string; sobre: string }
export type Partes = Record<string, unknown> | (Parte | [string, unknown])[] | null | undefined

/** {clave: valor} | [[clave, valor]] | [{clave, valor, …}] → partes con nombre y colores, sin las vacías. */
export function partesDe(p: Partes): ParteLista[] {
  const arr: Parte[] = Array.isArray(p)
    ? p.map((x) => (Array.isArray(x) ? { clave: x[0], valor: x[1] as number } : x))
    : Object.keys(p ?? {}).map((k) => ({ clave: k, valor: (p as Record<string, number>)[k] }))
  return arr
    .filter((x): x is Parte & { valor: number } => Boolean(x) && esNum(x.valor) && x.valor > 0)
    .map((x) => {
      const col = x.color || color(x.clave ?? '')
      return { clave: x.clave, valor: x.valor, nombre: x.nombre ?? N.nombre(x.clave), color: col, sobre: x.sobre || (x.color ? tintaSobre(col) : colorSobre(x.clave ?? '')) }
    })
}

/* ------------------------------------------------------------------ */
/* Voto por partido                                                    */
/* ------------------------------------------------------------------ */

export type ItemPartido = { clave: string; nombre: string; candidatura: string; p10: number | null; p50: number | null; p90: number | null }
export type PartidosNorm = { boleta: string; items: ItemPartido[]; naturaleza: string | null; nota: string | null; unidad: '%' | 'votos' }

/**
 * Normaliza lo que entrega la capa de datos (partidos, partidosDistrito,
 * partidosZona, partidosSeccion…) a una lista de partidos en su orden fijo:
 * MC, Morena, PT, PVEM, Hagamos/Futuro, PAN, PRI y Otros.
 */
export function normPartidos(P: Json, boleta?: string): PartidosNorm {
  const b = boleta || P?.boleta || 'ayun'
  const items: ItemPartido[] = Array.isArray(P?.partidos)
    ? P.partidos.map((p: Json) => ({ clave: p.clave, nombre: p.nombre || N.nombre(p.clave), candidatura: p.candidatura || N.candidatura(p.clave), p10: p.p10, p50: p.p50, p90: p.p90 }))
    : (N.partidos(b) as string[]).map((k) => {
        const x = P ? P[k] : null
        const o = x && typeof x === 'object' ? x : { p50: x }
        return { clave: k, nombre: N.nombre(k), candidatura: N.candidatura(k), p10: esNum(o.p10) ? o.p10 : null, p50: esNum(o.p50) ? o.p50 : null, p90: esNum(o.p90) ? o.p90 : null }
      })
  return { boleta: b, items, naturaleza: P?.naturaleza || null, nota: P?.nota || null, unidad: P?.unidad === 'votos' ? 'votos' : '%' }
}

/** [[clave, valor]] en el orden fijo de los partidos, para las barras genéricas. */
export const partesPartidos = (P: Json): [string, number][] =>
  normPartidos(P)
    .items.filter((x) => esNum(x.p50))
    .map((x) => [x.clave, x.p50 as number])
