import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Listen on LAN so other devices can open the dev app; set VITE_API_URL to this machine's LAN IP + :5000 for API
    host: true
  }
})

