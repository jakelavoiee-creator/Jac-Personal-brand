import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { injectFontCSS } from './lib/fonts';
import App from './App';

injectFontCSS();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
