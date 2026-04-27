import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import './styles/global.css';

const rootEl = document.getElementById('root');
if (rootEl == null) {
  throw new Error('Elemento #root ausente');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
