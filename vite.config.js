import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    host: true,

    // Allow all hosts for flexibility (Vercel, Render, etc.)
    // allowedHosts: ['.trycloudflare.com']
  }
})
