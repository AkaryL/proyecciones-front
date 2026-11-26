/**
 * Estado y carga de datos de las páginas del tablero.
 *
 * Lo que se está viendo (boleta, escenario, distrito) y las opciones propias de
 * cada página (orden, pestaña, zona abierta…) viajan en la dirección de la
 * página (`?b=dip&e=S4&d=8`): así se conservan al recargar y se pueden
 * compartir. Además, lo último que se eligió se recuerda mientras dura la
 * visita y acompaña a la persona de una página a otra (Territorio ↔ Comparativo).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { D, N, lista, type Boleta, type Estado, type Json } from './index'

export type EstadoCarga = 'cargando' | 'listo' | 'falta'

/**
 * Pide los archivos del motor que usa una página (claves de la capa de datos:
 * 'v8', 'agentes', 'proyecciones'…). `falta` solo si no llegó el principal
 * (sim_v8); los demás, si faltan, se rotulan donde se usan.
 */
export function useMotor(claves: string[], opcionales: string[] = []): EstadoCarga {
  const pedido = claves.join(',')
  const sinFalla = opcionales.join(',')
  const [carga, setCarga] = useState<{ pedido: string; estado: EstadoCarga }>({ pedido: '', estado: 'cargando' })
  useEffect(() => {
    let vivo = true
    D.cargar(pedido.split(','), { opcionales: sinFalla ? sinFalla.split(',') : [] }).then(() => {
      if (vivo) setCarga({ pedido, estado: D.dato('v8') ? 'listo' : 'falta' })
    })
    return () => {
      vivo = false
    }
  }, [pedido, sinFalla])
  if (carga.pedido === pedido) return carga.estado
  // ya estaban todos en memoria (se pidieron en otra página): no hay que esperar. Si falta alguno, aunque
  // sea opcional, se espera a que termine la carga: así la página no se pinta a medias y se corrige después.
  return claves.every((k) => D.listo(k)) ? 'listo' : 'cargando'
}

/**
 * La predicción por sección de un escenario y el resultado 2024 por partido de
 * una boleta se piden aparte (pesan) y solo cuando una lista los necesita.
 * Devuelve si la predicción ya está; al llegar cualquiera de los dos se repinta.
 */
export function useSeccionesMotor(escenario: string, boleta: Boleta, activo = true): boolean {
  const [, repinta] = useState(0)
  useEffect(() => {
    if (!activo) return
    let vivo = true
    const espera: Promise<unknown>[] = []
    if (D.estadoSecciones(escenario) !== 'listo' && D.estadoSecciones(escenario) !== 'falta') espera.push(D.cargarSecciones(escenario))
    if (D.estadoPartidos2024(boleta) === 'sin_pedir') espera.push(D.cargarPartidos2024(boleta))
    if (espera.length) {
      Promise.all(espera).then(
        () => vivo && repinta((n) => n + 1),
        () => undefined,
      )
    }
    return () => {
      vivo = false
    }
  }, [escenario, boleta, activo])
  return activo && D.estadoSecciones(escenario) === 'listo'
}

/**
 * El resultado 2024 por partido y por sección de las tres boletas (pesa): se pide
 * solo cuando una página lo necesita y, al llegar, se repinta. El estado de cada
 * boleta se consulta con `D.estadoPartidos2024(boleta)`.
 */
export function usePartidos2024(): void {
  const [, repinta] = useState(0)
  useEffect(() => {
    // ya llegó (o ya se sabe que falta): nada que esperar. Si otra página lo pidió y sigue en camino, se espera esa misma carga.
    if ((N.BOLETAS as Boleta[]).every((b) => ['listo', 'falta'].includes(D.estadoPartidos2024(b)))) return
    let vivo = true
    const alLlegar = () => {
      if (vivo) repinta((n) => n + 1)
    }
    D.cargarPartidos2024().then(alLlegar, alLlegar)
    return () => {
      vivo = false
    }
  }, [])
}

export type Version = { corte: string; modelo: string; tablero: string }

/** Fechas del paquete del motor (hasta cuándo llegan los datos, de cuándo es el modelo y el tablero). */
export function useVersion(): Version | null {
  const [version, setVersion] = useState<Version | null>(null)
  useEffect(() => {
    let vivo = true
    fetch(`${import.meta.env.BASE_URL}data/motor/version.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v: Version | null) => {
        if (vivo && v?.corte && v.modelo && v.tablero) setVersion(v)
      })
      .catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [])
  return version
}

/** Parámetros de la dirección de la página, con una función para cambiarlos sin recargar ni mover la página. */
export function useParametros() {
  const [params, setParams] = useSearchParams()
  const fijar = useCallback(
    (cambios: Record<string, string | null | undefined>) => {
      setParams(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          for (const [k, v] of Object.entries(cambios)) {
            if (v == null || v === '') siguientes.delete(k)
            else siguientes.set(k, v)
          }
          return siguientes
        },
        { replace: true, preventScrollReset: true },
      )
    },
    [setParams],
  )
  return { params, fijar }
}

const EJES = ['b', 'e', 'd'] as const
/**
 * Lo último que se eligió en esta visita (boleta, escenario, distrito). Vive en
 * memoria: acompaña de una página a otra y se olvida al cerrar o recargar (para
 * eso está la dirección de cada página).
 */
const recordado: Partial<Record<(typeof EJES)[number], string>> = {}

/**
 * Lo que se está viendo, validado contra los datos: boleta conocida, distrito
 * de Guadalajara y un escenario que exista (si no, el central del motor).
 * `fijo` son los ejes que una página no deja elegir (Comparativo: la alcaldía).
 */
export function useEstado(fijo: Partial<Estado> = {}): {
  estado: Estado
  escenarios: Json[]
  fijar: (cambios: Partial<Estado>) => void
  params: URLSearchParams
  /** Cambia varias opciones de la página de una vez (dos cambios seguidos se pisarían: el segundo no ve al primero). */
  fijarParametros: (cambios: Record<string, string | null>) => void
} {
  const { params, fijar: fijarParams } = useParametros()
  const escenarios = lista(D.escenarios())
  // lo que dice la dirección manda; lo que le falta se completa con lo elegido antes en esta visita
  const b = params.get('b') ?? recordado.b ?? null
  const e = params.get('e') ?? recordado.e ?? null
  const d = params.get('d') ?? recordado.d ?? null
  const fijoB = fijo.b
  const fijoE = fijo.e
  const fijoD = fijo.d
  const estado = useMemo<Estado>(() => {
    const central: string = String(N.escenario_central(escenarios) ?? N.ESTADO.e)
    return {
      b: fijoB ?? ((N.BOLETAS as string[]).includes(b ?? '') ? (b as Boleta) : N.ESTADO.b),
      e: fijoE ?? (escenarios.some((x) => String(x.id) === e) ? (e as string) : central),
      d: fijoD ?? ((N.DISTRITOS as string[]).includes(d ?? '') ? (d as string) : ''),
    }
    // `escenarios` es la misma lista mientras no cambien los datos: basta con cuántos son
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b, e, d, fijoB, fijoE, fijoD, escenarios.length])
  // La dirección y lo recordado se mantienen de acuerdo: lo que la dirección trae (y es válido) se recuerda; lo que le
  // falta y sí se recuerda se le escribe, para que siempre diga lo que se ve. Los ejes que la página fija no cuentan.
  useEffect(() => {
    const libres = { b: fijoB === undefined, e: fijoE === undefined, d: fijoD === undefined }
    const faltan: Record<string, string> = {}
    for (const k of EJES) {
      if (!libres[k]) continue
      const enDireccion = params.get(k)
      if (enDireccion != null) {
        if (enDireccion === estado[k]) recordado[k] = enDireccion
      } else if (recordado[k]) faltan[k] = recordado[k]
    }
    if (Object.keys(faltan).length) fijarParams(faltan)
  }, [params, estado, fijoB, fijoE, fijoD, fijarParams])
  const fijar = useCallback(
    (cambios: Partial<Estado>) => {
      Object.assign(recordado, cambios)
      fijarParams(cambios as Record<string, string>)
    },
    [fijarParams],
  )
  return { estado, escenarios, fijar, params, fijarParametros: fijarParams }
}
