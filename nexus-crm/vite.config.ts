import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { validateEnvironment } from './src/lib/environmentPolicy'

// Configuração do Vite para o Nexus CRM
export default defineConfig(({ command, mode }) => {
  validateEnvironment(loadEnv(mode, process.cwd(), 'VITE_'), command === 'build')
  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  }
})
