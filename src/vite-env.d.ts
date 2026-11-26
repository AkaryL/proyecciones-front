/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base de la API de Proyecciones (repositorio proyecciones-backend),
   * con prefijo y sin diagonal al final.
   * Ejemplo: http://localhost:3400/api/proyecciones
   */
  readonly VITE_API_URL?: string
  /**
   * De dónde leen Territorio, Comparativo y Fuentes los JSON del motor
   * (sim_v8.json, proyecciones.json…). Sin ella, de la copia que va con el
   * front (public/data/motor). Se pone cuando el back ya los sirve.
   * Ejemplo: http://localhost:3400/api/proyecciones/motor
   */
  readonly VITE_MOTOR_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
