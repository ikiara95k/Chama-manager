import React from 'react';
import { createRoot } from 'react-dom/client';
import ChamaManager from './ChamaManager.jsx';
import './styles.css';
import { hydrateLocalState, installCloudSync } from './cloudStorage.js';

async function startApp() {
  await hydrateLocalState();
  installCloudSync();

  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ChamaManager />
    </React.StrictMode>
  );
}

startApp();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
