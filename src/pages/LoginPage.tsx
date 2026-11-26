import { useEffect, useRef, useState, type FormEvent } from 'react'
import { iniciarSesion } from '../api/sesion'
import { Icon } from '../components/icons/Icon'
import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import { SectionTag } from '../components/ui/SectionTag'
import { prefersReducedMotion } from '../lib/motion'
import { RUTA_INICIO, useGo } from '../lib/navigation'
import './LoginPage.css'

type Errores = { usuario?: string; contrasena?: string; general?: string }

/**
 * Inicio de sesión. No tiene pantalla en el diseño: usa su mismo lenguaje (el
 * rótulo del inicio, una tarjeta blanca, la píldora de sección y el degradado
 * de la franja en el botón).
 *
 * Todavía no hay backend (ver src/api/sesion.ts): al enviar solo se revisa que
 * los dos campos traigan algo y se entra. La contraseña no se guarda en ningún
 * lado: se lee del formulario en el momento de enviar.
 */
export function LoginPage() {
  const go = useGo()
  const tarjetaRef = useRef<HTMLFormElement>(null)
  const usuarioRef = useRef<HTMLInputElement>(null)
  const contrasenaRef = useRef<HTMLInputElement>(null)
  const [errores, setErrores] = useState<Errores>({})
  const [visible, setVisible] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // quien llega aquí viene a escribir: el cursor empieza en el primer campo
  useEffect(() => {
    usuarioRef.current?.focus({ preventScroll: true })
  }, [])

  /** Envío rechazado: la tarjeta niega con una sacudida corta. */
  const sacudir = () => {
    if (prefersReducedMotion()) return
    tarjetaRef.current?.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)', offset: 0.2 }, { transform: 'translateX(6px)', offset: 0.45 }, { transform: 'translateX(-3px)', offset: 0.7 }, { transform: 'translateX(0)' }],
      { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )
  }

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (enviando) return
    const datos = new FormData(event.currentTarget)
    const usuario = String(datos.get('usuario') ?? '').trim()
    const contrasena = String(datos.get('contrasena') ?? '')

    const faltan: Errores = {}
    if (!usuario) faltan.usuario = 'Escribe tu usuario.'
    if (!contrasena) faltan.contrasena = 'Escribe tu contraseña.'
    if (faltan.usuario || faltan.contrasena) {
      setErrores(faltan)
      sacudir()
      // el cursor va al primer campo que falta
      ;(faltan.usuario ? usuarioRef : contrasenaRef).current?.focus()
      return
    }

    setErrores({})
    setEnviando(true)
    const resultado = await iniciarSesion({ usuario, contrasena })
    if (resultado.ok) {
      go(RUTA_INICIO)
      return
    }
    setEnviando(false)
    setErrores({ general: resultado.mensaje })
    sacudir()
    contrasenaRef.current?.select()
  }

  /** Al corregir un campo se retira su aviso. */
  const limpiar = (campo: 'usuario' | 'contrasena') => {
    if (errores[campo] || errores.general) setErrores((previos) => ({ ...previos, [campo]: undefined, general: undefined }))
  }

  return (
    <PageShell variant="login" title="Iniciar sesión">
      <div className="frame">
        {/* las medidas de .login son px del diseño: por eso va dentro del frame, no en él */}
        <div className="login">
          {/* el rótulo del inicio, a escala: un frame más angosto dentro del frame */}
          <div className="login__brand frame">
            <PageHero variant="mapa" title={['PROYECCIONES', 'ELECTORALES']} banner="2027" />
          </div>

          <form ref={tarjetaRef} className="login__card card" onSubmit={enviar} noValidate aria-labelledby="login-titulo">
            <SectionTag width={112} textX={24}>
              ACCESO
            </SectionTag>
            <h2 id="login-titulo" className="login__title f-bold">
              Iniciar sesión
            </h2>
            <p className="login__lead f-h-medium">Entra con tu usuario y contraseña.</p>

            <div className="login__field">
              <label className="login__label f-h-bold" htmlFor="login-usuario">
                Usuario
              </label>
              <input
                ref={usuarioRef}
                id="login-usuario"
                name="usuario"
                className="login__input f-h-medium"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(errores.usuario)}
                aria-describedby={errores.usuario ? 'login-usuario-error' : undefined}
                onInput={() => limpiar('usuario')}
              />
              <p id="login-usuario-error" className="login__error f-h-medium" role="alert">
                {errores.usuario ? (
                  <>
                    <Icon name="warning" />
                    {errores.usuario}
                  </>
                ) : null}
              </p>
            </div>

            <div className="login__field">
              <label className="login__label f-h-bold" htmlFor="login-contrasena">
                Contraseña
              </label>
              <div className="login__control">
                <input
                  ref={contrasenaRef}
                  id="login-contrasena"
                  name="contrasena"
                  className="login__input login__input--con-boton f-h-medium"
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errores.contrasena)}
                  aria-describedby={errores.contrasena ? 'login-contrasena-error' : undefined}
                  onInput={() => limpiar('contrasena')}
                />
                <button
                  type="button"
                  className={`login__ver${visible ? ' is-visible' : ''}`}
                  aria-pressed={visible}
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setVisible((ahora) => !ahora)}
                >
                  <Icon name="eye" />
                </button>
              </div>
              <p id="login-contrasena-error" className="login__error f-h-medium" role="alert">
                {errores.contrasena || errores.general ? (
                  <>
                    <Icon name="warning" />
                    {errores.contrasena ?? errores.general}
                  </>
                ) : null}
              </p>
            </div>

            <button type="submit" className="login__submit f-black" disabled={enviando}>
              {enviando ? 'ENTRANDO…' : 'ENTRAR'}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  )
}
