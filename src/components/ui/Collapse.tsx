import { useEffect, useState, type ReactNode } from 'react'
import { DUR, duracion } from '../../lib/motion'
import './Collapse.css'

type CollapseProps = {
  open: boolean
  children: ReactNode
  /** Clase del contenedor (márgenes, ancho, capa). */
  className?: string
  id?: string
}

/**
 * Acordeón: abre y cierra su contenido animando el alto, sin medirlo.
 *
 * Usa una rejilla de una fila que pasa de 0fr a 1fr (funciona en todos los
 * navegadores actuales y no necesita conocer el alto del contenido). El
 * contenido solo existe mientras está abierto o cerrándose, así un mapa u otra
 * pieza pesada no queda viva estando oculta. Si arranca abierto, no se anima.
 *
 * Clases del contenedor: `is-open` (abierto o abriéndose) e `is-settled`
 * (abierto y ya quieto: deja de recortar lo que sobresale).
 */
export function Collapse({ open, children, className, id }: CollapseProps) {
  const [mounted, setMounted] = useState(open)
  const [expanded, setExpanded] = useState(open)
  const [settled, setSettled] = useState(open)
  // Al abrir se monta enseguida, todavía cerrado; al cerrar se quitan las clases
  // enseguida. Son ajustes durante el pintado: no esperan a un efecto.
  if (open && !mounted) setMounted(true)
  if (!open && expanded) setExpanded(false)
  if (!open && settled) setSettled(false)

  useEffect(() => {
    if (open) {
      // dos cuadros: el navegador debe pintar primero el estado cerrado para que haya transición
      let segundo = 0
      let quieto = 0
      const primero = requestAnimationFrame(() => {
        segundo = requestAnimationFrame(() => {
          setExpanded(true)
          quieto = window.setTimeout(() => setSettled(true), duracion(DUR.medium) + 40)
        })
      })
      return () => {
        cancelAnimationFrame(primero)
        cancelAnimationFrame(segundo)
        window.clearTimeout(quieto)
      }
    }
    // se desmonta al terminar el cierre (con reloj: `transitionend` no es fiable al animar filas en fr)
    const reloj = window.setTimeout(() => setMounted(false), duracion(DUR.medium))
    return () => window.clearTimeout(reloj)
  }, [open])

  if (!mounted) return null
  const clases = `collapse${expanded ? ' is-open' : ''}${settled ? ' is-settled' : ''}${className ? ` ${className}` : ''}`
  return (
    <div id={id} className={clases}>
      <div className="collapse__inner">{children}</div>
    </div>
  )
}
