import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './utils/serviceWorker'
import { initDB } from './utils/offlineStorage'

// Initialize offline support
async function initOffline() {
  try {
    await initDB();
    await registerServiceWorker();
  } catch (error) {
    console.error('Failed to initialize offline support:', error);
  }
}

// Initialize offline support in production
if (import.meta.env.PROD) {
  initOffline();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
