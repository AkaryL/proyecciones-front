import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import './Dropdown.css'

export type DropdownOption<T extends string> = {
  value: T
  label: string
  /** Etiqueta corta a la izquierda (p. ej. «S1»). */
  badge?: string
  /** Segunda línea, más discreta. */
  hint?: string
}

type DropdownProps<T extends string> = {
  options: DropdownOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Nombre accesible de la lista. */
  label: string
  /** Clase del contenedor (define posición y tamaño del botón). */
  className?: string
  /** Contenido del botón que abre la lista. */
  children: ReactNode
}

/**
 * Botón con lista desplegable de una sola elección. Se cierra al elegir, con
 * Escape o al tocar fuera, y se puede recorrer con las flechas del teclado.
 */
export function Dropdown<T extends string>({ options, value, onChange, label, className, children }: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()

  const show = () => {
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }
  const hide = (refocus = false) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }
  const choose = (option: DropdownOption<T>) => {
    hide(true)
    if (option.value !== value) onChange(option.value)
  }

  // cerrar al tocar fuera
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // al abrir, el foco pasa a la lista y la opción activa queda a la vista
  useEffect(() => {
    if (!open) return
    listRef.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (event: KeyboardEvent) => {
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown':
        setActive((index) => Math.min(last, index + 1))
        break
      case 'ArrowUp':
        setActive((index) => Math.max(0, index - 1))
        break
      case 'Home':
        setActive(0)
        break
      case 'End':
        setActive(last)
        break
      case 'Enter':
      case ' ':
        if (options[active]) choose(options[active])
        break
      case 'Escape':
        hide(true)
        break
      case 'Tab':
        hide()
        return
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div ref={rootRef} className={`dropdown${open ? ' dropdown--open' : ''}${className ? ` ${className}` : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        className="dropdown__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            show()
          }
        }}
      >
        {children}
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={id}
          className="dropdown__list"
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onKeyDown}
        >
          {options.map((option, index) => {
            const selected = option.value === value
            return (
              <li
                key={option.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={selected}
                className={`dropdown__option${selected ? ' is-selected' : ''}${index === active ? ' is-active' : ''}`}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                {option.badge ? <span className="dropdown__badge">{option.badge}</span> : null}
                <span className="dropdown__text">
                  <span className="dropdown__label">{option.label}</span>
                  {option.hint ? <span className="dropdown__hint">{option.hint}</span> : null}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
