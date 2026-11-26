/**
 * Página "Diputaciones 2027 · Ayuntamiento y diputaciones": contenido fijo del
 * diseño. Las cifras salen del motor (ver src/pages/diputaciones/model.ts).
 */
import type { IconName } from '../components/icons/iconPaths'
import type { PartyTone } from './parties'

/** Escenario con el que abre la página (el del diseño: «escenario base S0»). */
export const DEFAULT_SCENARIO = 'S0'

/**
 * Ajustes finos de cada tarjeta de distrito: en el diseño las tarjetas no están
 * alineadas de forma idéntica entre sí, y estos valores (px del diseño)
 * reproducen esas diferencias. En una tarjeta nueva pueden omitirse.
 */
export type DistrictTune = {
  /** Corrimiento horizontal de la tarjeta. */
  cardX?: number
  /** Corrimiento vertical de la columna de barras. */
  barsDy?: number
  /** Corrimiento vertical de la columna izquierda (ícono, nombre, secciones). */
  headDy?: number
  /** Posición horizontal del ícono dentro de la tarjeta. */
  headX?: number
  /** Botón "Mapa": posición y ancho. */
  buttonX?: number
  buttonY?: number
  buttonWidth?: number
  /** Línea divisoria vertical. */
  dividerX?: number
  dividerY?: number
  /** Separación respecto al bloque anterior y posición de la sombra inferior. */
  gapBefore?: number
  shadowDy?: number
}

export type DistrictLayout = {
  tune: DistrictTune
  /** Verde del PRI en las barras de esa tarjeta (el diseño usa dos). */
  priTone: PartyTone
}

export const DISTRICT_LAYOUT: Record<string, DistrictLayout> = {
  '8': {
    priTone: 'pri',
    tune: {
      cardX: -4.5,
      barsDy: 6.8,
      headDy: 0.8,
      headX: 30.2,
      buttonX: 29.3,
      buttonY: 149,
      buttonWidth: 203.7,
      dividerX: 259,
      dividerY: 24.8,
      gapBefore: 75.5,
      shadowDy: 0,
    },
  },
  '9': {
    priTone: 'pri-bright',
    tune: {
      barsDy: 6,
      headDy: 6.8,
      headX: 26.4,
      buttonX: 25,
      buttonY: 155.1,
      buttonWidth: 202.8,
      dividerY: 30,
      gapBefore: 64.7,
      shadowDy: -2.8,
    },
  },
  '11': {
    priTone: 'pri-bright',
    tune: { gapBefore: 55.5, shadowDy: 2.3 },
  },
  '13': {
    priTone: 'pri-bright',
    tune: { barsDy: 0.2, headDy: 0.2, buttonY: 150, dividerY: 24.2, gapBefore: 54.6, shadowDy: 0 },
  },
}

/** Distrito cuyo mapa aparece desplegado al cargar la página. */
export const DEFAULT_OPEN_DISTRICT = '8'

/* ------------------------------------------------------------------ */
/* Sobre la diputación federal                                         */
/* ------------------------------------------------------------------ */

export type FederalNote = { icon: IconName; title: string; lines: string[] }

export const FEDERAL_NOTES: FederalNote[] = [
  {
    icon: 'layers',
    title: 'Tres boletas',
    lines: ['Proyecto alcaldía,', 'diputación local y diputación federal', '2027, cada una con su base oficial 2024', 'y sus anclas.'],
  },
  {
    icon: 'anchor',
    title: 'Más incertidumbre',
    lines: [
      'La federal se ancla sobre todo en la',
      'encuesta MURAL nov-2026 (su único dato',
      'de intención por distrito), por eso es',
      'más incierta que la local.',
    ],
  },
  {
    icon: 'eye',
    title: 'Leer con cuidado',
    lines: [
      'Su encuesta ancla aún no se ha cotejado',
      'con la publicación original',
      '(3-nov-2026). El margen de MC tiende a',
      'verse más adverso por las anclas, no por',
      'un hecho medido aparte.',
    ],
  },
]
