/**
 * Página "Simulación 2027 · Diputación local · junio 2027": contenido fijo del
 * diseño (grupos clave, lecturas, textos). El veredicto del motor sale de los
 * datos del escenario elegido (ver src/pages/simulacion/model.ts).
 */
import type { IconName } from '../components/icons/iconPaths'
import type { PartyTone } from './parties'

/* ------------------------------------------------------------------ */
/* Grupos de mayor interés estratégico                                 */
/* ------------------------------------------------------------------ */

export type FormulaTerm = { icon: IconName; label: string; root?: boolean }

export const INTEREST_FORMULA = {
  title: 'CÓMO SE CALCULA EL INTERÉS',
  terms: [
    { icon: 'people', label: 'peso efectivo', root: true },
    { icon: 'scales', label: 'competitividad del distrito' },
    { icon: 'swap', label: 'escenarios' },
  ] as FormulaTerm[],
  result: 'INTERÉS',
}

export type Kpi = { label: string; value: string; note: string }

export const KPIS: Kpi[] = [
  { label: 'GRUPOS CLAVE', value: '18', note: 'todos en el D11 · margen S0 5.7 pp' },
  { label: 'ELECTORES EN LOS 18', value: '282 mil', note: '23% de los 1.227.847 electores' },
  { label: 'MAYOR INTERÉS', value: '116.4', note: '#1 Hombres 30-39 · D11' },
]

/** Tarjeta "Quién lidera": grupos que encabeza cada fuerza. */
export const LEADERS_KPI = {
  label: 'QUIÉN LIDERA',
  mc: 10,
  morena: 7,
  /** Grupos sin detalle. */
  other: 1,
  note: 'MC 10 · Morena 7 · 1 sin detalle (#16)',
}

/* ------------------------------------------------------------------ */
/* Mapa de grupos                                                      */
/* ------------------------------------------------------------------ */

export type GroupCell = { tone: PartyTone; title: string; note: string } | null

export type GroupRow = { age: string; men: GroupCell; women: GroupCell }

export const GROUP_MAP: GroupRow[] = [
  {
    age: '18-24',
    men: { tone: 'mc', title: 'MC 62%', note: '#2 · interés 107' },
    women: { tone: 'mc', title: 'MC 49%', note: '#5 · interés 98' },
  },
  {
    age: '25-29',
    men: { tone: 'mc', title: 'MC 55%', note: '#12 · interés 91' },
    women: { tone: 'mc', title: 'MC 42%', note: '#14 · interés 84' },
  },
  {
    age: '30-39',
    men: { tone: 'mc', title: 'MC 46%', note: '#1 · interés 116' },
    women: { tone: 'morena', title: 'Morena 36%', note: '#3 · interés 103' },
  },
  {
    age: '40-49',
    men: { tone: 'mc', title: 'MC 35%', note: '#7 · interés 94' },
    women: { tone: 'morena', title: 'Morena 41%', note: '#15 · interés 83' },
  },
  {
    age: '50-64',
    men: { tone: 'morena', title: 'Morena 36%', note: '#11 · interés 92' },
    women: { tone: 'morena', title: 'Morena 46%', note: '#4 · interés 101' },
  },
  {
    age: '65+',
    men: null,
    women: { tone: 'morena', title: 'Morena 50%', note: '#9 · interés 94' },
  },
]

export type QuickRead = { icon: IconName; tone: 'mc' | 'morena' | 'teal' | 'deep'; title: string; lines: string[] }

export const QUICK_READS: QuickRead[] = [
  {
    icon: 'target',
    tone: 'mc',
    title: 'MC manda entre jóvenes',
    lines: ['Lidera todos los grupos de 18 a 29', 'años con datos, hasta 62% en hombres', 'de 18-24.'],
  },
  {
    icon: 'female',
    tone: 'morena',
    title: 'Morena manda en mujeres 40+',
    lines: ['Gana en las 5 mujeres de 40 años o', 'más, con hasta 50% en mujeres de', '65+.'],
  },
  {
    icon: 'swap',
    tone: 'teal',
    title: 'Dos escenarios mueven a MC',
    lines: ['S11 le resta 4.5 a 12.1 pp en', 'alcaldía (13 grupos); S4 le suma 4.3', 'a 5.5 pp en mujeres 50+ (4 grupos).'],
  },
  {
    icon: 'scales',
    tone: 'deep',
    title: 'Los más reñidos',
    lines: ['#3 Morena +2.3 · #17 MC +3.2 · #7 MC', '+4.6 (pp de ventaja).'],
  },
]

/* ------------------------------------------------------------------ */
/* Análisis por grupos de edad                                         */
/* ------------------------------------------------------------------ */

export const AGE_ANALYSIS = {
  title: 'Análisis por grupos de edad',
  subtitle: 'Voto de cada segmento en la línea base (diputación local; estimación propia).',
  legendNote: 'Barra = % de voto del segmento · números dentro si el partido tiene 8% o más',
  footnote: 'S11 / S4 = escenario que más mueve a MC en alcaldía (pp) · PARTIC. = participación esperada',
}

/** Canales de la columna "Medios" y su posición en la leyenda inferior (px del diseño). */
export const MEDIA_LEGEND: { icon: 'phone' | 'chat' | 'tv' | 'doc' | 'mic'; label: string; x: number }[] = [
  { icon: 'phone', label: 'Redes', x: 28 },
  { icon: 'chat', label: 'WhatsApp', x: 114 },
  { icon: 'tv', label: 'TV / radio', x: 221.6 },
  { icon: 'doc', label: 'Prensa y noticias digitales', x: 343.6 },
  { icon: 'mic', label: 'Podcasts', x: 588 },
]

/* ------------------------------------------------------------------ */
/* Simulador de escenarios                                             */
/* ------------------------------------------------------------------ */

/** Texto del panel junto al simulador (el del diseño hablaba de un chat con IA, que aún no existe). */
export const SIMULATOR = {
  title: ['Simulador de', 'Escenarios Electorales'],
  paragraphs: [
    ['Explora los 18 escenarios del motor', 'y compara cómo cambiaría el voto', 'en cada boleta y en cada distrito', 'de Guadalajara.'],
    [
      'Elige la boleta, el ámbito y un',
      'escenario: verás el voto proyectado',
      'de cada candidatura, quién va',
      'adelante y cuánto se mueve frente',
      'al escenario central, para apoyar',
      'el desarrollo de estrategias y la',
      'toma de decisiones.',
    ],
  ],
}
