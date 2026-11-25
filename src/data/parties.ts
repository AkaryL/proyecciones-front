/** Tonos de partido disponibles en la interfaz (ver clases `.tone-*` en base.css). */
export type PartyTone = 'mc' | 'morena' | 'pan' | 'pan-navy' | 'pri' | 'pri-bright' | 'pvem' | 'pt' | 'neutral'

/** Partidos de la leyenda. */
export type PartyKey = 'mc' | 'morena' | 'pan' | 'pri' | 'pvem' | 'pt'

export const PARTY_NAME: Record<PartyKey, string> = {
  mc: 'Movimiento Ciudadano',
  morena: 'Morena',
  pan: 'PAN',
  pri: 'PRI',
  pvem: 'Partido Verde',
  pt: 'Partido del Trabajo',
}

/** Partido al que corresponde cada tono (varios tonos pueden ser del mismo partido). */
export const TONE_PARTY: Record<PartyTone, PartyKey | null> = {
  mc: 'mc',
  morena: 'morena',
  pan: 'pan',
  'pan-navy': 'pan',
  pri: 'pri',
  'pri-bright': 'pri',
  pvem: 'pvem',
  pt: 'pt',
  neutral: null,
}

/** Segmento de una barra apilada. */
export type BarSegment = {
  tone: PartyTone
  /** Porcentaje del ancho de la barra. */
  value: number
  /** Texto dentro del segmento (se omite en los segmentos pequeños). */
  label?: string
  /** Cifra que se muestra debajo del segmento. */
  note?: string
}
