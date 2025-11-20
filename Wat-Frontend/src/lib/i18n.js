/**
 * 🌍 Configuration i18n pour WAT
 * Gestion multi-langue avec react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 📚 Ressources de traduction
const resources = {
  fr: {
    translation: {
      // 🏠 Navigation
      nav: {
        home: "Accueil",
        calendar: "Calendrier", 
        settings: "Paramètres",
        about: "À propos",
        watchlist: "Ma Liste",
        trending: "Tendances"
      },

      // 🔍 Recherche
      search: {
        placeholder: "Rechercher un anime...",
        noResults: "Aucun résultat trouvé",
        searching: "Recherche en cours..."
      },
      
      // 🎯 Page d'accueil
      home: {
        title: "Que regarder aujourd'hui ?",
        subtitle: "Découvrez les derniers épisodes d'animes sortis aujourd'hui",
        todayReleases: "Sorties du jour",
        noReleases: "Aucun anime aujourd'hui",
        noReleasesDesc: "Il semble qu'aucun nouvel épisode ne sorte aujourd'hui pour {{country}}. Essayez de changer de région ou revenez demain !",
        loading: "Chargement des animes du jour...",
        error: "Impossible de charger les animes du jour",
        errorDesc: "Vérifiez votre connexion internet et réessayez.",
        retry: "Réessayer",
        stats: {
          todayReleases: "Sorties aujourd'hui",
          totalAnimes: "Animes total",
          activeWeek: "Actifs cette semaine",
          totalEpisodes: "Épisodes ce mois"
        }
      },

      // 📅 Calendrier
      calendar: {
        title: "Calendrier des sorties",
        week: "Semaine",
        today: "Aujourd'hui",
        tomorrow: "Demain",
        yesterday: "Hier",
        days: {
          monday: "Lundi",
          tuesday: "Mardi", 
          wednesday: "Mercredi",
          thursday: "Jeudi",
          friday: "Vendredi",
          saturday: "Samedi",
          sunday: "Dimanche"
        },
        months: {
          january: "Janvier",
          february: "Février",
          march: "Mars",
          april: "Avril",
          may: "Mai",
          june: "Juin",
          july: "Juillet",
          august: "Août",
          september: "Septembre",
          october: "Octobre",
          november: "Novembre",
          december: "Décembre"
        }
      },

      // ⚙️ Paramètres
      settings: {
        title: "Paramètres",
        subtitle: "Personnalisez votre expérience WAT",
        language: "Langue",
        languageDesc: "Choisissez votre langue préférée pour l'interface",
        currentLanguage: "Langue actuelle",
        region: "Région",
        regionDesc: "Sélectionnez votre région pour obtenir les sorties locales",
        currentRegion: "Région actuelle",
        selectCountry: "Sélectionnez votre pays",
        countryInfo: "Le choix du pays permet d'afficher les sorties d'anime spécifiques à votre région.",
        countryUpdated: "Pays mis à jour avec succès!",
        theme: "Thème",
        notifications: "Notifications",
        about: "À propos de WAT",
        version: "Version",
        developer: "Développeur",
        support: "Support"
      },

      // 🎴 Anime Cards
      anime: {
        episode: "Épisode {{number}}",
        episodes: "{{count}} épisodes", 
        episodesTBA: "Episodes TBA",
        noTitle: "Titre non disponible",
        genres: "Genres",
        rating: "Note",
        year: "Année",
        studio: "Studio",
        watchOn: "Regarder sur",
        streamingOn: "Diffusé sur",
        addToList: "Ajouter à ma liste",
        moreInfo: "Plus d'infos",
        synopsis: "Synopsis",
        watch: "Regarder",
        available: "Disponible",
        markAsWatched: "Marquer comme vu",
        share: "Partager",
        status: {
          airing: "En cours",
          completed: "Terminé",
          upcoming: "À venir",
          unknown: "Inconnu"
        }
      },

      // 🚨 Messages d'erreur génériques
      errors: {
        generic: "Une erreur s'est produite",
        network: "Erreur de connexion réseau",
        notFound: "Contenu introuvable",
        serverError: "Erreur serveur",
        timeout: "Délai d'attente dépassé"
      },

      // 🔄 États de chargement
      loading: {
        default: "Chargement...",
        animes: "Chargement des animes...",
        details: "Chargement des détails..."
      },

      // 🌍 Pays/Régions
      countries: {
        FR: "France",
        US: "États-Unis", 
        JP: "Japon",
        UK: "Royaume-Uni",
        DE: "Allemagne",
        ES: "Espagne",
        IT: "Italie"
      },

      // 🎛️ Interface utilisateur
      ui: {
        changeToLanguage: "Changer vers {{language}}",
        loading: "Chargement...",
        error: "Erreur",
        success: "Succès",
        cancel: "Annuler",
        confirm: "Confirmer",
        close: "Fermer",
        back: "Retour",
        next: "Suivant",
        previous: "Précédent",
        save: "Sauvegarder",
        edit: "Modifier",
        delete: "Supprimer",
        add: "Ajouter",
        remove: "Retirer",
        refresh: "Actualiser",
        gridView: "Vue grille",
        listView: "Vue liste"
      }
      ,
      // 🛂 Auth / OAuth
      auth: {
        title: "Se connecter",
        description: "Connecte-toi avec Discord pour sauvegarder ta watchlist et tes préférences sans créer de compte supplémentaire.",
        login_with_discord: "Se connecter avec Discord"
      }
    }
  },
  
  en: {
    translation: {
      // 🏠 Navigation
      nav: {
        home: "Home",
        calendar: "Calendar",
        settings: "Settings", 
        about: "About",
        watchlist: "My List",
        trending: "Trending"
      },

      // 🔍 Search
      search: {
        placeholder: "Search anime...",
        noResults: "No results found",
        searching: "Searching..."
      },
      
      // 🎯 Home page
      home: {
        title: "What to watch today?",
        subtitle: "Discover the latest anime episodes released today",
        todayReleases: "Today's Releases",
        noReleases: "No anime today",
        noReleasesDesc: "It seems no new episodes are releasing today for {{country}}. Try changing region or come back tomorrow!",
        loading: "Loading today's animes...",
        error: "Unable to load today's animes",
        errorDesc: "Check your internet connection and try again.",
        retry: "Retry",
        stats: {
          todayReleases: "Today's releases",
          totalAnimes: "Total animes",
          activeWeek: "Active this week",
          totalEpisodes: "Episodes this month"
        }
      },

      // 📅 Calendar
      calendar: {
        title: "Release Calendar",
        week: "Week",
        today: "Today",
        tomorrow: "Tomorrow", 
        yesterday: "Yesterday",
        days: {
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday", 
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday",
          sunday: "Sunday"
        },
        months: {
          january: "January",
          february: "February",
          march: "March",
          april: "April", 
          may: "May",
          june: "June",
          july: "July",
          august: "August",
          september: "September",
          october: "October",
          november: "November",
          december: "December"
        }
      },

      // ⚙️ Settings
      settings: {
        title: "Settings",
        subtitle: "Customize your WAT experience",
        language: "Language",
        languageDesc: "Choose your preferred language for the interface",
        currentLanguage: "Current language",
        region: "Region",
        regionDesc: "Select your region to get local releases",
        currentRegion: "Current region",
        selectCountry: "Select your country",
        countryInfo: "Choosing your country helps display anime releases specific to your region.",
        countryUpdated: "Country updated successfully!",
        theme: "Theme",
        notifications: "Notifications",
        about: "About WAT",
        version: "Version",
        developer: "Developer", 
        support: "Support"
      },

      // 🎴 Anime Cards
      anime: {
        episode: "Episode {{number}}",
        episodes: "{{count}} episodes",
        episodesTBA: "Episodes TBA",
        noTitle: "Title not available",
        genres: "Genres", 
        rating: "Rating",
        year: "Year",
        studio: "Studio",
        watchOn: "Watch on",
        streamingOn: "Streaming on",
        addToList: "Add to my list",
        moreInfo: "More info",
        synopsis: "Synopsis",
        watch: "Watch",
        available: "Available",
        markAsWatched: "Mark as watched",
        share: "Share",
        status: {
          airing: "Currently Airing",
          completed: "Completed",
          upcoming: "Upcoming",
          unknown: "Unknown"
        }
      },

      // 🚨 Generic error messages
      errors: {
        generic: "An error occurred",
        network: "Network connection error",
        notFound: "Content not found",
        serverError: "Server error",
        timeout: "Request timeout"
      },

      // 🔄 Loading states
      loading: {
        default: "Loading...",
        animes: "Loading animes...",
        details: "Loading details..."
      },

      // 🌍 Countries/Regions
      countries: {
        FR: "France",
        US: "United States",
        JP: "Japan", 
        UK: "United Kingdom",
        DE: "Germany",
        ES: "Spain",
        IT: "Italy"
      },

      // 🎛️ User Interface
      ui: {
        changeToLanguage: "Change to {{language}}",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        confirm: "Confirm",
        close: "Close",
        back: "Back",
        next: "Next",
        previous: "Previous",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        add: "Add",
        remove: "Remove",
        refresh: "Refresh",
        gridView: "Grid view",
        listView: "List view"
      }
      ,
      // 🛂 Auth / OAuth
      auth: {
        title: "Sign in",
        description: "Sign in with Discord to save your watchlist and preferences without creating an extra account.",
        login_with_discord: "Sign in with Discord"
      }
    }
  }
};

// 🔧 Configuration i18n
i18n
  .use(LanguageDetector) // Détection automatique de la langue
  .use(initReactI18next) // Intégration React
  .init({
    resources,
    
    // 🌍 Configuration des langues
    fallbackLng: 'fr', // Langue par défaut
    supportedLngs: ['fr', 'en'], // Langues supportées
    
    // 🔍 Détection de langue
    detection: {
      // Ordre de détection : localStorage > navigator > défaut
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'], // Sauvegarde dans localStorage
      lookupLocalStorage: 'wat-language' // Clé de stockage
    },

    // 🛠️ Options
    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    },
    
    // 🐛 Debug (désactiver en production)
    debug: import.meta.env.DEV,
    
    // 📝 Namespace par défaut
    defaultNS: 'translation',
    
    // ⚡ Chargement synchrone (ressources incluses)
    initImmediate: false
  });

export default i18n;