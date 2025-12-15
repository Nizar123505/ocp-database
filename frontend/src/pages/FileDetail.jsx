import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { excelService } from "../services/api";
import "./FileDetail.css";

export default function FileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("form");
  const [editingRow, setEditingRow] = useState(null);
  
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchFileData();
  }, [id]);

  const fetchFileData = async () => {
    try {
      setLoading(true);
      const [fileRes, dataRes] = await Promise.all([
        excelService.getById(id),
        excelService.getData(id)
      ]);
      
      setFile(fileRes.data);
      setHeaders(dataRes.data.headers);
      setData(dataRes.data.data);
      
      // Initialiser le formulaire vide
      const initialForm = {};
      dataRes.data.headers.forEach(header => {
        initialForm[header] = "";
      });
      setFormData(initialForm);
      
    } catch (err) {
      setError("Erreur lors du chargement du fichier");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field, option, checked) => {
    const currentValues = formData[field] || [];
    let newValues;
    
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter(v => v !== option);
    }
    
    setFormData(prev => ({ ...prev, [field]: newValues }));
  };

  const getColumnConfig = (headerName) => {
    if (!file?.columns) return { field_type: 'text', required: false, options: [] };
    const column = file.columns.find(c => c.name === headerName);
    return column || { field_type: 'text', required: false, options: [] };
  };

  const renderFormField = (header, column) => {
    const value = formData[header] || "";
    
    switch (column.field_type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(header, e.target.value)}
            placeholder={`Entrez ${header.toLowerCase()}...`}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(header, e.target.value)}
          >
            <option value="">Sélectionnez une option</option>
            {column.options?.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="radio-group">
            {column.options?.map((opt, idx) => (
              <label key={idx} className="radio-label">
                <input
                  type="radio"
                  name={header}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleInputChange(header, e.target.value)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="checkbox-group">
            {column.options?.map((opt, idx) => (
              <label key={idx} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={(formData[header] || []).includes(opt)}
                  onChange={(e) => handleCheckboxChange(header, opt, e.target.checked)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(header, e.target.value)}
            placeholder={`Entrez ${header.toLowerCase()}`}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(header, e.target.value)}
            placeholder="exemple@email.com"
          />
        );
      
      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleInputChange(header, e.target.value)}
            placeholder="+212 6XX XXX XXX"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(header, e.target.value)}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(header, e.target.value)}
            placeholder={`Entrez ${header.toLowerCase()}`}
          />
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs requis
    for (const header of headers) {
      const column = getColumnConfig(header);
      if (column.required && !formData[header]) {
        setError(`Le champ "${header}" est obligatoire`);
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingRow) {
        await excelService.updateEntry(id, { ...formData, _row_id: editingRow });
        setSuccess("Entrée modifiée avec succès");
        setEditingRow(null);
      } else {
        await excelService.addEntry(id, formData);
        setSuccess("Entrée ajoutée avec succès");
      }
      
      // Recharger les données
      await fetchFileData();
      
      // Réinitialiser le formulaire
      const initialForm = {};
      headers.forEach(header => {
        initialForm[header] = "";
      });
      setFormData(initialForm);
      
    } catch (err) {
      setError("Erreur lors de l'enregistrement");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingRow(row._row_id);
    const newFormData = {};
    headers.forEach(header => {
      let value = row[header] || "";
      // Convertir les chaînes séparées par des virgules en tableaux pour les checkboxes
      const column = getColumnConfig(header);
      if (column.field_type === 'checkbox' && typeof value === 'string') {
        value = value.split(', ').filter(Boolean);
      }
      newFormData[header] = value;
    });
    setFormData(newFormData);
    setActiveTab("form");
  };

  const handleDelete = async (rowId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      return;
    }

    try {
      await excelService.deleteEntry(id, rowId);
      await fetchFileData();
      setSuccess("Entrée supprimée avec succès");
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await excelService.download(id);
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

  const cancelEdit = () => {
    setEditingRow(null);
    const initialForm = {};
    headers.forEach(header => {
      initialForm[header] = "";
    });
    setFormData(initialForm);
  };

  if (loading) {
    return (
      <div className="file-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Chargement du fichier...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="file-detail-page">
      {/* Header */}
      <header className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/fichiers")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div className="file-info">
            <h1>{file?.name}</h1>
            <span>{file?.entries_count || 0} entrées</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="download-btn" onClick={handleDownload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Télécharger Excel
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {editingRow ? "Modifier l'entrée" : "Nouvelle entrée"}
        </button>
        <button 
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
          Données ({data.length})
        </button>
      </div>

      {/* Main Content */}
      <main className="detail-main">
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {activeTab === 'form' && (
          <div className="form-container">
            <div className="form-header">
              <h2>{editingRow ? "Modifier l'entrée" : "Nouveau formulaire"}</h2>
              <p>
                {editingRow 
                  ? `Modifiez les informations de l'entrée sélectionnée`
                  : `Remplissez ce formulaire pour ajouter une nouvelle entrée au fichier Excel "${file?.name}"`
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="entry-form">
              <div className="form-grid">
                {headers.map((header, idx) => {
                  const column = getColumnConfig(header);
                  return (
                    <div key={idx} className={`form-group ${column.field_type === 'textarea' || column.field_type === 'checkbox' || column.field_type === 'radio' ? 'full-width' : ''}`}>
                      <label>
                        {header}
                        {column.required && <span className="required">*</span>}
                      </label>
                      {renderFormField(header, column)}
                    </div>
                  );
                })}
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={saving}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {saving ? "Enregistrement..." : "Enregistrer dans Excel"}
                </button>
                {editingRow && (
                  <button type="button" className="cancel-btn" onClick={cancelEdit}>
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-container">
            <div className="data-header">
              <h2>Données existantes</h2>
              <p>{data.length} entrée(s) dans ce fichier</p>
            </div>

            {data.length === 0 ? (
              <div className="empty-data">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <h3>Aucune donnée</h3>
                <p>Ajoutez une nouvelle entrée en utilisant le formulaire</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      {headers.map((header, idx) => (
                        <th key={idx}>{header}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="row-number">{rowIdx + 1}</td>
                        {headers.map((header, colIdx) => (
                          <td key={colIdx}>
                            {row[header] !== null && row[header] !== undefined 
                              ? String(row[header]) 
                              : "-"
                            }
                          </td>
                        ))}
                        <td className="actions-cell">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEdit(row)}
                            title="Modifier"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="delete-row-btn"
                            onClick={() => handleDelete(row._row_id)}
                            title="Supprimer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}







