// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
// Static output with Cloudflare adapter for on-demand SIWE auth routes
// In Astro v5, 'static' supports hybrid rendering via `export const prerender = false`
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [react()]
});