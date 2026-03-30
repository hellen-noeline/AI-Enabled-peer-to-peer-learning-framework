import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Listen on LAN so other devices can open the dev app; set VITE_API_URL to this machine's LAN IP + :5000 for API
    host: true
  },
  // Required when using `vite preview` behind Render (or similar) — Vite blocks unknown Host headers by default
  preview: {
    host: true,
    allowedHosts: ['.onrender.com', 'localhost', '127.0.0.1']
  }
})

