import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress browser default page title / site name header on printed pages
let originalDocTitle = document.title;
window.addEventListener('beforeprint', () => {
  originalDocTitle = document.title;
  document.title = '';
});
window.addEventListener('afterprint', () => {
  document.title = originalDocTitle;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
