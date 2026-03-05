import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles/fonts.css';
import './api/axiosSetup';
import './i18n';
import App from './App';

// Unregister any existing service workers to prevent PWA errors
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider
      theme={{
        fontFamily:
          '"Noto Sans Ethiopic", "Noto Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        headings: {
          fontFamily:
            '"Noto Sans Ethiopic", "Noto Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>,
);



