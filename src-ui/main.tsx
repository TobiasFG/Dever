import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NotificationsProvider } from '@/features/notifications/store';
import { AskProvider } from '@/features/claude/AskProvider';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationsProvider>
      <AskProvider>
        <App />
      </AskProvider>
    </NotificationsProvider>
  </StrictMode>,
);
