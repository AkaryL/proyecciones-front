/** Formatos de cifras tal como los usa el diseño. */

const MENOS = '−' // signo menos tipográfico (−)

/** Redondeo a entero «al par» en los .5 (el que usa el motor): 22.5 → 22, 33.5 → 34. */
export function entero(value: number): number {
  const floor = Math.floor(value)
  const resto = value - floor
  if (Math.abs(resto - 0.5) < 1e-9) return floor % 2 === 0 ? floor : floor + 1
  return Math.round(value)
}

/** «41.0» */
export const decimal = (value: number, decimales = 1) => value.toFixed(decimales)

/** «41.0%» */
export const porcentaje = (value: number, decimales = 1) => `${value.toFixed(decimales)}%`

/** «87%» (sin decimales, redondeo del motor) */
export const porcentajeEntero = (value: number) => `${entero(value)}%`

/** «+1.5» / «−2.8» / «0.0» */
export function conSigno(value: number, decimales = 1): string {
  const texto = Math.abs(value).toFixed(decimales)
  if (Number(texto) === 0) return texto
  return `${value > 0 ? '+' : MENOS}${texto}`
}

/** «37.6–50.2» */
export const intervalo = (desde: number, hasta: number, decimales = 1) => `${desde.toFixed(decimales)}–${hasta.toFixed(decimales)}`

/** «381,525» */
export const miles = (value: number) => Math.round(value).toLocaleString('es-MX')

/** «1.37 M» · «418 mil» · «985» */
export function compacto(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`
  if (value >= 10_000) return `${Math.round(value / 1000)} mil`
  return miles(value)
}

/** En millones con dos decimales, como la tarjeta del diseño: «1.37 M» · «0.39 M». */
export const millones = (value: number) => `${(value / 1_000_000).toFixed(2)} M`

/** Valor de una variable con su unidad: «62», «29%», «1.4%». */
export function conUnidad(value: number, unidad: string, decimales: number): string {
  const texto = value.toFixed(decimales)
  return unidad === '%' ? `${texto}%` : unidad ? `${texto} ${unidad}` : texto
}
