import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import App from './App';
import { HashRouter } from 'react-router-dom';
import { cleanup } from './services/qaSessionStorage';

// Run cleanup on app start (remove sessions older than 7 days)
cleanup().catch((err) => console.error('Failed to run cleanup:', err));

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
