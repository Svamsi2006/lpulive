import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: '${import.meta.env.PROD ? '' : 'http://localhost:5000'}',
        changeOrigin: true,
      },
      '/socket.io': {
        target: '${import.meta.env.PROD ? '' : 'http://localhost:5000'}',
        ws: true,
      },
    },
  },
})
