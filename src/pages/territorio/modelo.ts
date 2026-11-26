/**
 * Modelo de la página Territorio: lo que se pinta con el estado vigente
 * (boleta, escenario, distrito). Ninguna cifra está escrita aquí: todo se lee
 * con la capa de datos del motor (sim_v8, sim_agentes, sim_corridas,
 * sim_concilio y proyecciones). Los umbrales de «favorito» y «en disputa» son
 * los de proyecciones.json · parametros.
 *
 * Quién va delante se cuenta por coalición; la bisagra (40-60 % de las
 * corridas) es pareja y no se le pone dueño.
 */
import { BLOQUE_MORENA, D, N, POR_COAL, T, color, enFrase, esNum, lista, num, pct, pctProb, type Boleta, type Estado, type Json } from '../../motor'
import type { Parte } from '../../components/tablero/kit/util'

export const MOR = BLOQUE_MORENA

export type Clase = 'bastion' | 'defender' | 'recuperar' | 'firme'
export const CLASES: Clase[] = ['bastion', 'defender', 'recuperar', 'firme']
/** Listas de secciones que se pueden ver («cambian» y «diferenciado» no son clases). */
export type Lista = 'bisagra' | 'defender' | 'recuperar' | 'cambian' | 'bastion' | 'diferenciado'

export type Umbrales = { U: number; lo: number; hi: number; top: number | null; topG: number | null }
/** Recuento de secciones de un ámbito por clase, con sus electores en disputa y las que cruzan la mitad frente a la referencia. */
export type Cuenta = { n: number; ln: number; bastion: number; defender: number; recuperar: number; firme: number; lnDisp: number; aMor: number; aMc: number }
export type Resumen = { c: Cuenta; x: Json; n: number; ln: number; fav: number; disp: number; lnDisp: number; aMor: number; aMc: number }
/** Series por sección de la boleta y el escenario (la referencia usa las series «s0_…» del motor). */
export type Series = { ids: (string | number)[]; dl: (string | number)[]; ln: number[]; agua: number[]; pre: string; p0: number[] | null; mc0: number[] | null; p: number[] | null; dmc: number[] | null; tri: Record<string, number[]> | null }
export type Orden3 = { k: string; v: number }[]
export type ZonaVista = { z: Json; v: Json; o: Orden3; vent: number | null; par: boolean; C: Json; K: Json; P: Json }

export type Modelo = {
  b: Boleta
  eid: string
  d: string
  /** Todos los escenarios, el elegido, el de referencia (sin la crisis) y el central. */
  E: Json[]
  e: Json
  ref: Json
  cen: Json
  esRef: boolean
  bol: Json
  prelim: boolean
  /** «ALCALDÍA · S1 · toda Guadalajara» */
  rot: string
  /** «toda Guadalajara», «D8» */
  amb: string
  eRot: string
  /** El mismo rótulo, para texto corrido: «Alcaldía · S1 · toda Guadalajara». */
  rotTxt: string
  u: Umbrales | null
  S: Series | null
  sec: Resumen | null
  zonaDe: Record<string, string>
  zonas: ZonaVista[]
  nZonas: number
  P3: Json
  P3cen: string | null
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export const dCorto = (dl: string | number, b: Boleta): string => (b === 'fed' ? N.distrito_federal(dl, true) : N.distrito(dl, true))
export function esPrelim(b: Boleta): boolean {
  const B = D.proyeccion('P10')?.boletas?.[b]
  return Boolean(B?.preliminar) || /preliminar/i.test(N.BOLETA[b].chip)
}
/** Texto de la etiqueta de boleta: «Alcaldía · S1» (+ «· PRELIMINAR»). */
export const etqBoleta = (m: Modelo, extra?: string): string => `${m.bol.corto} · ${m.eid}${extra ? ` · ${extra}` : ''}${m.prelim ? ` · ${T.PRELIMINAR}` : ''}`
export const marcas = (): Json => D.proyeccion()?._meta?.marcas || {}
/** Probabilidad corta: nunca «100 %» ni «0 %». */
export const probTxt = (p: unknown): string => pctProb(p, 1)
export const esExtrema = (p: unknown): boolean => esNum(p) && /^[<>]/.test(probTxt(p))
/** Las voces de la lectura (sim_concilio.json · roles). */
export const nVoces = (): number => lista(D.dato('concilio')?.roles).length
/** «% 18-24», «% voto Morena dip 2024»… */
export const rasgoTxt = (k: string): string => String(D.dato('agentes')?._meta?.rasgos?.[k] || '')
/** Año del resultado oficial que trae el perfil de zona. */
export const anioBase = (): string => /\b(\d{4})\b/.exec(rasgoTxt('MORENA'))?.[1] ?? ''
/** «Alcaldía · S1»: la boleta y el escenario con que se rotularon las zonas (no siguen los selectores). */
export function rolFijo(): string {
  const mt = D.dato('corridas')?._meta
  return mt?.boleta && mt.rol_escenario ? `${N.BOLETA[mt.boleta].corto} · ${mt.rol_escenario}` : ''
}
export const esPartido = (k: string): boolean => Boolean(N.PARTIDO?.[k])
/** Pares [partido, valor] en el orden fijo de los partidos. */
export function ordenCanon(pares: [string, number][]): [string, number][] {
  const o: string[] = N.PARTIDOS || []
  const pos = (k: string) => (o.indexOf(k) < 0 ? 99 : o.indexOf(k))
  return [...pares].sort((a, b) => pos(a[0]) - pos(b[0]))
}
export const colorBoleta = (b: string): string => (b === 'ayun' ? N.DISENO.teal : b === 'dip' ? N.DISENO.marino : b === 'fed' ? N.DISENO.ambar : N.DISENO.petroleo)
export function colorVoz(roles: Json[], id: string): string {
  const pal = [N.DISENO.teal, N.DISENO.verde, N.DISENO.ambar, N.DISENO.petroleo, N.DISENO.marino]
  const i = Math.max(0, roles.findIndex((r) => r.id === id))
  return pal[i % pal.length]
}

/* ------------------------------------------------------------------ */
/* Clases de sección                                                   */
/* ------------------------------------------------------------------ */

export function umbrales(): Umbrales | null {
  const p = D.proyeccion()?.parametros
  if (!p?.seccion_favorito_umbral || !p.seccion_disputa) return null
  const d = p.seccion_disputa.valor
  return { U: p.seccion_favorito_umbral.valor, lo: d[0], hi: d[1], top: p.top_secciones ? p.top_secciones.valor : null, topG: p.top_grupos ? p.top_grupos.valor : null }
}
export const claseDe = (p: unknown, u: Umbrales): Clase | null => (!esNum(p) ? null : p > u.hi ? 'bastion' : p >= u.U ? 'defender' : p >= u.lo ? 'recuperar' : 'firme')
export function nomClase(k: string): string {
  const nombres: Record<string, string> = {
    bastion: 'Bastión de MC',
    defender: 'Por defender',
    recuperar: 'Por recuperar',
    firme: `Firme de ${enFrase(MOR)}`,
    bisagra: 'Bisagra (en disputa)',
    cambian: 'Cruzan la mitad',
    diferenciado: 'Voto diferenciado',
  }
  return nombres[k] || k
}
export function defClase(k: string, u: Umbrales): string {
  const d = `MC queda delante de ${enFrase(MOR)} (${POR_COAL}) `
  const def: Record<string, string> = {
    bastion: `${d}en más de ${pct(u.hi, 0)} de las corridas`,
    defender: `${d}entre ${pct(u.U, 0)} y ${pct(u.hi, 0)} de las corridas`,
    recuperar: `${d}entre ${pct(u.lo, 0)} y menos de ${pct(u.U, 0)} de las corridas`,
    firme: `${d}en menos de ${pct(u.lo, 0)} de las corridas`,
    bisagra: `${d}entre ${pct(u.lo, 0)} y ${pct(u.hi, 0)} de las corridas`,
  }
  return def[k] || ''
}
/** Bastión y firme llevan el color de quien llega al umbral; la bisagra es casi empate: tonos neutros. */
export function colorClase(k: Clase): string {
  const neutra: string[] = N.rampa('neutra')
  return k === 'bastion' ? color('MC') : k === 'defender' ? neutra[1] : k === 'recuperar' ? N.DISENO.sin_dato : color(MOR)
}
export const partesClase = (c: Record<Clase, number>): Parte[] => CLASES.map((k) => ({ nombre: nomClase(k), valor: c[k], color: colorClase(k) }))

/* ------------------------------------------------------------------ */
/* Series y recuentos                                                  */
/* ------------------------------------------------------------------ */

export function series(b: Boleta, eid: string, ref: Json, esRef: boolean): Series | null {
  const S = D.secciones()
  const pre: string | null = ref ? `${String(ref.id).toLowerCase()}_` : null
  if (!S || !pre) return null
  const serie = (c: string): number[] | null => (esRef ? D.campoSeccion(`${pre}${c}_${b}`) : D.campoSeccion(`${c}_${b}`, eid))
  const o: Series = {
    ids: S.ids,
    dl: S.dl,
    ln: S.lista_nominal,
    agua: S.exposicion_agua,
    pre,
    p0: D.campoSeccion(`${pre}p_mc_${b}`),
    mc0: D.campoSeccion(`${pre}mc_${b}`),
    p: serie('p_mc'),
    dmc: esRef ? null : D.campoSeccion(`d_mc_${b}`, eid),
    tri: null,
  }
  const mc = serie('mc')
  const mor = serie('mor')
  const pan = serie('pp')
  if (mc && mor && pan) o.tri = { MC: mc, [MOR]: mor, PAN_PRI: pan }
  return o
}

export function cuenta(S: Series | null, u: Umbrales | null, dl?: string): Cuenta | null {
  if (!S?.p || !u) return null
  const c: Cuenta = { n: 0, ln: 0, bastion: 0, defender: 0, recuperar: 0, firme: 0, lnDisp: 0, aMor: 0, aMc: 0 }
  const p = S.p
  S.ids.forEach((_, i) => {
    if (dl && String(S.dl[i]) !== dl) return
    const k = claseDe(p[i], u)
    const p0 = S.p0 ? S.p0[i] : null
    c.n++
    c.ln += S.ln[i]
    if (!k) return
    c[k]++
    if (k === 'defender' || k === 'recuperar') c.lnDisp += S.ln[i]
    if (esNum(p0)) {
      if (p0 >= u.U && p[i] < u.U) c.aMor++
      else if (p0 < u.U && p[i] >= u.U) c.aMc++
    }
  })
  return c
}

const filaP10 = (b: Boleta, eid: string, d?: string): Json => D.proyeccion('P10')?.boletas?.[b]?.por_escenario?.[eid]?.[d || 'ciudad'] || null

const avisados = new Set<string>()
/** Las mismas cifras por dos caminos: si el recuento de la página no coincide con proyecciones.json (P10), se anota. */
function comprueba(m: Pick<Modelo, 'b' | 'eid'>, c: Cuenta, x: Json, dl?: string) {
  if (!x) return
  const ok = c.n === x.secciones && c.bastion + c.defender === x.mc_favorito && c.defender + c.recuperar === x.en_disputa && c.lnDisp === x.lista_nominal_en_disputa
  const k = `${m.b}${m.eid}${dl || ''}`
  if (!ok && !avisados.has(k)) {
    avisados.add(k)
    console.warn(`Territorio: el recuento de secciones de ${N.rotulo(m.b, m.eid, dl || '')} no coincide con proyecciones.json (P10).`)
  }
}
/** Cifras de un ámbito: las de P10 donde existen, y el desglose que P10 no trae. */
export function resumenSecc(m: Pick<Modelo, 'b' | 'eid' | 'S' | 'u'>, dl?: string): Resumen | null {
  const c = cuenta(m.S, m.u, dl)
  const x = filaP10(m.b, m.eid, dl)
  if (!c) return null
  comprueba(m, c, x, dl)
  return {
    c,
    x,
    n: c.n,
    ln: c.ln,
    fav: x ? x.mc_favorito : c.bastion + c.defender,
    disp: x ? x.en_disputa : c.defender + c.recuperar,
    lnDisp: x ? x.lista_nominal_en_disputa : c.lnDisp,
    aMor: x ? x.cambian_a_morena_aliados_vs_S0 : c.aMor,
    aMc: x ? x.cambian_a_mc_vs_S0 : c.aMc,
  }
}

/* ------------------------------------------------------------------ */
/* Zonas                                                               */
/* ------------------------------------------------------------------ */

/** Las tres coaliciones de mayor a menor voto. */
export function orden3(v: Json): Orden3 {
  if (!v) return []
  return (D.BLOQUES as string[])
    .map((k) => ({ k, v: v[k] as number }))
    .filter((x) => esNum(x.v))
    .sort((a, b) => b.v - a.v)
}
/** «Parejo» en una zona: los dos primeros a menos del umbral de grupos_variables.json; sin ese dato no se nombra a nadie. */
export function umbralZ(): number | null {
  const m = D.dato('grupos_var')?._meta?.voto_sin_rango
  return m && esNum(m.parejo_menos_de_puntos) ? m.parejo_menos_de_puntos : null
}
export function parejoZ(o: Orden3): boolean {
  const u = umbralZ()
  return o.length > 1 && (u == null || o[0].v - o[1].v < u)
}
export const difZ = (o: Orden3): string => `diferencia ${num(o[0].v - o[1].v, 1)} puntos entre ${enFrase(o[0].k)} y ${enFrase(o[1].k)}`

function zonasVista(m: Pick<Modelo, 'b' | 'eid' | 'd'>): ZonaVista[] {
  return lista(D.zonas(m.d ? { dl: m.d } : null)).map((z) => {
    const v = D.zonaVoto(m.eid, m.b, z.id)
    const o = orden3(v)
    const L = D.zonaLectura(z.id)
    return { z, v, o, vent: o.length > 1 ? o[0].v - o[1].v : null, par: parejoZ(o), C: L.corrida, K: L.deliberacion, P: v ? D.partidosZona(m.eid, m.b, z.id) : null }
  })
}

/* ------------------------------------------------------------------ */
/* Modelo                                                              */
/* ------------------------------------------------------------------ */

export function modelo(v: Estado): Modelo {
  const E = lista(D.escenarios())
  const cen = E.find((x) => x.central)
  const e = E.find((x) => x.id === v.e) ?? cen ?? E[0] ?? { id: v.e, rotulo: v.e }
  const ref = E.find((x) => x.referencia) ?? { id: e.id }
  const bol = N.BOLETA[v.b]
  const esRef = Boolean(e.referencia)
  const prelim = esPrelim(v.b)
  const amb: string = N.ambito(v.d, v.b)
  const u = umbrales()
  const S = series(v.b, v.e, ref, esRef)
  const base = { b: v.b, eid: v.e, d: v.d, S, u }
  const zonaDe: Record<string, string> = {}
  for (const z of lista(D.zonas())) for (const s of lista(z.secciones)) zonaDe[String(s)] = z.id
  const P3 = D.proyeccion('P3')
  return {
    ...base,
    E,
    e,
    ref,
    cen,
    esRef,
    bol,
    prelim,
    rot: N.rotulo(v.b, v.e, v.d),
    amb,
    eRot: e.rotulo || v.e,
    rotTxt: `${bol.corto}${prelim ? ' (preliminar)' : ''} · ${v.e} · ${amb}`,
    sec: resumenSecc(base, v.d),
    zonaDe,
    zonas: zonasVista(base),
    nZonas: lista(D.zonas()).length,
    P3: P3?.boletas?.[v.b]?.zonas ? P3.boletas[v.b] : null,
    P3cen: P3 ? P3.escenario_central : null,
  }
}

/** Secciones de una lista, de más a menos electores. */
export function listaSecc(m: Modelo, cual: Lista): number[] {
  const { S, u } = m
  if (!S?.p || !u) return []
  const p = S.p
  const out: number[] = []
  S.ids.forEach((_, i) => {
    if (m.d && String(S.dl[i]) !== m.d) return
    const k = claseDe(p[i], u)
    const p0 = S.p0 ? S.p0[i] : null
    const entra = cual === 'bisagra' ? k === 'defender' || k === 'recuperar' : cual === 'cambian' ? esNum(p[i]) && esNum(p0) && p0 >= u.U !== p[i] >= u.U : k === cual
    if (entra) out.push(i)
  })
  return out.sort((a, b) => S.ln[b] - S.ln[a] || (String(S.ids[a]) < String(S.ids[b]) ? -1 : 1))
}
