/**
 * 🌀 Composant Loading - Spinner de chargement standardisé
 * Utilisé dans toute l'app pour les états de chargement
 */
import './Loading.scss';

const Loading = ({ 
  message = "Chargement en cours...", 
  size = "medium",
  className = "" 
}) => {
  const sizeClass = {
    small: 'loading-small',
    medium: 'loading-medium', 
    large: 'loading-large'
  }[size];

  return (
    <div className={`loading-container ${sizeClass} ${className}`}>
      <div className="spinner"></div>
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
};

export default Loading;