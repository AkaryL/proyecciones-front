import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DiputacionesPage } from './pages/DiputacionesPage'
import { FuentesPage } from './pages/FuentesPage'
import { MapaPage } from './pages/MapaPage'
import { SimulacionPage } from './pages/SimulacionPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapaPage />} />
        <Route path="/diputaciones" element={<DiputacionesPage />} />
        <Route path="/simulacion" element={<SimulacionPage />} />
        <Route path="/fuentes" element={<FuentesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
