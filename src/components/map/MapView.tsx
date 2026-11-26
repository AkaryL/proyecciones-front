import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Limites, MapaData } from '../../api'
import { GUADALAJARA_BOUNDARY } from '../../data/guadalajara'
import type { Pintura, Seleccion } from '../../lib/mapLayers'
import { DUR, duracion, prefersReducedMotion } from '../../lib/motion'
import './MapView.css'

type MapViewProps = {
  /** Lo que debe caber, ajustado, en el encuadre inicial (el municipio o un distrito). */
  limites: Limites
  /** Muestra los botones +/− (por defecto sí). */
  zoomControl?: boolean
  className?: string

  /** Geometría de las secciones; mientras no llega solo se ve el municipio resaltado. */
  mapa?: MapaData | null
  /** Cómo colorear las secciones. `null` deja solo el municipio resaltado. */
  pintura?: Pintura | null
  seleccion?: Seleccion | null
  onSeleccion?: (seleccion: Seleccion | null) => void
  /** Distrito cuyo contorno se destaca siempre (índice), p. ej. el de la tarjeta que abre el mapa. */
  destacado?: number | null
  /**
   * A dónde debe volar el mapa. Solo se mueve cuando cambia `clave` (otro ámbito
   * o «restablecer»): elegir un filtro no toca la cámara que la persona acomodó.
   */
  encuadre?: { clave: string; limites: Limites }
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
/** Opacidad del relleno de las secciones como conjunto (deja entrever las calles). */
const OPACIDAD_RELLENO = '0.86'

/** Escala actual del diseño: ancho con el que se muestra el artboard (el de un `.frame`) / 1440. */
function designScale() {
  const frame = document.querySelector('.frame')
  return (frame?.clientWidth || document.documentElement.clientWidth) / DESIGN_WIDTH
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

/** [lat, lng, lat, lng, …] → [[lat, lng], …] */
function puntos(plano: number[]): L.LatLngTuple[] {
  const salida: L.LatLngTuple[] = []
  for (let k = 0; k < plano.length; k += 2) salida.push([plano[k], plano[k + 1]])
  return salida
}

/**
 * Márgenes del encuadre: un aire parejo más lo que tapan los elementos que
 * flotan sobre el mapa. Cada uno recorta el lado al que está pegado.
 *
 * Si el mapa es más alto que la ventana, se encuadra en la parte de arriba que
 * cabe en una pantalla: lo encuadrado se ve completo, junto con el panel, sin
 * tener que recorrer la página.
 */
function margenes(map: L.Map, evitar: RefObject<HTMLElement | null>[] | undefined): L.FitBoundsOptions {
  const contenedor = map.getContainer().getBoundingClientRect()
  const aire = 26 * designScale()
  const izquierda: L.PointTuple = [aire, aire]
  const derecha: L.PointTuple = [aire, aire]
  for (const ref of evitar ?? []) {
    const caja = ref.current?.getBoundingClientRect()
    if (!caja || !caja.width || caja.right < contenedor.left || caja.left > contenedor.right) continue
    if (caja.left + caja.width / 2 < contenedor.left + contenedor.width / 2) izquierda[0] = Math.max(izquierda[0], caja.right - contenedor.left + aire)
    else derecha[0] = Math.max(derecha[0], contenedor.right - caja.left + aire)
  }
  const visible = Math.max(Math.min(contenedor.height, window.innerHeight), 4 * aire)
  derecha[1] += Math.max(0, contenedor.height - visible)
  return { paddingTopLeft: izquierda, paddingBottomRight: derecha }
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
 * Abre encuadrado en `limites` con el municipio resaltado; al recibir una
 * `pintura` dibuja las secciones electorales coloreadas, con etiqueta al pasar
 * el cursor y selección al tocar. El zoom acompaña a la escala de la página.
 */
export function MapView({
  limites,
  zoomControl = true,
  className,
  mapa = null,
  pintura = null,
  seleccion = null,
  onSeleccion,
  destacado = null,
  encuadre,
  evitar,
  onActivar,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [capas, setCapas] = useState<Capas | null>(null)
  const resaltadoRef = useRef<L.Polygon | null>(null)
  const [[sur, oeste], [norte, este]] = limites

  // Los manejadores de Leaflet se crean una vez: leen siempre el valor vigente desde aquí.
  const vivo = useRef({ pintura, onSeleccion, onActivar, evitar, seleccion })
  useEffect(() => {
    vivo.current = { pintura, onSeleccion, onActivar, evitar, seleccion }
  })

  /* ---------- 1 · Mapa base, encuadrado en `limites` ---------- */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let scale = designScale()
    const instance = L.map(container, { zoomSnap: 0, zoomDelta: 1, zoomControl, scrollWheelZoom: false, minZoom: 8, maxZoom: 18 })
    instance.fitBounds(
      [
        [sur, oeste],
        [norte, este],
      ],
      { ...margenes(instance, vivo.current.evitar), animate: false },
    )
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(instance)

    const resaltado = L.polygon(GUADALAJARA_BOUNDARY, {
      className: 'map-view__highlight',
      color: '#e6fbee',
      weight: 2,
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
  }, [sur, oeste, norte, este, zoomControl])

  /* ---------- 2 · Secciones, límites de distrito y rótulos ---------- */
  useEffect(() => {
    if (!map || !mapa) return
    // Dos lienzos: el relleno de las secciones, translúcido como conjunto (así no se notan las
    // juntas entre secciones vecinas), y encima las líneas, que no interceptan el cursor.
    const paneRelleno = map.getPane(PANE.relleno) ?? map.createPane(PANE.relleno)
    paneRelleno.style.zIndex = '350'
    paneRelleno.style.opacity = '0'
    paneRelleno.style.transition = `opacity ${duracion(DUR.small)}ms ease`
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
    // los contornos (distrito destacado, selección) existen también sin capa: van siempre en el mapa
    const marcas = L.layerGroup().addTo(map)
    const nuevas: Capas = { secciones, relleno: L.layerGroup(secciones), bordes, etiquetas, marcas, cursor, renderer }
    setCapas(nuevas)

    return () => {
      window.clearTimeout(limpiar)
      for (const capa of [nuevas.relleno, nuevas.bordes, nuevas.etiquetas, nuevas.marcas, nuevas.cursor, lienzoRelleno, renderer]) capa.remove()
      setCapas(null)
    }
  }, [map, mapa])

  /* ---------- 3 · Pintar la capa elegida, con fundido ---------- */
  const pintada = useRef<string | null>(null) // clave de lo que hay pintado; null = solo el municipio
  const reloj = useRef(0)
  useEffect(() => {
    if (!map) return
    window.clearTimeout(reloj.current)
    const relleno = map.getPane(PANE.relleno)
    // el municipio resaltado se funde con las secciones: sale cuando ellas entran
    resaltadoRef.current?.getElement()?.classList.toggle('is-oculto', Boolean(capas && pintura))

    if (!capas || !pintura) {
      const retirar = () => {
        if (capas) for (const capa of [capas.relleno, capas.bordes, capas.etiquetas, capas.cursor]) capa.remove()
        pintada.current = null
      }
      if (capas && pintada.current !== null && relleno) {
        relleno.style.opacity = '0'
        reloj.current = window.setTimeout(retirar, duracion(DUR.small))
      } else retirar()
      return
    }

    const pintar = () => {
      capas.secciones.forEach((poligono, i) => poligono.setStyle(estilo(pintura, i)))
      for (const capa of [capas.relleno, capas.bordes, capas.cursor, capas.etiquetas]) if (!map.hasLayer(capa)) capa.addTo(map)
      capas.bordes.bringToFront()
      pintada.current = pintura.clave
      // en el cuadro siguiente, para que la opacidad tenga de dónde transicionar
      requestAnimationFrame(() => {
        if (relleno) relleno.style.opacity = OPACIDAD_RELLENO
      })
    }
    if (pintada.current === null || pintada.current === pintura.clave) {
      pintar() // primera capa (entra con fundido) o los mismos colores con datos más recientes
    } else {
      // otra capa: la anterior se desvanece, se repinta y entra la nueva
      if (relleno) relleno.style.opacity = '0'
      reloj.current = window.setTimeout(pintar, duracion(DUR.small))
    }
    return () => window.clearTimeout(reloj.current)
  }, [map, capas, pintura])

  /* ---------- 4 · Contornos: distrito destacado y selección ---------- */
  useEffect(() => {
    if (!capas || !mapa) return
    capas.marcas.clearLayers()
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
    if (!pintura) return
    if (seleccion?.unidad === 'dist') trazar(contorno(seleccion.indice), TRAZO.seleccion)
    if (seleccion?.unidad === 'secc') trazar([puntos(mapa.poligonos[seleccion.indice])], TRAZO.seleccion, true)
  }, [capas, mapa, pintura, seleccion, destacado])

  /* ---------- 5 · Encuadre: vuela solo cuando cambia la clave ---------- */
  const clave = encuadre?.clave ?? ''
  const destino = encuadre?.limites ?? limites
  const destinoRef = useRef(destino)
  useEffect(() => {
    destinoRef.current = destino
  })
  const inicial = useRef(true)
  useEffect(() => {
    if (!map) return
    if (inicial.current) {
      inicial.current = false // el encuadre inicial ya lo dejó hecho el montaje
      return
    }
    const opciones = margenes(map, vivo.current.evitar)
    if (prefersReducedMotion()) map.fitBounds(destinoRef.current, { ...opciones, animate: false })
    else map.flyToBounds(destinoRef.current, { ...opciones, duration: 0.9 })
  }, [map, clave])

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
