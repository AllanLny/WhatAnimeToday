import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { UserProvider } from './context/UserContext';

// Import du nouveau design 2025
import Home from './pages/Home/Home';
import WeeklyCalendar from './pages/Calendar/WeeklyCalendar';
import Settings from './pages/Settings/Settings';

import './App.scss';

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
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<WeeklyCalendar />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/watchlist" element={<div>Watchlist (à venir)</div>} />
              <Route path="/trending" element={<div>Tendances (à venir)</div>} />
            </Routes>
          </div>
        </Router>
        
        {/* React Query DevTools (dev only) */}
        <ReactQueryDevtools initialIsOpen={false} />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;