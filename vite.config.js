import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this as a project site under /scrolly-absence/
  base: command === 'build' ? '/scrolly-absence/' : '/',
  plugins: [svelte()],
}))
