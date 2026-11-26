import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RUTA_LOGIN } from './lib/navigation'
import { DiputacionesPage } from './pages/DiputacionesPage'
import { LoginPage } from './pages/LoginPage'
import { MapaPage } from './pages/MapaPage'
import { PaginaCargando } from './pages/PaginaCargando'
import { SimulacionPage } from './pages/SimulacionPage'

// Territorio, Comparativo y Fuentes leen los datos del motor con su capa de datos, que pesa: su código llega solo al entrar a la página.
const TerritorioPage = lazy(() => import('./pages/territorio/TerritorioPage').then((m) => ({ default: m.TerritorioPage })))
const ComparativoPage = lazy(() => import('./pages/comparativo/ComparativoPage').then((m) => ({ default: m.ComparativoPage })))
const FuentesPage = lazy(() => import('./pages/fuentes/FuentesPage').then((m) => ({ default: m.FuentesPage })))

export default function App() {
  return (
    // `useTransitions={false}`: el cambio de ruta se aplica de inmediato, que es lo que
    // necesita el fundido entre páginas (ver src/lib/navigation.ts).
    <BrowserRouter useTransitions={false}>
      <Routes>
        <Route path="/" element={<MapaPage />} />
        <Route path="/diputaciones" element={<DiputacionesPage />} />
        <Route path="/simulacion" element={<SimulacionPage />} />
        <Route
          path="/fuentes"
          element={
            <Suspense fallback={<PaginaCargando nombre="Fuentes" titulo="FUENTES 2027" franja="DATOS, MÉTODO Y LÍMITES" />}>
              <FuentesPage />
            </Suspense>
          }
        />
        <Route
          path="/territorio"
          element={
            <Suspense fallback={<PaginaCargando nombre="Territorio" titulo="TERRITORIO 2027" franja="DÓNDE SE GANA Y DÓNDE SE PIERDE" />}>
              <TerritorioPage />
            </Suspense>
          }
        />
        <Route
          path="/comparativo"
          element={
            <Suspense fallback={<PaginaCargando nombre="Comparativo" titulo="COMPARATIVO 2027" franja="MOTOR VS ENCUESTAS" />}>
              <ComparativoPage />
            </Suspense>
          }
        />
        <Route path={RUTA_LOGIN} element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
