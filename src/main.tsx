import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import App from './App';
import './index.css';

/**
 * 앱 마운트 순서:
 * BrowserRouter  → React Router 라우팅 컨텍스트 제공
 * AuthProvider   → 인증 상태 컨텍스트 제공 (Router 안에 위치해야 useNavigate 사용 가능)
 * App            → 실제 앱 컴포넌트
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
