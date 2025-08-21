import { useState, useEffect } from 'react';
import { getTodayReleases, getStreamingInfo } from '../../services/api';
import { useUserContext } from '../../context/UserContext';
import PlatformLogo from '../../components/Common/PlatformLogo/PlatformLogo';
import './Home.scss'; 

function Home() {
  const [todayReleases, setTodayReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { country } = useUserContext();
  const [selectedPlatform, setSelectedPlatform] = useState('all'); // 'all' ou nom de la plateforme

  useEffect(() => {
    const fetchTodayReleases = async () => {
      try {
        setLoading(true);
        const releases = await getTodayReleases();
        
        // Pour chaque anime, on récupère ses plateformes de diffusion avec le pays sélectionné
        const releasesWithStreaming = await Promise.all(
          releases.map(async (anime) => {
            const streamingInfo = await getStreamingInfo(anime.mal_id, country);
            return { ...anime, streamingInfo };
          })
        );
        
        setTodayReleases(releasesWithStreaming);
        setError(null);
      } catch (err) {
        setError("Erreur lors de la récupération des données. Veuillez réessayer plus tard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayReleases();
  }, [country]); // Refetch when country changes

  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('fr-FR', options);

  // Filtrer les animes selon la plateforme sélectionnée
  const filteredReleases = selectedPlatform === 'all'
    ? todayReleases
    : todayReleases.filter(anime => anime.streamingInfo[selectedPlatform]?.available);

  // Fonction pour gérer le clic sur un anime
  const handleAnimeClick = (anime, platform) => {
    console.log("Tentative d'ouverture:", platform, anime.streamingInfo[platform]);
    if (anime.streamingInfo[platform]?.url) {
      window.open(anime.streamingInfo[platform].url, '_blank', 'noopener,noreferrer');
    }
  };

  // Fonction pour gérer le clic sur une plateforme
  const handlePlatformClick = (platform) => {
    setSelectedPlatform(platform);
  };

  return (
    <div className="home-container">
      <h1>Sorties Anime/Manga du jour</h1>
      <h2>{formattedDate}</h2>
      <p className="country-indicator">Pays sélectionné: <span>{country}</span></p>
      
      <div className="platform-filter">
        <span>Filtrer par plateforme:</span>
        <div className="filter-buttons">
          <button 
            className={selectedPlatform === 'all' ? 'active' : ''} 
            onClick={() => handlePlatformClick('all')}
          >
            Toutes
          </button>
          
          <button 
            className={selectedPlatform === 'netflix' ? 'active' : ''} 
            onClick={() => handlePlatformClick('netflix')}
          >
            <PlatformLogo platform="netflix" size="small" /> Netflix
          </button>
          
          <button 
            className={selectedPlatform === 'crunchyroll' ? 'active' : ''} 
            onClick={() => handlePlatformClick('crunchyroll')}
          >
            <PlatformLogo platform="crunchyroll" size="small" /> Crunchyroll
          </button>
          
          <button 
            className={selectedPlatform === 'adn' ? 'active' : ''} 
            onClick={() => handlePlatformClick('adn')}
          >
            <PlatformLogo platform="adn" size="small" /> ADN
          </button>
          
          <button 
            className={selectedPlatform === 'prime video' ? 'active' : ''} 
            onClick={() => handlePlatformClick('prime video')}
          >
            <PlatformLogo platform="prime video" size="small" /> Prime Video
          </button>
        </div>
      </div>
      
      {filteredReleases.length === 0 ? (
        <p className="no-results">Aucune sortie pour ce filtre aujourd'hui</p>
      ) : (
        <div className="anime-grid">
          {filteredReleases.map((anime) => (
            <div key={anime.mal_id} className="anime-card">
              <div className="anime-image-container">
                <img src={anime.images.jpg.image_url} alt={anime.title} />
                <div className="anime-platforms">
                  {Object.entries(anime.streamingInfo)
                    .filter(([_, info]) => info.available)
                    .map(([platform]) => (
                      <div 
                        key={platform} 
                        className="platform-logo-wrapper"
                        onClick={() => handleAnimeClick(anime, platform)}
                      >
                        <PlatformLogo platform={platform} />
                      </div>
                    ))
                  }
                </div>
              </div>
              <h3>{anime.title}</h3>
              <p className="anime-synopsis">
                {anime.synopsis ? anime.synopsis.substring(0, 100) + '...' : 'Pas de description disponible'}
              </p>
              <div className="watch-button-container">
                {Object.entries(anime.streamingInfo)
                  .filter(([_, info]) => info.available)
                  .slice(0, 1)
                  .map(([platform, info]) => (
                    <button 
                      key={platform} 
                      className="watch-button"
                      onClick={() => handleAnimeClick(anime, platform)}
                    >
                      <span className="watch-icon">▶</span>
                      Regarder sur {platform}
                    </button>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;