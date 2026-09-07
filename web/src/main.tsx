import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { ProgressProvider } from '@/game/progress';
import { PrefsProvider } from '@/game/prefs';
import App from '@/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PrefsProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </PrefsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
