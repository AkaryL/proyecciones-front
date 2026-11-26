import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DiputacionesPage } from './pages/DiputacionesPage'
import { RUTA_LOGIN } from './lib/navigation'
import { FuentesPage } from './pages/FuentesPage'
import { LoginPage } from './pages/LoginPage'
import { MapaPage } from './pages/MapaPage'
import { SimulacionPage } from './pages/SimulacionPage'
import { TableroPage } from './pages/TableroPage'

export default function App() {
  return (
    // `useTransitions={false}`: el cambio de ruta se aplica de inmediato, que es lo que
    // necesita el fundido entre páginas (ver src/lib/navigation.ts).
    <BrowserRouter useTransitions={false}>
      <Routes>
        <Route path="/" element={<MapaPage />} />
        <Route path="/diputaciones" element={<DiputacionesPage />} />
        <Route path="/simulacion" element={<SimulacionPage />} />
        <Route path="/fuentes" element={<FuentesPage />} />
        <Route
          path="/territorio"
          element={<TableroPage key="territorio" pagina="territorio" titulo="TERRITORIO 2027" franja="DÓNDE SE GANA Y DÓNDE SE PIERDE" />}
        />
        <Route path="/comparativo" element={<TableroPage key="comparativo" pagina="comparativo" titulo="COMPARATIVO 2027" franja="MOTOR VS ENCUESTAS" />} />
        <Route path={RUTA_LOGIN} element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
