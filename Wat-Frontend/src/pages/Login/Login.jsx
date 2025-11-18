import React from 'react';
import './Login.scss';

const Login = () => {
  const redirectToDiscord = () => {
    // Optional: pass current path as redirect param
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/api/auth/discord?redirect=${redirect}`;
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Se connecter</h1>
        <p>Connecte-toi avec Discord pour sauvegarder ta watchlist et tes préférences sans créer de compte supplémentaire.</p>

        <div className="login-actions">
          <button className="btn btn-discord" onClick={redirectToDiscord}>
            Se connecter avec Discord
          </button>
          <a className="btn btn-ghost" href="/">Retour</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
