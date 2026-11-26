/**
 * Fuentes · lecturas, textos y cuentas de la página (sin interfaz).
 *
 * De dónde sale cada cifra (ninguna está escrita aquí):
 *   sim_v8.json         _meta (método, insumos, línea base y anclas, canales, rangos inciertos, limitaciones, validación) y escenarios
 *   proyecciones.json   _meta (insumos con huella, marcas, pendientes), parametros, P5 (estado y evidencia de escenarios),
 *                       P6 (encuestas del promedio), P7 (elección), P9 (cortes guardados)
 *   sim_evolucion.json  resultados oficiales de cada boleta · sim_dashboard.json  ficha técnica de cada medición
 *   sim_agentes, sim_escenarios, sim_menciones, sim_corridas, sim_concilio, sim_dossier, sim_agua: su fecha, sus conteos y los textos de su _meta
 * Aquí solo se cuentan elementos y se hacen sumas y restas de esas cifras. El
 * método del motor se muestra con el texto de sim_v8.json · _meta.metodo,
 * partido por sus rótulos; no se reescribe.
 */
import { D, N, T, enFrase, esNum, listaDe as lista, type Boleta, type Json } from '../../motor'

export const RAYA = '—'
const NBSP = ' '
/** Archivos del motor que abre la página. */
export const CARGA = ['v8', 'proyecciones', 'agentes', 'escenarios', 'evolucion', 'dashboard', 'menciones', 'corridas', 'concilio', 'dossier', 'agua']
export const DISCLAIMER = 'son estimaciones propias, condicionales a cada escenario; no son pronósticos'
export const BOLETAS3: Boleta[] = ['ayun', 'dip', 'fed']

export type TabSupuestos = 'modelo' | 'rangos' | 'proyecciones' | 'escenarios'
export const TABS_SUP: { v: TabSupuestos; t: string }[] = [
  { v: 'modelo', t: 'Del modelo' },
  { v: 'rangos', t: 'Rangos inciertos' },
  { v: 'proyecciones', t: 'De las proyecciones' },
  { v: 'escenarios', t: 'Escenarios y noticias' },
]
export type TabFichas = 'promedio' | 'todas'
export const TABS_FI: { v: TabFichas; t: string }[] = [
  { v: 'promedio', t: 'Casas del promedio' },
  { v: 'todas', t: 'Todas las casas' },
]
/** Pestaña que pide la dirección de la página, o la primera si no es válida. */
export const leeTab = <V extends string>(valor: string | null, tabs: { v: V }[]): V => tabs.find((o) => o.v === valor)?.v ?? tabs[0].v

/** Las secciones de la página, en orden; `n` es su número en el índice (la primera no lleva). */
export const SECCIONES = [
  { id: 'fue-resumen', n: null, corto: '', titulo: '¿De dónde sale cada cifra?' },
  { id: 'fue-bloques', n: 1, corto: 'Fuentes por bloque', titulo: '¿Qué archivo alimenta cada parte del tablero?' },
  { id: 'fue-metodo', n: 2, corto: 'Método del motor', titulo: '¿Cómo calcula el motor cada cifra?' },
  { id: 'fue-partidos', n: 3, corto: 'Partidos por separado', titulo: '¿Cómo se separan los partidos?' },
  { id: 'fue-supuestos', n: 4, corto: 'Supuestos', titulo: '¿Qué se supone y qué se podría cambiar?' },
  { id: 'fue-limites', n: 5, corto: 'Limitaciones', titulo: '¿Qué no puede decir este tablero?' },
  { id: 'fue-validacion', n: 6, corto: 'Validación', titulo: '¿Cómo se comprobó el modelo?' },
  { id: 'fue-encuestas', n: 7, corto: 'Fichas de encuestas', titulo: '¿Quién midió, cómo y cuánto cuenta?' },
  { id: 'fue-glosario', n: 8, corto: 'Glosario', titulo: '¿Qué quiere decir cada palabra?' },
  { id: 'fue-cortes', n: 9, corto: 'Historial de cortes', titulo: '¿Cómo ha cambiado el motor de un corte a otro?' },
] as const
export type Sec = (typeof SECCIONES)[number]
export const seccion = (id: Sec['id']): Sec => SECCIONES.find((s) => s.id === id) as Sec

/* ------------------------------------------------------------------ */
/* Formato y texto                                                     */
/* ------------------------------------------------------------------ */

export const obj = (x: unknown): Json => (x && typeof x === 'object' && !Array.isArray(x) ? x : {})
/** {valor, fuente} → valor. */
export const val = (x: Json): Json => (x && typeof x === 'object' && 'valor' in x ? x.valor : x)
export const num = (x: unknown, dec?: number): string => (esNum(x) ? N.num(x, dec) : T.SIN_DATO)
export const pct = (x: unknown, dec?: number): string => (esNum(x) ? N.pct(x, dec) : T.SIN_DATO)
/** Diferencias en «puntos», no en «pp» (regla del portal). */
export const pp = (x: unknown, dec?: number): string => (esNum(x) ? (N.pp(x, dec) as string).replace(/\s*pp$/, `${NBSP}puntos`) : T.SIN_DATO)
export const masMenos = (x: unknown, dec = 1): string => (esNum(x) ? `±${NBSP}${N.num(Math.abs(x), dec)}${NBSP}puntos` : T.SIN_DATO)
export const plural = (n: unknown, uno: string, varios: string): string => `${num(n)} ${n === 1 ? uno : varios}`
/** «a, b y c». */
export const enumera = (a: unknown): string => {
  const l = lista<string>(a).filter((x) => x != null && x !== '')
  return l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`
}
/** Día: «3-nov-2026» · solo mes: «oct-2026». */
export const fechaTxt = (iso: unknown): string => {
  const s = String(iso ?? '')
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? N.fecha(s.slice(0, 10)) : /^\d{4}-\d{2}$/.test(s) ? N.mes(s) : s || T.SIN_DATO
}
export const anio = (iso: unknown): string => /^(\d{4})/.exec(String(iso || ''))?.[1] ?? ''
export const coal = (k: string, b: Boleta = 'ayun'): string => (typeof N.coalicion === 'function' ? N.coalicion(k, b) : N.nombre(k))
export const mayus = (s: unknown): string => {
  const t = String(s ?? '').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}
/** Cierra con punto lo que no termina en signo. */
export const punto = (s: unknown): string => {
  const t = String(s ?? '').trim()
  return !t || /[.!?…»)]$/.test(t) ? t : `${t}.`
}
/** Palabras que los JSON traen sin acento y que la capa de datos todavía no cubre (la causa está en los generadores). */
const TILDES: Record<string, string> = { estan: 'están', historica: 'histórica', tecnica: 'técnica', analogia: 'analogía', minusculas: 'minúsculas', lomeli: 'Lomelí', martinez: 'Martínez' }
const tildes = (s: unknown): string =>
  String(s ?? '')
    .replace(/[A-Za-zñÑáéíóúüÁÉÍÓÚÜ]+/g, (w: string, pos: number, todo: string) => {
      const antes = pos > 0 ? todo.charAt(pos - 1) : ''
      const despues = todo.charAt(pos + w.length)
      const r = TILDES[w.toLowerCase()]
      // rutas, dominios y claves no se tocan
      if (!r || /[\w/.-]/.test(antes) || /[\w/-]/.test(despues)) return w
      return w.charAt(0) === w.charAt(0).toUpperCase() ? r.charAt(0).toUpperCase() + r.slice(1) : r
    })
    .replace(/\besta en votaci/g, 'está en votaci')
/** Quita referencias internas a archivos («(data/insumos/x.json)», «(eventos_2026-11-03.md §V)») y códigos de supuesto («SA-UI-08:»). */
export const sinRutas = (s: unknown): string =>
  String(s ?? '')
    .replace(/\s*\([^()]*\.(?:md|json|py)\b[^()]*\)/g, '')
    .replace(/\s*\(noticia\)/g, '')
    .replace(/(^|\s)SA-[A-Z]+-\d+\s*:?\s*/g, '$1')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
/** Junta de nuevo en frases completas un texto partido por espacios antes de mayúscula. */
const enFrases = (s: string, corte: RegExp): string[] =>
  s.split(corte).reduce<string[]>((ac, trozo) => {
    if (ac.length && !/[.!?]$/.test(ac[ac.length - 1])) ac[ac.length - 1] += ` ${trozo}`
    else ac.push(trozo)
    return ac
  }, [])
/** Quita las frases con asignaciones de código («esc_fac=1.0») o rutas de guiones: no le dicen nada a quien no programa. */
export const sinCodigo = (s: unknown): string =>
  enFrases(String(s ?? ''), /\s+(?=[A-ZÁÉÍÓÚÑ«])/)
    .filter((f) => !/\b[a-z]+_[a-z_]+\s*=|scripts\//.test(f))
    .join(' ')
    .replace(/\s*\([^()]*\b[a-z]+_[a-z_]+\b[^()]*\)/g, '')
    .trim()
/** Texto de un JSON listo para pintar: nomenclatura única y acentos (capa de datos), acentos que faltan y signos. */
export const tx = (s: unknown): string =>
  tildes(D.llano(s == null ? '' : String(s)))
    .replace(/(\d)\s?%/g, `$1${NBSP}%`)
    .replace(/\s->\s/g, ' → ')
    .replace(/>=/g, '≥')
    .replace(/\s+x\s+(?=[a-záéíóúñ(])/gi, ' × ')
export const limpio = (s: unknown): string => punto(mayus(sinRutas(tx(s)))).replace(/(\d)([\s ])pp\b/g, '$1$2puntos')
export const primeraFrase = (s: unknown): string => {
  const t = String(s ?? '')
  return /^(.*?[.!?])(?:\s+[A-ZÁÉÍÓÚÑ«]|$)/.exec(t)?.[1] ?? t
}
export const dominio = (url: unknown): string => /^https?:\/\/(?:www\.)?([^/]+)/.exec(String(url || ''))?.[1] ?? ''
export const esUrl = (url: unknown): url is string => /^https?:\/\//.test(String(url || ''))
export const rotEsc = (id: string): string => {
  const e = D.escenario(id)
  return e ? N.escenario(e) : String(id)
}
/** «Dip. federal (preliminar)». */
export const rotBoleta = (b: string): string => (N.BOLETA[b] ? `${N.BOLETA[b].corto}${b === 'fed' ? ` (${String(T.PRELIMINAR).toLowerCase()})` : ''}` : String(b))

/* ------------------------------------------------------------------ */
/* Acceso a datos                                                      */
/* ------------------------------------------------------------------ */

/** El JSON crudo de un archivo del motor. */
export const J = (k: string): Json => D.dato(k) || null
export const metaDe = (k: string): Json => obj(obj(J(k))._meta)
export const proy = (id: string): Json => J('proyecciones')?.[id] ?? null
export const parametros = (): Json => obj(obj(J('proyecciones')).parametros)
/** Los avisos que se repiten en el tablero («preliminar», «sin cotejar con el original», «no es certeza»). */
export const marcas = (): Json => obj(metaDe('proyecciones').marcas)
export const etiquetaMarca = (k: string, respaldo: string): string => {
  const m = marcas()[k]
  return m?.etiqueta ? String(m.etiqueta) : respaldo
}
export const sinCotejar = (): string => etiquetaMarca('sin_cotejar', 'sin cotejar con el original')
/** La encuesta MURAL va siempre con su advertencia. */
export const nombraMural = (s: unknown): boolean => /MURAL|XtrategiaGDL/.test(String(s ?? ''))
export const nZonas = (j: Json): number => lista(obj(j).distritos).reduce((n, d) => n + lista(d.clusters).length, 0)

type DefArchivo = { k: string; parte: string; que: string; pags: string[]; cuenta: (j: Json) => string }
/** Qué parte del tablero alimenta cada archivo. Las fechas y los conteos se leen de cada JSON. */
const ARCHIVOS: DefArchivo[] = [
  {
    k: 'v8',
    parte: 'Voto proyectado por el motor',
    que: 'Las tres boletas en cada escenario: ciudad, distritos, secciones, grupos de edad y género, y trayectoria mes a mes.',
    pags: ['mapa', 'diputaciones', 'comparativo', 'territorio', 'simulacion'],
    cuenta: (j) => {
      const m = obj(j._meta)
      return `${plural(lista(j.escenarios).length, 'escenario', 'escenarios')} · ${plural(m.n_secciones, 'sección', 'secciones')} · ${plural(m.n_corridas, 'corrida', 'corridas')} por escenario`
    },
  },
  {
    k: 'proyecciones',
    parte: 'Proyecciones útiles',
    que: 'Brecha en votos, ruta de votos, qué mueve la aguja, escalera de escenarios, promedio de encuestas, riesgos y cambios entre cortes. Se calculan con los demás archivos.',
    pags: ['mapa', 'diputaciones', 'comparativo', 'territorio', 'simulacion', 'monitoreo'],
    cuenta: (j) => `${plural(Object.keys(j).filter((k) => /^P\d+$/.test(k)).length, 'proyección', 'proyecciones')} · ${plural(lista(obj(j._meta).insumos).length, 'insumo', 'insumos')} con huella`,
  },
  {
    k: 'agentes',
    parte: `${T.AGENTES} y zonas`,
    que: 'Cada zona del modelo partida por grupo de edad y género, con su lista nominal y su voto de partida.',
    pags: ['territorio', 'simulacion'],
    cuenta: (j) => `${plural(lista(j.agentes).length, 'perfil', 'perfiles')} · ${plural(nZonas(j), 'zona', 'zonas')}`,
  },
  {
    k: 'escenarios',
    parte: 'Grupos clave',
    que: 'Los perfiles de votante ordenados por interés y los grupos más finos, por sección.',
    pags: ['simulacion'],
    cuenta: (j) => `${plural(lista(j.grupos_clave).length, 'grupo clave', 'grupos clave')} · ${plural(lista(j.micro_grupos).length, 'grupo por sección', 'grupos por sección')}`,
  },
  {
    k: 'evolucion',
    parte: 'Evolución de una elección a otra',
    que: 'Resultados oficiales anteriores, encuestas con cifras y la trayectoria mensual de cada escenario.',
    pags: ['comparativo'],
    cuenta: (j) => {
      const n = Object.keys(obj(j.oficiales)).reduce((s, b) => s + lista(j.oficiales[b]).length, 0)
      return `${plural(n, 'resultado oficial', 'resultados oficiales')} · ${plural(lista(j.encuestas).length, 'encuesta', 'encuestas')} con cifras`
    },
  },
  {
    k: 'dashboard',
    parte: 'Encuestas del monitoreo',
    que: 'Cada medición publicada, con su ficha técnica, su enlace y el resultado de la verificación.',
    pags: ['comparativo', 'monitoreo'],
    cuenta: (j) => {
      const c = obj(obj(j.encuestas).conteo)
      return `${plural(c.mediciones, 'medición', 'mediciones')} de ${plural(c.fichas, 'ficha verificada', 'fichas verificadas')}`
    },
  },
  {
    k: 'menciones',
    parte: 'Prensa, redes y actores',
    que: 'Notas verificadas, publicaciones de redes, sentimiento por mes, actores de poder y nube de conceptos.',
    pags: ['monitoreo'],
    cuenta: (j) => {
      const m = obj(j._meta_monitoreo)
      return `${plural(m.noticias_total, 'nota', 'notas')} · ${plural(m.redes, 'publicación de redes', 'publicaciones de redes')}`
    },
  },
  { k: 'corridas', parte: 'Lectura por zona', que: 'Resumen de los números de cada zona, escrito con reglas fijas.', pags: ['territorio'], cuenta: (j) => plural(lista(j.corridas).length, 'zona leída', 'zonas leídas') },
  {
    k: 'concilio',
    parte: 'Lectura por voces',
    que: 'La misma lectura por zona, ordenada por papeles (analista, reservas, síntesis…); también con reglas fijas.',
    pags: ['territorio'],
    cuenta: (j) => `${plural(lista(j.deliberaciones).length, 'zona', 'zonas')} · ${plural(lista(j.roles).length, 'voz', 'voces')}`,
  },
  {
    k: 'dossier',
    parte: 'Dossier',
    que: 'Investigación con evidencias fechadas sobre la alcaldesa, MC y el terreno.',
    pags: ['monitoreo'],
    cuenta: (j) => `${plural(lista(j.temas).length, 'tema', 'temas')} · ${plural(lista(j.recomendaciones).length, 'recomendación', 'recomendaciones')}`,
  },
  {
    k: 'agua',
    parte: 'Crisis del agua',
    que: 'Seguimiento de la crisis: colonias con más reportes, reportes por distrito y señales de alerta.',
    pags: ['monitoreo'],
    cuenta: (j) => `${plural(lista(j.top_colonias).length, 'colonia', 'colonias')} con más reportes · ${plural(lista(j.senales_alerta).length, 'señal de alerta', 'señales de alerta')}`,
  },
]
/** Archivos que usan otras páginas del tablero y que esta no abre: se nombran, sin fecha ni cifras. */
export const OTROS_ARCHIVOS = [
  { archivo: 'mapa_v8.js', que: 'capas del mapa por sección; se genera desde el archivo del motor', pag: 'mapa' },
  { archivo: 'pvem_geo.js', que: 'contorno de las secciones para dibujar el mapa', pag: 'mapa' },
  { archivo: 'datos_paginas.js', que: 'cómputos anteriores del Congreso de Jalisco', pag: 'diputaciones' },
]
/** Nombre llano de cada parámetro de proyecciones.json (su valor y su porqué salen del archivo). */
export const PARAM: Record<string, string> = {
  fecha_eleccion: 'Fecha de la elección',
  escenarios_de_gestion: 'Escenarios de gestión propia',
  interes_escala: 'Índice de interés: escala',
  interes_margen_tope: 'Índice de interés: margen a partir del cual ya no se cuenta como reñido',
  interes_competitividad_minima: 'Índice de interés: competitividad mínima',
  interes_divisor_movilidad: 'Índice de interés: divisor de la movilidad',
  encuestas_vida_media_dias: 'Encuestas: días en que una encuesta pierde la mitad de su peso',
  encuestas_peso_confianza: 'Encuestas: peso según el nivel de confianza',
  encuestas_confianza_sin_clasificar: 'Encuestas: nivel si la ficha no lo declara',
  encuestas_ventana_duplicado_dias: 'Encuestas: días para tratar dos fichas como la misma medición',
  estudio_preliminar: 'Encuesta que va sin cotejar con el original',
  seccion_favorito_umbral: 'Sección con MC favorito: % de corridas desde el que se cuenta',
  seccion_disputa: 'Sección en disputa: tramo de % de corridas',
  top_secciones: 'Secciones por distrito en cada lista',
  top_grupos: 'Grupos por distrito en cada lista',
  dia_para_fechas_de_mes: 'Día que se supone si solo se sabe el mes',
  ejemplos_en_lectura: 'Ejemplos que nombra una lectura',
  largo_maximo_de_cita: 'Largo máximo de una cita',
  tolerancia_de_redondeo: 'Diferencia máxima de redondeo en curules',
}

export type Archivo = { a: DefArchivo; json: Json; archivo: string; fecha: string | null; cuenta: string; estado: 'falta' | 'sin_fecha' | 'anterior' | 'corte' }
/** Cada archivo con su fecha propia, lo que trae hoy y si es anterior al corte del motor. */
export function archivos(): Archivo[] {
  const corte = D.corte()
  return ARCHIVOS.map((a) => {
    const j = J(a.k)
    const f: string | null = j ? D.fechaDe(a.k) : null
    let cuenta = ''
    if (j) {
      try {
        cuenta = a.cuenta(j)
      } catch {
        cuenta = ''
      }
    }
    return { a, json: j, archivo: D.ARCHIVOS?.[a.k] || a.k, fecha: f || null, cuenta, estado: !j ? 'falta' : !f ? 'sin_fecha' : corte && String(f) < String(corte) ? 'anterior' : 'corte' }
  })
}
/** Último resultado oficial de la boleta (sim_evolucion.json). */
export function oficial(b: Boleta): Json {
  const o = lista(J('evolucion') ? D.evolucion(b)?.oficiales : null)
  return o.length ? o[o.length - 1] : null
}
export const intencion = (): Json => proy('P6')?.intencion_alcaldia ?? null
/** Fila de sim_dashboard.json de una medición del monitoreo (su «fuente» dice cuál). */
export function filaTablero(q: Json): Json {
  const m = /sim_dashboard\.json#encuestas\.filas\[(\d+)\]/.exec(String(q?.fuente || ''))
  const t = J('dashboard')
  return m && Array.isArray(t?.encuestas?.filas) ? t.encuestas.filas[+m[1]] || null : null
}
/** Ficha técnica de una encuesta del promedio: la suya en el monitoreo o la de la fila que la repite. */
export function fichaDe(q: Json): Json {
  const propia = filaTablero(q)
  if (propia) return propia
  const marca = new RegExp(`«${String(q.id).replace(/[^\w]/g, '')}»`)
  return lista(intencion()?.no_entran).reduce<Json>((f, o) => f || (marca.test(String(o.motivo || '')) ? filaTablero(o) : null), null)
}

/* ------------------------------------------------------------------ */
/* Método, supuestos y limitaciones                                    */
/* ------------------------------------------------------------------ */

/** «Unidad: … Base: … Choques: …» → [{t, x}], sin cambiar una palabra. */
export function partesMetodo(texto: string): { t: string; x: string }[] {
  const partes: { t: string; x: string }[] = []
  for (const f of enFrases(String(texto || ''), /\s+(?=[A-ZÁÉÍÓÚÑ])/)) {
    const m = /^([A-ZÁÉÍÓÚÑ][^.:;,()]{2,38}):\s+(.*)$/.exec(f)
    if (m) partes.push({ t: m[1], x: mayus(m[2]) })
    else if (partes.length) partes[partes.length - 1].x += ` ${f}`
    else partes.push({ t: '', x: f })
  }
  return partes
}
/** «agua_hoy_dip_mc: −5.0» → «−5.0 puntos al voto de MC (hoy, en la Dip. local)». */
export function metaTxt(k: string, v: unknown): string {
  const t = String(k).split('_')
  const dest = t[t.length - 1]
  const a = dest === 'mc' ? `al voto de ${N.nombre('MC')}` : dest === 'morena' ? `al voto de ${N.nombre('MORENA')}` : dest === 'turnout' ? 'a la participación' : ''
  const ex = t
    .slice(1, -1)
    .map((x) => (x === 'hoy' ? 'hoy' : N.BOLETA[x] ? `en la ${N.BOLETA[x].corto}` : ''))
    .filter(Boolean)
  return `${pp(v)}${a ? ` ${a}` : ''}${ex.length ? ` (${ex.join(', ')})` : ''}`
}
/** Valor de un parámetro de las proyecciones, en llano: fechas, cifras, boletas, listas y pares. */
export function valorParam(v: Json): string {
  const uno = (x: Json): string =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(x)) ? fechaTxt(x) : esNum(x) ? N.num(x, Math.round(x) === x ? 0 : Math.abs(x) < 0.01 ? 3 : 2) : N.BOLETA[x] ? N.BOLETA[x].corto : String(x)
  if (Array.isArray(v)) return v.map(uno).join(' y ')
  if (v && typeof v === 'object')
    return Object.keys(v)
      .map((k) => `${k} ${uno(v[k])}`)
      .join(' · ')
  return uno(v)
}
/** Título corto de una limitación, según de qué habla (no según su posición). */
export function rotLimite(t: string): string {
  if (/calibrad/i.test(t)) return 'Magnitudes calibradas, no medidas'
  if (/posterior a la marcha/i.test(t)) return 'Encuestas después de la marcha'
  if (/sensibilidades/i.test(t)) return 'Sensibilidades por edad, género y nivel socioeconómico'
  if (/distrito 13|franja/i.test(t)) return N.DISTRITO_LOCAL['13'] ? `${N.DISTRITO_LOCAL['13'].corto} · solo su franja de Guadalajara` : 'Solo una franja del distrito'
  if (/Hagamos/i.test(t)) return `Quién va dentro de ${enFrase('MORENA_ALIADOS')}`
  return 'Limitación del motor'
}
/**
 * Cuántas secciones no traen el resultado 2024 por partido de la coalición de
 * Morena en cada boleta (entonces el reparto usa la proporción del motor en su
 * distrito); null mientras el archivo no ha llegado.
 */
export function sinDato2024(b: Boleta): { n: number; de: number } | null {
  if (D.estadoPartidos2024(b) !== 'listo') return null
  const ids: unknown = obj(D.secciones()).ids
  if (!Array.isArray(ids)) return null
  const ps: string[] = N.partidos_de('MORENA_ALIADOS', b)
  const sin = ids.filter((id) => {
    const w: Json = D.proporciones2024(b, id)?.pesos ?? {}
    return !(ps.reduce((s, k) => s + (esNum(w[k]) && w[k] > 0 ? w[k] : 0), 0) > 0)
  })
  return { n: sin.length, de: ids.length }
}
