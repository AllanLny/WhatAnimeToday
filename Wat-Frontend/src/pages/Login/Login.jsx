import React from 'react';
import './Login.scss';
import { useWATTranslation } from '../../hooks/useWATTranslation';

const Login = () => {
  const { t } = useWATTranslation();

  const redirectToDiscord = () => {
    // Optional: pass current path as redirect param
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/api/auth/discord?redirect=${redirect}`;
  };

  return (
    <div className="login-page">
      <div className="login-card">
  <h1>{t('auth.title', { defaultValue: 'Se connecter' })}</h1>
  <p>{t('auth.description', { defaultValue: "Connecte-toi avec Discord pour sauvegarder ta watchlist et tes préférences sans créer de compte supplémentaire." })}</p>

        <div className="login-actions">
          <button className="btn btn-discord" onClick={redirectToDiscord}>
            {t('auth.login_with_discord', { defaultValue: 'Se connecter avec Discord' })}
          </button>
          <a className="btn btn-ghost" href="/">Retour</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
