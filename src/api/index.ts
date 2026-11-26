/**
 * Acceso a datos del front.
 *
 * Todo sale de la API (repositorio `proyecciones-backend`), que devuelve las
 * formas de `types.ts` tal cual. La dirección se configura en `VITE_API_URL`
 * (ver `.env.example`); en desarrollo apunta al puerto 3400.
 *
 *  - El resumen de escenarios se pide UNA vez al arrancar (`cargarDatos`),
 *    antes de montar la aplicación, porque se usa en el primer pintado.
 *  - Lo pesado —mapa, predicción por sección, fuentes— se pide con `fetch` la
 *    primera vez que hace falta y se guarda en `cache`.
 *
 * Si el almacén del back está vacío, la API responde el mismo contrato con las
 * cifras en cero: el sitio se pinta igual, sin números.
 */
import { conCifrasDelDiseno } from './diseno'
import type { Escenario, EscenariosData, FuentesData, MapaData, SeccionesEscenario, TableroSection } from './types'

export * from './types'

/** Base de la API, sin diagonal al final. */
export const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3400/api/proyecciones').replace(/\/+$/, '')

const cache = new Map<string, Promise<unknown>>()

function pedir<T>(ruta: string): Promise<T> {
  let pendiente = cache.get(ruta) as Promise<T> | undefined
  if (!pendiente) {
    pendiente = fetch(`${API}/${ruta}`).then((respuesta) => {
      if (!respuesta.ok) throw new Error(`${API}/${ruta} respondió ${respuesta.status}`)
      return respuesta.json() as Promise<T>
    })
    // si falla, la siguiente petición lo vuelve a intentar
    pendiente.catch(() => cache.delete(ruta))
    cache.set(ruta, pendiente)
  }
  return pendiente
}

/**
 * Escenarios del motor con las cifras de la ciudad y de cada distrito.
 *
 * Se asigna en `cargarDatos()`. Los módulos que lo leen al importarse
 * (`SCENARIO_OPTIONS`, `MAP_SCENARIO`, …) se importan después, desde
 * `main.tsx`, así que para ellos siempre está lleno.
 */
export let DATOS: EscenariosData = undefined as unknown as EscenariosData

/** Pide el resumen de escenarios. Se llama una vez, en el arranque. */
export async function cargarDatos(): Promise<EscenariosData> {
  DATOS = conCifrasDelDiseno(await pedir<EscenariosData>('escenarios'))
  return DATOS
}

export function escenarioPorId(id: string): Escenario {
  return DATOS.escenarios.find((escenario) => escenario.id === id) ?? DATOS.escenarios[0]
}

/** Geometría de las secciones, resultado 2024 y capas temáticas. */
export function getMapa(): Promise<MapaData> {
  return pedir<MapaData>('mapa')
}

/** Predicción por sección de un escenario (diputación local). */
export function getSecciones(escenario: string): Promise<SeccionesEscenario> {
  return pedir<SeccionesEscenario>(`secciones/${escenario}`)
}

/** Contenido de la página Fuentes: secciones de HTML del tablero del motor. */
export async function getFuentes(): Promise<TableroSection[]> {
  const datos = await pedir<FuentesData>('fuentes')
  return datos.secciones
}
