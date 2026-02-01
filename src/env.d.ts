/// <reference path="../.astro/types.d.ts" />

// Cloudflare Workers environment bindings
interface Env {
  NONCE_KV?: KVNamespace
  JWT_SECRET?: string
}

// Extend Astro's App.Locals to include Cloudflare runtime
type Runtime = import('@astrojs/cloudflare').Runtime<Env>

declare namespace App {
  interface Locals extends Runtime {}
}
