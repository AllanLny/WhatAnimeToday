import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home/Home';
import WeeklyCalendar from './pages/Calendar/WeeklyCalendar';
import Settings from './pages/Settings/Settings';
import './App.scss';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app-container">
          <header className="app-header">
            <h1>What Anime Today ?</h1>
            <nav>
              <ul className="nav-list">
                <li><Link to="/">Aujourd'hui</Link></li>
                <li><Link to="/calendar">Calendrier</Link></li>
                <li><Link to="/settings">Paramètres</Link></li>
              </ul>
            </nav>
          </header>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<WeeklyCalendar />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>© 2024 What Anime Today | Toutes les données proviennent de TMDB API</p>
          </footer>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;