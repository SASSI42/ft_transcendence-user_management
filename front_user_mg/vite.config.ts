import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 🛠️ FIX: Listen on all IPs (0.0.0.0)
    port: 5173, // Optional: Force a specific port
  }
})