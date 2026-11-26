import { useEffect, useLayoutEffect, useRef } from 'react'
import { N, T, type Estado, type Json } from '../../../motor'
import type { Version } from '../../../motor/hooks'
import { Chip, Icono, type ChipDef } from './base'

type Eje = 'b' | 'e' | 'd'
const ICONO: Record<Eje, string> = { b: 'boleta', e: 'matraz', d: 'pin' }

type CampoProps = { eje: Eje; rotulo: string; opciones: [string, string][]; valor: string; onChange: (valor: string) => void }

/**
 * Un selector de la barra. Lo que se LEE es un texto normal, que se parte en dos
 * renglones si hace falta y nunca se recorta; encima va el <select> de verdad,
 * transparente y del mismo tamaño, que es el que se toca y el que lee el lector
 * de pantalla. Así la píldora mide lo que mide su texto.
 */
function Campo({ eje, rotulo, opciones, valor, onChange }: CampoProps) {
  const actual = opciones.find(([v]) => v === valor)?.[1] ?? ''
  return (
    <label className="pp-ctx__campo" data-k={eje}>
      <span className="pp-ctx__caja">
        <span className="pp-ctx__ico" aria-hidden="true">
          <Icono nombre={ICONO[eje]} tam={14} />
        </span>
        <span className="pp-ctx__rot">{rotulo}</span>
        <span className="pp-ctx__val" aria-hidden="true">
          {actual}
        </span>
        <select className="pp-ctx__sel" aria-label={rotulo} value={valor} onChange={(ev) => onChange(ev.target.value)}>
          {opciones.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}

/** Un eje que la página no deja elegir: se muestra como rótulo fijo. */
const Fijo = ({ eje, rotulo, valor }: { eje: Eje; rotulo: string; valor: string }) => (
  <span className="pp-ctx__campo" data-k={eje} data-fijo="1">
    <span className="pp-ctx__pild">
      <span className="pp-ctx__ico" aria-hidden="true">
        <Icono nombre={ICONO[eje]} tam={14} />
      </span>
      <span className="pp-ctx__rot">{rotulo}</span>
      <span className="pp-ctx__fijo">{valor}</span>
    </span>
  </span>
)

const Sep = () => (
  <span className="pp-ctx__sep" aria-hidden="true">
    ·
  </span>
)

type ContextoProps = {
  estado: Estado
  escenarios: Json[]
  /** Ejes que se pueden elegir en esta página; los demás van como rótulo fijo. */
  ejes: Eje[]
  /** Rótulo de la boleta o del escenario cuando la página enseña todos («Las 3 boletas»). */
  todas?: { b?: boolean; e?: boolean }
  corte?: string | null
  version: Version | null
  /** Chips informativos bajo la barra. */
  chips?: ChipDef[]
  onChange: (cambios: Partial<Estado>) => void
}

/**
 * Barra «Estás viendo»: boleta, escenario y distrito, más la fecha de los
 * datos; debajo, los chips informativos de la página. La barra se queda pegada
 * arriba al bajar, con una franja opaca detrás.
 */
export function Contexto({ estado, escenarios, ejes, todas, corte, version, chips, onChange }: ContextoProps) {
  const ref = useRef<HTMLDivElement>(null)
  const elige = (eje: Eje) => ejes.includes(eje)
  const rotEscenario = (id: string) => {
    const e = escenarios.find((x) => String(x.id) === id)
    return e ? (N.escenario(e) as string) : id
  }
  const rotDistrito = (d: string): string => (d === '' ? T.CTX_TODA_GDL : elige('b') || !todas?.b ? N.ambito(d, estado.b) : `${T.CTX_DISTRITO} ${d}`)
  const texto = `${estado.b}|${estado.e}|${estado.d}|${escenarios.length}|${version?.tablero ?? corte ?? ''}`

  // Si con los textos elegidos la barra no cabe en un renglón, se compacta: se guardan los rótulos y los puntos.
  // Es una medida del propio DOM: el atributo se pone directamente, sin pasar por el estado de React.
  useLayoutEffect(() => {
    const barra = ref.current
    if (!barra?.firstElementChild) return
    const mide = () => {
      barra.removeAttribute('data-compacta')
      const y0 = (barra.firstElementChild as HTMLElement).offsetTop
      const alto = (barra.firstElementChild as HTMLElement).offsetHeight
      if ([...barra.children].some((c) => (c as HTMLElement).offsetTop >= y0 + alto)) barra.setAttribute('data-compacta', '1')
    }
    mide()
    const observer = new ResizeObserver(mide)
    observer.observe(barra.parentElement ?? barra)
    return () => observer.disconnect()
  }, [texto])

  // «pegada»: la barra ya tocó el borde de arriba; entonces lleva su franja detrás
  useEffect(() => {
    const barra = ref.current
    if (!barra) return
    const mide = () => {
      const top = Number.parseFloat(getComputedStyle(barra).top) || 0
      barra.toggleAttribute('data-pegada', barra.getBoundingClientRect().top <= top + 0.5 && window.scrollY > 0)
    }
    mide()
    window.addEventListener('scroll', mide, { passive: true })
    window.addEventListener('resize', mide)
    return () => {
      window.removeEventListener('scroll', mide)
      window.removeEventListener('resize', mide)
    }
  }, [])

  const fecha = version ? (
    <span className="pp-ctx__corte" title={`${T.CTX_DATOS_AL || 'Datos al'} ${N.fecha(version.corte)} · ${T.CTX_MODELO_DEL || 'modelo y grupos del'} ${N.fecha(version.modelo)}. Detalle en Fuentes.`}>
      <Icono nombre="calendario" tam={14} />
      {`${T.CTX_ACTUALIZADO || 'Última actualización'} ${N.fecha(version.tablero)}`}
    </span>
  ) : (
    <span className="pp-ctx__corte">
      <Icono nombre="calendario" tam={14} />
      {`${T.CTX_CORTE} ${corte ? N.fecha(corte) : T.CTX_CARGANDO}`}
    </span>
  )

  return (
    <>
      <div
        ref={ref}
        className="pp-ctx"
        role="group"
        aria-label={T.CTX_ESTAS}
        data-n={elige('d') ? 3 : 2}
        data-forma={elige('d') ? 'bd-e' : !elige('e') && todas?.e ? 'be' : 'b-e'}
      >
        <span className="pp-ctx__estas">{T.CTX_ESTAS}</span>
        {elige('b') ? (
          <Campo eje="b" rotulo={T.CTX_BOLETA} opciones={(N.BOLETAS as string[]).map((b) => [b, N.BOLETA[b].corto])} valor={estado.b} onChange={(b) => onChange({ b: b as Estado['b'] })} />
        ) : (
          <Fijo eje="b" rotulo={T.CTX_BOLETA} valor={todas?.b ? T.CTX_TODAS : N.BOLETA[estado.b].corto} />
        )}
        <Sep />
        {elige('e') ? (
          <Campo eje="e" rotulo={T.CTX_ESCENARIO} opciones={escenarios.map((e) => [String(e.id), N.escenario(e)])} valor={estado.e} onChange={(e) => onChange({ e })} />
        ) : (
          <Fijo eje="e" rotulo={T.CTX_ESCENARIO} valor={todas?.e ? T.CTX_TODOS_ESC : rotEscenario(estado.e)} />
        )}
        <Sep />
        {elige('d') ? (
          <>
            <Campo eje="d" rotulo={T.CTX_DISTRITO} opciones={['', ...(N.DISTRITOS as string[])].map((d) => [d, rotDistrito(d)])} valor={estado.d} onChange={(d) => onChange({ d })} />
            <Sep />
          </>
        ) : null}
        {fecha}
      </div>
      {chips?.length ? (
        <div className="pp-heroe-chips">
          {chips.map((c, i) => (
            <Chip key={i} chip={c} />
          ))}
        </div>
      ) : null}
    </>
  )
}
