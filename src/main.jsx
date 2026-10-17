import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// NUEVO: Importamos el Service Worker de la PWA
import { registerSW } from 'virtual:pwa-register'

// NUEVO: Le decimos al navegador que registre la app y busque actualizaciones
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)