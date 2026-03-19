import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use root path for Netlify, /RoofApp/ for GitHub Pages
  base: process.env.NETLIFY ? '/' : '/RoofApp/',
})