import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages alatt az oldal a /CleanMark/ útvonalon fut
  base: '/CleanMark/',
  plugins: [react()],
})
