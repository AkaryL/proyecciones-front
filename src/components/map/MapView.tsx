import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { MapaData } from '../../api'
import { GUADALAJARA_BOUNDARY } from '../../data/guadalajara'
import { limites, type Pintura, type Seleccion } from '../../lib/mapLayers'
import './MapView.css'

type MapViewProps = {
  /** Centro inicial [lat, lng]. */
  center: [number, number]
  /** Zoom que reproduce el encuadre del diseño con el artboard a tamaño real (1440 px). */
  zoom: number
  /**
   * Nivel de mosaicos de OpenStreetMap que se dibuja en el encuadre inicial.
   * El diseño usa el nivel 8 ampliado; fijarlo conserva el mismo tamaño de
   * etiquetas y trazos a cualquier escala de la página.
   */
  tileZoom?: number
  /** Muestra los botones +/− (por defecto sí). */
  zoomControl?: boolean
  className?: string

  /** Geometría de las secciones; mientras no llega solo se ve el municipio resaltado. */
  mapa?: MapaData | null
  /** Cómo colorear las secciones. `null` deja el mapa como en el diseño. */
  pintura?: Pintura | null
  seleccion?: Seleccion | null
  onSeleccion?: (seleccion: Seleccion | null) => void
  /** Distrito cuyo contorno se destaca siempre (índice), p. ej. el de la tarjeta que abre el mapa. */
  destacado?: number | null
  /**
   * A dónde debe volar el mapa: `distrito` (índice) o todo el municipio (-1).
   * Cuando cambia `clave` se reencuadra; con `null` vuelve al encuadre del diseño.
   */
  encuadre?: { clave: string; distrito: number } | null
  /** Elementos que tapan parte del mapa (panel, leyenda): el encuadre los evita. */
  evitar?: RefObject<HTMLElement | null>[]
  /** Se tocó el municipio resaltado en la vista inicial. */
  onActivar?: () => void
}

const DESIGN_WIDTH = 1440
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const TRAZO = { oscuro: '#06222c', claro: '#ffffff', seleccion: '#5fe3c6' }
const PANE = { relleno: 'pe-relleno', lineas: 'pe-lineas' }

/** Escala actual del diseño (la misma de `.frame`): ancho efectivo del artboard / 1440. */
function designScale() {
  const root = document.documentElement
  const frameMax = Number.parseFloat(getComputedStyle(root).getPropertyValue('--frame-max')) || DESIGN_WIDTH
  return Math.min(root.clientWidth, frameMax) / DESIGN_WIDTH
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

/** [lat, lng, lat, lng, …] → [[lat, lng], …] */
function puntos(plano: number[]): L.LatLngTuple[] {
  const salida: L.LatLngTuple[] = []
  for (let k = 0; k < plano.length; k += 2) salida.push([plano[k], plano[k + 1]])
  return salida
}

type Capas = {
  secciones: L.Polygon[]
  relleno: L.LayerGroup
  bordes: L.Polyline
  etiquetas: L.LayerGroup
  marcas: L.LayerGroup
  cursor: L.LayerGroup
  renderer: L.Canvas
}

/**
 * Mapa interactivo (Leaflet + OpenStreetMap) con el tratamiento oscuro del diseño.
 * En la vista inicial solo resalta el municipio, como el diseño; al recibir una
 * `pintura` dibuja las secciones electorales coloreadas, con etiqueta al pasar
 * el cursor y selección al tocar. El zoom acompaña a la escala de la página.
 */
export function MapView({
  center,
  zoom,
  tileZoom,
  zoomControl = true,
  className,
  mapa = null,
  pintura = null,
  seleccion = null,
  onSeleccion,
  destacado = null,
  encuadre = null,
  evitar,
  onActivar,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [capas, setCapas] = useState<Capas | null>(null)
  const resaltadoRef = useRef<L.Polygon | null>(null)
  const [lat, lng] = center

  // Los manejadores de Leaflet se crean una vez: leen siempre el valor vigente desde aquí.
  const vivo = useRef({ pintura, onSeleccion, onActivar, evitar, seleccion })
  useEffect(() => {
    vivo.current = { pintura, onSeleccion, onActivar, evitar, seleccion }
  })

  /* ---------- 1 · Mapa base ---------- */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let scale = designScale()
    const initialZoom = zoom + Math.log2(scale)

    // Leaflet pediría los mosaicos del nivel redondeado del zoom actual; con este
    // desfase se piden los del nivel del diseño y se dibujan al tamaño equivalente.
    const zoomOffset = Math.max(-2, Math.min(2, (tileZoom ?? Math.round(zoom)) - Math.round(initialZoom)))
    const tileSize = 256 / 2 ** zoomOffset
    container.style.setProperty('--tile-size', `${tileSize + 1}px`)

    const instance = L.map(container, {
      center: [lat, lng],
      zoom: initialZoom,
      zoomSnap: 0,
      zoomDelta: 1,
      zoomControl,
      scrollWheelZoom: false,
    })

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      tileSize,
      zoomOffset,
      minZoom: 3 - zoomOffset,
      maxZoom: 19 - zoomOffset,
    }).addTo(instance)

    const resaltado = L.polygon(GUADALAJARA_BOUNDARY, {
      className: 'map-view__highlight',
      stroke: false,
      fillOpacity: 1,
      bubblingMouseEvents: false,
    }).addTo(instance)
    resaltado.bindTooltip('Guadalajara · toca para ver sus secciones', { sticky: true, className: 'map-view__tip', direction: 'top', offset: [0, -8] })
    resaltado.on('click', () => vivo.current.onActivar?.())
    resaltadoRef.current = resaltado

    // La rueda del ratón desplaza la página; solo acerca el mapa cuando éste tiene el foco (tras tocarlo).
    instance.on('focus', () => instance.scrollWheelZoom.enable())
    instance.on('blur', () => instance.scrollWheelZoom.disable())
    instance.on('click', () => vivo.current.onSeleccion?.(null))

    // Al cambiar el tamaño de la ventana se conserva el encuadre proporcional.
    const observer = new ResizeObserver(() => {
      const nextScale = designScale()
      instance.invalidateSize({ animate: false })
      if (nextScale === scale) return
      instance.setView(instance.getCenter(), instance.getZoom() + Math.log2(nextScale / scale), { animate: false })
      scale = nextScale
    })
    observer.observe(container)
    setMap(instance)

    return () => {
      observer.disconnect()
      resaltadoRef.current = null
      setMap(null)
      instance.remove()
    }
  }, [lat, lng, zoom, tileZoom, zoomControl])

  /* ---------- 2 · Secciones, límites de distrito y rótulos ---------- */
  useEffect(() => {
    if (!map || !mapa) return
    // Dos lienzos: el relleno de las secciones, translúcido como conjunto (así no se notan las
    // juntas entre secciones vecinas), y encima las líneas, que no interceptan el cursor.
    const paneRelleno = map.getPane(PANE.relleno) ?? map.createPane(PANE.relleno)
    paneRelleno.style.zIndex = '350'
    paneRelleno.style.opacity = '0.86'
    const paneLineas = map.getPane(PANE.lineas) ?? map.createPane(PANE.lineas)
    paneLineas.style.zIndex = '360'
    paneLineas.style.pointerEvents = 'none'
    const lienzoRelleno = L.canvas({ pane: PANE.relleno, padding: 0.4 })
    const renderer = L.canvas({ pane: PANE.lineas, padding: 0.4 })
    const cursor = L.layerGroup()
    let bajoCursor = '' // sección o distrito que tiene el contorno del cursor
    let limpiar = 0

    const contorno = (distrito: number) => mapa.bordes.filter((borde) => borde.entre.includes(distrito)).map((borde) => puntos(borde.linea))

    const secciones = mapa.poligonos.map((anillo, i) => {
      const vertices = puntos(anillo)
      const poligono = L.polygon(vertices, { renderer: lienzoRelleno, ...estilo(vivo.current.pintura, i), bubblingMouseEvents: false })
      poligono.bindTooltip(
        () => {
          const lineas = vivo.current.pintura?.texto(i) ?? []
          return lineas.map((linea, k) => (k === 0 ? `<b>${escapeHtml(linea)}</b>` : escapeHtml(linea))).join('<br>')
        },
        { sticky: true, className: 'map-view__tip', direction: 'top', offset: [0, -10] },
      )
      // El contorno del cursor se dibuja aparte, encima de todo, sin tocar el orden de las secciones.
      poligono.on('mouseover', () => {
        const actual = vivo.current.pintura
        if (!actual) return
        window.clearTimeout(limpiar)
        const id = actual.unidad === 'secc' ? `s${i}` : `d${mapa.dl[i]}`
        if (bajoCursor === id) return
        bajoCursor = id
        cursor.clearLayers()
        const opciones: L.PolylineOptions = { renderer, color: TRAZO.claro, opacity: 1, interactive: false, fill: false }
        if (actual.unidad === 'secc') L.polygon(vertices, { ...opciones, weight: 2.2 }).addTo(cursor)
        else L.polyline(contorno(mapa.dl[i]), { ...opciones, weight: 4 }).addTo(cursor)
      })
      poligono.on('mouseout', () => {
        // con un respiro: al pasar a otra sección del mismo distrito el contorno no parpadea
        limpiar = window.setTimeout(() => {
          bajoCursor = ''
          cursor.clearLayers()
        }, 40)
      })
      poligono.on('click', () => {
        const actual = vivo.current.pintura
        if (!actual) return
        const siguiente: Seleccion = actual.unidad === 'secc' ? { unidad: 'secc', indice: i } : { unidad: 'dist', indice: mapa.dl[i] }
        const previa = vivo.current.seleccion
        const misma = previa && previa.unidad === siguiente.unidad && previa.indice === siguiente.indice
        vivo.current.onSeleccion?.(misma ? null : siguiente)
      })
      return poligono
    })

    const bordes = L.polyline(
      mapa.bordes.map((borde) => puntos(borde.linea)),
      { renderer, color: TRAZO.claro, weight: 2.2, opacity: 0.95, interactive: false },
    )
    const etiquetas = L.layerGroup(
      mapa.distritos.map((distrito) =>
        L.tooltip({ permanent: true, direction: 'center', interactive: false, className: 'map-view__label' }).setLatLng(distrito.centro).setContent(`D${distrito.id}`),
      ),
    )
    const nuevas: Capas = { secciones, relleno: L.layerGroup(secciones), bordes, etiquetas, marcas: L.layerGroup(), cursor, renderer }
    setCapas(nuevas)

    return () => {
      window.clearTimeout(limpiar)
      for (const capa of [nuevas.relleno, nuevas.bordes, nuevas.etiquetas, nuevas.marcas, nuevas.cursor, lienzoRelleno, renderer]) capa.remove()
      setCapas(null)
    }
  }, [map, mapa])

  /* ---------- 3 · Pintar la capa elegida ---------- */
  useEffect(() => {
    if (!map) return
    const resaltado = resaltadoRef.current
    if (!capas || !pintura) {
      // vista inicial del diseño: solo el municipio resaltado
      if (capas) for (const capa of [capas.relleno, capas.bordes, capas.etiquetas, capas.marcas, capas.cursor]) capa.remove()
      if (resaltado && !map.hasLayer(resaltado)) resaltado.addTo(map)
      return
    }
    resaltado?.remove()
    capas.secciones.forEach((poligono, i) => poligono.setStyle(estilo(pintura, i)))
    for (const capa of [capas.relleno, capas.bordes, capas.marcas, capas.cursor, capas.etiquetas]) if (!map.hasLayer(capa)) capa.addTo(map)
    capas.bordes.bringToFront()
  }, [map, capas, pintura])

  /* ---------- 4 · Contornos: distrito destacado y selección ---------- */
  useEffect(() => {
    if (!capas || !mapa) return
    capas.marcas.clearLayers()
    if (!pintura) return
    const { renderer } = capas
    const trazar = (lineas: L.LatLngTuple[][], color: string, cerrado = false) => {
      // doble trazo: uno oscuro debajo para que el contorno se lea sobre cualquier color
      for (const [tono, grosor] of [
        [TRAZO.oscuro, 6.5],
        [color, 3],
      ] as const) {
        const opciones: L.PolylineOptions = { renderer, color: tono, weight: grosor, opacity: 1, interactive: false, fill: false }
        ;(cerrado ? L.polygon(lineas, opciones) : L.polyline(lineas, opciones)).addTo(capas.marcas)
      }
    }
    const contorno = (distrito: number) => mapa.bordes.filter((borde) => borde.entre.includes(distrito)).map((borde) => puntos(borde.linea))
    if (destacado !== null && destacado >= 0) trazar(contorno(destacado), TRAZO.claro)
    if (seleccion?.unidad === 'dist') trazar(contorno(seleccion.indice), TRAZO.seleccion)
    if (seleccion?.unidad === 'secc') trazar([puntos(mapa.poligonos[seleccion.indice])], TRAZO.seleccion, true)
  }, [capas, mapa, pintura, seleccion, destacado])

  /* ---------- 5 · Encuadre ---------- */
  const clave = encuadre?.clave ?? null
  const distrito = encuadre?.distrito ?? -1
  const haVolado = useRef(false)
  useEffect(() => {
    if (!map) return
    if (clave === null) {
      if (!haVolado.current) return
      haVolado.current = false
      map.flyTo([lat, lng], zoom + Math.log2(designScale()), { duration: 0.9 })
      return
    }
    if (!mapa) return
    const contenedor = map.getContainer().getBoundingClientRect()
    const margen = 28 * designScale()
    const izquierda: L.PointTuple = [margen, margen]
    const derecha: L.PointTuple = [margen, margen]
    for (const ref of vivo.current.evitar ?? []) {
      const caja = ref.current?.getBoundingClientRect()
      if (!caja || !caja.width || caja.right < contenedor.left || caja.left > contenedor.right) continue
      // cada obstáculo recorta el lado del mapa al que está pegado
      if (caja.left + caja.width / 2 < contenedor.left + contenedor.width / 2) izquierda[0] = Math.max(izquierda[0], caja.right - contenedor.left + margen)
      else derecha[0] = Math.max(derecha[0], contenedor.right - caja.left + margen)
    }
    haVolado.current = true
    map.flyToBounds(limites(mapa, distrito), { paddingTopLeft: izquierda, paddingBottomRight: derecha, duration: 0.9, maxZoom: 15 })
  }, [map, mapa, clave, distrito, lat, lng, zoom])

  return <div ref={containerRef} className={`map-view${pintura ? ' map-view--activo' : ''}${className ? ` ${className}` : ''}`} />
}

/** Estilo de una sección según la capa vigente. */
function estilo(pintura: Pintura | null, i: number): L.PathOptions {
  if (!pintura) return { stroke: false, fill: true, fillColor: '#a3d7b2', fillOpacity: 0 }
  const fillColor = pintura.color(i)
  // fuera del ámbito elegido: apenas insinuada
  if (!pintura.enAmbito(i)) return { stroke: false, fill: true, fillColor, fillOpacity: 0.16 }
  // por distrito no se ve la división entre secciones: el trazo lleva el color del relleno y tapa las juntas
  if (pintura.unidad === 'dist') return { stroke: true, color: fillColor, weight: 1, opacity: 1, fill: true, fillColor, fillOpacity: 1 }
  return { stroke: true, color: TRAZO.oscuro, weight: 0.5, opacity: 0.6, fill: true, fillColor, fillOpacity: 1 }
}
