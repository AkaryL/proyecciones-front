/** Territorio · 5: ruta de votos. Del escenario central al mejor escenario de gestión, dónde habría más votos por recuperar. */
import { D, N, T, cuantos, esNum, limpia, lista, mayus, num, pct, ptsAbs, signo, type Json } from '../../motor'
import { Aviso, Boton, Chip, Col, Fuente, H3, Nota, Rejilla, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { Lineal, Mueve } from '../../components/tablero/kit/barras'
import { Filtros, Formula, RankNombre, RankNumero, TablaRanking, type Celda, type Columna } from '../../components/tablero/kit/tablas'
import { KpiMini } from '../../components/tablero/kit/tarjetas'
import { dCorto, type Modelo } from './modelo'
import { SinDatos } from './piezas'

export type VistaRuta = 'zonas' | 'secciones' | 'grupos'

type Props = { m: Modelo; vista: VistaRuta; abierta: string; onVista: (v: VistaRuta) => void; onZona: (id: string) => void; onIr: (ruta: string) => void }

export function Ruta({ m, vista, abierta, onVista, onZona, onIr }: Props) {
  const tituloSec = '¿Dónde habría más votos por recuperar?'
  const P3: Json = D.proyeccion('P3')
  const B: Json = m.P3
  if (!P3 || !B) {
    return (
      <Seccion n={4} id="t-ruta-sec" titulo={tituloSec}>
        <SinDatos m={m} k="Ruta de votos" t="Sin ruta de votos para esta boleta" x="Falta proyecciones.json (P3)." />
      </Seccion>
    )
  }
  const cen: string = P3.escenario_central
  const ges: string = B.escenario_de_gestion
  const eGes = m.E.find((e) => e.id === ges)
  const amb = m.amb
  const totD = m.d ? B.distritos?.[m.d] : null
  const tot = m.d ? totD?.votos_recuperables : B.ciudad?.votos_recuperables
  const zonas = lista(B.zonas).filter((z) => !m.d || String(z.dl) === m.d)
  const texto = `Si MC pasara del escenario central (${cen}) al de gestión (${ges}), en ${amb} habría unos ${num(tot ? tot.valor : null)} votos por recuperar en la ${m.bol.corto}${m.prelim ? ' (preliminar)' : ''}${
    zonas[0] ? `; la zona con más sería ${zonas[0].zona} (${num(zonas[0].votos_recuperables)}).` : '.'
  } No son votos seguros: dicen dónde habría más en juego.`
  const pal: string[] = N.rampa('neutra')
  const porD = (N.DISTRITOS as string[])
    .map((dl, i) => {
      const x = B.distritos?.[dl]
      return { dl, v: x?.votos_recuperables ? (x.votos_recuperables.valor as number) : null, color: pal[pal.length - 1 - (i % pal.length)] }
    })
    .filter((x): x is { dl: string; v: number; color: string } => esNum(x.v))
  const masD = [...porD].sort((a, b) => b.v - a.v)[0]

  let titulo: string
  let sub: string
  let columnas: Columna[]
  let filas: Celda[][]
  let minAncho: number
  if (vista === 'zonas') {
    const maxZ = Math.max(1, ...zonas.map((z) => z.votos_recuperables))
    titulo = `Las ${num(zonas.length)} zonas de ${amb}, de más a menos votos por recuperar`
    sub = 'Votos de la zona = su lista nominal × su participación de referencia × la mejora de MC en la zona.'
    minAncho = 900
    columnas = [
      { t: '', ancho: '34px' },
      { t: 'Zona', ancho: 'minmax(186px,1.2fr)' },
      { t: 'Ver', ancho: '84px' },
      { t: 'Participación', ancho: '100px', tip: 'Participación de referencia de la zona (la de la elección intermedia anterior), en % de su lista nominal.' },
      { t: `MC en ${cen}`, ancho: '90px', tip: '% de voto de MC en la zona en el escenario central.' },
      { t: 'Mejora', ancho: '100px', tip: `Cuántos puntos subiría MC en la zona al pasar de ${cen} a ${ges}.` },
      { t: 'Votos por recuperar', ancho: 'minmax(170px,1fr)' },
    ]
    filas = zonas.map((z, i) => [
      { c: <RankNumero n={i + 1} /> },
      { c: <RankNombre nombre={z.zona} sub={`${cuantos(z.n_secciones, 'sección', 'secciones')} · ${num(z.lista_nominal)} electores`} /> },
      { c: <Chip chip={{ t: abierta === z.zona ? 'Abierta' : 'Abrir', icono: 'ojo', onClick: () => onZona(z.zona) }} /> },
      { c: pct(z.participacion * 100) },
      { c: pct(z.mc_central) },
      { c: <Mueve valor={z.mejora_pp} dec={2} /> },
      { c: <Lineal valor={z.votos_recuperables} max={maxZ} dec={0} /> },
    ])
  } else if (vista === 'secciones') {
    const SS: Json = B.secciones || {}
    const distritos: string[] = m.d ? [m.d] : N.DISTRITOS
    const todas: { dl: string; s: Json }[] = []
    for (const dl of distritos) for (const s of lista(SS[dl]?.top)) todas.push({ dl, s })
    todas.sort((a, b) => b.s.votos_recuperables - a.s.votos_recuperables || b.s.lista_nominal - a.s.lista_nominal)
    const filasS = todas.slice(0, m.u?.top ? m.u.top : todas.length)
    const maxS = Math.max(1, ...filasS.map((x) => x.s.votos_recuperables))
    titulo = `Las ${num(filasS.length)} secciones de ${amb} con más votos por recuperar`
    sub = `Votos de la sección = su lista nominal × la participación de su distrito × la mejora de MC en la sección. Suma de todas las secciones: ${distritos
      .map((dl) => {
        const x = SS[dl]
        return `${dCorto(dl, m.b)} ${num(x?.total ? x.total.valor : null)}${x?.participacion_usada ? ` (participación ${pct(x.participacion_usada.valor)})` : ''}`
      })
      .join(' · ')}.`
    minAncho = 760
    columnas = [
      { t: '', ancho: '34px' },
      { t: 'Sección', ancho: 'minmax(150px,1.2fr)' },
      { t: 'Electores', ancho: '90px', der: true },
      { t: 'Mejora', ancho: '100px', tip: `Cuántos puntos subiría MC en la sección al pasar de ${cen} a ${ges}.` },
      { t: 'Votos por recuperar', ancho: 'minmax(170px,1fr)' },
      { t: 'Agua', ancho: '56px', tip: 'Exposición a la crisis del agua, de menos a más (estimación propia).' },
    ]
    filas = filasS.map((x, i) => {
      const id = String(x.s.seccion)
      return [
        { c: <RankNumero n={i + 1} /> },
        { c: <RankNombre nombre={`Sección ${id}`} sub={`${dCorto(x.dl, m.b)}${m.zonaDe[id] ? ` · zona ${m.zonaDe[id]}` : ''}`} /> },
        { c: num(x.s.lista_nominal), der: true },
        { c: <Mueve valor={x.s.mejora_pp} dec={1} /> },
        { c: <Lineal valor={x.s.votos_recuperables} max={maxS} dec={0} /> },
        { c: esNum(x.s.exposicion_agua) ? num(x.s.exposicion_agua * 100) : T.SIN_DATO },
      ]
    })
  } else {
    const G = lista(B.grupos)
    const topG = m.u?.topG ? m.u.topG : null
    let gs: Json[]
    if (m.d) {
      const porId: Record<string, Json> = Object.fromEntries(G.map((g) => [g.id, g]))
      gs = lista<string>(totD?.top_por_votos)
        .map((id) => porId[id])
        .filter(Boolean)
    } else {
      gs = G.filter((g) => esNum(g.puesto_votos_en_ciudad) && (!topG || g.puesto_votos_en_ciudad <= topG)).sort((a, b) => a.puesto_votos_en_ciudad - b.puesto_votos_en_ciudad)
    }
    const maxG = Math.max(1, ...gs.map((g) => g.votos_recuperables))
    const maxI = Math.max(1, ...gs.map((g) => g.interes))
    const II: Json = P3.indice_de_interes || {}
    titulo = `Los ${num(gs.length)} grupos de votantes de ${amb} con más votos por recuperar (de ${num(m.d && totD?.n_grupos ? totD.n_grupos.valor : G.length)})`
    sub = `Un grupo es una zona × una edad × un género. Votos del grupo = sus electores × su participación de referencia × la mejora de MC en el grupo.${B.ciudad?.nota && !m.d ? ` ${limpia(B.ciudad.nota)}` : ''}`
    minAncho = 1040
    columnas = [
      { t: '', ancho: '34px' },
      { t: 'Grupo', ancho: 'minmax(170px,1.3fr)' },
      { t: 'Participación', ancho: '100px', tip: 'Participación de referencia del grupo, en % de sus electores.' },
      { t: `MC en ${cen}`, ancho: '90px', tip: '% de voto de MC en el grupo en el escenario central.' },
      { t: 'Mejora', ancho: '100px', tip: `Cuántos puntos subiría MC en el grupo al pasar de ${cen} a ${ges}.` },
      { t: 'Votos por recuperar', ancho: 'minmax(150px,1fr)' },
      { t: 'Lo mueve más', ancho: '110px', tip: `Escenario en que más cambia el voto de MC en el grupo frente a ${m.ref.id}, y cuántos puntos (sin signo).` },
      { t: 'Interés', ancho: '120px', tip: `Índice de interés: ${limpia(II.formula || '')}. Sirve para ordenar, no es un porcentaje.` },
    ]
    filas = gs.map((g, i) => [
      { c: <RankNumero n={i + 1} /> },
      { c: <RankNombre nombre={mayus(D.segmentoTxt(g.edad, g.genero))} sub={`zona ${g.zona} · ${num(g.peso)} electores`} /> },
      { c: pct(g.participacion * 100) },
      { c: pct(g.mc_central) },
      { c: <Mueve valor={g.mejora_pp} dec={2} /> },
      { c: <Lineal valor={g.votos_recuperables} max={maxG} dec={0} /> },
      { c: `${g.escenario_que_mas_lo_mueve} · ${ptsAbs(g.movilidad_pp)}` },
      { c: <Lineal valor={g.interes} max={maxI} dec={1} /> },
    ])
  }

  return (
    <Seccion n={4} id="t-ruta-sec" titulo={tituloSec} texto={texto}>
      <div className="pp-chips">
        <RotuloFijo>{`${T.FIJO} ${m.bol.corto} · de ${cen} a ${ges} · ${amb} (no sigue al selector de escenario)`}</RotuloFijo>
        {m.prelim ? <Aviso /> : null}
      </div>
      <Formula titulo="Cómo se calculan los votos por recuperar" terminos={['electores', 'participación de referencia', 'mejora de MC']} resultado="Votos por recuperar" nota={limpia(P3.como_se_calcula || '')} />
      <Rejilla min={200} gap={16}>
        <KpiMini rotulo="Votos por recuperar" valor={num(tot ? tot.valor : null)} sub={`suma de los grupos de votantes de ${amb}${totD?.n_grupos ? ` (${num(totD.n_grupos.valor)})` : ''}`} />
        <KpiMini rotulo="Mejora de MC" valor={signo(B.mejora_en_la_ciudad ? B.mejora_en_la_ciudad.valor : null)} sub={`puntos en toda la ciudad, de ${cen} a ${ges}`} />
        <KpiMini rotulo="Escenario de gestión" valor={ges} sub={`${eGes ? `${eGes.corto || eGes.nombre}. ` : ''}${limpia(B.criterio_de_gestion || '')}`} />
        <KpiMini
          rotulo="Distrito con más votos por recuperar"
          valor={masD ? dCorto(masD.dl, m.b) : T.SIN_DATO}
          partes={porD.map((x) => ({ nombre: dCorto(x.dl, m.b), valor: x.v, color: x.color }))}
          unidad="votos"
          sub={porD.map((x) => `${dCorto(x.dl, m.b)} ${num(x.v)}`).join(' · ')}
        />
      </Rejilla>
      <Filtros
        aria="Ver la ruta por"
        valor={vista}
        onChange={onVista}
        opciones={[
          { v: 'zonas', t: 'Por zona' },
          { v: 'secciones', t: 'Por sección' },
          { v: 'grupos', t: 'Por grupo de votantes' },
        ]}
      />
      <Col gap={4}>
        <H3>{titulo}</H3>
        <Nota doce>{sub}</Nota>
      </Col>
      <TablaRanking aria={titulo} minAncho={minAncho} columnas={columnas} filas={filas} />
      <Fuente titulo="Cómo leerlo.">{`${lista(P3.notas).map(limpia).join(' ')} Las tres listas no suman lo mismo porque cada una usa su propia participación (la del grupo, la de la zona o la del distrito).`}</Fuente>
      <div className="pp-chips">
        <Boton onClick={() => onIr('/simulacion')}>Ver los grupos en Simulación →</Boton>
        <Boton onClick={() => onIr('/')}>Ver las secciones en el Mapa →</Boton>
      </div>
    </Seccion>
  )
}
