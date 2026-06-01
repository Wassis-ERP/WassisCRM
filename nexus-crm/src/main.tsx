import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { PropostasProvider } from './contexts/PropostasContext'
import { queryClient } from './lib/queryClient'

// Modo "frontend puro": estado em memória, sem backend.
// O AuthProvider entrega um usuário admin fixo; dados de domínio vivem em
// lib/inMemoryDb.ts e zeram a cada reload da página.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <PropostasProvider>
              <App />
            </PropostasProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
    </QueryClientProvider>
  </StrictMode>,
)
