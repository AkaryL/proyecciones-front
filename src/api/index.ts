/**
 * Acceso a datos del front.
 *
 * Todavía no hay backend: los datos son archivos estáticos generados por
 * `npm run data` (scripts/build-data.mjs) a partir del paquete del motor.
 *  - El resumen de escenarios va dentro del bundle (se usa en el primer pintado).
 *  - Lo pesado del mapa se pide con `fetch` la primera vez que hace falta.
 *
 * Para conectar una API basta con reescribir las funciones de este archivo
 * conservando las formas de `types.ts`.
 */
import escenariosJson from '../data/generated/escenarios.json'
import { conCifrasDelDiseno } from './diseno'
import type { Escenario, EscenariosData, MapaData, SeccionesEscenario } from './types'

export * from './types'

/** Escenarios del motor con las cifras de la ciudad y de cada distrito. */
export const DATOS: EscenariosData = conCifrasDelDiseno(escenariosJson as unknown as EscenariosData)

export function escenarioPorId(id: string): Escenario {
  return DATOS.escenarios.find((escenario) => escenario.id === id) ?? DATOS.escenarios[0]
}

const cache = new Map<string, Promise<unknown>>()

function pedir<T>(ruta: string): Promise<T> {
  let pendiente = cache.get(ruta) as Promise<T> | undefined
  if (!pendiente) {
    pendiente = fetch(`${import.meta.env.BASE_URL}data/${ruta}`).then((respuesta) => {
      if (!respuesta.ok) throw new Error(`No se pudo leer ${ruta} (${respuesta.status})`)
      return respuesta.json() as Promise<T>
    })
    // si falla, la siguiente petición lo vuelve a intentar
    pendiente.catch(() => cache.delete(ruta))
    cache.set(ruta, pendiente)
  }
  return pendiente
}

/** Geometría de las secciones, resultado 2024 y capas temáticas. */
export function getMapa(): Promise<MapaData> {
  return pedir<MapaData>('mapa.json')
}

/** Predicción por sección de un escenario (diputación local). */
export function getSecciones(escenario: string): Promise<SeccionesEscenario> {
  return pedir<SeccionesEscenario>(`secciones/${escenario}.json`)
}
