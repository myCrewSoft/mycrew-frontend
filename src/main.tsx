import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './store/AuthContext'
import App from './App'
import './index.css'
import { ToastProvider } from './components/common/toast/ToastProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>,
)
