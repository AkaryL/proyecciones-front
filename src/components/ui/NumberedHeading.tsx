import './ui.css'

type NumberedHeadingProps = {
  number: number
  children: string
}

/** Título de sección con su número en un recuadro degradado. */
export function NumberedHeading({ number, children }: NumberedHeadingProps) {
  return (
    <h2 className="numbered-heading">
      <span className="numbered-heading__badge">
        <span className="bl f-h-bold">{number}</span>
      </span>
      <span className="numbered-heading__text bl f-h-bold">{children}</span>
    </h2>
  )
}
