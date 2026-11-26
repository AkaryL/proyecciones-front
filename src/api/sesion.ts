/**
 * Sesión de la persona.
 *
 * El sitio todavía es solo front y no tiene backend: estas dos funciones son
 * el punto donde se conectará. Hoy no validan nada ni guardan nada, así que la
 * pantalla de inicio de sesión no protege el contenido; solo deja armado el
 * recorrido (salir → pantalla de entrada → entrar).
 */

export type Credenciales = { usuario: string; contrasena: string }

export type ResultadoSesion = { ok: true } | { ok: false; mensaje: string }

/**
 * Inicia sesión. Sin backend aún: da por buena cualquier combinación.
 * Con backend: se mandan las credenciales, se guarda la sesión que devuelva y,
 * si las rechaza, se responde `{ ok: false, mensaje }` (la pantalla ya lo muestra).
 */
export async function iniciarSesion(credenciales: Credenciales): Promise<ResultadoSesion> {
  void credenciales
  return { ok: true }
}

/**
 * Cierra la sesión. Sin backend aún: no hay nada que cerrar.
 * Con backend: se invalida la sesión en el servidor y se borra lo guardado en el navegador.
 */
export async function cerrarSesion(): Promise<void> {}
