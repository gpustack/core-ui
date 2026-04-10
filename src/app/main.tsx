import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.less';
import Playground from './Playground.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>
);
