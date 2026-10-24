import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

const WAKING_UP = [502, 503, 504];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry up to 6 times (about 1 minute) while the free Render server wakes up; otherwise once.
      retry: (count, err) => (WAKING_UP.includes(err?.response?.status) ? count < 6 : count < 1),
      retryDelay: (count, err) => (WAKING_UP.includes(err?.response?.status) ? 10000 : 1000),
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);