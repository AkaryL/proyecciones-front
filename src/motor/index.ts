/**
 * Datos del motor de simulación (v8.1) para las páginas que vienen del tablero:
 * Territorio, Comparativo y Fuentes.
 *
 * Los cálculos y los nombres son los del propio tablero, tal cual: dos módulos
 * sin interfaz que se guardan en `vendor/` y no se editan aquí (se actualizan
 * copiándolos del paquete del motor):
 *   - nombres.js   → nombres, colores, formatos y textos fijos (`N`)
 *   - pp-datos.js  → lectura de los JSON del motor y sus cálculos (`D`)
 * Todo lo que se ve en pantalla está escrito en React sobre estas lecturas.
 *
 * Mientras no haya backend, los JSON se leen de `public/data/motor/` (los copia
 * `npm run data`). Para conectar una API basta cambiar `lector` en
 * `D.configurar(...)`: recibe el nombre del archivo y devuelve su contenido.
 */
import './vendor/nombres.js'
import './vendor/pp-datos.js'

/**
 * Los datos del motor llegan como JSON sin esquema fijo (cada archivo trae sus
 * propios campos y cambia entre versiones), y la capa de datos es JavaScript sin
 * tipos: se manejan como `Json`. Lo que las páginas arman con ellos sí va tipado.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any

const raiz = globalThis as unknown as { NOMBRES: Json; PPDatos: Json }

/** Nombres, colores, formatos y textos fijos del tablero. */
export const N: Json = raiz.NOMBRES
/** Capa de datos del motor: carga los JSON y hace sus cálculos. */
export const D: Json = raiz.PPDatos
/** Textos fijos («s/d», «Parejo», «PRELIMINAR»…). */
export const T: Json = N.TEXTO

D.configurar({ base: `${import.meta.env.BASE_URL}data/motor/`, nombres: N })

export type Boleta = 'ayun' | 'dip' | 'fed'
/** Lo que se está viendo: boleta, escenario y distrito ('' = toda Guadalajara). */
export type Estado = { b: Boleta; e: string; d: string }

export const BLOQUE_MORENA = 'MORENA_ALIADOS'
const NBSP = ' '

/* ------------------------------------------------------------------ */
/* Formato (los mismos formatos que usa el tablero)                    */
/* ------------------------------------------------------------------ */

export const esNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export const lista = <V = Json>(x: unknown): V[] => (Array.isArray(x) ? (x as V[]) : [])
/** Como `lista`, pero un valor suelto cuenta como lista de uno: así leen Comparativo y Fuentes los campos que el motor a veces entrega solos. */
export const listaDe = <V = Json>(x: unknown): V[] => (Array.isArray(x) ? (x as V[]) : x == null ? [] : [x as V])
export const lim = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
/** Número con dos decimales como mucho, para estilos (anchos, posiciones). */
export const r2 = (n: number) => String(Math.round(n * 100) / 100)
export const techo = (v: number, paso = 10) => Math.max(paso, Math.ceil((v - 1e-9) / paso) * paso)

export const num = (x: unknown, dec?: number): string => N.num(x, dec)
export const pct = (x: unknown, dec?: number): string => N.pct(x, dec)
/** Diferencia en puntos porcentuales: «+1.5 pp». */
export const pp = (x: unknown, dec?: number): string => N.pp(x, dec)
/** Diferencia con signo y sin unidad: «+1.5», «−2.8». */
export const signo = (x: unknown, dec?: number): string => {
  const s: string = N.pp(x, dec)
  return s === T.SIN_DATO ? s : s.replace(/\s*pp$/, '')
}
/** Diferencia en «puntos» (regla del portal: nunca «pp» en texto corrido). */
export const pts = (x: unknown, dec?: number): string => {
  const t = pp(x, dec)
  return t === T.SIN_DATO ? t : t.replace(/\s*pp$/, `${NBSP}puntos`)
}
export const ptsAbs = (x: unknown, dec?: number): string => pts(x, dec).replace(/^[+−-]/, '')
/** «1.23 M», «283 mil», «985» (cifras grandes en tarjetas). */
export const compacto = (x: unknown): string => {
  if (!esNum(x)) return T.SIN_DATO
  const a = Math.abs(x)
  if (a >= 1e6) return `${N.num(x / 1e6, 2)}${NBSP}M`
  if (a >= 1e4) return `${N.num(x / 1e3, 0)}${NBSP}mil`
  return N.num(x, 0)
}
/** Probabilidad corta: nunca «100 %» ni «0 %» («>99.9 %», «<0.1 %»). */
export const pctProb = (p: unknown, dec?: number): string => {
  if (!esNum(p)) return T.SIN_DATO
  const largo: string = N.pct_corridas(p, dec ?? 0)
  if (/^más del/.test(largo)) return `>${largo.replace(/^más del\s*/, '').replace(/\s*de las corridas$/, '')}`
  if (/^menos del/.test(largo)) return `<${largo.replace(/^menos del\s*/, '').replace(/\s*de las corridas$/, '')}`
  return N.pct(p, dec ?? 0)
}
/** Casi empate: el primero queda primero en menos de 60 % de las corridas; no se nombra a nadie. */
export const casiEmpate = (p: unknown): boolean => esNum(p) && p < N.UMBRAL.VENTAJA
/** «Coalición de Morena 55.9 % · MC 44.1 % de las corridas · nadie llega a 60 %». */
export function partesParejo(pg: Record<string, unknown> | null | undefined, op: { dec?: number; corto?: boolean } = {}): string {
  const dec = op.dec ?? (op.corto ? 0 : 1)
  const dos = Object.keys(pg ?? {})
    .filter((k) => esNum(pg?.[k]))
    .sort((a, c) => (pg?.[c] as number) - (pg?.[a] as number))
    .slice(0, 2)
    .map((k) => `${N.nombre(k)} ${pctProb(pg?.[k], dec)}`)
    .join(' · ')
  if (op.corto) return dos
  const nadie = `nadie llega a ${N.pct(N.UMBRAL.VENTAJA, 0)}`
  return dos ? `${dos} ${T.DE_LAS_CORRIDAS} · ${nadie}` : `${nadie} ${T.DE_LAS_CORRIDAS}`
}

/* ------------------------------------------------------------------ */
/* Colores                                                             */
/* ------------------------------------------------------------------ */

/** Relleno de dato de un partido o coalición. */
export const color = (k: string): string => N.color(k, 'claro')
/** Nombre o cifra escritos en el color del partido. */
export const colorTexto = (k: string): string => N.color_texto(k, 'claro')
/** Texto encima del relleno del partido. */
export const colorSobre = (k: string): string => N.color_sobre(k, 'claro')
/** Blanco o negro, lo que se lea mejor sobre un color cualquiera. */
export const tintaSobre = (hex: string): string => (N.contraste(N.SOBRE.blanco, hex) >= N.contraste(N.SOBRE.negro, hex) ? N.SOBRE.blanco : N.SOBRE.negro)

/* ------------------------------------------------------------------ */
/* Texto                                                               */
/* ------------------------------------------------------------------ */

/** «1 sección» / «28 zonas». */
export const cuantos = (n: unknown, uno: string, varios: string): string => `${num(n)} ${n === 1 ? uno : varios}`
export const mayus = (s: unknown): string => {
  const t = String(s ?? '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}
/** Textos de los JSON: sin códigos internos ni paréntesis que citan archivos o campos. */
export const limpia = (t: unknown): string =>
  (D.llano(t) as string)
    .replace(/\s*\([^()]*\.(?:json|py|md)[^()]*\)/g, '')
    .replace(/\s*\([a-z][a-z0-9]*_[a-z0-9_]+\)/g, '')
    .replace(/\s*\((?:noticia|supuesto)s?\)/gi, '')
/** Textos de los JSON en llano y con «puntos» en vez de «pp». */
export const puntosTxt = (t: unknown): string => (t == null ? '' : (D.llano(t) as string)).replace(/(\d)([\s ])pp\b/g, '$1$2puntos')
/** Nombre de una coalición dentro de una frase: «la coalición de Morena». */
export const enFrase = (k: string): string => (typeof N.enFrase === 'function' ? N.enFrase(k) : N.nombre(k))
/** «por coalición». */
export const POR_COAL: string = T.POR_COALICION || 'por coalición'
