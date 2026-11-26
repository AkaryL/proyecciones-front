import { useMemo } from 'react'
import { Col, Fuente } from '../../components/tablero/kit/base'
import { Contexto } from '../../components/tablero/kit/Contexto'
import { PaginaTablero } from '../../components/tablero/PaginaTablero'
import { scrollToElement } from '../../lib/motion'
import { useGo } from '../../lib/navigation'
import { D, N, cuantos, lista, num } from '../../motor'
import { useEstado, useMotor, useVersion } from '../../motor/hooks'
import { Distritos } from './Distritos'
import { anioBase, modelo, type Lista } from './modelo'
import { Avisos, Indicadores, Partidos } from './Resumen'
import { Ruta, type VistaRuta } from './Ruta'
import { Secciones, type Cuantas } from './Secciones'
import { ZonaAbierta } from './ZonaAbierta'
import { Ciudad, Zonas, type OrdenZonas, type PestanaCiudad } from './Zonas'

/** Archivos del motor que usa la página; el umbral de «parejo» de las zonas (grupos_var) puede faltar. */
const DATOS = ['v8', 'agentes', 'corridas', 'concilio', 'proyecciones', 'grupos_var']

/**
 * Lo que se elige dentro de la página (orden, lista, pestaña, zona abierta)
 * viaja en la dirección junto al estado; el primer valor de cada una es el de
 * fábrica y no se escribe.
 */
const OPCIONES = {
  orden: ['cerradas', 'electores', 'distrito'],
  lista: ['bisagra', 'defender', 'recuperar', 'cambian', 'bastion', 'diferenciado'],
  cuantas: ['top', 'todas'],
  ruta: ['zonas', 'secciones', 'grupos'],
  ciudad: ['concentrar', 'resumen', 'riesgo', 'bloques', 'supuestos', 'medios', 'escenario'],
} as const

const opcion = <K extends keyof typeof OPCIONES>(params: URLSearchParams, k: K): (typeof OPCIONES)[K][number] => {
  const v = params.get(k)
  return (OPCIONES[k] as readonly string[]).includes(v ?? '') ? (v as (typeof OPCIONES)[K][number]) : OPCIONES[k][0]
}

/**
 * Territorio · dónde se gana y dónde se pierde. Secciones, en orden: el voto por
 * partido, los indicadores de secciones, el reparto por distrito, las zonas con
 * su perfil (y la zona abierta), lo que vale para toda la ciudad, las secciones
 * prioritarias y la ruta de votos por recuperar.
 */
export function TerritorioPage() {
  const carga = useMotor(DATOS, ['grupos_var'])
  const { estado, escenarios, fijar, params, fijarParametros } = useEstado()
  const version = useVersion()
  const go = useGo()
  const listo = carga === 'listo'
  // el modelo se rehace con el estado; `listo` entra para que se arme cuando llegan los datos
  const m = useMemo(() => (listo ? modelo(estado) : null), [listo, estado])
  const meta = listo ? D.meta() || {} : {}

  /** El valor de fábrica de una opción no se escribe en la dirección. */
  const valor = (k: keyof typeof OPCIONES, v: string) => (v === OPCIONES[k][0] ? null : v)
  const fija = (k: keyof typeof OPCIONES, v: string) => fijarParametros({ [k]: valor(k, v) })
  // la zona abierta debe existir y ser del distrito que se está viendo
  const zPedida = params.get('z') || ''
  const zona = listo && zPedida ? D.zona(zPedida) : null
  const z = zona && (!estado.d || String(zona.dl) === estado.d) ? zPedida : ''
  /** Abre (o cierra, con '') una zona y lleva la página hasta ella. */
  const abreZona = (id: string) => {
    fijarParametros({ z: id && D.zona(id) ? id : null })
    requestAnimationFrame(() => {
      const destino = document.getElementById(id ? 't-zona' : 't-zonas')
      if (destino) scrollToElement(destino, { offset: 90 })
    })
  }

  return (
    <PaginaTablero
      clave="territorio"
      nombre="Territorio"
      carga={carga}
      leyendo="Cargando…"
      sinDatos={{ k: 'Territorio', t: 'No se pudieron cargar los datos del motor', x: 'Falta sim_v8.json. Vuelve a cargar la página.' }}
    >
      {m ? (
        <>
          <Contexto
            estado={estado}
            escenarios={escenarios}
            ejes={['b', 'e', 'd']}
            corte={D.corte()}
            version={version}
            chips={[
              cuantos(meta.n_secciones, 'sección', 'secciones'),
              cuantos(lista(D.zonas()).length, 'zona', 'zonas'),
              N.lista_nominal(D.listaNominal()),
              `Mediana de ${num(meta.n_corridas)} corridas`,
              { t: N.datos_al(D.corte()), icono: 'calendario' },
            ]}
            onChange={fijar}
          />
          <main className="pp-main">
            <Col gap={48} id="t-aviso">
              <Avisos m={m} />
            </Col>
            <Col gap={48} id="t-partidos">
              <Partidos m={m} />
            </Col>
            <Col gap={48} id="t-kpi">
              <Indicadores m={m} />
            </Col>
            <Col gap={48} id="t-distritos">
              <Distritos m={m} onDistrito={(d) => fijar({ d })} />
            </Col>
            <Col gap={48} id="t-zonas">
              <Zonas m={m} orden={opcion(params, 'orden') as OrdenZonas} abierta={z} onOrden={(o) => fija('orden', o)} onZona={abreZona} />
            </Col>
            <Col gap={48} id="t-zona">
              {z ? <ZonaAbierta m={m} id={z} onCerrar={() => abreZona('')} onEscenario={(e) => fijar({ e })} /> : null}
            </Col>
            <Col gap={48} id="t-ciudad">
              <Ciudad m={m} pestana={opcion(params, 'ciudad') as PestanaCiudad} onPestana={(p) => fija('ciudad', p)} onDiputaciones={() => go('/diputaciones')} />
            </Col>
            <Col gap={48} id="t-secciones">
              <Secciones
                m={m}
                lista={opcion(params, 'lista') as Lista}
                cuantas={opcion(params, 'cuantas') as Cuantas}
                // al cambiar de lista se vuelve a «las de más electores»
                onLista={(l) => fijarParametros({ lista: valor('lista', l), cuantas: null })}
                onCuantas={(c) => fija('cuantas', c)}
              />
            </Col>
            <Col gap={48} id="t-ruta">
              <Ruta m={m} vista={opcion(params, 'ruta') as VistaRuta} abierta={z} onVista={(v) => fija('ruta', v)} onZona={abreZona} onIr={go} />
            </Col>
            <Col gap={48} id="t-pie">
              <Fuente titulo="Fuentes.">
                {`Secciones, zonas y distritos: sim_v8.json (motor ${meta.version}, ${N.datos_al(D.corte())}). Zonas, perfiles y voto oficial ${anioBase()}: sim_agentes.json. Lectura por zona: sim_corridas.json. Lectura en voces: sim_concilio.json. Clasificación de secciones y ruta de votos: proyecciones.json (P10 y P3${
                  D.proyeccion()?._meta?.corte ? `, ${N.datos_al(D.proyeccion()._meta.corte)}` : ''
                }). Son estimaciones propias condicionales a cada escenario; no son pronósticos.`}
              </Fuente>
            </Col>
          </main>
        </>
      ) : null}
    </PaginaTablero>
  )
}
