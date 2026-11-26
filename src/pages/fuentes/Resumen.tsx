/** Fuentes · de un vistazo: cuántos archivos, corridas, secciones y escenarios hay detrás de las cifras, y el índice de la página. */
import { D, N, T, compacto, esNum, listaDe as lista, type Json } from '../../motor'
import { Chips, Col, Kicker, Rejilla, Seccion, SinCorte } from '../../components/tablero/kit/base'
import { ComoLeer, Kpi, KpiMini } from '../../components/tablero/kit/tarjetas'
import { DISCLAIMER, J, SECCIONES, archivos, etiquetaMarca, fechaTxt, nZonas, num, obj, plural, proy, seccion, sinCotejar, val } from './modelo'

export function Resumen({ onIr }: { onIr: (id: string) => void }) {
  const s = seccion('fue-resumen')
  const meta: Json = D.meta() || {}
  const nOk = archivos().filter((a) => a.json).length
  const mm: Json = obj(obj(J('menciones'))._meta_monitoreo)
  const cn: Json = obj(obj(obj(J('dashboard')).encuestas).conteo)
  const p7 = proy('P7')
  const ag = J('agentes')
  const ln: unknown = D.listaNominal()
  const escenarios = lista(D.escenarios())
  const canales = Object.keys(obj(meta.canales)).length
  return (
    <Seccion
      id={s.id}
      tag="De un vistazo"
      titulo={N.pagina('fuentes')?.pregunta || s.titulo}
      texto={
        <>
          {'Todas las cifras del tablero salen de '}
          <strong>{plural(nOk, 'archivo de datos', 'archivos de datos')}</strong>
          {', con corte al '}
          <strong>
            <SinCorte>{D.corteTexto()}</SinCorte>
          </strong>
          {`. Si cambiara un archivo, cambiarían las cifras que dependen de él: ${DISCLAIMER}.`}
        </>
      }
    >
      <Rejilla min={210}>
        <Kpi variante="claro" valor={num(meta.n_corridas)} rotulo="corridas por escenario" sub="cada corrida es una elección simulada" />
        <Kpi variante="claro" valor={num(meta.n_secciones)} rotulo="secciones de Guadalajara" sub={`${num(meta.n_celdas)} celdas de sección, edad y género`} />
        <Kpi variante="teal" valor={num(escenarios.length)} rotulo="escenarios" sub={`en cada una de las ${num(N.BOLETAS.length)} boletas`} />
        <Kpi variante="navy" valor={D.corteTexto()} rotulo="Corte de datos" sub={meta.fecha ? `archivo del motor exportado el ${fechaTxt(meta.fecha)}` : 'fecha hasta la que llegan los datos'} />
      </Rejilla>
      <Rejilla min={240} gap={16}>
        <KpiMini rotulo="Lista nominal" valor={compacto(ln)} sub={esNum(ln) ? N.lista_nominal(ln) : T.SIN_DATO} />
        <KpiMini rotulo={T.AGENTES} valor={ag ? num(lista(ag.agentes).length) : T.SIN_DATO} sub="una zona, un grupo de edad y un género" />
        <KpiMini rotulo="Zonas del modelo" valor={ag ? num(nZonas(ag)) : T.SIN_DATO} sub={`en ${plural(N.DISTRITOS.length, 'distrito', 'distritos')}`} />
        <KpiMini rotulo="Canales de choque" valor={num(canales)} sub="vías por las que un hecho mueve votos" />
        <KpiMini rotulo="Mediciones de encuestas" valor={num(cn.mediciones)} sub={`de ${plural(cn.fichas, 'ficha verificada', 'fichas verificadas')}`} />
        <KpiMini rotulo="Notas de prensa" valor={num(mm.noticias_total)} sub={`${num(mm.noticias_nuevas)} de este corte`} />
        <KpiMini rotulo="Publicaciones de redes" valor={num(mm.redes)} sub="verificadas contra su dirección web" />
        <KpiMini
          rotulo="Días a la elección"
          valor={p7 ? num(val(p7.dias_a_la_eleccion)) : T.SIN_DATO}
          sub={p7?.fecha_eleccion ? `desde el corte hasta el ${fechaTxt(val(p7.fecha_eleccion.fecha || p7.fecha_eleccion))}` : ''}
        />
      </Rejilla>
      <Col gap={8}>
        <Kicker variante="chico">Ir a una sección</Kicker>
        <Chips items={SECCIONES.filter((x) => x.n).map((x) => ({ t: `${x.n} · ${x.corto}`, href: `#${x.id}`, punto: false, clave: x.id, onClick: () => onIr(x.id) }))} />
      </Col>
      <ComoLeer titulo="Cómo leer esta página.">
        {'Cada sección responde a una pregunta. Lo que sale de un archivo dice de cuál; lo que es un '}
        <strong>supuesto</strong>
        {' lleva esa palabra. Tres avisos se repiten en todo el tablero: '}
        <strong>{`«${etiquetaMarca('preliminar', 'preliminar')}»`}</strong>
        {` (la ${String(N.BOLETA.fed.largo).toLowerCase()}), `}
        <strong>{`«${sinCotejar()}»`}</strong>
        {' (la encuesta MURAL) y '}
        <strong>{`«${etiquetaMarca('probabilidad_extrema', 'no es certeza')}»`}</strong>
        {'; qué quiere decir cada uno está en «Limitaciones». Las palabras técnicas están en el «Glosario».'}
      </ComoLeer>
    </Seccion>
  )
}
