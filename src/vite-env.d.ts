/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base de la API de Proyecciones (repositorio proyecciones-backend),
   * con prefijo y sin diagonal al final.
   * Ejemplo: http://localhost:3400/api/proyecciones
   */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
