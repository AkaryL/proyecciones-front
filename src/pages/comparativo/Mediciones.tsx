/** Comparativo · 7: todas las mediciones de intención de voto. Cuáles cuentan en el promedio y por qué. */
import { D, N, T, esNum, listaDe as lista, num, pct, type Json } from '../../motor'
import { Etiqueta, Fuente, H3, Seccion, SinCorte } from '../../components/tablero/kit/base'
import { Filtros, RankNombre, TablaRanking, type Celda, type Columna } from '../../components/tablero/kit/tablas'
import { TarjetaAviso, Vacio } from '../../components/tablero/kit/tarjetas'
import { FILTROS, RAYA, SIN_COTEJAR, avisoDe, desdeTrimestre, f1, fechaTxt, filaTablero, intencion, levantamiento, pasa, porFecha, prelim, rotFiltro, type Filtro } from './modelo'
import { Enlace, FijoEncuestas, MarcaAviso, MarcaPrelim, VacioSec } from './piezas'

/** Color de la etiqueta de cada nivel de confianza. */
const NIVELES: Record<string, 'ambar' | 'gris' | ''> = { alta: '', 'media-alta': '', media: 'ambar', 'media-baja': 'gris', baja: 'gris' }

const COLUMNAS: Columna[] = [
  { t: 'Levantamiento', ancho: 'minmax(116px,1fr)' },
  // 182: lo que mide la etiqueta «sin cotejar con el original», que va en un solo renglón
  { t: 'Casa encuestadora', ancho: 'minmax(182px,1.2fr)' },
  { t: 'Boleta', ancho: 'minmax(96px,.8fr)' },
  { t: 'MC', ancho: '40px', der: true },
  { t: N.nombre('MORENA'), ancho: '56px', der: true },
  { t: 'Otros partidos que lista', ancho: 'minmax(140px,1.1fr)' },
  { t: 'En el promedio', ancho: 'minmax(210px,2fr)' },
  { t: 'Confianza', ancho: '98px' },
  { t: 'Fuente', ancho: '60px' },
]

export function Mediciones({ filtro, onFiltro }: { filtro: Filtro; onFiltro: (f: Filtro) => void }) {
  const id = 'cmp-mediciones'
  const titulo = '¿Qué encuestas hay y cuáles cuentan en el promedio?'
  const I = intencion()
  if (!I) return <VacioSec id={id} tag="Todas las mediciones" titulo={titulo} x="Falta la lista de encuestas (proyecciones.json · P6)." />
  const si = lista(I.entran)
  const no = lista(I.no_entran)
  const ev: Json = D.evolucion('ayun')
  const porId: Record<string, Json> = Object.fromEntries([...si, ...no].map((q) => [q.id, q]))
  const evBol: Json = ev?.meta?.encuestas_boleta ?? {}
  const evId: Record<string, Json> = Object.fromEntries(lista(ev?.encuestas_todas).map((q) => [q.id, q]))
  /** El motivo, sin identificadores internos ni nombres de archivo. */
  const motivo = (q: Json) =>
    String(q.motivo || '')
      .replace(/«([a-z0-9_]+)»(?:\s+de\s+[\w.-]+\.json)?/g, (todo: string, idq: string) => {
        const o = porId[idq]
        return o ? `«${o.casa}, ${levantamiento(o)}${prelim(o) ? `, ${SIN_COTEJAR}` : ''}»` : todo
      })
      .replace(/\s*\(boleta «[^»]*»\)/g, '')
  const boletaDe = (q: Json, entra: boolean): string => {
    if (entra) return N.BOLETA.ayun.corto
    const e = evId[q.id]
    if (e) return e.boleta === 'ayun' ? N.BOLETA.ayun.corto : evBol[e.boleta]?.txt || T.SIN_DATO
    return filaTablero(q)?.boleta_txt || T.SIN_DATO
  }
  /** Los demás partidos que lista la medición, tal como los publica, en el orden fijo de los partidos. */
  const otros = (q: Json, e: Json): string => {
    const orden: string[] = N.PARTIDOS || Object.keys(N.PARTIDO)
    const lugar = (k: string) => (orden.includes(k) ? orden.indexOf(k) : 99)
    return (
      Object.keys(N.PARTIDO)
        .filter((k) => k !== 'MC' && k !== 'MORENA' && k !== 'OTROS')
        .map((k): [string, unknown] => [k, esNum(q[k]) ? q[k] : esNum(e[k]) ? e[k] : esNum(e.aliados?.[k]) ? e.aliados[k] : null])
        .filter(([, x]) => esNum(x))
        .sort(([a], [c]) => lugar(a) - lugar(c))
        .map(([k, x]) => `${N.nombre(k)} ${f1(x)}`)
        .join(' · ') || RAYA
    )
  }
  const fila = (q: Json, entra: boolean): Celda[] => {
    const e: Json = evId[q.id] || {}
    const t = filaTablero(q)
    return [
      { c: levantamiento(q) },
      {
        c: (
          <>
            <RankNombre nombre={q.casa} />
            <MarcaPrelim q={q} />
            <MarcaAviso q={q} />
          </>
        ),
        tip: avisoDe(q) || null,
      },
      { c: boletaDe(q, entra) },
      { c: f1(esNum(q.MC) ? q.MC : e.MC), der: true },
      { c: f1(esNum(q.MORENA) ? q.MORENA : e.MORENA), der: true },
      { c: otros(q, e) },
      { c: entra ? <RankNombre nombre={`Entra · pesa ${pct(q.peso_pct)}`} sub={`${num(q.dias_al_corte)} días antes del corte`} /> : <RankNombre nombre="No entra" sub={motivo(q)} /> },
      {
        c: entra && q.confianza ? <Etiqueta tipo={NIVELES[q.confianza] ?? 'gris'}>{q.confianza}</Etiqueta> : <Etiqueta tipo="gris">sin nivel</Etiqueta>,
        tip: entra ? (q.confianza_texto ? `Confianza: ${q.confianza_texto}` : null) : 'Solo las encuestas que entran en el promedio traen nivel de confianza.',
      },
      { c: <Enlace url={q.url || t?.url} casa={q.casa} /> },
    ]
  }
  const reciente = (a: Json, c: Json) => -porFecha(a, c)
  // las que no entran no traen nivel de confianza
  const pasaNo = (q: Json) => filtro === 'todas' || (filtro === 'trimestre' && pasa(q, filtro))
  const fSi = [...si].sort(reciente).filter((q) => pasa(q, filtro))
  const fNo = [...no].sort(reciente).filter(pasaNo)
  const total = si.length + no.length
  const bloque = (rot: string, filas: Json[], entra: boolean) => (
    <>
      <H3 titulo>{rot}</H3>
      {filas.length ? (
        <TablaRanking aria={rot} minAncho={1130} columnas={COLUMNAS} filas={filas.map((q) => fila(q, entra))} />
      ) : (
        <Vacio chico t={`Ninguna pasa el filtro «${rotFiltro(filtro)}»`} x={!entra && filtro === 'confiables' ? 'Las mediciones que no entran en el promedio no traen nivel de confianza.' : undefined} />
      )}
    </>
  )
  const cuenta: Json = D.dato('dashboard')?.encuestas?.conteo
  const conAviso = si.filter((q) => avisoDe(q))
  return (
    <Seccion
      id={id}
      tag="Todas las mediciones"
      titulo={titulo}
      derecha={<Filtros aria="Filtrar encuestas" valor={filtro} opciones={FILTROS} onChange={onFiltro} />}
      texto={`De las ${num(total)} mediciones de intención de voto que hay en los insumos, ${num(si.length)} entran en el promedio y ${num(no.length)} no; cada una dice a qué boleta corresponde y, si no entra, por qué.${
        filtro !== 'todas' ? ` Con el filtro «${rotFiltro(filtro)}» se muestran ${num(fSi.length + fNo.length)} de ${num(total)}.` : ''
      }`}
    >
      <FijoEncuestas />
      {bloque(`Entran en el promedio (${num(fSi.length)}${fSi.length !== si.length ? ` de ${num(si.length)}` : ''})`, fSi, true)}
      {bloque(`No entran, y por qué (${num(fNo.length)}${fNo.length !== no.length ? ` de ${num(no.length)}` : ''})`, fNo, false)}
      {conAviso.length ? (
        <TarjetaAviso
          titulo={conAviso.length === 1 ? 'Una encuesta del promedio lleva aviso' : `${num(conAviso.length)} encuestas del promedio llevan aviso`}
          aviso="Con aviso"
          min={320}
          notas={conAviso.map((q) => ({ t: `${q.casa} · ${levantamiento(q)} · pesa ${pct(q.peso_pct)}`, x: avisoDe(q) }))}
        />
      ) : null}
      <Fuente titulo="Fuentes.">
        {`proyecciones.json · P6.intencion_alcaldia.entran y no_entran; las cifras de las que no entran, de sim_evolucion.json · encuestas; la boleta y el enlace de las del monitoreo, de sim_dashboard.json · encuestas.filas. ${lista(I.metodo?.reglas)
          .slice(0, 2)
          .map((r) => D.llano(r) as string)
          .join(' ')}${
          esNum(cuenta?.mediciones) ? ` El monitoreo guarda en total ${num(cuenta.mediciones)} mediciones (también de aprobación y de contexto); aquí van solo las de intención de voto.` : ''
        } «Confianza ≥ media» deja solo las que entran con nivel media, media-alta o alta. «Último trimestre» = desde el `}
        <SinCorte>{fechaTxt(desdeTrimestre())}</SinCorte>.
      </Fuente>
    </Seccion>
  )
}
