import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './ui/App.js';
import './ui/styles.css';

const container = document.querySelector('#root');
if (!container) throw new Error('#root 컨테이너를 찾을 수 없습니다.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
