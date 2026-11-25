/**
 * Capas del mapa: cómo se colorea cada sección o distrito según el filtro
 * elegido, su leyenda, el texto que aparece al pasar el cursor y la ficha de lo
 * que se selecciona. No calcula cifras nuevas: solo lee las del motor.
 */
import { DATOS, type Bloque, type Escenario, type MapaData, type Partido, type SeccionesEscenario, type TemaClave } from '../api'
import { BLOQUE, PARTIDO, textoVeredicto, veredicto } from './electoral'
import { compacto, conUnidad, miles, porcentaje } from './format'

export type CapaClave = 'ganador24' | 'adelante' | 'mc' | 'morena' | TemaClave
export type Unidad = 'secc' | 'dist'

/** Lo seleccionado en el mapa: una sección (índice en `ids`) o un distrito (índice en `distritos`). */
export type Seleccion = { unidad: Unidad; indice: number }

export type LeyendaItem = { color: string; texto: string; cuenta?: number }

export type Leyenda = {
  titulo: string
  subtitulo: string
  items: LeyendaItem[]
  nota?: string
}

/** Lo que necesita el mapa para pintar una capa. */
export type Pintura = {
  /** Cambia cuando cambia el coloreado. */
  clave: string
  unidad: Unidad
  /** Color de relleno de la sección i. */
  color: (i: number) => string
  /** La sección i está dentro del ámbito elegido (las demás se atenúan). */
  enAmbito: (i: number) => boolean
  /** Líneas de la etiqueta flotante de la sección i (o de su distrito). */
  texto: (i: number) => string[]
}

/* ------------------------------------------------------------------ */
/* Colores                                                             */
/* ------------------------------------------------------------------ */

export const COLOR = {
  /** Verde con que el diseño resalta el municipio. */
  neutro: '#a3d7b2',
  sinDato: '#c9ced3',
  parejo: '#7b8794',
}

const RAMPA = {
  MC: ['#ffe6d1', '#ffb986', '#ff8231', '#b24a00'],
  MORENA: ['#f7cbd8', '#e06f93', '#c30344', '#6d0026'],
  TEMA: ['#d9f7f0', '#7fe5d2', '#00aba5', '#00485c'],
  NSE: ['#e3f9f4', '#a8eddf', '#5fdcc8', '#1fbfb3', '#00838a', '#00384b'],
}

/** Cortes del % de voto proyectado (regla de dibujo, no del modelo). */
const CORTES_VOTO = { mc: [30, 40, 50], morena: [20, 30, 40] }

const CANDIDATURAS: Bloque[] = ['MC', 'MORENA_ALIADOS', 'PAN_PRI'] // orden de `lider` en los datos por sección

const clase = (value: number, cortes: number[]) => cortes.reduce((k, corte) => (value >= corte ? k + 1 : k), 0)
const claseCuartil = (value: number, cortes: number[]) => cortes.reduce((k, corte) => (value > corte ? k + 1 : k), 0)

/* ------------------------------------------------------------------ */
/* Catálogo de capas (el panel de filtros del diseño)                  */
/* ------------------------------------------------------------------ */

export const CAPAS_ELECTORALES: { clave: CapaClave; label: string }[] = [
  { clave: 'ganador24', label: 'Partido ganador' },
  { clave: 'adelante', label: 'Proyección 2027 Ganador' },
  { clave: 'mc', label: 'Proyección 2027 voto MC' },
  { clave: 'morena', label: 'Proyección 2027 voto Morena' },
]

/** `null`: la capa existe en el diseño pero no hay dato por sección que pintar. */
export const CAPAS_TEMATICAS: { clave: TemaClave | null; label: string }[] = [
  { clave: null, label: 'Sentimiento Digital' },
  { clave: 'servicios', label: 'Servicios Públicos' },
  { clave: 'seguridad_social', label: 'Seguridad Social' },
  { clave: 'economia', label: 'Economía' },
  { clave: 'nse', label: 'Nivel Socieconómico' },
  { clave: 'genero', label: 'Género' },
]

export const AVISO_SENTIMIENTO =
  'Sentimiento digital no se puede pintar en el mapa: las menciones en redes y prensa se miden por canal, tema y actor, no por sección.'

const TITULO_TEMA: Record<TemaClave, string> = {
  servicios: 'Servicios públicos',
  seguridad_social: 'Seguridad social',
  economia: 'Economía',
  nse: 'Nivel socioeconómico',
  genero: 'Género',
}

const ES_TEMA = (capa: CapaClave): capa is TemaClave => capa in TITULO_TEMA

/** ¿La capa necesita la predicción por sección del escenario? */
export const usaPrediccion = (capa: CapaClave | null) => capa === 'adelante' || capa === 'mc' || capa === 'morena'

/* ------------------------------------------------------------------ */
/* Pintura y leyenda                                                   */
/* ------------------------------------------------------------------ */

type Contexto = {
  mapa: MapaData
  /** Predicción por sección del escenario (puede no haber llegado todavía). */
  secciones: SeccionesEscenario | null
  escenario: Escenario
  capa: CapaClave | null
  unidad: Unidad
  /** Distrito al que se limita la vista ('' = todo el municipio). */
  ambito: string
}

const nombreSeccion = (mapa: MapaData, i: number) => `Sección ${mapa.ids[i]}${mapa.colonia[i] ? ` · ${mapa.colonia[i]}` : ''}`
const nombreDistrito = (mapa: MapaData, d: number) => `Distrito ${mapa.distritos[d].id}`

/** Voto estimado del partido Morena en la sección: la mediana de su coalición por su parte en 2024. */
const morenaSeccion = (mapa: MapaData, secciones: SeccionesEscenario, i: number) => secciones.mor[i] * mapa.reparto.MORENA[i]

function contar(n: number, clasificar: (i: number) => number, clases: number) {
  const cuenta = new Array<number>(clases).fill(0)
  for (let i = 0; i < n; i++) {
    const k = clasificar(i)
    if (k >= 0) cuenta[k]++
  }
  return cuenta
}

/** Devuelve cómo pintar el mapa y su leyenda. `null` si faltan datos de la capa. */
export function pintar(ctx: Contexto): { pintura: Pintura; leyenda: Leyenda | null } | null {
  const { mapa, secciones, escenario, capa, unidad, ambito } = ctx
  const n = mapa.ids.length
  const dAmbito = ambito ? mapa.distritos.findIndex((d) => d.id === ambito) : -1
  const enAmbito = (i: number) => dAmbito < 0 || mapa.dl[i] === dAmbito
  const distritos = escenario.boletas[mapa.meta.boleta].distritos
  const porDistrito = unidad === 'dist'
  const rotulo = (i: number) => (porDistrito ? [nombreDistrito(mapa, mapa.dl[i]), `${DATOS.distritos[mapa.dl[i]].secciones} secciones`] : [nombreSeccion(mapa, i), nombreDistrito(mapa, mapa.dl[i])])
  const enElAmbito = dAmbito < 0 ? n : DATOS.distritos[dAmbito].secciones
  const cuantos = `${dAmbito < 0 ? '' : `Distrito ${ambito} · `}${porDistrito ? 'por distrito' : `por sección (${miles(enElAmbito)})`}`
  const clave = `${capa ?? 'neutro'}|${unidad}|${escenario.id}|${ambito}`
  const cuentaDe = (clasificar: (i: number) => number, clases: number) =>
    porDistrito ? undefined : contar(n, (i) => (enAmbito(i) ? clasificar(i) : -1), clases)
  /** Añade a la leyenda las secciones del ámbito que no cayeron en ninguna clase. */
  const conSinDato = (items: LeyendaItem[], cuenta: number[] | undefined): LeyendaItem[] => {
    if (!cuenta) return items
    const resto = enElAmbito - cuenta.reduce((sum, c) => sum + c, 0)
    return resto > 0 ? [...items, { color: COLOR.sinDato, texto: 'Sin dato', cuenta: resto }] : items
  }

  /* Sin capa: solo la división en secciones o distritos, con el verde del diseño. */
  if (!capa) {
    return { pintura: { clave, unidad, color: () => COLOR.neutro, enAmbito, texto: rotulo }, leyenda: null }
  }

  /* --- Partido más votado en 2024 (cómputo oficial) --- */
  if (capa === 'ganador24') {
    const { ganador, seccion, distrito } = mapa.resultado2024
    const ganadorDistrito = distrito.map((r) => mapa.partidos.reduce((best, p, k) => (r[p] > r[mapa.partidos[best]] ? k : best), 0))
    const de = (i: number) => (porDistrito ? ganadorDistrito[mapa.dl[i]] : ganador[i])
    const partido = (k: number): Partido | null => (k >= 0 ? mapa.partidos[k] : null)
    const cuenta = cuentaDe((i) => ganador[i], mapa.partidos.length)
    const presentes = mapa.partidos.map((p, k) => ({ p, k })).filter(({ k }) => (porDistrito ? ganadorDistrito.includes(k) : (cuenta?.[k] ?? 0) > 0))
    return {
      pintura: {
        clave,
        unidad,
        enAmbito,
        color: (i) => {
          const p = partido(de(i))
          return p ? PARTIDO[p].color : de(i) === -2 ? COLOR.parejo : COLOR.sinDato
        },
        texto: (i) => {
          const p = partido(de(i))
          const pct = p ? (porDistrito ? distrito[mapa.dl[i]][p] : seccion[p][i]) : null
          return [...rotulo(i), p && pct != null ? `2024: ${PARTIDO[p].nombre} fue el más votado (${porcentaje(pct)})` : de(i) === -2 ? '2024: empate en el primer lugar' : '2024: sin votos registrados']
        },
      },
      leyenda: {
        titulo: 'Partido más votado en 2024',
        subtitulo: `Diputación local · cómputo oficial · ${cuantos}`,
        items: conSinDato(
          presentes.map(({ p, k }) => ({ color: PARTIDO[p].color, texto: PARTIDO[p].nombre, cuenta: cuenta?.[k] })),
          cuenta,
        ),
        nota: 'Por partido, no por coalición. Es un dato, no una proyección.',
      },
    }
  }

  /* --- Capas temáticas (no cambian con el escenario) --- */
  if (ES_TEMA(capa)) {
    const tema = mapa.temas[capa]
    const valor = (i: number) => (porDistrito ? tema.distrito[mapa.dl[i]] : tema.valores[i])
    const texto = (i: number) => {
      const v = valor(i)
      return [...rotulo(i), v == null ? `${tema.nombre}: sin dato` : `${tema.nombre}: ${conUnidad(v, tema.unidad, tema.decimales)}${porDistrito ? ' (promedio de sus secciones)' : ''}`]
    }
    const subtitulo = `${tema.nombre} · ${cuantos}`
    if (tema.categorias && tema.categoria && tema.cortesCategoria) {
      const cortes = tema.cortesCategoria
      const categoria = (i: number) => {
        if (!porDistrito) return tema.categoria![i]
        const v = valor(i)
        return v == null ? -1 : clase(v, cortes)
      }
      const cuenta = cuentaDe((i) => tema.categoria![i], tema.categorias.length)
      return {
        pintura: { clave, unidad, enAmbito, color: (i) => (categoria(i) >= 0 ? RAMPA.NSE[categoria(i)] : COLOR.sinDato), texto },
        leyenda: {
          titulo: TITULO_TEMA[capa],
          subtitulo,
          items: conSinDato(
            tema.categorias.map((nombre, k) => ({ color: RAMPA.NSE[k], texto: nombre.charAt(0).toUpperCase() + nombre.slice(1), cuenta: cuenta?.[k] })).reverse(),
            cuenta,
          ),
          nota: `Fuente: ${tema.fuente}.`,
        },
      }
    }
    const cortes = tema.cortes ?? []
    const fmt = (v: number) => conUnidad(v, tema.unidad, tema.decimales)
    const rotulos = [`Hasta ${fmt(cortes[0])}`, `${fmt(cortes[0])} a ${fmt(cortes[1])}`, `${fmt(cortes[1])} a ${fmt(cortes[2])}`, `Más de ${fmt(cortes[2])}`]
    const cuenta = cuentaDe((i) => (tema.valores[i] == null ? -1 : claseCuartil(tema.valores[i]!, cortes)), 4)
    return {
      pintura: {
        clave,
        unidad,
        enAmbito,
        color: (i) => {
          const v = valor(i)
          return v == null ? COLOR.sinDato : RAMPA.TEMA[claseCuartil(v, cortes)]
        },
        texto,
      },
      leyenda: {
        titulo: TITULO_TEMA[capa],
        subtitulo,
        items: conSinDato(rotulos.map((t, k) => ({ color: RAMPA.TEMA[k], texto: t, cuenta: cuenta?.[k] })).reverse(), cuenta),
        nota: `Fuente: ${tema.fuente}.`,
      },
    }
  }

  /* --- Capas del motor: siguen al escenario --- */
  const de = `Diputación local · ${escenario.id} · ${cuantos}`

  if (capa === 'adelante') {
    if (porDistrito) {
      const vs = mapa.distritos.map((d) => veredicto(distritos[d.id].gana))
      return {
        pintura: {
          clave,
          unidad,
          enAmbito,
          color: (i) => (vs[mapa.dl[i]].nivel === 'empate' ? COLOR.parejo : BLOQUE[vs[mapa.dl[i]].lider].color),
          texto: (i) => {
            const v = vs[mapa.dl[i]]
            return [...rotulo(i), `${textoVeredicto(v)} · ${BLOQUE[v.lider].nombre} primero en ${porcentaje(v.p)} de las corridas`]
          },
        },
        leyenda: {
          titulo: 'Proyección 2027 · quién va adelante',
          subtitulo: de,
          items: [...CANDIDATURAS.filter((b) => vs.some((v) => v.nivel !== 'empate' && v.lider === b)).map((b) => ({ color: BLOQUE[b].color, texto: BLOQUE[b].nombre })), ...(vs.some((v) => v.nivel === 'empate') ? [{ color: COLOR.parejo, texto: 'Empate técnico' }] : [])],
          nota: `Empate técnico: nadie queda primero en ${DATOS.umbral.ventaja}% o más de las corridas.`,
        },
      }
    }
    if (!secciones) return null
    const tipo = (i: number) => (secciones.lider[i] < 0 ? -1 : secciones.parejo[i] ? 3 : secciones.lider[i])
    const cuenta = cuentaDe(tipo, 4)
    return {
      pintura: {
        clave,
        unidad,
        enAmbito,
        color: (i) => {
          const k = tipo(i)
          return k < 0 ? COLOR.sinDato : k === 3 ? COLOR.parejo : BLOQUE[CANDIDATURAS[k]].color
        },
        texto: (i) => {
          const k = secciones.lider[i]
          if (k < 0) return [...rotulo(i), 'Sin predicción']
          const quien = `${BLOQUE[CANDIDATURAS[k]].nombre} primero en ${porcentaje(secciones.corridas[i] ?? 0)} de las corridas`
          return [...rotulo(i), secciones.parejo[i] ? `Parejo · ${quien}` : `Adelante: ${quien}`]
        },
      },
      leyenda: {
        titulo: 'Proyección 2027 · quién va adelante',
        subtitulo: de,
        items: [
          ...CANDIDATURAS.map((b, k) => ({ color: BLOQUE[b].color, texto: BLOQUE[b].nombre, cuenta: cuenta?.[k] })).filter((item) => (item.cuenta ?? 0) > 0),
          { color: COLOR.parejo, texto: 'Parejo', cuenta: cuenta?.[3] },
        ],
        nota: `Parejo: quien queda primero en más corridas no llega a ${DATOS.umbral.ventaja}% de ellas o no tiene la mediana más alta.`,
      },
    }
  }

  /* voto proyectado de MC o de Morena */
  const esMc = capa === 'mc'
  const cortes = esMc ? CORTES_VOTO.mc : CORTES_VOTO.morena
  const rampa = esMc ? RAMPA.MC : RAMPA.MORENA
  const partido: Partido = esMc ? 'MC' : 'MORENA'
  if (!porDistrito && !secciones) return null
  const valor = (i: number) => (porDistrito ? distritos[mapa.distritos[mapa.dl[i]].id].partidos[partido] : esMc ? secciones!.mc[i] : morenaSeccion(mapa, secciones!, i))
  const cuenta = cuentaDe((i) => clase(valor(i), cortes), 4)
  const rotulos = [`Menos de ${cortes[0]}%`, `${cortes[0]} a ${cortes[1]}%`, `${cortes[1]} a ${cortes[2]}%`, `${cortes[2]}% o más`]
  return {
    pintura: {
      clave,
      unidad,
      enAmbito,
      color: (i) => rampa[clase(valor(i), cortes)],
      texto: (i) => [...rotulo(i), `${PARTIDO[partido].nombre}: ${porcentaje(valor(i))} del voto proyectado`],
    },
    leyenda: {
      titulo: `Proyección 2027 · voto de ${PARTIDO[partido].nombre}`,
      subtitulo: de,
      items: rotulos.map((t, k) => ({ color: rampa[k], texto: t, cuenta: cuenta?.[k] })).reverse(),
      nota: esMc
        ? 'Mediana de las corridas del motor, % de la votación válida.'
        : porDistrito
          ? 'Mediana del motor para el partido Morena, sin sus aliados.'
          : 'Reparto estimado: el voto de la coalición repartido con lo que sacó Morena en cada sección en 2024.',
    },
  }
}

/* ------------------------------------------------------------------ */
/* Ficha de lo seleccionado                                            */
/* ------------------------------------------------------------------ */

export type Ficha = {
  titulo: string
  subtitulo: string
  datos: { etiqueta: string; valor: string }[]
  /** Voto proyectado por candidatura en el escenario. */
  proyeccion: { titulo: string; filas: { nombre: string; color: string; valor: number }[]; lectura: string } | null
  /** Resultado oficial 2024 por partido, de mayor a menor. */
  resultado2024: string | null
  tema: { etiqueta: string; valor: string } | null
}

function top2024(resultado: Partial<Record<Partido, number | null>>, partidos: Partido[]): string | null {
  const lista = partidos
    .map((p) => ({ p, v: resultado[p] }))
    .filter((x): x is { p: Partido; v: number } => typeof x.v === 'number' && x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 4)
  return lista.length ? lista.map(({ p, v }) => `${PARTIDO[p].nombre} ${porcentaje(v)}`).join(' · ') : null
}

export function ficha(seleccion: Seleccion, ctx: Omit<Contexto, 'unidad' | 'ambito'>): Ficha {
  const { mapa, secciones, escenario, capa } = ctx
  const tema = capa && ES_TEMA(capa) ? mapa.temas[capa] : null
  const filas = (valores: Record<Bloque, number>) => CANDIDATURAS.map((b) => ({ nombre: BLOQUE[b].nombre, color: BLOQUE[b].color, valor: valores[b] }))
  const titulo = `Proyección 2027 · ${escenario.id} · diputación local`

  if (seleccion.unidad === 'dist') {
    const d = seleccion.indice
    const info = DATOS.distritos[d]
    const datos = escenario.boletas[mapa.meta.boleta].distritos[info.id]
    const v = veredicto(datos.gana)
    const valorTema = tema ? tema.distrito[d] : null
    return {
      titulo: `Distrito ${info.id}`,
      subtitulo: info.franja ? 'Solo su franja dentro de Guadalajara' : 'Distrito local completo',
      datos: [
        { etiqueta: 'Secciones', valor: miles(info.secciones) },
        { etiqueta: 'Electores', valor: compacto(info.electores) },
        { etiqueta: 'Habitantes', valor: compacto(info.habitantes) },
      ],
      proyeccion: {
        titulo,
        filas: filas({ MC: datos.bloques.MC[1], MORENA_ALIADOS: datos.bloques.MORENA_ALIADOS[1], PAN_PRI: datos.bloques.PAN_PRI[1] }),
        lectura: info.franja
          ? `Más votos en la franja: ${BLOQUE[v.lider].nombre} (${porcentaje(v.p)} de las corridas). La franja no elige diputado por sí sola.`
          : `${textoVeredicto(v)}: ${BLOQUE[v.lider].nombre} queda primero en ${porcentaje(v.p)} de las corridas.`,
      },
      resultado2024: top2024(mapa.resultado2024.distrito[d], mapa.partidos),
      tema: tema ? { etiqueta: `${tema.nombre} (promedio de sus secciones)`, valor: valorTema == null ? 'Sin dato' : conUnidad(valorTema, tema.unidad, tema.decimales) } : null,
    }
  }

  const i = seleccion.indice
  const d = mapa.dl[i]
  const lider = secciones ? secciones.lider[i] : -1
  const valorTema = tema ? tema.valores[i] : null
  return {
    titulo: `Sección ${mapa.ids[i]}`,
    subtitulo: [mapa.colonia[i], `Distrito ${mapa.distritos[d].id}`].filter(Boolean).join(' · '),
    datos: [{ etiqueta: 'Electores', valor: miles(mapa.ln[i]) }],
    proyeccion: secciones
      ? {
          titulo,
          filas: filas({ MC: secciones.mc[i], MORENA_ALIADOS: secciones.mor[i], PAN_PRI: secciones.pp[i] }),
          lectura:
            lider < 0
              ? 'Sin predicción para esta sección.'
              : `${secciones.parejo[i] ? 'Parejo' : 'Va adelante'}: ${BLOQUE[CANDIDATURAS[lider]].nombre} queda primero en ${porcentaje(secciones.corridas[i] ?? 0)} de las corridas.`,
        }
      : null,
    resultado2024: top2024(Object.fromEntries(mapa.partidos.map((p) => [p, mapa.resultado2024.seccion[p][i]])), mapa.partidos),
    tema: tema ? { etiqueta: tema.nombre, valor: valorTema == null ? 'Sin dato' : conUnidad(valorTema, tema.unidad, tema.decimales) } : null,
  }
}

/** Caja [sur-oeste, nor-este] que contiene las secciones del ámbito (todo el municipio si `distrito` < 0). */
export function limites(mapa: MapaData, distrito: number): [[number, number], [number, number]] {
  let minLat = 90
  let maxLat = -90
  let minLng = 180
  let maxLng = -180
  mapa.poligonos.forEach((anillo, i) => {
    if (distrito >= 0 && mapa.dl[i] !== distrito) return
    for (let k = 0; k < anillo.length; k += 2) {
      minLat = Math.min(minLat, anillo[k])
      maxLat = Math.max(maxLat, anillo[k])
      minLng = Math.min(minLng, anillo[k + 1])
      maxLng = Math.max(maxLng, anillo[k + 1])
    }
  })
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ]
}
