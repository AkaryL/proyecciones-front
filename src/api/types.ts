/**
 * Formas de los datos que consume el front. Hoy salen de archivos estáticos
 * (scripts/build-data.mjs); una API futura debe devolver estas mismas formas.
 */

export type Boleta = 'ayun' | 'dip' | 'fed'

/** Candidaturas que compiten: MC va solo; las otras dos son coaliciones. */
export type Bloque = 'MC' | 'MORENA_ALIADOS' | 'PAN_PRI'

export type Partido = 'MC' | 'MORENA' | 'PT' | 'PVEM' | 'HAG_FUT' | 'PAN' | 'PRI'

/** Percentiles 10, 50 (mediana) y 90 de las corridas del motor, en % de la votación válida. */
export type Rango = [p10: number, p50: number, p90: number]

/** Cifras de un ámbito (la ciudad o un distrito) en una boleta. */
export type Ambito = {
  bloques: Record<Bloque, Rango>
  /** Mediana por partido. */
  partidos: Record<Partido, number>
  /** % de las corridas en que cada candidatura queda primero. */
  gana: Record<Bloque, number>
}

export type BoletaDatos = Ambito & {
  /** Cambio de la mediana frente a S0, en puntos. */
  delta: Record<Bloque, number>
  participacion: number
  distritos: Record<string, Ambito>
}

export type Escenario = {
  id: string
  /** Nombre corto, sin el identificador: «Inercia (central)». */
  rotulo: string
  nombre: string
  definicion: string
  /** Boletas en las que el escenario mueve algo. */
  afecta: Boleta[]
  boletas: Record<Boleta, BoletaDatos>
}

export type DistritoInfo = {
  id: string
  secciones: number
  electores: number
  /** Habitantes del Censo 2020. */
  habitantes: number
  /** Solo una franja del distrito está en Guadalajara: no elige diputado por sí sola. */
  franja: boolean
}

export type EscenariosData = {
  meta: {
    corte: string
    motor: string
    modelo: string
    tablero: string
    corridas: number
    /** Escenario central del motor. */
    central: string
    aviso: string
  }
  /** % de corridas a partir del cual se dice «gana» o «ventaja». */
  umbral: { gana: number; ventaja: number }
  electores: number
  habitantes: number
  secciones: number
  distritos: DistritoInfo[]
  escenarios: Escenario[]
}

/* ------------------------------------------------------------------ */
/* Mapa                                                                */
/* ------------------------------------------------------------------ */

export type TemaClave = 'servicios' | 'seguridad_social' | 'economia' | 'nse' | 'genero'

export type Tema = {
  variable: string
  nombre: string
  detalle: string | null
  unidad: string
  decimales: number
  fuente: string
  /** Valor por sección (mismo orden que `ids`); null sin dato. */
  valores: (number | null)[]
  /** Promedio de las secciones de cada distrito, ponderado por electores. */
  distrito: (number | null)[]
  /** Cuartiles de las secciones (cortes de la leyenda). */
  cortes?: number[]
  rango?: [number, number]
  /** Solo en el nivel socioeconómico: categoría por sección y cortes del índice. */
  categorias?: string[]
  categoria?: number[]
  cortesCategoria?: number[] | null
}

export type Borde = {
  /** Índices de los distritos a cada lado (-1 = fuera del municipio). */
  entre: [number, number]
  /** Polilínea plana: [lat, lng, lat, lng, …]. */
  linea: number[]
}

export type MapaData = {
  meta: { boleta: Boleta; central: string; corte: string }
  /** Clave de cada sección electoral. Todos los arreglos por sección siguen este orden. */
  ids: string[]
  /** Índice del distrito de cada sección (posición en `distritos`). */
  dl: number[]
  /** Electores en la lista nominal. */
  ln: number[]
  colonia: (string | null)[]
  /** Un anillo por sección, plano: [lat, lng, lat, lng, …]. */
  poligonos: number[][]
  distritos: { id: string; centro: [number, number] }[]
  bordes: Borde[]
  partidos: Partido[]
  resultado2024: {
    seccion: Record<Partido, (number | null)[]>
    distrito: Record<Partido, number>[]
    /** Índice en `partidos` del más votado; -1 sin dato, -2 empate. */
    ganador: number[]
  }
  /** Parte de cada partido dentro de su coalición, por sección (resultado 2024). */
  reparto: Record<Exclude<Partido, 'MC'>, number[]>
  temas: Record<TemaClave, Tema>
}

/** Predicción por sección de un escenario (diputación local). */
export type SeccionesEscenario = {
  id: string
  boleta: Boleta
  /** Medianas por candidatura. */
  mc: number[]
  mor: number[]
  pp: number[]
  /** Candidatura con más corridas en primer lugar: 0 MC, 1 Morena y aliados, 2 PAN-PRI. */
  lider: number[]
  /** % de las corridas en que esa candidatura queda primero. */
  corridas: (number | null)[]
  /** 1 si la sección está pareja (nadie llega al umbral de ventaja con la mediana más alta). */
  parejo: number[]
}

/* ------------------------------------------------------------------ */
/* Fuentes                                                             */
/* ------------------------------------------------------------------ */

/** Una sección de la página Fuentes: HTML tomado tal cual del tablero del motor. */
export type TableroSection = { id: string; html: string }

export type FuentesData = {
  /** Archivo del tablero del que se tomó (null si no hay nada cargado). */
  origen: string | null
  secciones: TableroSection[]
}
