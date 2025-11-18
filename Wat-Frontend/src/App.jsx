import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from './context/UserContext';
import './App.scss';

// Code-splitting: lazy load pages to reduce initial bundle
const Home = React.lazy(() => import('./pages/Home/Home'));
const WeeklyCalendar = React.lazy(() => import('./pages/Calendar/WeeklyCalendar'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const Login = React.lazy(() => import('./pages/Login/Login'));

// Configuration React Query optimisée
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

function App() {
  const [Devtools, setDevtools] = useState(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import('@tanstack/react-query-devtools').then(mod => setDevtools(() => mod.ReactQueryDevtools)).catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <div className="app">
            <Suspense fallback={<div />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/calendar" element={<WeeklyCalendar />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Login />} />
                <Route path="/watchlist" element={<div>Watchlist (à venir)</div>} />
                <Route path="/trending" element={<div>Tendances (à venir)</div>} />
              </Routes>
            </Suspense>
          </div>
        </Router>
        {Devtools ? <Devtools initialIsOpen={false} /> : null}
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;