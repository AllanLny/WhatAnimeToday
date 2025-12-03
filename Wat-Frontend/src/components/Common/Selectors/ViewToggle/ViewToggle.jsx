import React from 'react';
import { useWATTranslation } from '../../../../hooks/useWATTranslation';
import './ViewToggle.scss';

/**
 * Composant toggle pour changer entre vue grille et vue liste
 */
const ViewToggle = ({ 
  viewMode = 'grid', 
  onViewModeChange = () => {},
  className = ''
}) => {
  const { t } = useWATTranslation();

  const handleViewModeChange = (mode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  return (
    <div className={`view-toggle ${viewMode === 'list' ? 'list-active' : 'grid-active'} ${className}`}>
      <button 
        className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('grid')}
        title={t('ui.gridView', 'Vue grille')}
        aria-label={t('ui.gridView', 'Vue grille')}
        data-view="grid"
      >
        <svg className="icon icon-grid" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="4" cy="4" r="2" fill="currentColor" />
          <circle cx="12" cy="4" r="2" fill="currentColor" />
          <circle cx="4" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>
      <button 
        className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('list')}
        title={t('ui.listView', 'Vue liste')}
        aria-label={t('ui.listView', 'Vue liste')}
        data-view="list"
      >
        <svg className="icon icon-list" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
};

export default ViewToggle;