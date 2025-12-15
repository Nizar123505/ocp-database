import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { excelService } from "../services/api";
import "./NewFile.css";

const FIELD_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'radio', label: 'Choix unique' },
  { value: 'checkbox', label: 'Choix multiples' },
  { value: 'textarea', label: 'Zone de texte' },
];

export default function NewFile() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [fileInfo, setFileInfo] = useState({
    name: "",
    description: ""
  });
  
  const [columns, setColumns] = useState([
    { name: "", field_type: "text", required: false, options: [] }
  ]);

  const handleFileInfoChange = (field, value) => {
    setFileInfo(prev => ({ ...prev, [field]: value }));
  };

  const addColumn = () => {
    setColumns([...columns, { name: "", field_type: "text", required: false, options: [] }]);
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

  const handleOptionsChange = (index, optionsStr) => {
    const options = optionsStr.split(',').map(opt => opt.trim()).filter(Boolean);
    updateColumn(index, 'options', options);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fileInfo.name.trim()) {
        setError("Le nom du fichier est requis");
        return;
      }
      setError("");
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async () => {
    // Valider les colonnes
    const validColumns = columns.filter(col => col.name.trim());
    if (validColumns.length === 0) {
      setError("Ajoutez au moins une colonne");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = {
        name: fileInfo.name,
        description: fileInfo.description,
        columns: validColumns.map((col, idx) => ({
          ...col,
          order: idx,
          options: col.options.length > 0 ? col.options : null
        }))
      };

      const response = await excelService.create(data);
      navigate(`/fichier/${response.data.id}`);
    } catch (err) {
      setError("Erreur lors de la création du fichier");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-file-page">
      {/* Header */}
      <header className="new-file-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/fichiers")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <span className="page-title">Créer un nouveau fichier Excel</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Informations</span>
          </div>
          <div className="progress-line">
            <div className={`progress-fill ${step >= 2 ? 'filled' : ''}`}></div>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Structure</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="new-file-main">
        {error && <div className="error-banner">{error}</div>}

        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Informations du fichier</h2>
              <p>Donnez un nom et une description à votre fichier Excel</p>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Nom du fichier *</label>
                <input
                  type="text"
                  placeholder="Ex: Suivi des bateaux 2024"
                  value={fileInfo.name}
                  onChange={(e) => handleFileInfoChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Décrivez le contenu de ce fichier..."
                  value={fileInfo.description}
                  onChange={(e) => handleFileInfoChange('description', e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="step-actions">
              <button className="cancel-btn" onClick={() => navigate("/fichiers")}>
                Annuler
              </button>
              <button className="next-btn" onClick={handleNext}>
                Suivant
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Structure du formulaire</h2>
              <p>Définissez les colonnes de votre fichier Excel (ces colonnes deviendront les champs du formulaire)</p>
            </div>

            <div className="columns-section">
              {columns.map((column, index) => (
                <div key={index} className="column-card">
                  <div className="column-header">
                    <span className="column-number">Colonne {index + 1}</span>
                    {columns.length > 1 && (
                      <button className="remove-column-btn" onClick={() => removeColumn(index)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="column-fields">
                    <div className="form-group">
                      <label>Nom de la colonne *</label>
                      <input
                        type="text"
                        placeholder="Ex: Nom du bateau"
                        value={column.name}
                        onChange={(e) => updateColumn(index, 'name', e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Type de champ</label>
                        <select
                          value={column.field_type}
                          onChange={(e) => updateColumn(index, 'field_type', e.target.value)}
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={column.required}
                            onChange={(e) => updateColumn(index, 'required', e.target.checked)}
                          />
                          <span>Champ obligatoire</span>
                        </label>
                      </div>
                    </div>

                    {['select', 'radio', 'checkbox'].includes(column.field_type) && (
                      <div className="form-group">
                        <label>Options (séparées par des virgules)</label>
                        <input
                          type="text"
                          placeholder="Ex: Option 1, Option 2, Option 3"
                          value={column.options?.join(', ') || ''}
                          onChange={(e) => handleOptionsChange(index, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button className="add-column-btn" onClick={addColumn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter une colonne
              </button>
            </div>

            <div className="step-actions">
              <button className="back-step-btn" onClick={handleBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Retour
              </button>
              <button className="create-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? "Création en cours..." : "Créer le fichier"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}







