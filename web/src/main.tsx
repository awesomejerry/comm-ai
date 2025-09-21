import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import PresenterPage from './pages/PresenterPage.full';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PresenterPage />
  </React.StrictMode>
);
