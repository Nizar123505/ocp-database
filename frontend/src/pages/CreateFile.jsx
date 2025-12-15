import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { filesService } from "../services/api";
import "./CreateFile.css";

export default function CreateFile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState([
    { name: "", type: "text" }
  ]);

  const COLUMN_TYPES = [
    { value: 'text', label: 'Texte' },
    { value: 'number', label: 'Nombre' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date et heure' },
  ];

  const addColumn = () => {
    setColumns([...columns, { name: "", type: "text" }]);
  };

  const removeColumn = (index) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index));
    }
  };

  const updateColumn = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const moveColumn = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= columns.length) return;
    
    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[newIndex];
    newColumns[newIndex] = temp;
    setColumns(newColumns);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!fileName.trim()) {
      setError("Le nom du fichier est requis");
      return;
    }

    const validColumns = columns.filter(col => col.name.trim());
    if (validColumns.length === 0) {
      setError("Ajoutez au moins une colonne avec un nom");
      return;
    }

    setLoading(true);

    try {
      const response = await filesService.createFile({
        name: fileName.trim(),
        columns: validColumns
      });

      // Rediriger vers le fichier créé
      navigate(`/fichier/${encodeURIComponent(response.data.filename)}`);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création du fichier");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Templates prédéfinis
  const applyTemplate = (templateName) => {
    switch (templateName) {
      case 'navire':
        setColumns([
          { name: "N°", type: "number" },
          { name: "Navire", type: "text" },
          { name: "Date B/L", type: "datetime" },
          { name: "Tonnage B/L", type: "number" },
          { name: "Qualité", type: "text" },
          { name: "Fournisseur", type: "text" },
          { name: "Origine", type: "text" },
          { name: "Destination", type: "text" },
          { name: "Arrivée", type: "datetime" },
          { name: "Appareillage", type: "datetime" },
          { name: "Remarques", type: "text" },
        ]);
        break;
      case 'simple':
        setColumns([
          { name: "ID", type: "number" },
          { name: "Nom", type: "text" },
          { name: "Description", type: "text" },
          { name: "Date", type: "date" },
          { name: "Valeur", type: "number" },
        ]);
        break;
      case 'inventaire':
        setColumns([
          { name: "Code", type: "text" },
          { name: "Désignation", type: "text" },
          { name: "Quantité", type: "number" },
          { name: "Unité", type: "text" },
          { name: "Prix unitaire", type: "number" },
          { name: "Valeur totale", type: "number" },
          { name: "Emplacement", type: "text" },
          { name: "Date inventaire", type: "date" },
        ]);
        break;
      default:
        break;
    }
  };

  return (
    <div className="create-file-page">
      {/* Header */}
      <header className="create-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/accueil")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div className="page-info">
            <h1>Créer un nouveau fichier Excel</h1>
            <span>Définissez le nom et les colonnes de votre fichier</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="create-main">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          {/* Nom du fichier */}
          <section className="form-section">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Nom du fichier
            </h2>
            <div className="file-name-input">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Ex: Suivi Import 2025"
                maxLength={100}
              />
              <span className="file-extension">.xlsx</span>
            </div>
          </section>

          {/* Templates */}
          <section className="form-section">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              Templates (optionnel)
            </h2>
            <p className="section-desc">Utilisez un modèle prédéfini pour démarrer rapidement</p>
            <div className="templates-grid">
              <button type="button" className="template-btn" onClick={() => applyTemplate('navire')}>
                <span className="template-icon">🚢</span>
                <span className="template-name">Suivi Navires</span>
                <span className="template-desc">Import/Export maritime</span>
              </button>
              <button type="button" className="template-btn" onClick={() => applyTemplate('simple')}>
                <span className="template-icon">📋</span>
                <span className="template-name">Simple</span>
                <span className="template-desc">Structure basique</span>
              </button>
              <button type="button" className="template-btn" onClick={() => applyTemplate('inventaire')}>
                <span className="template-icon">📦</span>
                <span className="template-name">Inventaire</span>
                <span className="template-desc">Gestion de stock</span>
              </button>
            </div>
          </section>

          {/* Colonnes */}
          <section className="form-section">
            <div className="section-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Colonnes ({columns.length})
              </h2>
              <button type="button" className="add-column-btn" onClick={addColumn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter une colonne
              </button>
            </div>

            <div className="columns-list">
              {columns.map((column, index) => (
                <div key={index} className="column-item">
                  <div className="column-order">
                    <button 
                      type="button" 
                      className="order-btn"
                      onClick={() => moveColumn(index, -1)}
                      disabled={index === 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15"/>
                      </svg>
                    </button>
                    <span className="column-number">{index + 1}</span>
                    <button 
                      type="button" 
                      className="order-btn"
                      onClick={() => moveColumn(index, 1)}
                      disabled={index === columns.length - 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="column-fields">
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => updateColumn(index, 'name', e.target.value)}
                      placeholder="Nom de la colonne"
                      className="column-name-input"
                    />
                    <select
                      value={column.type}
                      onChange={(e) => updateColumn(index, 'type', e.target.value)}
                      className="column-type-select"
                    >
                      {COLUMN_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    type="button" 
                    className="remove-column-btn"
                    onClick={() => removeColumn(index)}
                    disabled={columns.length <= 1}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="add-column-inline-btn" onClick={addColumn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter une colonne
            </button>
          </section>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate("/accueil")}>
              Annuler
            </button>
            <button type="submit" className="create-btn" disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {loading ? "Création en cours..." : "Créer le fichier"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}







