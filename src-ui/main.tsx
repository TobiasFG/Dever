import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NotificationsProvider } from '@/features/notifications/store';
import { AskProvider } from '@/features/claude/AskProvider';
import { UpdatesProvider } from '@/features/updates/UpdatesProvider';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationsProvider>
      <UpdatesProvider>
        <AskProvider>
          <App />
        </AskProvider>
      </UpdatesProvider>
    </NotificationsProvider>
  </StrictMode>,
);
