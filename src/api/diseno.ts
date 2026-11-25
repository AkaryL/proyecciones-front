import type { Bloque, Boleta, Escenario, EscenariosData, Rango } from './types'

/**
 * Cifras del diseño (PDF) para la vista inicial de cada página.
 *
 * El diseño se armó con una corrida anterior del motor, así que en dos celdas
 * sus cifras difieren en décimas de las del paquete vigente. Para que la vista
 * inicial sea idéntica al diseño, esas dos celdas se sustituyen aquí. Poner
 * `USAR_CIFRAS_DEL_DISENO` en `false` deja todo tal cual lo exporta el motor.
 */
export const USAR_CIFRAS_DEL_DISENO = true

type Ajuste = {
  escenario: string
  boleta: Boleta
  bloques?: Partial<Record<Bloque, Rango>>
  gana?: Partial<Record<Bloque, number>>
  delta?: Partial<Record<Bloque, number>>
  /** Otros escenarios que comparten estas cifras (los que no mueven esa boleta repiten las del central). */
  tambien?: (escenario: Escenario) => boolean
}

const AJUSTES: Ajuste[] = [
  {
    // Diputaciones · Ayuntamiento («escenario base S0»)
    escenario: 'S0',
    boleta: 'ayun',
    bloques: { MORENA_ALIADOS: [33.9, 41.1, 48.5], MC: [33.6, 41.0, 48.2], PAN_PRI: [17.7, 17.8, 18.1] },
    gana: { MORENA_ALIADOS: 50.4, MC: 49.6 },
  },
  {
    // Simulación · veredicto del motor («Escenario S1 · Inercia (central)», diputación local)
    escenario: 'S1',
    boleta: 'dip',
    bloques: { MORENA_ALIADOS: [37.6, 43.6, 50.2], MC: [25.4, 32.6, 38.9], PAN_PRI: [22.7, 23.2, 24.7] },
    gana: { MORENA_ALIADOS: 87.9, MC: 12.1 },
    delta: { MORENA_ALIADOS: 1.5, MC: -2.8 },
    tambien: (escenario) => escenario.afecta.length > 0 && !escenario.afecta.includes('dip'),
  },
]

/** Devuelve los datos con las celdas del diseño sustituidas (no modifica el original). */
export function conCifrasDelDiseno(datos: EscenariosData): EscenariosData {
  if (!USAR_CIFRAS_DEL_DISENO) return datos
  return {
    ...datos,
    escenarios: datos.escenarios.map((escenario) => {
      const ajustes = AJUSTES.filter((ajuste) => ajuste.escenario === escenario.id || ajuste.tambien?.(escenario))
      if (!ajustes.length) return escenario
      const boletas = { ...escenario.boletas }
      for (const ajuste of ajustes) {
        const actual = boletas[ajuste.boleta]
        boletas[ajuste.boleta] = {
          ...actual,
          bloques: { ...actual.bloques, ...ajuste.bloques },
          gana: { ...actual.gana, ...ajuste.gana },
          delta: { ...actual.delta, ...ajuste.delta },
        }
      }
      return { ...escenario, boletas }
    }),
  }
}
