/** Fuentes · 6: cómo se comprobó el modelo. Pruebas internas del motor: dicen que las cuentas cierran, no que el resultado vaya a ser ese. */
import type { ReactNode } from 'react'
import { D, N, T, enFrase, esNum, listaDe as lista, type Json } from '../../motor'
import { Fuente, Kicker, Mono, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { Tarjeta } from '../../components/tablero/kit/tarjetas'
import { BOLETAS3, limpio, metaDe, num, obj, pct, plural, pp, proy, rotBoleta, rotEsc, seccion, tx } from './modelo'
import { Ficha, Notas, VacioSec } from './piezas'

export function Validacion() {
  const s = seccion('fue-validacion')
  const meta: Json = D.meta() || {}
  const v: Json = obj(meta.validacion)
  if (!Object.keys(v).length) return <VacioSec s={s} x="El archivo del motor no trae sus pruebas de validación." />
  const lb: Json = obj(meta.linea_base)
  const P9 = proy('P9')
  const pm: Json = metaDe('proyecciones')
  const cen: string = D.central()
  const mc: string = N.nombre('MC')
  const preliminar = String(T.PRELIMINAR).toLowerCase()

  /* S0 reproduce la base: sin sorteo, debería quedar en la base más la mitad del cambio medio de las anclas */
  const bases = BOLETAS3.flatMap((b) => {
    const x: Json = v[`s0_reproduce_base_${b}`]
    if (!x || !esNum(x.MC_base_centro) || !esNum(x.MC_S0_det_con_deriva)) return []
    const cambio: unknown = obj(lb[b]).cambio_medio
    return [{ b, x, dif: x.MC_S0_det_con_deriva - x.MC_base_centro, mitad: esNum(cambio) ? cambio / 2 : null }]
  })
  const primera = bases[0]
  const frase0 = primera
    ? `en la ${rotBoleta(primera.b)}, ${mc} pasa de ${pct(primera.x.MC_base_centro, 2)} en la base a ${pct(primera.x.MC_S0_det_con_deriva, 2)} en S0 (${pp(primera.dif, 2)}${esNum(primera.mitad) ? `; se esperaba ${pp(primera.mitad, 2)}` : ''})`
    : ''

  const sg: Json = obj(v.similitud_geografia)
  const an: Json = obj(v.ancho_p10_p90_alcaldia_MC)
  const ka = Object.keys(an)
    .filter((k) => esNum(an[k]))
    .sort((a, c) => an[a] - an[c])
  const ce: Json = obj(v.contraste_encuesta_hoy)
  const mo: Json = obj(ce.motor_S1_mes0)
  const kEnc = Object.keys(ce).find((k) => /^encuesta_margen/.test(k))
  const uv: Json = obj(P9?.ultimo_corte_vs_vigente)
  const ex: Json = obj(meta.exportacion)

  const tarjetas: ReactNode[] = [
    ...bases.map(({ b, x, dif, mitad }) => (
      <Ficha key={`base-${b}`} fijo={`${N.BOLETA[b].corto} · S0 · ${T.TODA_GDL}`} kicker="S0 reproduce la base" valor={pp(dif, 2)} sub={`${mc}: de ${pct(x.MC_base_centro, 2)} a ${pct(x.MC_S0_det_con_deriva, 2)}`}>
        {`Sin sorteo, S0 debería quedar en la base más la mitad del cambio medio de las anclas (la otra mitad la gana ${enFrase('MORENA_ALIADOS')})${esNum(mitad) ? `: se esperaba ${pp(mitad, 2)} y salió ${pp(dif, 2)}` : ''}.`}
      </Ficha>
    )),
    !v.s0_reproduce_base_fed && N.BOLETA.fed ? (
      <Ficha key="base-pendiente" fijo={`${rotBoleta('fed')} · S0`} kicker="S0 reproduce la base" valor={T.SIN_DATO} sub="el motor no publica esta prueba para esta boleta">
        {`La ${String(N.BOLETA.fed.largo).toLowerCase()} es ${preliminar}: su validación está pendiente.`}
      </Ficha>
    ) : null,
    esNum(sg.mediana_fuera_diagonal) ? (
      <Ficha
        key="geografia"
        fijo={`${N.BOLETA.ayun.corto} · cada escenario frente a ${cen}`}
        kicker="Los escenarios no mueven las mismas secciones"
        valor={num(sg.mediana_fuera_diagonal, 2)}
        sub="parecido típico entre dos escenarios (de 0, nada, a 1, idénticos)"
      >
        {`Se compara qué secciones mueve cada escenario. El par más parecido llega a ${num(sg.max_fuera_diagonal, 2)}${sg.v7_referencia ? `. En la versión anterior del motor: ${tx(sg.v7_referencia)}` : ''}.`}
      </Ficha>
    ) : null,
    ka.length ? (
      <Ficha
        key="ancho"
        fijo={`${N.BOLETA.ayun.corto} · ${mc} · ${String(T.CTX_TODOS_ESC).toLowerCase()}`}
        kicker="La incertidumbre se mantiene en todos los escenarios"
        valor={`de ${num(an[ka[0]], 1)} a ${num(an[ka[ka.length - 1]], 1)}`}
        sub={`puntos de ancho del rango de ${T.CORRIDAS_80}`}
      >
        {`El rango más angosto es el de ${ka[0]} y el más ancho, el de ${ka[ka.length - 1]}. Ningún escenario se queda sin incertidumbre.`}
      </Ficha>
    ) : null,
    esNum(v.segmentos_rango_cambio_MC_S1) ? (
      <Ficha
        key="segmentos"
        fijo={`${N.BOLETA.ayun.corto} · ${rotEsc(cen)}`}
        kicker="Los grupos de edad y género no reaccionan igual"
        valor={pp(v.segmentos_rango_cambio_MC_S1, 2).replace(/^\+/, '')}
        sub={`entre el grupo en que más cambia ${mc} y el grupo en que menos`}
      >
        {`Cambio de ${mc} frente a S0, por grupo de edad y género.`}
      </Ficha>
    ) : null,
    kEnc && esNum(ce[kEnc]) ? (
      <Ficha key="encuesta" fijo={`${rotEsc(cen)} · si la elección fuera hoy`} kicker="Contraste con una encuesta posterior a la marcha" valor={pp(ce[kEnc])} sub={`margen de ${mc} en la encuesta (frente a Morena, PT y PVEM)`}>
        {`El motor daría ${(['ayun', 'dip'] as const)
          .filter((b) => mo[b] && esNum(mo[b].margen))
          .map((b) => `${pp(mo[b].margen)} en la ${N.BOLETA[b].corto}`)
          .join(' y ')}. ${limpio(ce.nota || '')} Encuesta: ${limpio(ce.encuesta || '')}`}
      </Ficha>
    ) : null,
    v.sumas ? (
      <Ficha key="sumas" kicker="Las cuentas cierran" valor={esNum(meta.sin_vecinos) ? num(meta.sin_vecinos) : null} sub={esNum(meta.sin_vecinos) ? 'secciones sin secciones vecinas' : null}>
        {limpio(v.sumas)}
      </Ficha>
    ) : null,
    P9?.ultimo_corte_vs_vigente ? (
      <Ficha
        key="vigente"
        kicker="Lo publicado no cambió al ampliar el archivo"
        valor={uv.mismas_cifras === true ? 'Mismas cifras' : plural(lista(uv.diferencias).length, 'diferencia', 'diferencias')}
        sub="último corte guardado frente al archivo vigente"
      >
        {ex.que_es ? limpio(ex.que_es) : limpio(uv.nota || '')}
      </Ficha>
    ) : null,
  ]

  // las reglas escritas para quien programa (nombres de campo, huellas) no se muestran
  const claras = lista(pm.reglas)
    .map((r) => String(r))
    .filter((r) => !/[a-z]_[a-z]|sha256|:\s*true/.test(r))
  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      texto={`${
        frase0 ? `Si el motor estuviera bien armado, el escenario de referencia S0 debería reproducir la base oficial más la deriva de las anclas, y lo hace: ${frase0}. ` : ''
      }No hay todavía una elección con la cual comparar: estas pruebas dirían que las cuentas cierran, no que el resultado vaya a ser ese.`}
    >
      <Rejilla min={300}>{tarjetas}</Rejilla>
      <Tarjeta variante="24 plana">
        <Kicker>Cómo se puede rastrear una cifra</Kicker>
        <Notas
          min={260}
          items={[
            { t: 'Cada cifra dice de dónde sale', x: claras.length ? claras.map(limpio).join(' ') : 'Cada cifra lleva su fuente o la palabra «supuesto».' },
            { t: 'Cómo leer una nota de fuente', x: pm.como_leer_una_fuente ? limpio(pm.como_leer_una_fuente) : 'Las notas «Fuentes.» dan el archivo y la ruta del dato dentro de él.' },
            {
              t: 'Huella de los archivos',
              x: (
                <>
                  {`Las proyecciones guardan la huella (un código que cambia si el archivo cambia) de sus ${plural(lista(pm.insumos).length, 'insumo', 'insumos')} y de ${plural(lista(pm.codigo).length, 'guion', 'guiones')} de cálculo. Si una no coincide con el archivo del disco, hay que volver a calcular. Motor: `}
                  <Mono>{String(obj(lista(pm.insumos)[0]).sha256 || T.SIN_DATO)}</Mono>.
                </>
              ),
            },
          ]}
        />
      </Tarjeta>
      <Fuente titulo="Fuentes.">sim_v8.json · _meta.validacion, _meta.sin_vecinos y _meta.exportacion; proyecciones.json · P9.ultimo_corte_vs_vigente, _meta.reglas, _meta.insumos y _meta.codigo.</Fuente>
    </Seccion>
  )
}
