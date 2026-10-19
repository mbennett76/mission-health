import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth.jsx';
import { StoreProvider } from './store.jsx';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AuthProvider>
  </React.StrictMode>,
);
