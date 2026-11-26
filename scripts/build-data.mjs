#!/usr/bin/env node
/**
 * Genera los datos estáticos del front (public/data) a partir del paquete del
 * tablero del motor v8.1 (los JSON y .js que exporta el motor de simulación).
 *
 *   node scripts/build-data.mjs [carpeta_del_tablero]
 *
 * Sin argumento usa la variable TABLERO_DIR o, si no existe, la carpeta
 * hermana `SUBIR_ESTE_tablero_2026-11-24_final`.
 *
 * Mientras no haya backend, el front lee estos archivos con `fetch` desde
 * src/api. El día que exista una API basta con cambiar esas funciones: las
 * formas de los datos (src/api/types.ts) son las mismas que salen de aquí.
 *
 * Reglas que se respetan del tablero original:
 *  - ninguna cifra se inventa: todo sale del motor o de los cómputos oficiales;
 *  - «parejo» en una sección: quien queda primero en más corridas solo se nombra
 *    si llega al umbral de ventaja y además tiene la mediana más alta;
 *  - el voto por partido en una sección es un reparto estimado: la mediana de la
 *    coalición repartida con lo que sacó cada partido ahí en 2024.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PROJECT = path.resolve(HERE, '..')
const SOURCE = path.resolve(process.argv[2] ?? process.env.TABLERO_DIR ?? path.join(PROJECT, '..', 'SUBIR_ESTE_tablero_2026-11-24_final'))
/** Datos pesados del mapa: se piden con fetch solo cuando hacen falta. */
const OUT_PUBLIC = path.join(PROJECT, 'public', 'data')
/** Resumen de escenarios: va dentro del bundle porque se usa en el primer pintado. */
const OUT_BUNDLE = path.join(PROJECT, 'src', 'data', 'generated')

if (!fs.existsSync(path.join(SOURCE, 'sim_v8.json'))) {
  console.error(`No encuentro el paquete del tablero en:\n  ${SOURCE}\nPasa la carpeta como argumento o en TABLERO_DIR.`)
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

const read = (file) => fs.readFileSync(path.join(SOURCE, file), 'utf8').replace(/^﻿/, '')
const json = (file) => JSON.parse(read(file))

/** Primer literal JSON que sigue a `marker` dentro de un .js del tablero. */
function jsLiteral(file, marker) {
  const src = read(file)
  let start = src.indexOf(marker)
  if (start < 0) throw new Error(`${file}: no aparece ${marker}`)
  start += marker.length
  while (src[start] !== '{' && src[start] !== '[') start++
  let depth = 0
  let inString = false
  let end = start
  for (; end < src.length; end++) {
    const c = src[end]
    if (inString) {
      if (c === '\\') end++
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') inString = true
    else if (c === '{' || c === '[') depth++
    else if (c === '}' || c === ']') {
      depth--
      if (depth === 0) break
    }
  }
  return JSON.parse(src.slice(start, end + 1))
}

const sim = json('sim_v8.json')
const mapaV8 = jsLiteral('mapa_v8.js', '/*<MAPA_V8>*/')
const geo = jsLiteral('pvem_geo.js', 'window.PVEM_GEO=')
const indice = json('sim_secciones.json')
const partidos2024 = json('partidos_2024.json')
const variables = json('grupos_variables.json')
const descripcion = json('grupos_descripcion.json')
const nombres = jsLiteral('nombres.js', 'var D=')
const version = json('version.json')

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const BOLETAS = { ayun: 'alcaldia', dip: 'diputacion', fed: 'federal' }
const BLOQUES = ['MC', 'MORENA_ALIADOS', 'PAN_PRI']
const PARTIDOS = ['MC', 'MORENA', 'PT', 'PVEM', 'HAG_FUT', 'PAN', 'PRI']
const COALICION = { MC: ['MC'], MORENA_ALIADOS: ['MORENA', 'PT', 'PVEM', 'HAG_FUT'], PAN_PRI: ['PAN', 'PRI'] }
/** Boleta que pinta el mapa (la del diseño: «Diputado local»). */
const BOLETA_MAPA = 'dip'

const isNum = (x) => typeof x === 'number' && Number.isFinite(x)
const round = (x, decimals = 1) => (isNum(x) ? Number(x.toFixed(decimals)) : null)
const pick = (object, keys, map = (x) => x) => Object.fromEntries(keys.map((key) => [key, map(object?.[key])]))

function writeJson(dir, name, data) {
  const file = path.join(dir, name)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const text = JSON.stringify(data)
  fs.writeFileSync(file, text)
  return text.length
}

/** Cuantil con interpolación lineal (los cortes de las leyendas son cuartiles). */
function quantile(sorted, fraction) {
  const x = (sorted.length - 1) * fraction
  const i = Math.floor(x)
  return i + 1 < sorted.length ? sorted[i] + (sorted[i + 1] - sorted[i]) * (x - i) : sorted[i]
}

/* ------------------------------------------------------------------ */
/* 1 · Escenarios: ciudad y distritos en las tres boletas              */
/* ------------------------------------------------------------------ */

const ids = sim.secciones.ids.map(String)
const distritos = mapaV8.distritos.ids.map(String)
const dlIndex = sim.secciones.dl.map((dl) => distritos.indexOf(String(dl)))
const listaNominal = indice.lista_nominal
const rotulos = Object.fromEntries(mapaV8.escenarios.map((e) => [e.id, e.rotulo]))

if (ids.length !== 985 || ids.join() !== indice.ids.map(String).join()) throw new Error('El orden de las secciones no coincide entre archivos')

const tri = (x) => [round(x.p10), round(x.p50), round(x.p90)]

function ambito(bloques, partidos, gana) {
  return {
    bloques: pick(bloques, BLOQUES, tri),
    partidos: pick(partidos, PARTIDOS, (x) => round(typeof x === 'object' && x ? x.p50 : x)),
    gana: pick(gana, BLOQUES, (x) => round(x)),
  }
}

const escenarios = sim.escenarios.map((escenario) => {
  const boletas = {}
  for (const [clave, campo] of Object.entries(BOLETAS)) {
    const x = escenario[campo]
    boletas[clave] = {
      ...ambito(x.bloques, x.partidos, x.p_gana),
      // cambio de la mediana frente a S0, en puntos (lo da el motor para la ciudad)
      delta: pick(x.delta_vs_s0, BLOQUES, (d) => round(d.p50)),
      participacion: round(x.participacion.p50),
      distritos: Object.fromEntries(distritos.map((dl) => [dl, ambito(x.distritos[dl].bloques, x.distritos[dl].partidos_p50, x.distritos[dl].p_gana)])),
    }
  }
  // rótulo corto sin el identificador repetido: «S1 · Inercia (central)» → «Inercia (central)»
  const rotulo = String(rotulos[escenario.id] ?? escenario.nombre).replace(new RegExp(`^${escenario.id}\\s*·\\s*`), '')
  return {
    id: escenario.id,
    rotulo: rotulo.charAt(0).toUpperCase() + rotulo.slice(1),
    nombre: escenario.nombre,
    definicion: escenario.definicion,
    afecta: escenario.boletas_afectadas,
    boletas,
  }
})

/* Caja [[sur, oeste], [norte, este]] de las secciones que cumplen `filtro` (geometría de pvem_geo.js). */
const posicionGeo = Object.fromEntries(ids.map((id, i) => [id, i]))
function caja(filtro) {
  let sur = 90
  let norte = -90
  let oeste = 180
  let este = -180
  for (const seccion of geo.secciones) {
    const i = posicionGeo[String(seccion.s)]
    if (i === undefined || !filtro(i)) continue
    for (const [lng, lat] of seccion.poly) {
      sur = Math.min(sur, lat)
      norte = Math.max(norte, lat)
      oeste = Math.min(oeste, lng)
      este = Math.max(este, lng)
    }
  }
  return [
    [round(sur, 5), round(oeste, 5)],
    [round(norte, 5), round(este, 5)],
  ]
}

/* Habitantes (Censo 2020) por distrito: suma de sus secciones con censo propio. */
const variablesPorDistrito = Object.fromEntries(distritos.map((dl) => [dl, json(`grupos_variables_D${dl}.json`)]))
const iPoblacion = variables.variables.findIndex((v) => v.clave === 'poblacion')
const habitantes = distritos.map((dl) =>
  Object.values(variablesPorDistrito[dl].secciones).reduce((sum, seccion) => sum + (isNum(seccion.v[iPoblacion]) ? seccion.v[iPoblacion] : 0), 0),
)

const escenariosJson = {
  meta: {
    corte: version.corte,
    motor: version.version_motor,
    modelo: version.modelo,
    tablero: version.tablero,
    corridas: sim._meta.n_corridas,
    central: mapaV8.central.id,
    aviso: 'Estimación propia condicional al escenario; no es pronóstico.',
  },
  umbral: { gana: nombres.UMBRAL.GANA, ventaja: nombres.UMBRAL.VENTAJA },
  electores: mapaV8.lista_nominal_total,
  habitantes: habitantes.reduce((sum, n) => sum + n, 0),
  secciones: ids.length,
  // caja que contiene todas las secciones: el encuadre inicial del mapa
  limites: caja(() => true),
  distritos: distritos.map((id, k) => ({
    id,
    secciones: mapaV8.distritos.n_secciones[k],
    electores: mapaV8.distritos.ln[k],
    habitantes: habitantes[k],
    limites: caja((i) => dlIndex[i] === k),
    // el D13 solo tiene una franja dentro de Guadalajara: no elige diputado por sí sola
    franja: Boolean(mapaV8.distritos.franja[k]),
  })),
  escenarios,
}

/* ------------------------------------------------------------------ */
/* 2 · Mapa: geometría, resultado 2024 y capas temáticas               */
/* ------------------------------------------------------------------ */

const posicion = Object.fromEntries(ids.map((id, i) => [id, i]))
const anillos = new Array(ids.length).fill(null)
for (const seccion of geo.secciones) {
  const i = posicion[String(seccion.s)]
  if (i === undefined) continue
  anillos[i] = seccion.poly // [lng, lat]
}
const sinGeometria = anillos.filter((ring) => !ring).length
if (sinGeometria) console.warn(`Aviso: ${sinGeometria} secciones no traen geometría`)

/* Aristas compartidas: una arista que solo aparece en una sección es borde del
   municipio; si separa dos distritos distintos, es límite de distrito. */
const aristas = new Map()
anillos.forEach((ring, i) => {
  if (!ring) return
  for (let k = 0; k < ring.length; k++) {
    const a = ring[k]
    const b = ring[(k + 1) % ring.length]
    if (a[0] === b[0] && a[1] === b[1]) continue
    const ka = `${a[0]},${a[1]}`
    const kb = `${b[0]},${b[1]}`
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
    const found = aristas.get(key)
    if (found) found.j = i
    else aristas.set(key, { a, b, i, j: -1 })
  }
})

/** Encadena segmentos sueltos en polilíneas continuas (mejores uniones al dibujar). */
function chain(segments) {
  const byPoint = new Map()
  const key = (p) => `${p[0]},${p[1]}`
  segments.forEach((segment, index) => {
    for (const p of [segment.a, segment.b]) {
      const k = key(p)
      if (!byPoint.has(k)) byPoint.set(k, [])
      byPoint.get(k).push(index)
    }
  })
  const used = new Array(segments.length).fill(false)
  const lines = []
  const extend = (line, atEnd) => {
    for (;;) {
      const tip = atEnd ? line[line.length - 1] : line[0]
      const next = (byPoint.get(key(tip)) ?? []).find((index) => !used[index])
      if (next === undefined) return
      used[next] = true
      const segment = segments[next]
      const other = key(segment.a) === key(tip) ? segment.b : segment.a
      if (atEnd) line.push(other)
      else line.unshift(other)
    }
  }
  segments.forEach((segment, index) => {
    if (used[index]) return
    used[index] = true
    const line = [segment.a, segment.b]
    extend(line, true)
    extend(line, false)
    lines.push(line)
  })
  return lines
}

const flat = (line) => line.flatMap(([lng, lat]) => [lat, lng])

const grupos = new Map() // «a|b» (índices de distrito, -1 = fuera del municipio) → segmentos
for (const arista of aristas.values()) {
  const da = dlIndex[arista.i]
  const db = arista.j < 0 ? -1 : dlIndex[arista.j]
  if (da === db) continue
  const pair = [da, db].sort((x, y) => x - y)
  const key = pair.join('|')
  if (!grupos.has(key)) grupos.set(key, [])
  grupos.get(key).push(arista)
}
const cerrada = (line) => line.length > 2 && line[0][0] === line[line.length - 1][0] && line[0][1] === line[line.length - 1][1]
const bordes = [...grupos.entries()].flatMap(([key, segments]) => {
  const entre = key.split('|').map(Number)
  return (
    chain(segments)
      // Un lazo cerrado «hacia afuera» no es límite del municipio: es una rendija entre dos
      // secciones cuyos vértices no coinciden. El límite real siempre termina en otro distrito.
      .filter((line) => !(entre[0] === -1 && cerrada(line)))
      .map((line) => ({ entre, linea: flat(line) }))
  )
})

/* Centro de cada distrito: promedio de los vértices de sus secciones (como el tablero). */
const centros = distritos.map((_, k) => {
  let lat = 0
  let lng = 0
  let n = 0
  anillos.forEach((ring, i) => {
    if (!ring || dlIndex[i] !== k) return
    for (const p of ring) {
      lng += p[0]
      lat += p[1]
      n++
    }
  })
  return [round(lat / n, 5), round(lng / n, 5)]
})

/* --- Resultado oficial 2024 por partido (boleta del mapa) --- */
const r2024 = partidos2024[BOLETA_MAPA]
const validos2024 = indice.calidad[BOLETA_MAPA].validos_2024
const resultado2024 = Object.fromEntries(PARTIDOS.map((partido) => [partido, ids.map((id) => round(r2024[id]?.[partido]))]))

/** Índice del partido más votado; -1 sin dato, -2 empate en el primer lugar. */
function masVotado(valores) {
  let max = 0
  let top = []
  valores.forEach((value, k) => {
    if (!isNum(value) || value <= 0) return
    if (value > max) {
      max = value
      top = [k]
    } else if (value === max) top.push(k)
  })
  return max > 0 ? (top.length === 1 ? top[0] : -2) : -1
}

const ganador2024 = ids.map((id) => masVotado(PARTIDOS.map((partido) => r2024[id]?.[partido])))

/* Por distrito: suma de votos de sus secciones (porcentaje × votos válidos). */
const resultado2024Distrito = distritos.map((_, k) => {
  const votos = PARTIDOS.map(() => 0)
  let total = 0
  ids.forEach((id, i) => {
    if (dlIndex[i] !== k || !r2024[id] || !isNum(validos2024[i])) return
    total += validos2024[i]
    PARTIDOS.forEach((partido, p) => {
      votos[p] += ((r2024[id][partido] ?? 0) * validos2024[i]) / 100
    })
  })
  return Object.fromEntries(PARTIDOS.map((partido, p) => [partido, round((votos[p] / total) * 100)]))
})

/* --- Reparto de cada coalición entre sus partidos, por sección (proporción 2024) --- */
const central = sim.escenarios.find((e) => e.id === mapaV8.central.id)
const reparto = Object.fromEntries(PARTIDOS.filter((p) => p !== 'MC').map((p) => [p, []]))
let conRepartoDeDistrito = 0
ids.forEach((id, i) => {
  const dl = distritos[dlIndex[i]]
  const motor = central[BOLETAS[BOLETA_MAPA]].distritos[dl].partidos_p50
  for (const bloque of ['MORENA_ALIADOS', 'PAN_PRI']) {
    const miembros = COALICION[bloque]
    const de2024 = r2024[id] ? miembros.reduce((sum, p) => sum + Math.max(0, r2024[id][p] ?? 0), 0) : 0
    // sin resultado 2024 de esos partidos en la sección: la proporción del motor en su distrito
    const fuente = de2024 > 0 ? r2024[id] : motor
    const total = de2024 > 0 ? de2024 : miembros.reduce((sum, p) => sum + Math.max(0, motor[p] ?? 0), 0)
    if (!(de2024 > 0)) conRepartoDeDistrito++
    for (const p of miembros) reparto[p].push(round(Math.max(0, fuente[p] ?? 0) / total, 4))
  }
})

/* --- Capas temáticas (segundo «Filtrar» del diseño) --- */
const TEMAS = [
  { clave: 'servicios', variable: 'agua_exposicion' },
  { clave: 'seguridad_social', variable: 'pct_sin_afiliacion_salud' },
  { clave: 'economia', variable: 'pct_desocupada' },
  { clave: 'nse', variable: 'nse' },
  { clave: 'genero', variable: 'ln_pct_mujeres' },
]
const NSE_CATEGORIAS = ['bajo', 'medio-bajo', 'medio', 'medio-alto', 'alto', 'muy alto']

function porDistrito(valores) {
  // promedio de las secciones del distrito ponderado por electores (se rotula así en pantalla)
  return distritos.map((_, k) => {
    let suma = 0
    let peso = 0
    valores.forEach((value, i) => {
      if (dlIndex[i] !== k || !isNum(value)) return
      suma += value * listaNominal[i]
      peso += listaNominal[i]
    })
    return peso ? suma / peso : null
  })
}

const temas = {}
for (const tema of TEMAS) {
  if (tema.variable === 'nse') {
    const regla = descripcion._meta.reglas.nivel_socioeconomico_aproximado ?? {}
    const valores = ids.map((id) => round(descripcion.secciones[id]?.indice, 0))
    temas[tema.clave] = {
      variable: 'nse',
      nombre: 'Nivel socioeconómico aproximado',
      detalle: regla.indice ? `Índice de 0 a 100: ${regla.indice}.` : null,
      unidad: '',
      decimales: 0,
      fuente: 'Censo de Población y Vivienda 2020 (INEGI), estadísticas por sección electoral; índice propio',
      valores,
      distrito: porDistrito(valores).map((x) => round(x, 0)),
      categorias: NSE_CATEGORIAS,
      categoria: ids.map((id) => NSE_CATEGORIAS.indexOf(descripcion.secciones[id]?.nse)),
      cortesCategoria: regla.cortes_del_indice ?? null,
    }
    continue
  }
  const j = variables.variables.findIndex((v) => v.clave === tema.variable)
  const def = variables.variables[j]
  if (!def) throw new Error(`No existe la variable ${tema.variable}`)
  const valores = ids.map((id, i) => {
    const seccion = variablesPorDistrito[distritos[dlIndex[i]]].secciones[id]
    return round(seccion?.v?.[j], Math.max(1, def.decimales))
  })
  const ordenados = valores.filter(isNum).sort((a, b) => a - b)
  temas[tema.clave] = {
    variable: def.clave,
    nombre: def.nombre,
    detalle: def.detalle,
    unidad: def.unidad,
    decimales: def.decimales,
    fuente: def.fuente,
    valores,
    distrito: porDistrito(valores).map((x) => round(x, Math.max(1, def.decimales))),
    // cuartiles de las secciones con dato: solo sirven para colorear y para la leyenda
    cortes: [0.25, 0.5, 0.75].map((f) => round(quantile(ordenados, f), 2)),
    rango: [ordenados[0], ordenados[ordenados.length - 1]],
  }
}

const mapaJson = {
  meta: { boleta: BOLETA_MAPA, central: mapaV8.central.id, corte: version.corte },
  ids,
  dl: dlIndex,
  ln: listaNominal,
  colonia: ids.map((id) => descripcion.secciones[id]?.colonia ?? null),
  // un anillo por sección, plano: [lat, lng, lat, lng, …]
  poligonos: anillos.map((ring) => (ring ? flat(ring) : [])),
  distritos: distritos.map((id, k) => ({ id, centro: centros[k] })),
  bordes,
  partidos: PARTIDOS,
  resultado2024: { seccion: resultado2024, distrito: resultado2024Distrito, ganador: ganador2024 },
  reparto,
  temas,
}

/* ------------------------------------------------------------------ */
/* 3 · Predicción por sección de cada escenario (boleta del mapa)      */
/* ------------------------------------------------------------------ */

const ORDEN = ['mc', 'mor', 'pp']
const porEscenario = {}
for (const escenario of sim.escenarios) {
  const archivo = json(`sim_secciones_${escenario.id}.json`)
  if (archivo.ids.map(String).join() !== ids.join()) throw new Error(`sim_secciones_${escenario.id}.json: otro orden de secciones`)
  const x = archivo[BOLETA_MAPA]
  const orden = archivo._meta.bloques_que_pueden_ir_adelante ?? ORDEN
  const lider = []
  const parejo = []
  const corridas = []
  ids.forEach((_, i) => {
    const primero = ORDEN.map((bloque) => x.p_primero[bloque][i])
    const adelante = isNum(x.adelante?.[i]) ? ORDEN.indexOf(orden[x.adelante[i]]) : -1
    const medianas = ORDEN.map((bloque) => x[bloque].p50[i])
    const max = Math.max(...primero)
    const masCorridas = primero.indexOf(max)
    const esParejo = adelante < 0 || max < nombres.UMBRAL.VENTAJA || masCorridas !== adelante || medianas[adelante] !== Math.max(...medianas)
    lider.push(adelante)
    parejo.push(esParejo ? 1 : 0)
    corridas.push(adelante < 0 ? null : round(primero[adelante]))
  })
  porEscenario[escenario.id] = {
    id: escenario.id,
    boleta: BOLETA_MAPA,
    mc: x.mc.p50.map((v) => round(v)),
    mor: x.mor.p50.map((v) => round(v)),
    pp: x.pp.p50.map((v) => round(v)),
    // bloque con más corridas en primer lugar (0 MC, 1 Morena y aliados, 2 PAN-PRI) y en qué parte de las corridas
    lider,
    corridas,
    parejo,
  }
}

/* ------------------------------------------------------------------ */
/* Escritura                                                           */
/* ------------------------------------------------------------------ */

// Solo se limpia lo que este script escribe: en OUT_BUNDLE también viven los datos de otros scripts.
fs.rmSync(path.join(OUT_PUBLIC, 'secciones'), { recursive: true, force: true })
const rel = (dir) => path.relative(PROJECT, dir).replaceAll('\\', '/')
const sizes = []
sizes.push([`${rel(OUT_BUNDLE)}/escenarios.json`, writeJson(OUT_BUNDLE, 'escenarios.json', escenariosJson)])
sizes.push([`${rel(OUT_PUBLIC)}/mapa.json`, writeJson(OUT_PUBLIC, 'mapa.json', mapaJson)])
let secciones = 0
for (const [id, data] of Object.entries(porEscenario)) secciones += writeJson(OUT_PUBLIC, `secciones/${id}.json`, data)
sizes.push([`${rel(OUT_PUBLIC)}/secciones/S*.json (${Object.keys(porEscenario).length})`, secciones])

/* ------------------------------------------------------------------ */
/* Datos del motor para Territorio, Comparativo y Fuentes              */
/* ------------------------------------------------------------------ */

// Estas tres páginas leen los JSON del motor tal cual, con la capa de datos del
// propio tablero (src/motor/vendor/pp-datos.js): aquí solo se copian los que usan.
const MOTOR = [
  'version.json',
  'sim_v8.json',
  'sim_agentes.json',
  'sim_corridas.json',
  'sim_concilio.json',
  'proyecciones.json',
  'grupos_variables.json',
  'partidos_2024.json',
  'federal_2024.js',
  'sim_evolucion.json',
  'sim_dashboard.json',
  'sim_escenarios.json',
  'sim_menciones.json',
  'sim_dossier.json',
  'sim_agua.json',
  // la predicción por sección de cada escenario
  ...fs.readdirSync(SOURCE).filter((file) => /^sim_secciones_S\d+\.json$/.test(file)),
]
const motorDir = path.join(OUT_PUBLIC, 'motor')
fs.rmSync(motorDir, { recursive: true, force: true })
fs.mkdirSync(motorDir, { recursive: true })
let motorBytes = 0
let motorFiles = 0
for (const file of MOTOR) {
  const source = path.join(SOURCE, file)
  if (!fs.existsSync(source)) {
    console.warn(`  (no viene en el paquete) ${file}`)
    continue
  }
  fs.copyFileSync(source, path.join(motorDir, file))
  motorBytes += fs.statSync(source).size
  motorFiles++
}
sizes.push([`${rel(OUT_PUBLIC)}/motor/* (${motorFiles})`, motorBytes])

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
console.log(`Datos generados desde ${SOURCE}`)
for (const [name, size] of sizes) console.log(`  ${name.padEnd(44)} ${kb(size)}`)
console.log(`  secciones ${ids.length} · distritos ${distritos.join(', ')} · bordes ${bordes.length} · reparto por distrito en ${conRepartoDeDistrito} coaliciones de sección`)
