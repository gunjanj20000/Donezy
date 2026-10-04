import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline functionality
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of Donezy is available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Donezy is ready to work completely offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
