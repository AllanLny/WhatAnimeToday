import { useState, useEffect } from 'react';
import { useUserContext } from '../../context/UserContext';
import '../Calendar/WeeklyCalendar.scss';

function WeeklyCalendar() {
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { country } = useUserContext();
  
  useEffect(() => {
    const fetchWeeklySchedule = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données pour chaque jour de la semaine
        const response = await fetch('https://api.jikan.moe/v4/schedules');
        const data = await response.json();
        
        setWeeklySchedule(data.data);
        setError(null);
      } catch (err) {
        setError("Erreur lors de la récupération du calendrier. Veuillez réessayer plus tard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklySchedule();
  }, [country]);

  if (loading) return <div className="loading-spinner">Chargement du calendrier...</div>;
  if (error) return <div className="error-message">{error}</div>;

  // Jours de la semaine en français
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  // Jour actuel pour le mettre en évidence
  const currentDay = new Date().getDay();

  return (
    <div className="weekly-calendar">
      <h1>Calendrier des sorties de la semaine</h1>
      <p>Pays sélectionné: {country}</p>
      
      <div className="calendar-grid">
        {days.map((day, index) => (
          <div 
            key={day} 
            className={`day-column ${index === currentDay ? 'current-day' : ''}`}
          >
            <h2>{day}</h2>
            <div className="anime-list">
              {weeklySchedule[day.toLowerCase()]?.map(anime => (
                <div key={anime.mal_id} className="calendar-anime-card">
                  <img 
                    src={anime.images.jpg.image_url} 
                    alt={anime.title} 
                    className="calendar-anime-image" 
                  />
                  <div className="calendar-anime-info">
                    <h3>{anime.title}</h3>
                    <p>Épisode: {anime.broadcast.string}</p>
                  </div>
                </div>
              )) || <p>Aucune sortie</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeeklyCalendar;