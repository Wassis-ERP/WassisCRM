import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { PropostasProvider } from './contexts/PropostasContext'
import { queryClient } from './lib/queryClient'
import { ConfirmProvider } from './components/feedback/ConfirmProvider'
import { validateEnvironment } from './lib/environmentPolicy'
import { usesBackendData } from './lib/dataMode'

validateEnvironment({
  VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE,
  VITE_DATA_MODE: import.meta.env.VITE_DATA_MODE,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
}, import.meta.env.PROD)

const application = <ConfirmProvider><App /></ConfirmProvider>

// O provider demonstrativo só existe no desenvolvimento explícito em memória.
// A aplicação conectada usa os hooks HTTP e não inicializa dados locais de negócio.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {usesBackendData ? application : <PropostasProvider>{application}</PropostasProvider>}
        </AuthProvider>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
    </QueryClientProvider>
  </StrictMode>,
)
