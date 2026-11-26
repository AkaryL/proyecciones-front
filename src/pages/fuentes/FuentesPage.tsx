import { useEffect } from 'react'
import { Contexto } from '../../components/tablero/kit/Contexto'
import { PaginaTablero } from '../../components/tablero/PaginaTablero'
import { scrollToElement } from '../../lib/motion'
import { D, N, lista, type Estado } from '../../motor'
import { useMotor, useParametros, useVersion } from '../../motor/hooks'
import { Bloques } from './Bloques'
import { Fichas } from './Fichas'
import { Glosario } from './Glosario'
import { Historial } from './Historial'
import { Limites } from './Limites'
import { Metodo } from './Metodo'
import { CARGA, TABS_FI, TABS_SUP, archivos, leeTab, num, plural, seccion } from './modelo'
import { Partidos } from './Partidos'
import { Bloque } from './piezas'
import { Resumen } from './Resumen'
import { Supuestos } from './Supuestos'
import { Validacion } from './Validacion'

/** Sin el archivo principal (sim_v8) no hay página; los demás, si faltan, se dicen en la sección que los usa. */
const OPCIONALES = CARGA.filter((k) => k !== 'v8')
/** Lo que separa una sección del borde de la ventana al saltar a ella: deja sitio a la barra «Estás viendo». */
const MARGEN_AL_SALTAR = 90

/**
 * Fuentes · datos, método y límites: ¿de dónde sale cada cifra? No sigue
 * boleta, escenario ni distrito: habla de las tres boletas y de todos los
 * escenarios.
 *
 * Secciones, en orden: de un vistazo · 1 fuentes por bloque · 2 método del
 * motor · 3 partidos por separado · 4 supuestos · 5 limitaciones · 6
 * validación · 7 fichas de encuestas · 8 glosario · 9 historial de cortes.
 *
 * Lo que se elige dentro de la página viaja en la dirección: `su` = pestaña de
 * Supuestos, `fi` = pestaña de Fichas y `s` = sección a la que se saltó.
 */
export function FuentesPage() {
  const carga = useMotor(CARGA, OPCIONALES)
  const { params, fijar } = useParametros()
  const version = useVersion()
  const listo = carga === 'listo'
  const meta = listo ? D.meta() || {} : {}

  // la página no deja elegir nada: la barra dice «Las 3 boletas · Todos los escenarios»
  const estado: Estado = { b: 'ayun', e: listo ? String(D.central()) : '', d: '' }
  const su = leeTab(params.get('su'), TABS_SUP)
  const fi = leeTab(params.get('fi'), TABS_FI)

  /** El índice salta a la sección sin perder lo demás de la dirección. */
  const irA = (id: string) => {
    const destino = document.getElementById(id)
    if (!destino) return
    scrollToElement(destino, { offset: MARGEN_AL_SALTAR })
    fijar({ s: id.replace(/^fue-/, '') })
  }
  // al abrir un enlace que apunta a una sección (`?s=metodo`), la página baja hasta ella
  useEffect(() => {
    if (!listo) return
    const pedida = new URLSearchParams(window.location.search).get('s')
    const destino = pedida ? document.getElementById(`fue-${pedida.replace(/[^\w-]/g, '')}`) : null
    if (destino) window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY - MARGEN_AL_SALTAR, behavior: 'instant' })
  }, [listo])

  return (
    <PaginaTablero
      clave="fuentes"
      nombre="Fuentes"
      carga={carga}
      leyendo="Leyendo los archivos del tablero…"
      sinDatos={{ k: 'Sin datos', t: 'No se pudo leer el motor', x: 'Falta sim_v8.json: de él salen el método, los supuestos y las limitaciones.' }}
    >
      <Contexto
        estado={estado}
        escenarios={lista(D.escenarios())}
        ejes={[]}
        todas={{ b: true, e: true }}
        corte={D.corte()}
        version={version}
        chips={[
          `Motor ${meta.version || ''} · ${num(meta.n_corridas)} corridas por escenario`,
          `${plural(archivos().filter((a) => a.json).length, 'archivo de datos', 'archivos de datos')} · ${N.datos_al(D.corte())}`,
        ]}
        onChange={() => undefined}
      />
      <main className="pp-main">
        <Bloque s={seccion('fue-resumen')}>
          <Resumen onIr={irA} />
        </Bloque>
        <Bloque s={seccion('fue-bloques')}>
          <Bloques />
        </Bloque>
        <Bloque s={seccion('fue-metodo')}>
          <Metodo />
        </Bloque>
        <Bloque s={seccion('fue-partidos')}>
          <Partidos />
        </Bloque>
        <Bloque s={seccion('fue-supuestos')}>
          <Supuestos tab={su} onTab={(t) => fijar({ su: t === TABS_SUP[0].v ? null : t })} />
        </Bloque>
        <Bloque s={seccion('fue-limites')}>
          <Limites />
        </Bloque>
        <Bloque s={seccion('fue-validacion')}>
          <Validacion />
        </Bloque>
        <Bloque s={seccion('fue-encuestas')}>
          <Fichas tab={fi} onTab={(t) => fijar({ fi: t === TABS_FI[0].v ? null : t })} />
        </Bloque>
        <Bloque s={seccion('fue-glosario')}>
          <Glosario />
        </Bloque>
        <Bloque s={seccion('fue-cortes')}>
          <Historial />
        </Bloque>
      </main>
    </PaginaTablero>
  )
}
