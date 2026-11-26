import type { EscenariosData, Limites } from './types'

/**
 * Caja de Guadalajara ([[sur, oeste], [norte, este]]), para encuadrar el mapa
 * cuando la API todavía no manda `limites`.
 *
 * El contrato los incluye desde que el mapa abre ajustado a la ciudad; un
 * almacén del back importado antes de ese cambio no los trae. No es una cifra
 * del motor: es geografía fija, y solo evita que el mapa se quede sin encuadre.
 */
const GUADALAJARA: Limites = [
  [20.60427, -103.40696],
  [20.75268, -103.26577],
]

const esCaja = (x: unknown): x is Limites =>
  Array.isArray(x) && x.length === 2 && x.every((punto) => Array.isArray(punto) && punto.length === 2 && punto.every((n) => typeof n === 'number' && Number.isFinite(n)))

/**
 * Garantiza que la ciudad y cada distrito traigan su caja. Lo que falte se
 * suple con la de la ciudad (un distrito sin caja propia se encuadra como toda
 * Guadalajara) y se avisa en la consola: se corrige volviendo a generar los
 * datos (`npm run data`) e importándolos al back.
 */
export function conEncuadre(datos: EscenariosData): EscenariosData {
  const completo = esCaja(datos.limites) && datos.distritos.every((distrito) => esCaja(distrito.limites))
  if (completo) return datos
  console.warn('La API no manda `limites` (el encuadre del mapa) completos: se usa la caja de Guadalajara. Vuelve a generar los datos (npm run data) e impórtalos al back.')
  const ciudad = esCaja(datos.limites) ? datos.limites : GUADALAJARA
  return { ...datos, limites: ciudad, distritos: datos.distritos.map((distrito) => (esCaja(distrito.limites) ? distrito : { ...distrito, limites: ciudad })) }
}
