import React, { useState, useEffect } from 'react';
import { LanguageSelector } from '../Common';
import { useWATTranslation } from '../../hooks/useWATTranslation';
import './Header.scss';

const Header = () => {
  const { t } = useWATTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      setIsScrolled(scrollTop > 50);
      setScrollProgress(Math.min(scrollPercent, 100));
      
      // Debug pour voir les valeurs
      console.log(`Scroll: ${scrollTop}, DocHeight: ${docHeight}, Percent: ${scrollPercent}`);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Appeler une fois au début pour initialiser
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
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
            <div className="profile-avatar">A</div>
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