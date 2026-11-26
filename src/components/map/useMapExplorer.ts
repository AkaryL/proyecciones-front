import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DATOS, escenarioPorId, getMapa, getSecciones, type MapaData, type SeccionesEscenario } from '../../api'
import { AVISO_SENTIMIENTO, ficha as armarFicha, pintar, usaPrediccion, type CapaClave, type Seleccion, type Unidad } from '../../lib/mapLayers'

type Opciones = {
  /** Escenario del motor cuyas proyecciones pinta el mapa. */
  escenario: string
  /** Distrito al que pertenece el mapa (el de la tarjeta que lo abre): se destaca su contorno. */
  distrito?: string
}

/** Pide un recurso cuando `clave` deja de ser null y conserva el anterior mientras llega el nuevo. */
function useRecurso<T>(clave: string | null, pedir: () => Promise<T>) {
  const [estado, setEstado] = useState<{ clave: string; data: T | null; error: boolean } | null>(null)
  const pedirRef = useRef(pedir)
  useEffect(() => {
    pedirRef.current = pedir
  })
  useEffect(() => {
    if (clave === null) return
    let vigente = true
    pedirRef.current().then(
      (data) => vigente && setEstado({ clave, data, error: false }),
      () => vigente && setEstado((previo) => ({ clave, data: previo?.data ?? null, error: true })),
    )
    return () => {
      vigente = false
    }
  }, [clave])
  return { data: estado?.data ?? null, error: Boolean(estado?.error && estado.clave === clave), alDia: estado?.clave === clave }
}

const indiceDe = (id: string) => DATOS.distritos.findIndex((d) => d.id === id)

/**
 * Estado del mapa interactivo: qué filtro, vista y ámbito están elegidos, qué
 * está seleccionado, y lo que de ahí se deriva (pintura, leyenda, ficha y
 * encuadre). Sin nada elegido el mapa muestra solo el municipio resaltado.
 */
export function useMapExplorer({ escenario: escenarioId, distrito }: Opciones) {
  const [capa, setCapa] = useState<CapaClave | null>(null)
  const [vista, setVista] = useState<Unidad | null>(null)
  /** La vista la eligió la persona (si no, se activó sola al elegir un filtro). */
  const [vistaElegida, setVistaElegida] = useState(false)
  const [ambito, setAmbito] = useState('')
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  /** Cuántas veces se pidió volver al encuadre inicial (cada una reencuadra el mapa). */
  const [reencuadres, setReencuadres] = useState(0)

  const activo = capa !== null || vista !== null || ambito !== ''
  const escenario = escenarioPorId(escenarioId)

  // Los datos del mapa se piden al entrar a la página para que el primer clic responda de inmediato.
  const [precarga, setPrecarga] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setPrecarga(true), 600)
    return () => window.clearTimeout(id)
  }, [])
  const mapa = useRecurso<MapaData>(activo || precarga ? 'mapa' : null, getMapa)
  const secciones = useRecurso<SeccionesEscenario>(activo || precarga ? escenarioId : null, () => getSecciones(escenarioId))

  // el aviso se retira solo
  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(null), 6500)
    return () => window.clearTimeout(id)
  }, [aviso])

  const unidad: Unidad = vista ?? 'secc'
  const pintado = useMemo(
    () => (activo && mapa.data ? pintar({ mapa: mapa.data, secciones: secciones.data, escenario, capa, unidad, ambito }) : null),
    [activo, mapa.data, secciones.data, escenario, capa, unidad, ambito],
  )
  const ficha = useMemo(
    () => (seleccion && mapa.data ? armarFicha(seleccion, { mapa: mapa.data, secciones: secciones.alDia ? secciones.data : null, escenario, capa }) : null),
    [seleccion, mapa.data, secciones.data, secciones.alDia, escenario, capa],
  )

  const elegirCapa = useCallback(
    (siguiente: CapaClave) => {
      setAviso(null)
      if (capa === siguiente) {
        // quitar el filtro: si la vista se había activado sola, el mapa vuelve al estado inicial
        setCapa(null)
        if (!vistaElegida) {
          setVista(null)
          setSeleccion(null)
        }
        return
      }
      setCapa(siguiente)
      if (vista === null) setVista('secc')
    },
    [capa, vista, vistaElegida],
  )

  const elegirVista = useCallback(
    (siguiente: Unidad) => {
      setSeleccion(null)
      if (vista === siguiente) {
        // con un filtro activo siempre hay una vista: solo se puede cambiar por la otra
        if (capa !== null) return
        setVista(null)
        setVistaElegida(false)
        return
      }
      setVista(siguiente)
      setVistaElegida(true)
    },
    [vista, capa],
  )

  const elegirAmbito = useCallback(
    (siguiente: string) => {
      setSeleccion(null)
      setAmbito(siguiente)
      // al entrar a un distrito se ven sus secciones; al volver al municipio sin filtro, el estado inicial
      if (siguiente && vista === null) setVista('secc')
      if (!siguiente && capa === null && !vistaElegida) setVista(null)
    },
    [vista, capa, vistaElegida],
  )

  /** Entrar al municipio desde la vista inicial (toque sobre el área resaltada). */
  const activar = useCallback(() => {
    setVista('secc')
    setVistaElegida(true)
  }, [])

  /** Quita filtros, vista, ámbito y selección, y devuelve el mapa a su encuadre inicial. */
  const restablecer = useCallback(() => {
    setCapa(null)
    setVista(null)
    setVistaElegida(false)
    setAmbito('')
    setSeleccion(null)
    setAviso(null)
    setReencuadres((n) => n + 1)
  }, [])

  // El contorno destaca el ámbito elegido o, si no hay, el distrito de la tarjeta; la cámara
  // sigue solo al ámbito: mientras el selector diga «Guadalajara», se ve el municipio completo.
  const foco = ambito || distrito || ''
  const iFoco = foco ? indiceDe(foco) : -1
  const iAmbito = ambito ? indiceDe(ambito) : -1
  const cargando = activo && !pintado && !mapa.error && !secciones.error
  const fallo = activo && (mapa.error || (usaPrediccion(capa) && unidad === 'secc' && secciones.error))

  return {
    activo,
    ambito,
    capa,
    /** Vista efectiva del panel (null si el mapa está en su estado inicial). */
    vista,
    seleccion,
    elegirCapa,
    elegirVista,
    elegirAmbito,
    avisarSinDato: () => setAviso(AVISO_SENTIMIENTO),
    seleccionar: setSeleccion,
    activar,
    restablecer,
    mapa: mapa.data,
    pintura: pintado?.pintura ?? null,
    leyenda: pintado?.leyenda ?? null,
    ficha,
    /** Encuadre con el que abre el mapa: Guadalajara completa, ajustada al espacio libre. */
    limites: DATOS.limites,
    /** Distrito cuyo contorno se destaca: el ámbito elegido o el de la tarjeta. */
    destacado: iFoco >= 0 ? iFoco : null,
    /** A dónde vuela el mapa cuando cambia el ámbito o se restablece. */
    encuadre: { clave: `${ambito || 'municipio'}|${reencuadres}`, limites: iAmbito >= 0 ? DATOS.distritos[iAmbito].limites : DATOS.limites },
    aviso: fallo ? 'No se pudieron cargar los datos del mapa. Revisa la conexión e inténtalo de nuevo.' : cargando ? 'Cargando el mapa…' : aviso,
  }
}

export type MapExplorer = ReturnType<typeof useMapExplorer>
