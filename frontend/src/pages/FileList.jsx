import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { excelService, userService } from "../services/api";
import "./FileList.css";

export default function FileList() {
  const [files, setFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
    fetchUser();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await excelService.getAll();
      setFiles(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des fichiers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await userService.getCurrentUser();
      setUser(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.(xlsx|xls)$/, ''));

      await excelService.upload(formData);
      await fetchFiles();
    } catch (err) {
      setError("Erreur lors de l'upload du fichier");
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await excelService.download(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Erreur lors du téléchargement");
      console.error(err);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) {
      return;
    }

    try {
      await excelService.delete(file.id);
      await fetchFiles();
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="file-list-page">
      {/* Header */}
      <header className="file-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/accueil")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span className="app-title">Gestionnaire de Formulaires Excel</span>
        </div>
        <div className="header-right">
          <span className="user-name">
            Bonjour, {user?.full_name || user?.username || "Utilisateur"}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="file-main">
        {/* Section Créer nouveau */}
        <section className="create-section">
          <div className="section-header">
            <div>
              <h2>Créer un nouveau fichier</h2>
              <p>Commencez avec un nouveau formulaire Excel</p>
            </div>
            <button className="create-btn" onClick={() => navigate("/nouveau")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nouveau fichier
            </button>
          </div>
        </section>

        {/* Section Fichiers existants */}
        <section className="files-section">
          <div className="section-header">
            <div>
              <h2>Fichiers existants</h2>
              <p>Sélectionnez un fichier existant pour continuer à le remplir</p>
            </div>
            <div className="upload-wrapper">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
              />
              <button 
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {uploading ? "Chargement..." : "Importer un fichier"}
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <span>Chargement des fichiers...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3>Aucun fichier disponible</h3>
              <p>Créez un nouveau fichier ou importez un fichier Excel existant</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-card-header">
                    <h3>{file.name}</h3>
                    <div className="file-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                  </div>
                  
                  <p className="file-description">
                    {file.description || "Fichier Excel"}
                  </p>
                  
                  <div className="file-meta">
                    <button 
                      className="meta-btn export"
                      onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Export
                    </button>
                    <span className="entries-count">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {file.entries_count} entrées
                    </span>
                  </div>
                  
                  <div className="file-info">
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Modifié le {formatDate(file.updated_at)}
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {file.created_by_name}
                    </span>
                  </div>
                  
                  <div className="file-actions">
                    <button 
                      className="open-btn"
                      onClick={() => navigate(`/fichier/${file.id}`)}
                    >
                      Ouvrir le fichier
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}







