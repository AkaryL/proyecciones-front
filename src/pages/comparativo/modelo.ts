/**
 * Comparativo · lecturas y cuentas de la página (sin interfaz).
 *
 * De dónde sale cada cifra (ninguna está escrita aquí):
 *   sim_v8.json          D.recorte / boleta / escenarios / meta  → motor en el escenario elegido
 *   sim_evolucion.json   D.evolucion(boleta)                     → resultados oficiales y trayectoria mensual
 *   proyecciones.json    P6 (encuestas, careos, aprobación), P7 (días a la elección), P9 (cortes), parametros
 *   sim_dashboard.json   encuestas.filas                         → boleta y enlace de las mediciones del monitoreo
 * Lo único que se calcula aquí son restas y sumas de esas cifras (margen = MC −
 * Morena; Morena + los aliados que lista cada encuesta) y la fecha «tres meses
 * antes del corte» del filtro «Último trimestre».
 */
import { D, N, T, casiEmpate, esNum, listaDe as lista, num, partesParejo, pct, signo, type Boleta, type Json } from '../../motor'
import type { CeldaDatos } from '../../components/tablero/kit/noche'

export const SIN_COTEJAR = 'sin cotejar con el original'
export const RAYA = '—'
/** Partidos de la coalición de Morena que una encuesta puede listar. */
const ALIADOS = ['PVEM', 'PT', 'HAG_FUT']
const MESES_TRIMESTRE = 3
/** «alcaldía»: el nombre de la boleta sale de los nombres del tablero. */
export const ALC: string = N.BOLETA.ayun.corto.toLowerCase()

export type Filtro = 'todas' | 'confiables' | 'trimestre'
export const FILTROS: { v: Filtro; t: string }[] = [
  { v: 'todas', t: 'Todas' },
  { v: 'confiables', t: 'Confianza ≥ media' },
  { v: 'trimestre', t: 'Último trimestre' },
]
export const esFiltro = (f: string | null): f is Filtro => FILTROS.some((o) => o.v === f)
export const rotFiltro = (f: Filtro): string => FILTROS.find((o) => o.v === f)?.t ?? ''

/* ------------------------------------------------------------------ */
/* Formato                                                             */
/* ------------------------------------------------------------------ */

/** {valor, fuente} → valor. */
export const val = (x: Json): Json => (x && typeof x === 'object' && 'valor' in x ? x.valor : x)
export const f1 = (x: unknown): string => (esNum(x) ? num(x, 1) : RAYA)
export const sig = (x: unknown): string => (esNum(x) ? signo(x) : RAYA)
/** Textos de los JSON del motor en llano (sin códigos; «Morena y aliados» → «Coalición de Morena»). */
export const llano = (s: unknown): string => (s == null ? '' : (D.llano(s) as string))
/** Lo mismo, con «puntos» en vez de «pp». */
export const puntosTxt = (s: unknown): string =>
  llano(s)
    .replace(/(\d)([\s ])pp\b/g, '$1$2puntos')
    .replace(/\s*\(pp\)/g, '')
/** Día: «3-nov-2026» · solo mes: «oct-2026». */
export const fechaTxt = (iso: unknown): string => {
  const s = String(iso ?? '')
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? N.fecha(s) : /^\d{4}-\d{2}$/.test(s) ? N.mes(s) : s || T.SIN_DATO
}
export const porFecha = (a: Json, c: Json): number => (String(a.fecha) < String(c.fecha) ? -1 : String(a.fecha) > String(c.fecha) ? 1 : 0)
export const busca = (arr: unknown, id: unknown): Json => lista(arr).find((x) => x && String(x.id) === String(id)) ?? null
/** Color del margen sobre panel oscuro: el de MC si es positivo, el de Morena si es negativo. */
export const colM = (m: unknown): string | null => (esNum(m) && m !== 0 ? N.color_texto(m > 0 ? 'MC' : 'MORENA', 'oscuro') : null)
/** Quita referencias internas a archivos: «(eventos_2026-11-03.md §V)». */
export const sinRutas = (s: unknown): string =>
  llano(s)
    .replace(/\s*\([^()]*\.(?:md|json)[^()]*\)/g, '')
    .replace(/^[\w/.-]+\.(?:md|json)\s*§\s*\w+:\s*/, '')
    .trim()
export const has = (o: Json, k: string): boolean => Boolean(o) && Object.prototype.hasOwnProperty.call(o, k)
/** «40.1 a 43.2» o «(sin rango)». */
export const rangoDe = (x: Json): string => (x && esNum(x.p10) && esNum(x.p90) ? `${f1(x.p10)} a ${f1(x.p90)}` : T.SIN_RANGO)

/* ------------------------------------------------------------------ */
/* Partidos por separado                                               */
/* ------------------------------------------------------------------ */

/** MC, Morena, PT, PVEM, Hagamos/Futuro, PAN, PRI (sin «Otros»). */
export const partidosCols = (b: Boleta): string[] => (D.listaPartidos(b) as string[]).filter((k) => k !== 'OTROS')
export const sigla = (k: string): string => {
  const lg = N.logo(k)
  return lg && lg.tipo === 'texto' ? lg.txt : N.nombre(k)
}
/** Total de una coalición dentro del voto por partido. */
export const candTotal = (P: Json, c: string): Json => lista(P?.candidaturas).reduce<Json>((r, x) => (x.clave === c ? x.total : r), null)
/** Los demás partidos de la coalición de Morena, con cifra. */
export const companeros = (P: Json, c: string): Json[] => lista(P?.partidos).filter((x) => x.candidatura === c && x.clave !== 'MORENA' && esNum(x.p50))
/**
 * Reparto estimado por partido de una cifra que solo existe por coalición
 * (trayectoria mensual, cortes guardados): proporción del motor vigente en ese
 * escenario y toda la ciudad. La naturaleza y la nota las pone la capa de datos.
 */
export const reparto = (bloques: Json, e: string, b: Boleta): Json => D.partidosDeBloques(bloques, e, b, null, { dec: 1 })
/** «Coalición de Morena (Morena, PT, PVEM y Hagamos/Futuro)». */
export const coal = (k: string, b: Boleta = 'ayun'): string => (typeof N.coalicion === 'function' ? N.coalicion(k, b) : N.nombre(k))

/** Celda de tabla oscura de un partido: su cifra y, en el tooltip, su naturaleza y su coalición. */
export function celdaPartido(P: Json, k: string, rep: boolean): CeldaDatos {
  const x = P?.por ? P.por[k] : null
  const c: string = N.candidatura(k)
  const t = candTotal(P, c)
  if (!x || !esNum(x.p50)) return { c: RAYA, clase: 'num', tip: P ? `${N.nombre(k)}: ${T.SIN_DATO}.` : null }
  return {
    c: f1(x.p50),
    clase: 'num',
    tip: `${N.nombre(k)} ${pct(x.p50)}${esNum(x.p10) && esNum(x.p90) ? `, ${N.rango(x.p10, x.p90)}` : ''}${c !== k && t && esNum(t.p50) ? ` · ${N.nombre(c)} ${pct(t.p50)} en total` : ''} · ${
      rep ? T.REPARTO_ESTIMADO || P.naturaleza : P.naturaleza
    }.`,
  }
}

/* ------------------------------------------------------------------ */
/* Motor: quién queda primero                                          */
/* ------------------------------------------------------------------ */

/** % de corridas en que cada coalición queda primero, de un corte guardado. */
export function pgCorte(c: Json): Record<string, number> {
  const o: Record<string, number> = {}
  for (const [k, campo] of [
    ['MC', 'p_gana_mc'],
    ['MORENA_ALIADOS', 'p_gana_morena_aliados'],
    ['PAN_PRI', 'p_gana_pan_pri'],
  ]) {
    const v = val(c?.[campo])
    if (esNum(v)) o[k] = v
  }
  return o
}
/**
 * «Coalición de Morena por delante en 74.2 % de las corridas» (el que sea, no
 * siempre MC) o, si nadie llega al umbral, «Parejo · MC 52.3 % · Coalición de
 * Morena 47.7 % de las corridas · nadie llega a 60 %». Con menos de dos
 * coaliciones no se puede saber si es casi empate: null.
 */
export function quienPrimero(pg: Record<string, unknown> | null | undefined, dec = 1): string | null {
  const l = Object.keys(pg ?? {})
    .filter((k) => esNum(pg?.[k]))
    .sort((a, c) => (pg?.[c] as number) - (pg?.[a] as number))
  if (l.length < 2) return null
  if (casiEmpate(pg?.[l[0]])) return `${T.PAREJO} · ${partesParejo(pg, { dec })}`
  return `${N.nombre(l[0])} por delante en ${N.pct_corridas(pg?.[l[0]], dec)}`
}
/**
 * Un corte que solo trae la parte de MC: se nombra a MC solo si llega al umbral;
 * si no, no se sabe quién va adelante y no se destaca a nadie.
 */
export function corridas(pg: Record<string, unknown> | null | undefined): string {
  const t = quienPrimero(pg, 1)
  if (t) return t
  if (!pg || !esNum(pg.MC)) return RAYA
  return casiEmpate(pg.MC)
    ? `${T.PAREJO} · nadie se destaca: el corte solo trae la parte de MC y no llega a ${pct(N.UMBRAL.VENTAJA, 0)} ${T.DE_LAS_CORRIDAS}`
    : `MC por delante en ${N.pct_corridas(pg.MC, 1)}`
}
/** Casi empate (o no se sabe): el margen del motor va sin color de partido. */
export function parejoMotor(pg: Record<string, unknown> | null | undefined): boolean {
  const l = Object.keys(pg ?? {}).filter((k) => esNum(pg?.[k]))
  return l.length < 2 || casiEmpate(Math.max(...l.map((k) => pg?.[k] as number)))
}

/* ------------------------------------------------------------------ */
/* Acceso a datos                                                      */
/* ------------------------------------------------------------------ */

export const proy = (id: string): Json => (D.listo('proyecciones') ? D.proyeccion(id) : null)
export const parametro = (k: string): Json => {
  const p = D.dato('proyecciones')?.parametros?.[k]
  return p ? val(p) : null
}
/** Intención de voto de la alcaldía (P6): promedio, encuestas que entran y que no. */
export const intencion = (): Json => proy('P6')?.intencion_alcaldia ?? null
/** Encuestas que entran en el promedio, de la más antigua a la más reciente. */
export const entran = (): Json[] => [...lista(intencion()?.entran)].sort(porFecha)
export const rotEsc = (id: string): string => {
  const e = D.escenario(id)
  return e ? N.escenario(e) : String(id)
}
/** Fila de sim_dashboard.json de una medición del monitoreo (su «fuente» dice cuál). */
export function filaTablero(q: Json): Json {
  const m = /sim_dashboard\.json#encuestas\.filas\[(\d+)\]/.exec(String(q?.fuente || ''))
  const t = D.dato('dashboard')
  return m && Array.isArray(t?.encuestas?.filas) ? t.encuestas.filas[+m[1]] || null : null
}
/** Cifra de un partido en una encuesta, tal como la publica la casa: la del promedio (P6) y, si no la trae, la de sim_evolucion.json. */
export function cifraEnc(q: Json, k: string): number | null {
  if (q && esNum(q[k])) return q[k]
  const e = lista(D.evolucion('ayun')?.encuestas_todas).reduce<Json>((r, x) => (x && q && String(x.id) === String(q.id) ? x : r), null)
  return e ? (esNum(e[k]) ? e[k] : esNum(e.aliados?.[k]) ? e.aliados[k] : null) : null
}

/* margen de una encuesta: frente a Morena (el partido) y, si lista aliados, frente a Morena con esos aliados (la cuenta de la coalición) */
export const margenSola = (q: Json): number | null => (esNum(q.MC) && esNum(q.MORENA) ? q.MC - q.MORENA : null)
export const aliadosDe = (q: Json): string[] => ALIADOS.filter((k) => esNum(q[k]))
export const conAliados = (q: Json): number | null => {
  const a = aliadosDe(q)
  return a.length && esNum(q.MORENA) ? a.reduce((s, k) => s + q[k], q.MORENA as number) : null
}
export const margenAliados = (q: Json): number | null => {
  const c = conAliados(q)
  return c != null && esNum(q.MC) ? q.MC - c : null
}
/** «PVEM y PT»: los aliados que de verdad lista alguna encuesta. */
export const nombresAliados = (enc: Json[]): string => {
  const usados = new Set(enc.flatMap(aliadosDe))
  return ALIADOS.filter((k) => usados.has(k))
    .map((k) => N.nombre(k) as string)
    .join(' y ')
}
export const adelanteEnc = (m: unknown): string => (!esNum(m) ? RAYA : N.red(m, 1) === 0 ? 'Igualados' : N.nombre(m > 0 ? 'MC' : 'MORENA'))

/** La encuesta MURAL (parametros.estudio_preliminar) va siempre marcada «sin cotejar con el original». */
export function prelim(q: Json): boolean {
  if (!q) return false
  if (q.preliminar === true || q.sin_cotejar === true) return true
  const e = parametro('estudio_preliminar')
  const f = String(q.fecha || '')
  return Boolean(
    e?.casa &&
      String(q.casa || '')
        .toLowerCase()
        .includes(String(e.casa).toLowerCase()) &&
      (!e.desde || f >= e.desde) &&
      (!e.hasta || f <= e.hasta),
  )
}
/** «Rubrum, 28-oct-2026». */
export const cita = (q: Json): string => `${q.casa}, ${fechaTxt(q.fecha)}${prelim(q) ? `, ${SIN_COTEJAR}` : ''}`
/** Aviso que el generador pone junto a una encuesta (p. ej. la que el monitoreo no pudo volver a verificar), en llano. */
export const avisoDe = (q: Json): string => (q?.aviso ? sinRutas(D.llano(String(q.aviso))).replace(/\s*\(estado «[^»]*»\)/g, '') : '')

/* filtros de encuestas: «Confianza ≥ media» usa los pesos por nivel de proyecciones.json; «Último trimestre», tres meses antes del corte */
function esConfiable(q: Json): boolean {
  const w = parametro('encuestas_peso_confianza') || {}
  if (esNum(q.peso_confianza) && esNum(w.media)) return q.peso_confianza >= w.media
  return ['media', 'media-alta', 'alta'].includes(String(q.confianza || ''))
}
/** Fecha «tres meses antes del corte» (AAAA-MM-DD), o '' si no hay corte. */
export function desdeTrimestre(): string {
  const c = D.fechaDe('proyecciones') || D.corte()
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(c))) return ''
  const d = new Date(Date.parse(`${String(c).slice(0, 10)}T00:00:00Z`))
  d.setUTCMonth(d.getUTCMonth() - MESES_TRIMESTRE)
  return d.toISOString().slice(0, 10)
}
export function pasa(q: Json, filtro: Filtro): boolean {
  if (filtro === 'confiables') return esConfiable(q)
  if (filtro === 'trimestre') return String(q.fecha || '') >= desdeTrimestre()
  return true
}

/** Periodo de levantamiento: los campos del JSON si existen; si no, los del monitoreo; si no, los días de su fecha_texto. */
export function periodo(q: Json): [string, string] | null {
  if (q.fecha_inicio && q.fecha_fin) return [q.fecha_inicio, q.fecha_fin]
  const t = filaTablero(q)
  if (t?.campo_ini && t.campo_fin) return [t.campo_ini, t.campo_fin]
  const m = /^(\d{1,2})\s*(?:al|-|–)\s*(\d{1,2})(?=[\s-])/.exec(String(q.fecha_texto || ''))
  const f = String(q.fecha || '')
  if (!m || !/^\d{4}-\d{2}-\d{2}/.test(f)) return null
  const a = +m[1]
  const c = +m[2]
  const dia = +f.slice(8, 10)
  const dos = (n: number) => `${n < 10 ? '0' : ''}${n}`
  return a < c && a <= dia && dia <= c ? [f.slice(0, 8) + dos(a), f.slice(0, 8) + dos(c)] : null
}
/**
 * Fecha de levantamiento con un solo formato («16 al 18-oct-2026»): las dos
 * fuentes de encuestas la escriben distinto. Si solo se sabe el mes o es un rango
 * de ediciones, se deja el texto del JSON; la aclaración entre paréntesis se conserva.
 */
export function levantamiento(q: Json): string {
  const txt = String(q.fecha_texto || '')
  const nota = (/\s*\([^()]*\)\s*$/.exec(txt) || [''])[0]
  const per = periodo(q)
  const f = String(q.fecha || '')
  if (per && per[0] === per[1]) return N.fecha(per[0]) + nota
  if (per) return `${per[0].slice(0, 7) === per[1].slice(0, 7) ? String(+per[0].slice(8, 10)) : N.fecha(per[0])} al ${N.fecha(per[1])}${nota}`
  if (/^\d{1,2}[\s-]/.test(txt) && /^\d{4}-\d{2}-\d{2}/.test(f)) return N.fecha(f) + nota
  return txt || fechaTxt(f)
}

/* ------------------------------------------------------------------ */
/* Evolución                                                           */
/* ------------------------------------------------------------------ */

export const difMedOficial = (o: Json): number | null => (esNum(o.MC) && esNum(o.MORENA_ALIADOS) ? o.MC - o.MORENA_ALIADOS : null)
const difMed = (q: Json): number | null => (q?.MC && q.MORENA_ALIADOS && esNum(q.MC.p50) && esNum(q.MORENA_ALIADOS.p50) ? q.MC.p50 - q.MORENA_ALIADOS.p50 : null)

export type PuntoMes = { fecha: string; hoy: boolean; fin: boolean; MC: Json; MORENA_ALIADOS: Json; PAN_PRI: Json; margen: number | null; m10: number | null; m90: number | null }
/**
 * Trayectoria mensual de un escenario. Los meses salen de la trayectoria (menos
 * corridas); el día de la elección usa el resultado completo, el mismo del resto
 * del tablero.
 */
export function puntosDe(e: Json, bol: Json, fechaEleccion: string): PuntoMes[] {
  return lista(e?.puntos).map((p, i) => {
    const fin = Boolean(e.eleccion && p.fecha === fechaEleccion)
    const q = fin ? e.eleccion : p
    const m = fin && bol ? bol.margen_mc_vs_morena_aliados : null
    return { fecha: p.fecha, hoy: i === 0, fin, MC: q.MC, MORENA_ALIADOS: q.MORENA_ALIADOS, PAN_PRI: q.PAN_PRI, margen: m && esNum(m.p50) ? m.p50 : difMed(q), m10: m ? m.p10 : null, m90: m ? m.p90 : null }
  })
}
