import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userService, filesService } from "../services/api";
import "./Home.css";

export default function Home() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  const [archivedFiles, setArchivedFiles] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [restoringFile, setRestoringFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchFiles();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await userService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await filesService.getFiles();
      setFiles(response.data.files);
    } catch (error) {
      console.error("Erreur lors de la récupération des fichiers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier l'extension
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadError("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await filesService.importFile(formData);
      
      setUploadSuccess(`Fichier "${response.data.filename}" importé avec succès ! (${response.data.total_sheets} feuille(s))`);
      
      // Recharger la liste des fichiers
      await fetchFiles();

      // Effacer le message après 5 secondes
      setTimeout(() => {
        setUploadSuccess("");
      }, 5000);

    } catch (err) {
      setUploadError(err.response?.data?.error || "Erreur lors de l'importation du fichier");
    } finally {
      setUploading(false);
      // Reset l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (filename, e) => {
    e.stopPropagation();
    
    if (!window.confirm(`Êtes-vous sûr de vouloir archiver "${filename}" ?\n\nLe fichier sera déplacé dans les archives et pourra être restauré ultérieurement.`)) {
      return;
    }

    try {
      await filesService.deleteFile(filename);
      setUploadSuccess("Fichier archivé avec succès. Vous pouvez le restaurer depuis les archives.");
      await fetchFiles();
      setTimeout(() => setUploadSuccess(""), 5000);
    } catch (err) {
      setUploadError(err.response?.data?.error || "Erreur lors de l'archivage");
    }
  };

  const fetchArchivedFiles = async () => {
    try {
      setLoadingArchive(true);
      const response = await filesService.getArchivedFiles();
      setArchivedFiles(response.data.archived_files || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des archives:", error);
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleShowArchive = () => {
    setShowArchive(true);
    fetchArchivedFiles();
  };

  const handleRestoreFile = async (fileId, filename) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir restaurer "${filename}" ?`)) {
      return;
    }

    try {
      setRestoringFile(fileId);
      await filesService.restoreFile(fileId);
      setUploadSuccess(`Fichier "${filename}" restauré avec succès !`);
      await fetchArchivedFiles();
      await fetchFiles();
      setTimeout(() => setUploadSuccess(""), 5000);
    } catch (err) {
      setUploadError(err.response?.data?.error || "Erreur lors de la restauration");
    } finally {
      setRestoringFile(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Déterminer l'icône du fichier basé sur le nom
  const getFileIcon = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('import')) return '📥';
    if (name.includes('export')) return '📤';
    return '📊';
  };

  // Déterminer la couleur du fichier
  const getFileColor = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('import')) return 'linear-gradient(135deg, #2196F3, #1565C0)';
    if (name.includes('export')) return 'linear-gradient(135deg, #4CAF50, #2E7D32)';
    return 'linear-gradient(135deg, #9C27B0, #6A1B9A)';
  };

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      ),
      title: "Bases de données",
      bg: "linear-gradient(135deg, #2196F3, #1565C0)"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      title: "Fichiers Excel",
      bg: "linear-gradient(135deg, #4CAF50, #2E7D32)"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      title: "Formulaires",
      bg: "linear-gradient(135deg, #9C27B0, #6A1B9A)"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
        </svg>
      ),
      title: "Port OCP",
      bg: "linear-gradient(135deg, #FF9800, #EF6C00)"
    }
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-left">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <span className="app-title">Gestion de Bases de Données - OCP</span>
        </div>
        <div className="header-right">
          <span className="user-name">
            Bonjour, {user?.full_name || user?.username || "Utilisateur"}
          </span>
          {/* Bouton Archives */}
          <button className="archive-btn" onClick={handleShowArchive}>
            🗄️ Archives
          </button>
          {/* Bouton Utilisateurs visible uniquement pour les administrateurs */}
          {user?.is_admin && (
            <button className="users-btn" onClick={() => navigate("/utilisateurs")}>
              👥 Utilisateurs
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* Features Section */}
        <section className="features-section">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ 
                  "--delay": `${index * 0.1}s`,
                  background: feature.bg 
                }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <span className="feature-title">{feature.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Welcome Section */}
        <section className="welcome-section">
          <h1>Gestion de Bases de Données</h1>
          <p>
            Gérez vos fichiers Excel de données Import et Export du Port de Jorf Lasfar. 
            Sélectionnez un fichier pour consulter ou ajouter des données.
          </p>
        </section>

        {/* Messages */}
        {uploadSuccess && (
          <div className="success-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {uploadSuccess}
          </div>
        )}
        {uploadError && (
          <div className="error-banner">
            {uploadError}
            <button className="close-error" onClick={() => setUploadError("")}>×</button>
          </div>
        )}

        {/* Files Section */}
        <section className="files-section">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Fichiers disponibles</h2>
              <span className="files-count">{files.length} fichier(s)</span>
            </div>
            <div className="section-header-actions">
              {/* Input caché pour l'import */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
              />
              <button 
                className="import-file-btn" 
                onClick={handleImportClick}
                disabled={uploading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {uploading ? "Importation..." : "Importer"}
              </button>
              <button className="create-file-btn" onClick={() => navigate("/nouveau-fichier")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nouveau fichier
              </button>
            </div>
          </div>
          
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
              <h3>Aucun fichier Excel trouvé</h3>
              <p>Créez un nouveau fichier ou importez un fichier existant</p>
              <div className="empty-actions">
                <button className="import-file-btn" onClick={handleImportClick}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Importer un fichier
                </button>
                <button className="create-file-btn" onClick={() => navigate("/nouveau-fichier")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Créer un fichier
                </button>
              </div>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className="file-card"
                  onClick={() => navigate(`/fichier/${encodeURIComponent(file.filename)}`)}
                  style={{ "--delay": `${index * 0.1}s` }}
                >
                  <div className="file-card-header">
                    <div 
                      className="file-icon-large"
                      style={{ background: getFileColor(file.name) }}
                    >
                      <span>{getFileIcon(file.name)}</span>
                    </div>
                    <div className="file-header-right">
                      <div className="file-badge">
                        {file.sheets_count} feuilles
                      </div>
                      <button 
                        className="delete-file-btn"
                        onClick={(e) => handleDeleteFile(file.filename, e)}
                        title="Supprimer ce fichier"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="file-name">{file.name}</h3>
                  
                  <div className="file-stats">
                    <div className="stat">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                      <span>{file.total_entries} entrées</span>
                    </div>
                    <div className="stat">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>

                  <div className="file-sheets-preview">
                    {file.sheets.slice(0, 3).map((sheet, idx) => (
                      <span key={idx} className="sheet-tag">{sheet}</span>
                    ))}
                    {file.sheets.length > 3 && (
                      <span className="sheet-tag more">+{file.sheets.length - 3}</span>
                    )}
                  </div>
                  
                  <div className="file-footer">
                    <div className="file-footer-info">
                      <span className="file-date">
                        Modifié le {formatDate(file.modified)}
                      </span>
                      {file.last_modified_by && (
                        <span className="file-modified-by">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          {file.last_modified_by.full_name || file.last_modified_by.username}
                        </span>
                      )}
                    </div>
                    <div className="open-arrow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal des fichiers archivés */}
      {showArchive && (
        <div className="archive-modal-overlay" onClick={() => setShowArchive(false)}>
          <div className="archive-modal" onClick={(e) => e.stopPropagation()}>
            <div className="archive-modal-header">
              <h2>🗄️ Fichiers archivés</h2>
              <button className="close-modal-btn" onClick={() => setShowArchive(false)}>
                ×
              </button>
            </div>
            
            <div className="archive-modal-content">
              {loadingArchive ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>Chargement des archives...</span>
                </div>
              ) : archivedFiles.length === 0 ? (
                <div className="empty-archive">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                    <polyline points="21 8 21 21 3 21 3 8"/>
                    <rect x="1" y="3" width="22" height="5"/>
                    <line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                  <h3>Aucun fichier archivé</h3>
                  <p>Les fichiers supprimés apparaîtront ici et pourront être restaurés.</p>
                </div>
              ) : (
                <div className="archived-files-list">
                  {archivedFiles.map((file) => (
                    <div key={file.id} className="archived-file-item">
                      <div className="archived-file-info">
                        <div className="archived-file-icon">📁</div>
                        <div className="archived-file-details">
                          <h4>{file.name}</h4>
                          <p>
                            <span className="archived-date">
                              Archivé le {formatDate(file.deleted_at)}
                            </span>
                            {file.deleted_by && (
                              <span className="archived-by">
                                par {file.deleted_by.full_name || file.deleted_by.username}
                              </span>
                            )}
                          </p>
                          <p className="archived-stats">
                            {file.sheets_count} feuille(s) • {file.total_entries} entrée(s)
                          </p>
                        </div>
                      </div>
                      <div className="archived-file-actions">
                        {file.can_restore ? (
                          <button
                            className="restore-btn"
                            onClick={() => handleRestoreFile(file.id, file.name)}
                            disabled={restoringFile === file.id}
                          >
                            {restoringFile === file.id ? (
                              <>
                                <span className="btn-spinner"></span>
                                Restauration...
                              </>
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                  <path d="M3 3v5h5"/>
                                </svg>
                                Restaurer
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="no-restore">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            Données conservées
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="archive-modal-footer">
              <p className="archive-info">
                💡 Les données des fichiers archivés sont conservées dans la base de données même si le fichier physique est supprimé.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
