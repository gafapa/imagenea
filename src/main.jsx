import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1a2236',
          color: '#e2e8f0',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>
)
