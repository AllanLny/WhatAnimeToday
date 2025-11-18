import React, { useState, useEffect } from 'react';
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

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Logo */}
        <a href="/" className="logo">
          <img src="/wat-logo-without-text.svg" alt="WAT" className="logo-icon" />
        </a>

        {/* Desktop Navigation */}
        <nav className="nav">
          <ul className="nav-links">
            <li className="nav-link">
              <a href="/" className="active">{t('nav.home')}</a>
            </li>
            <li className="nav-link">
              <a href="/calendar">{t('nav.calendar')}</a>
            </li>
            <li className="nav-link">
              <a href="/watchlist">Ma Liste</a>
            </li>
            <li className="nav-link">
              <a href="/trending">Tendances</a>
            </li>
          </ul>

          {/* Search Bar */}
          <div className="search-bar">
            <input 
              type="text" 
              className="search-input" 
              placeholder={t('search.placeholder', 'Rechercher un anime...')}
            />
          </div>

          {/* Language Selector */}
          <LanguageSelector showText={false} className="header-language" />

          {/* User Profile */}
          <div className="user-profile">
            {/* Round avatar / guest or logged */}
            <div className={`profile-round ${profileOpen ? 'open' : ''}`} onClick={() => setProfileOpen(p => !p)} role="button" tabIndex={0}>
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
            {profileOpen && (
              <div className="profile-dropdown">
                {user ? (
                  <div className="profile-dropdown-logged">
                    <div className="pd-user">
                      {user.avatar ? (
                        <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="avatar" className="pd-avatar" />
                      ) : null}
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
                      <div className="pd-guest-text">Se connecter pour sauvegarder ta liste et preferences</div>
                      <a className="btn btn-primary" href="/login">Se connecter avec Discord</a>
                    </div>
                )}
              </div>
            )}
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
            <a href="/" className="active">{t('nav.home')}</a>
          </li>
          <li className="nav-link">
            <a href="/calendar">{t('nav.calendar')}</a>
          </li>
          <li className="nav-link">
            <a href="/watchlist">{t('nav.watchlist', 'Ma Liste')}</a>
          </li>
          <li className="nav-link">
            <a href="/trending">{t('nav.trending', 'Tendances')}</a>
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