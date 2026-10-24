import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './ui/App.js';
// Layout and colour first, then the motion that reads its tokens.
import './ui/styles.css';
import './ui/motion.css';

const container = document.querySelector('#root');
if (!container) throw new Error('#root 컨테이너를 찾을 수 없습니다.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
