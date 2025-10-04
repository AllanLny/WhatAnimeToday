/**
 * 🚨 Composant ErrorMessage - Affichage d'erreurs standardisé
 * Utilisé pour tous les messages d'erreur dans l'app
 */
import './ErrorMessage.scss';
import { useWATTranslation } from '../../hooks/useWATTranslation';

const ErrorMessage = ({ 
  message = "Une erreur s'est produite", 
  type = "error",
  className = "",
  onRetry = null 
}) => {
  const { t } = useWATTranslation();
  
  const typeClass = {
    error: 'error-type-error',
    warning: 'error-type-warning',
    info: 'error-type-info'
  }[type];

  return (
    <div className={`error-container ${typeClass} ${className}`}>
      <div className="error-content">
        <span className="error-icon">
          {type === 'error' && '❌'}
          {type === 'warning' && '⚠️'} 
          {type === 'info' && 'ℹ️'}
        </span>
        <p className="error-text">{message}</p>
      </div>
      
      {onRetry && (
        <button 
          className="error-retry-btn"
          onClick={onRetry}
          type="button"
        >
          {t('home.retry', 'Réessayer')}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;