import type { CSSProperties, Ref } from 'react'
import type { Ficha, Leyenda } from '../../lib/mapLayers'
import { porcentaje } from '../../lib/format'
import { DUR, usePresence } from '../../lib/motion'
import './MapChrome.css'

type MapChromeProps = {
  /** Hay algo elegido en el mapa (filtro, vista o ámbito): se ofrece volver al inicio. */
  activo: boolean
  leyenda: Leyenda | null
  ficha: Ficha | null
  onCerrarFicha: () => void
  onRestablecer: () => void
  ref?: Ref<HTMLDivElement>
}

/**
 * Lo que acompaña al mapa cuando hay algo elegido: el botón para volver al
 * inicio, la leyenda de colores y la ficha de la sección o el distrito
 * seleccionado. Cada pieza entra y sale con una animación corta. El contenedor
 * existe siempre (vacío al inicio) para que el mapa reserve su espacio al encuadrar.
 */
export function MapChrome({ activo, leyenda, ficha, onCerrarFicha, onRestablecer, ref }: MapChromeProps) {
  const boton = usePresence(activo ? true : null, DUR.micro)
  const ley = usePresence(leyenda, DUR.micro)
  const fic = usePresence(ficha, DUR.micro)
  const salida = (leaving: boolean) => (leaving ? ' is-leaving' : '')

  return (
    <div ref={ref} className="map-chrome">
      {boton.value ? (
        <button type="button" className={`map-reset${salida(boton.leaving)}`} onClick={onRestablecer} disabled={boton.leaving}>
          Restablecer mapa
        </button>
      ) : null}

      {ley.value ? (
        <section className={`map-legend${salida(ley.leaving)}`} aria-label="Leyenda del mapa">
          {/* al cambiar de capa, el contenido nuevo aparece con un fundido dentro de la misma tarjeta */}
          <div key={`${ley.value.titulo}|${ley.value.subtitulo}`} className="swap-in">
            <h3 className="map-legend__title">{ley.value.titulo}</h3>
            <p className="map-legend__subtitle">{ley.value.subtitulo}</p>
            <ul className="map-legend__items">
              {ley.value.items.map((item) => (
                <li key={item.texto}>
                  <i style={{ background: item.color }} />
                  <span>{item.texto}</span>
                  {item.cuenta !== undefined ? <b>{item.cuenta}</b> : null}
                </li>
              ))}
            </ul>
            {ley.value.nota ? <p className="map-legend__note">{ley.value.nota}</p> : null}
          </div>
        </section>
      ) : null}

      {fic.value ? (
        <section className={`map-detail${salida(fic.leaving)}`} aria-live="polite" aria-label={fic.value.titulo}>
          <button type="button" className="map-detail__close" aria-label="Cerrar la ficha" onClick={onCerrarFicha} />
          <div key={fic.value.titulo} className="swap-in">
            <h3 className="map-detail__title">{fic.value.titulo}</h3>
            <p className="map-detail__subtitle">{fic.value.subtitulo}</p>

            <dl className="map-detail__facts">
              {fic.value.datos.map((dato) => (
                <div key={dato.etiqueta}>
                  <dt>{dato.etiqueta}</dt>
                  <dd>{dato.valor}</dd>
                </div>
              ))}
            </dl>

            {fic.value.proyeccion ? (
              <>
                <p className="map-detail__kicker">{fic.value.proyeccion.titulo}</p>
                <div className="map-detail__bar" aria-hidden="true">
                  {fic.value.proyeccion.filas.map((fila) => (
                    <span key={fila.nombre} style={{ '--v': fila.valor, background: fila.color } as CSSProperties} />
                  ))}
                </div>
                <ul className="map-detail__rows">
                  {fic.value.proyeccion.filas.map((fila) => (
                    <li key={fila.nombre}>
                      <i style={{ background: fila.color }} />
                      <span>{fila.nombre}</span>
                      <b>{porcentaje(fila.valor)}</b>
                    </li>
                  ))}
                </ul>
                <p className="map-detail__reading">{fic.value.proyeccion.lectura}</p>
              </>
            ) : null}

            {fic.value.resultado2024 ? (
              <>
                <p className="map-detail__kicker">Resultado oficial 2024</p>
                <p className="map-detail__text">{fic.value.resultado2024}</p>
              </>
            ) : null}

            {fic.value.tema ? (
              <>
                <p className="map-detail__kicker">{fic.value.tema.etiqueta}</p>
                <p className="map-detail__text map-detail__text--strong">{fic.value.tema.valor}</p>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

/** Aviso sobre el mapa (carga, capa sin dato), con entrada y salida suaves. */
export function MapNotice({ texto }: { texto: string | null }) {
  const { value, leaving } = usePresence(texto, DUR.small)
  if (!value) return null
  return (
    <p className={`map-notice${leaving ? ' is-leaving' : ''}`} role="status">
      {value}
    </p>
  )
}
