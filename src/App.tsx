import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DiputacionesPage } from './pages/DiputacionesPage'
import { MapaPage } from './pages/MapaPage'
import { SimulacionPage } from './pages/SimulacionPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapaPage />} />
        <Route path="/diputaciones" element={<DiputacionesPage />} />
        <Route path="/simulacion" element={<SimulacionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
