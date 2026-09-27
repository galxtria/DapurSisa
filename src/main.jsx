import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Daftarkan SW hanya di production build. Di dev (npm run dev) SW dimatikan
// agar tidak menyajikan cache lama seperti yang terjadi di localhost:5174.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Bersihkan SW sisa dari build sebelumnya saat dev agar UI selalu baru.
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {})
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
  }
}
