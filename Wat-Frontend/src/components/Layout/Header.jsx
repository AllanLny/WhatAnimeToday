import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LanguageSelector } from '../Common';
import { useWATTranslation } from '../../hooks/useWATTranslation';
import './Header.scss';

const Header = () => {
  const { t } = useWATTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  // Determine the top-level page name from the path: '/' -> 'home', '/calendar' -> 'calendar', etc.
  const pathSegment = location.pathname.split('/').filter(Boolean)[0] || 'home';
  const page = pathSegment;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      setIsScrolled(scrollTop > 50);
      setScrollProgress(Math.min(scrollPercent, 100));
      
  // (no debug logs)
    };

    window.addEventListener('scroll', handleScroll);
    
    // Appeler une fois au début pour initialiser
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check backend session for logged user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(json => {
        if (json && Object.keys(json).length > 0) setUser(json);
      })
      .catch(() => {});
  }, []);

  // If redirected after login (frontend receives ?justLogged=1), open dropdown once and clean URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('justLogged') === '1') {
      setProfileOpen(true);
      params.delete('justLogged');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Ref for dropdown to handle outside clicks
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or ESC
  useEffect(() => {
    const handleOutside = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target) && !e.target.closest('.profile-round')) {
        setProfileOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('click', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [dropdownRef]);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''} header--${page}`}>
      <div className="container">
        {/* Logo */}
        <a href="/" className="logo">
          <img src="/wat-logo-without-text.svg" alt="WAT" className="logo-icon" />
        </a>

        {/* Desktop Navigation */}
        <nav className="nav">
          <ul className="nav-links">
            <li className="nav-link">
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.home')}</NavLink>
            </li>
            <li className="nav-link">
              <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.calendar')}</NavLink>
            </li>
            <li className="nav-link">
              <NavLink to="/watchlist" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.watchlist', 'Ma Liste')}</NavLink>
            </li>
            <li className="nav-link">
              <NavLink to="/trending" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.trending', 'Tendances')}</NavLink>
            </li>
          </ul>

          {/* Search Bar */}
          {/* Hide search on certain pages (calendar, login) to reduce clutter
          {page !== 'calendar' && page !== 'login' && (
            <div className="search-bar">
              <input 
                type="text" 
                className="search-input" 
                placeholder={t('search.placeholder', 'Rechercher un anime...')}
                aria-label={t('search.placeholder', 'Rechercher un anime...')}
              />
            </div>
          )} */}

          {/* Language Selector */}
          <LanguageSelector showText={false} className="header-language" />

          {/* User Profile */}
          <div className="user-profile">
            {/* Round avatar / guest or logged */}
            <div className={`profile-round ${profileOpen ? 'open' : ''} ${page === 'calendar' ? 'compact' : ''}`} onClick={() => setProfileOpen(p => !p)} role="button" tabIndex={0}>
              {user ? (
                user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                    alt={user.username}
                    className="profile-avatar-img round"
                  />
                ) : (
                  <div className="profile-avatar round">{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</div>
                )
              ) : (
                // Guest round: simple circle with user icon
                <div className="profile-avatar round">👤</div>
              )}
            </div>

            {/* Dropdown under the round avatar */}
              <div
                className={`profile-dropdown ${profileOpen ? 'open' : 'closed'}`}
                ref={el => (dropdownRef.current = el)}
                aria-hidden={!profileOpen}
              >
                  {user ? (
                  <div className="profile-dropdown-logged">
                    <div className="pd-user">
                      <div className="pd-meta">
                        <div className="pd-username">{user.username}{user.discriminator ? `#${user.discriminator}` : ''}</div>
                      </div>
                    </div>
                    <div className="pd-actions">
                      <a href="/settings" className="btn btn-secondary">Settings</a>
                      <button className="btn btn-danger" onClick={() => {
                        fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                          setUser(null);
                          setProfileOpen(false);
                          window.location.reload();
                        });
                      }}>Déconnecter</button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-dropdown-guest">
                    <button
                      className="btn btn-discord discord-login-btn"
                      onClick={() => {
                        // Start OAuth flow on backend which will redirect to Discord
                        const redirect = window.location.origin + window.location.pathname;
                        window.location.href = '/api/auth/discord?redirect=' + encodeURIComponent(redirect);
                      }}
                      aria-label={t('auth.login_with_discord', { defaultValue: 'Se connecter avec Discord' })}
                    >
                      {/* Discord icon + translatable text */}
                      <span className="discord-text">{t('auth.login_with_discord', { defaultValue: 'Se connecter avec Discord' })}</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Navigation */}
          <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          <li className="nav-link">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.home')}</NavLink>
          </li>
          <li className="nav-link">
            <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.calendar')}</NavLink>
          </li>
          <li className="nav-link">
            <NavLink to="/watchlist" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.watchlist', 'Ma Liste')}</NavLink>
          </li>
          <li className="nav-link">
            <NavLink to="/trending" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.trending', 'Tendances')}</NavLink>
          </li>
        </ul>
        
        <div className="mobile-search">
          <input 
            type="text" 
            className="search-input" 
            placeholder={t('search.placeholder', 'Rechercher un anime...')}
          />
        </div>
        
        {/* Language Selector for Mobile */}
        <div className="mobile-language">
          <LanguageSelector compact={true} />
        </div>
      </nav>

      {/* Scroll Progress Bar */}
      <div 
        className="header-scroll-progress" 
        style={{ width: `${scrollProgress}%` }}
      />
    </header>
  );
};

export default Header;