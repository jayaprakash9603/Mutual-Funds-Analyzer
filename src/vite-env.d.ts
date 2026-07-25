/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Injected by vite.config.ts for `--mode demo`; see src/demo/demoMode.ts. */
  readonly VITE_DEMO_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
