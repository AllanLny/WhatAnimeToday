import { useState, useEffect } from 'react';
import { getTodayReleases, getStreamingInfo } from '../../services/api';
import { useUserContext } from '../../context/UserContext';
import '../Home/Home.scss'; 

function Home() {
  const [todayReleases, setTodayReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { country } = useUserContext();

  useEffect(() => {
    const fetchTodayReleases = async () => {
      try {
        setLoading(true);
        const releases = await getTodayReleases();
        
        // Pour chaque anime, on récupère ses plateformes de diffusion
        const releasesWithStreaming = await Promise.all(
          releases.map(async (anime) => {
            const streamingInfo = await getStreamingInfo(anime.mal_id);
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

  return (
    <div className="home-container">
      <h1>Sorties Anime/Manga du jour</h1>
      <h2>{formattedDate}</h2>
      <p>Pays sélectionné: {country}</p>
      
      {todayReleases.length === 0 ? (
        <p>Aucune sortie aujourd'hui</p>
      ) : (
        <div className="anime-grid">
          {todayReleases.map((anime) => (
            <div key={anime.mal_id} className="anime-card">
              <img src={anime.images.jpg.image_url} alt={anime.title} />
              <h3>{anime.title}</h3>
              <p>{anime.synopsis.substring(0, 100)}...</p>
              <div className="streaming-platforms">
                <h4>Disponible sur:</h4>
                <ul>
                  {Object.entries(anime.streamingInfo).map(([platform, available]) => (
                    available && <li key={platform}>{platform}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;