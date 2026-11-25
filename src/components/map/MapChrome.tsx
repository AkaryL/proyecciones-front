import type { CSSProperties, Ref } from 'react'
import type { Ficha, Leyenda } from '../../lib/mapLayers'
import { porcentaje } from '../../lib/format'
import './MapChrome.css'

type MapChromeProps = {
  leyenda: Leyenda | null
  ficha: Ficha | null
  onCerrarFicha: () => void
  ref?: Ref<HTMLDivElement>
}

/**
 * Lo que acompaña al mapa cuando hay una capa activa: la leyenda de colores y
 * la ficha de la sección o el distrito seleccionado. No aparece en la vista
 * inicial, que es la del diseño.
 */
export function MapChrome({ leyenda, ficha, onCerrarFicha, ref }: MapChromeProps) {
  if (!leyenda && !ficha) return null
  return (
    <div ref={ref} className="map-chrome">
      {leyenda ? (
        <section className="map-legend" aria-label="Leyenda del mapa">
          <h3 className="map-legend__title">{leyenda.titulo}</h3>
          <p className="map-legend__subtitle">{leyenda.subtitulo}</p>
          <ul className="map-legend__items">
            {leyenda.items.map((item) => (
              <li key={item.texto}>
                <i style={{ background: item.color }} />
                <span>{item.texto}</span>
                {item.cuenta !== undefined ? <b>{item.cuenta}</b> : null}
              </li>
            ))}
          </ul>
          {leyenda.nota ? <p className="map-legend__note">{leyenda.nota}</p> : null}
        </section>
      ) : null}

      {ficha ? (
        <section className="map-detail" aria-live="polite" aria-label={ficha.titulo}>
          <button type="button" className="map-detail__close" aria-label="Cerrar la ficha" onClick={onCerrarFicha} />
          <h3 className="map-detail__title">{ficha.titulo}</h3>
          <p className="map-detail__subtitle">{ficha.subtitulo}</p>

          <dl className="map-detail__facts">
            {ficha.datos.map((dato) => (
              <div key={dato.etiqueta}>
                <dt>{dato.etiqueta}</dt>
                <dd>{dato.valor}</dd>
              </div>
            ))}
          </dl>

          {ficha.proyeccion ? (
            <>
              <p className="map-detail__kicker">{ficha.proyeccion.titulo}</p>
              <div className="map-detail__bar" aria-hidden="true">
                {ficha.proyeccion.filas.map((fila) => (
                  <span key={fila.nombre} style={{ '--v': fila.valor, background: fila.color } as CSSProperties} />
                ))}
              </div>
              <ul className="map-detail__rows">
                {ficha.proyeccion.filas.map((fila) => (
                  <li key={fila.nombre}>
                    <i style={{ background: fila.color }} />
                    <span>{fila.nombre}</span>
                    <b>{porcentaje(fila.valor)}</b>
                  </li>
                ))}
              </ul>
              <p className="map-detail__reading">{ficha.proyeccion.lectura}</p>
            </>
          ) : null}

          {ficha.resultado2024 ? (
            <>
              <p className="map-detail__kicker">Resultado oficial 2024</p>
              <p className="map-detail__text">{ficha.resultado2024}</p>
            </>
          ) : null}

          {ficha.tema ? (
            <>
              <p className="map-detail__kicker">{ficha.tema.etiqueta}</p>
              <p className="map-detail__text map-detail__text--strong">{ficha.tema.valor}</p>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
