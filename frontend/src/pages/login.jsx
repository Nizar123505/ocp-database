import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (username.trim() === "" || password.trim() === "") {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        username,
        password,
      });

      const token = response.data.access;
      const refresh = response.data.refresh;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refresh);

      navigate("/accueil");
    } catch (err) {
      setError("Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Header avec logo OCP */}
      <div className="login-header">
        <div className="logo-wrapper">
          {!logoError ? (
            <img 
              src="/images/Attached_image.png" 
              alt="OCP Group" 
              className="ocp-logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="logo-fallback">
              <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" fill="#2E7D32"/>
                <path d="M50 15L58 35H78L62 48L68 68L50 55L32 68L38 48L22 35H42L50 15Z" fill="white"/>
              </svg>
              <span className="logo-text">OCP</span>
            </div>
          )}
        </div>
      </div>

      {/* Carte de connexion */}
      <div className="login-card">
        <div className="login-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        
        <h1 className="title">Connexion</h1>
        <p className="subtitle">
          Connectez-vous pour accéder à l'application de gestion des formulaires
        </p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <div className="input-wrapper">
              {!username && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
              <input
                type="text"
                placeholder="Entrez votre nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className={username ? "has-value" : ""}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-wrapper">
              {!password && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              <input
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={password ? "has-value" : ""}
              />
            </div>
          </div>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <p className="footer">
          Plateforme de gestion des formulaires<br/>
          <a href="#">Port de Jorf Lasfar - OCP Group</a>
        </p>
      </div>

      <div className="page-footer">
        Port du Maroc - OCP Group
      </div>
    </div>
  );
}
