import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ComingSoon from './components/ComingSoon.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ComingSoon />
  </StrictMode>,
);
