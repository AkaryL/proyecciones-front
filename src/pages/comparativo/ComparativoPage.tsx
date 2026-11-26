import { Contexto } from '../../components/tablero/kit/Contexto'
import { PaginaTablero } from '../../components/tablero/PaginaTablero'
import { D, cuantos, num } from '../../motor'
import { useEstado, useMotor, useVersion } from '../../motor/hooks'
import { Aprobacion } from './Aprobacion'
import { Cortes } from './Cortes'
import { Careos, Promedio } from './Encuestas'
import { Evolucion } from './Evolucion'
import { Mediciones } from './Mediciones'
import { ALC, esFiltro, intencion, val, type Filtro } from './modelo'
import { Bloque } from './piezas'
import { Indicadores, Leer } from './Resumen'
import { SerieMensual } from './SerieMensual'

/** Archivos del motor que usa la página; sin el principal (sim_v8) no hay nada que comparar, los demás se rotulan donde faltan. */
const DATOS = ['v8', 'evolucion', 'proyecciones', 'dashboard']
/** La página es siempre de la alcaldía y de toda Guadalajara; solo sigue el selector de escenario. */
const FIJO = { b: 'ayun', d: '' } as const

/**
 * Comparativo · motor vs encuestas: ¿coinciden el modelo y las encuestas?
 * Secciones, en orden: cuatro indicadores · cómo leer y tres hallazgos ·
 * evolución 2021–2027 · promedio de encuestas · careos por aspirante · serie
 * mes a mes · aprobaciones · todas las mediciones · cambios entre cortes.
 *
 * Lo que se elige dentro de la página viaja en la dirección: `f` = filtro de
 * encuestas (lo comparten la serie y la lista de mediciones) y `ap` = de quién
 * es la tabla de aprobación.
 */
export function ComparativoPage() {
  const carga = useMotor(DATOS, ['evolucion', 'proyecciones', 'dashboard'])
  const { estado, escenarios, fijar, params, fijarParametros } = useEstado(FIJO)
  const version = useVersion()
  const listo = carga === 'listo'
  const meta = listo ? D.meta() || {} : {}

  const f = params.get('f')
  const filtro: Filtro = esFiltro(f) ? f : 'todas'
  const fijaFiltro = (nuevo: Filtro) => fijarParametros({ f: nuevo === 'todas' ? null : nuevo })
  const promedio = listo ? intencion()?.promedio : null

  return (
    <PaginaTablero
      clave="comparativo"
      nombre="Comparativo"
      carga={carga}
      leyendo="Leyendo el motor y las encuestas…"
      sinDatos={{ k: 'Sin datos', t: 'No se pudo leer el motor', x: 'Falta sim_v8.json: sin él no hay nada que comparar.' }}
    >
      <Contexto
        estado={estado}
        escenarios={escenarios}
        ejes={['e']}
        corte={D.corte()}
        version={version}
        chips={[`Motor ${meta.version || ''} · mediana de ${num(meta.n_corridas)} corridas`, ...(promedio ? [`${cuantos(val(promedio.n_encuestas), 'encuesta', 'encuestas')} de ${ALC} en el promedio`] : [])]}
        onChange={fijar}
      />
      <main className="pp-main">
        <Bloque id="cmp-kpi">
          <Indicadores v={estado} />
        </Bloque>
        <Bloque id="cmp-leer">
          <Leer v={estado} />
        </Bloque>
        <Bloque id="cmp-evolucion">
          <Evolucion v={estado} />
        </Bloque>
        <Bloque id="cmp-promedio">
          <Promedio v={estado} />
        </Bloque>
        <Bloque id="cmp-careos">
          <Careos />
        </Bloque>
        <Bloque id="cmp-serie">
          <SerieMensual v={estado} filtro={filtro} onFiltro={fijaFiltro} />
        </Bloque>
        <Bloque id="cmp-aprobacion">
          <Aprobacion persona={params.get('ap') ?? ''} onPersona={(ap) => fijarParametros({ ap })} />
        </Bloque>
        <Bloque id="cmp-mediciones">
          <Mediciones filtro={filtro} onFiltro={fijaFiltro} />
        </Bloque>
        <Bloque id="cmp-cortes">
          <Cortes v={estado} />
        </Bloque>
      </main>
    </PaginaTablero>
  )
}
