import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { filesService } from "../services/api";
import "./FileSheets.css";

export default function FileSheets() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const decodedFilename = decodeURIComponent(filename);
  
  const [fileInfo, setFileInfo] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSheets();
  }, [filename]);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const response = await filesService.getSheets(decodedFilename);
      setFileInfo(response.data);
      
      // Parser les sheets si c'est une chaîne JSON
      let sheetsData = response.data.sheets;
      if (typeof sheetsData === 'string') {
        try { sheetsData = JSON.parse(sheetsData); } catch { sheetsData = []; }
      }
      setSheets(Array.isArray(sheetsData) ? sheetsData : []);
    } catch (err) {
      setError("Erreur lors du chargement du fichier");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await filesService.download(decodedFilename);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodedFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Erreur lors du téléchargement");
      console.error(err);
    }
  };

  // Icônes pour les différents types de feuilles
  const getSheetIcon = (sheetName) => {
    const name = sheetName.toLowerCase();
    if (name.includes('soufre')) return '🟡';
    if (name.includes('nh3') || name.includes('ammoni')) return '💨';
    if (name.includes('acs') || name.includes('acp') || name.includes('acide')) return '🧪';
    if (name.includes('kcl') || name.includes('potass')) return '🧂';
    if (name.includes('npk') || name.includes('engrais')) return '🌱';
    if (name.includes('urea') || name.includes('urée')) return '🔬';
    if (name.includes('phos')) return '💎';
    if (name.includes('app')) return '📦';
    if (name.includes('safi') || name.includes('marsa')) return '🏭';
    if (name.includes('catégorie') || name.includes('categorie')) return '📋';
    return '📄';
  };

  // Couleur de la feuille
  const getSheetColor = (index) => {
    const colors = [
      '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', 
      '#E91E63', '#00BCD4', '#795548', '#607D8B'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="file-sheets-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Chargement du fichier...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="file-sheets-page">
      {/* Header */}
      <header className="sheets-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/accueil")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div className="file-info">
            <h1>{fileInfo?.file_name || decodedFilename.replace('.xlsx', '')}</h1>
            <span>{sheets.length} feuilles disponibles</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="download-btn" onClick={handleDownload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Télécharger
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="sheets-main">
        {error && <div className="error-banner">{error}</div>}

        <section className="sheets-section">
          <div className="section-header">
            <h2>Sélectionnez une feuille</h2>
            <p>Choisissez la feuille sur laquelle vous souhaitez travailler</p>
          </div>

          <div className="sheets-grid">
            {sheets.map((sheet, index) => (
              <div 
                key={index}
                className="sheet-card"
                onClick={() => navigate(`/fichier/${encodeURIComponent(decodedFilename)}/feuille/${encodeURIComponent(sheet.name)}`)}
                style={{ "--delay": `${index * 0.05}s`, "--color": getSheetColor(index) }}
              >
                <div className="sheet-icon" style={{ background: `${getSheetColor(index)}20` }}>
                  <span>{getSheetIcon(sheet.name)}</span>
                </div>
                <div className="sheet-info">
                  <h3>{sheet.name}</h3>
                  <div className="sheet-meta">
                    <span className="meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                      {sheet.columns_count} colonnes
                    </span>
                    <span className="meta-item entries">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                      {sheet.entries_count} entrées
                    </span>
                  </div>
                </div>
                <div className="sheet-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}







