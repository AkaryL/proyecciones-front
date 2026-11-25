import { useRef } from 'react'
import logoMc from '../assets/img/logo-mc.png'
import logoMorena from '../assets/img/logo-morena.png'
import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import { FilterPanel } from '../components/map/FilterPanel'
import { MapChrome } from '../components/map/MapChrome'
import { MapView } from '../components/map/MapView'
import { useMapExplorer } from '../components/map/useMapExplorer'
import { MAIN_MAP_VIEW, MAP_SCENARIO, partyProjections, territoryStats } from '../data/mapa'
import './MapaPage.css'

const PARTY_LOGOS = {
  mc: { src: logoMc, alt: 'Movimiento Ciudadano' },
  morena: { src: logoMorena, alt: 'Morena' },
}

export function MapaPage() {
  const explorer = useMapExplorer({ escenario: MAP_SCENARIO })
  const panelRef = useRef<HTMLElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)

  return (
    <PageShell variant="mapa">
      <div className="frame">
        <PageHero variant="mapa" title="PE 2027" banner="PROYECCIONES ELECTORALES" />

        {/* Las tarjetas siguen al ámbito del selector: el municipio o un distrito. */}
        <section className="stats" aria-label="Indicadores" aria-live="polite">
          {partyProjections(explorer.ambito).map((item) => (
            <article key={item.party} className={`stat-card stat-card--light stat-card--${item.party}`}>
              <div className="stat-card__panel" />
              <img className="stat-card__logo" src={PARTY_LOGOS[item.party].src} alt={PARTY_LOGOS[item.party].alt} />
              <p className="stat-card__percent bl f-ultra">{item.value}</p>
              <p className="stat-card__caption f-bold">
                <span className="bl">{item.caption[0]}</span>
                <span className="bl">{item.caption[1]}</span>
              </p>
            </article>
          ))}

          {territoryStats(explorer.ambito).map((item) => (
            <article key={item.label} className={`stat-card stat-card--dark stat-card--${item.tone}`}>
              <p className="stat-card__figure bl f-ultra">{item.value}</p>
              <p className="stat-card__label bl f-black">{item.label}</p>
              <p className="stat-card__sublabel bl f-thin">{item.sublabel}</p>
            </article>
          ))}
        </section>
      </div>

      <section className="map-stage" aria-label="Mapa de Guadalajara">
        <MapView
          center={MAIN_MAP_VIEW.center}
          zoom={MAIN_MAP_VIEW.zoom}
          tileZoom={MAIN_MAP_VIEW.tileZoom}
          mapa={explorer.mapa}
          pintura={explorer.pintura}
          seleccion={explorer.seleccion}
          onSeleccion={explorer.seleccionar}
          destacado={explorer.destacado}
          encuadre={explorer.encuadre}
          evitar={[panelRef, chromeRef]}
          onActivar={explorer.activar}
        />
        <MapChrome ref={chromeRef} leyenda={explorer.leyenda} ficha={explorer.ficha} onCerrarFicha={() => explorer.seleccionar(null)} />
        {explorer.aviso ? (
          <p className="map-notice" role="status">
            {explorer.aviso}
          </p>
        ) : null}
        <div className="map-stage__overlay frame">
          <FilterPanel
            ref={panelRef}
            ambito={explorer.ambito}
            onAmbito={explorer.elegirAmbito}
            capa={explorer.capa}
            onCapa={explorer.elegirCapa}
            onSinDato={explorer.avisarSinDato}
            vista={explorer.vista}
            onVista={explorer.elegirVista}
          />
        </div>
      </section>
    </PageShell>
  )
}
