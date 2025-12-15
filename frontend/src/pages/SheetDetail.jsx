import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { filesService } from "../services/api";
import "./SheetDetail.css";

export default function SheetDetail() {
  const { filename, sheetName } = useParams();
  const navigate = useNavigate();
  const decodedFilename = decodeURIComponent(filename);
  const decodedSheetName = decodeURIComponent(sheetName);
  
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("form");
  const [editingRow, setEditingRow] = useState(null);
  
  // Support pour plusieurs lignes (jusqu'à 10)
  const [formRows, setFormRows] = useState([{}]);
  const [validationErrors, setValidationErrors] = useState({});
  const MAX_ROWS = 10;
  
  // Tri et recherche des données
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' ou 'desc'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Nombre de colonnes principales à afficher (le reste sera dans "plus de champs")
  const MAIN_COLUMNS_COUNT = 12;

  // Fonction pour trier les données
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Si on clique sur la même colonne, inverser la direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, commencer par ascendant
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Fonction pour obtenir les données triées et filtrées
  const getSortedAndFilteredData = () => {
    let filteredData = [...data];
    
    // Appliquer le filtre de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filteredData = filteredData.filter(row => {
        // Chercher dans toutes les colonnes
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(search);
        });
      });
    }
    
    // Appliquer le tri
    if (sortColumn) {
      filteredData.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        
        // Gérer les valeurs null/undefined
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        
        // Convertir en string pour comparaison
        const strA = String(valA);
        const strB = String(valB);
        
        // Essayer de comparer comme nombres si possible
        const numA = parseFloat(strA.replace(',', '.'));
        const numB = parseFloat(strB.replace(',', '.'));
        
        if (!isNaN(numA) && !isNaN(numB)) {
          // Comparaison numérique
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
        
        // Comparaison alphabétique
        const comparison = strA.localeCompare(strB, 'fr', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filteredData;
  };

  // Réinitialiser le tri
  const resetSort = () => {
    setSortColumn(null);
    setSortDirection('asc');
    setSearchTerm('');
  };

  // Trouver une colonne par mots-clés (pour les boutons de tri rapide)
  const findColumnByKeywords = (keywords) => {
    const keywordsLower = keywords.map(k => k.toLowerCase());
    return headers.find(header => {
      const headerLower = header.toLowerCase();
      return keywordsLower.some(keyword => headerLower.includes(keyword));
    });
  };

  // Colonnes de tri rapide
  const quickSortColumns = {
    navire: findColumnByKeywords(['navire', 'navires', 'ship']),
    date: findColumnByKeywords(['date b/l', 'date bl', 'date b l'])
  };

  // Vérifier si au moins un bouton de tri rapide est disponible
  const hasQuickSortButtons = Object.values(quickSortColumns).some(col => col);

  // Fonction pour déterminer le type attendu d'une colonne (utilise les données du backend)
  const getExpectedType = (columnName) => {
    // Chercher la colonne dans les données du backend
    const column = columns.find(col => col.name === columnName);
    
    if (column && column.data_type) {
      // Utiliser le type détecté par le backend basé sur l'analyse des données réelles
      switch (column.data_type) {
        case 'number':
          return 'number';
        case 'text_only':
          return 'text_only';  // Doit contenir des lettres (navires, clients, etc.)
        case 'date':
          return 'date';
        case 'boolean':
          return 'boolean';
        case 'text':
        case 'any':
        default:
          return 'any';
      }
    }
    
    // Fallback basé sur le nom de colonne si pas de data_type
    const nameLower = columnName.toLowerCase().trim();
    
    // Numéros
    if (nameLower === 'n°' || nameLower === 'n' || nameLower === '#') {
      return 'number';
    }
    
    return 'any';
  };

  // Fonction pour obtenir le label du type
  const getTypeLabel = (dataType) => {
    switch (dataType) {
      case 'number':
        return '🔢 Nombre';
      case 'text_only':
        return '📝 Texte (lettres)';
      case 'date':
        return '📅 Date';
      case 'boolean':
        return '✅ Oui/Non';
      default:
        return null;  // Pas d'indication pour les champs libres
    }
  };

  // Fonction de validation d'une valeur selon le type attendu
  const validateValue = (columnName, value) => {
    if (!value || value.toString().trim() === '') {
      return { isValid: true, error: null }; // Les champs vides sont acceptés
    }

    const expectedType = getExpectedType(columnName);
    const trimmedValue = value.toString().trim();
    
    // Vérifier si la valeur est un nombre pur
    const isNumeric = /^-?\d+([.,]\d+)?$/.test(trimmedValue.replace(/\s/g, ''));
    // Vérifier si la valeur contient des lettres
    const hasLetters = /[a-zA-ZÀ-ÿ]/.test(trimmedValue);

    if (expectedType === 'text_only') {
      // Le champ doit contenir des lettres (ex: NAVIRE, Client, Fournisseur)
      if (isNumeric && !hasLetters) {
        return { 
          isValid: false, 
          error: `Ce champ doit contenir du texte (lettres), pas uniquement des chiffres`
        };
      }
    } else if (expectedType === 'number') {
      // Le champ doit contenir un nombre
      if (hasLetters) {
        return { 
          isValid: false, 
          error: `Ce champ doit contenir un nombre, pas du texte`
        };
      }
    } else if (expectedType === 'date') {
      // Validation basique de format date
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}/,  // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/,  // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/   // DD-MM-YYYY
      ];
      const isValidDate = datePatterns.some(pattern => pattern.test(trimmedValue));
      if (!isValidDate && trimmedValue.length > 0) {
        // Permettre aussi les dates au format datetime-local
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmedValue)) {
          return {
            isValid: false,
            error: `Ce champ doit contenir une date valide`
          };
        }
      }
    }

    return { isValid: true, error: null };
  };

  // Valider toutes les lignes du formulaire
  const validateAllRows = () => {
    const errors = {};
    let hasErrors = false;

    formRows.forEach((row, rowIndex) => {
      columns.forEach(col => {
        const value = row[col.name];
        const { isValid, error } = validateValue(col.name, value);
        
        if (!isValid) {
          const key = `${rowIndex}-${col.name}`;
          errors[key] = error;
          hasErrors = true;
        }
      });
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  useEffect(() => {
    fetchData();
  }, [filename, sheetName]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [columnsRes, dataRes] = await Promise.all([
        filesService.getColumns(decodedFilename, decodedSheetName),
        filesService.getData(decodedFilename, decodedSheetName)
      ]);
      
      // Parser les colonnes si c'est une chaîne JSON
      let cols = columnsRes.data.columns;
      if (typeof cols === 'string') {
        try { cols = JSON.parse(cols); } catch { cols = []; }
      }
      setColumns(Array.isArray(cols) ? cols : []);
      
      // Parser les headers si c'est une chaîne JSON
      let hdrs = dataRes.data.headers;
      if (typeof hdrs === 'string') {
        try { hdrs = JSON.parse(hdrs); } catch { hdrs = []; }
      }
      setHeaders(Array.isArray(hdrs) ? hdrs : []);
      
      // Parser les données si c'est une chaîne JSON
      let dt = dataRes.data.data;
      if (typeof dt === 'string') {
        try { dt = JSON.parse(dt); } catch { dt = []; }
      }
      setData(Array.isArray(dt) ? dt : []);
      
      // Initialiser avec une ligne vide
      initializeEmptyRows(1, Array.isArray(cols) ? cols : []);
      
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeEmptyRows = (count, cols = columns) => {
    const rows = [];
    for (let i = 0; i < count; i++) {
      const row = {};
      cols.forEach(col => {
        row[col.name] = "";
      });
      rows.push(row);
    }
    setFormRows(rows);
  };

  const handleInputChange = (rowIndex, field, value) => {
    setFormRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
      return newRows;
    });

    // Valider la valeur en temps réel
    const { isValid, error } = validateValue(field, value);
    const key = `${rowIndex}-${field}`;
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (!isValid) {
        newErrors[key] = error;
      } else {
        delete newErrors[key];
      }
      return newErrors;
    });
  };

  const addNewRow = () => {
    if (formRows.length >= MAX_ROWS) {
      setError(`Vous ne pouvez pas ajouter plus de ${MAX_ROWS} lignes à la fois`);
      return;
    }
    
    const newRow = {};
    columns.forEach(col => {
      newRow[col.name] = "";
    });
    setFormRows(prev => [...prev, newRow]);
    setError("");
  };

  const removeRow = (rowIndex) => {
    if (formRows.length <= 1) return;
    setFormRows(prev => prev.filter((_, idx) => idx !== rowIndex));
  };

  const duplicateRow = (rowIndex) => {
    if (formRows.length >= MAX_ROWS) {
      setError(`Vous ne pouvez pas ajouter plus de ${MAX_ROWS} lignes à la fois`);
      return;
    }
    
    const rowToDuplicate = { ...formRows[rowIndex] };
    setFormRows(prev => [...prev, rowToDuplicate]);
    setError("");
  };

  // Retourner les colonnes dans leur ordre original (ordre du fichier Excel)
  const getOrderedColumns = () => {
    return columns;
  };

  const renderFormField = (column, rowIndex) => {
    const value = formRows[rowIndex]?.[column.name] || "";
    const errorKey = `${rowIndex}-${column.name}`;
    const hasError = validationErrors[errorKey];
    const expectedType = getExpectedType(column.name);
    
    // Générer un placeholder informatif basé sur le type de données
    const getPlaceholder = () => {
      switch (expectedType) {
        case 'text_only':
          return `Entrez du texte (ex: ${column.sample_values?.[0] || column.name})`;
        case 'number':
          return `Entrez un nombre`;
        case 'date':
          return `JJ/MM/AAAA ou sélectionnez une date`;
        case 'boolean':
          return `Oui ou Non`;
        default:
          // Si on a des exemples de valeurs, les utiliser
          if (column.sample_values && column.sample_values.length > 0) {
            return `Ex: ${column.sample_values[0]}`;
          }
          return column.name;
      }
    };
    
    const inputClassName = hasError ? 'input-error' : '';
    
    const renderInput = () => {
      switch (column.field_type) {
        case 'textarea':
          return (
            <textarea
              value={value}
              onChange={(e) => handleInputChange(rowIndex, column.name, e.target.value)}
              placeholder={getPlaceholder()}
              rows={2}
              className={inputClassName}
            />
          );
        
        case 'datetime-local':
          return (
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleInputChange(rowIndex, column.name, e.target.value)}
              className={inputClassName}
            />
          );
        
        case 'number':
          return (
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => handleInputChange(rowIndex, column.name, e.target.value)}
              placeholder="0"
              className={inputClassName}
            />
          );
        
        case 'select-yesno':
          return (
            <select
              value={value}
              onChange={(e) => handleInputChange(rowIndex, column.name, e.target.value)}
              className={inputClassName}
            >
              <option value="">--</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          );
        
        default:
          // Pour les champs texte, utiliser le type approprié basé sur le nom de la colonne
          const inputType = expectedType === 'number' ? 'text' : 'text';
          return (
            <input
              type={inputType}
              value={value}
              onChange={(e) => handleInputChange(rowIndex, column.name, e.target.value)}
              placeholder={getPlaceholder()}
              className={inputClassName}
            />
          );
      }
    };

    const typeLabel = getTypeLabel(expectedType);
    
    return (
      <div className="field-input-wrapper">
        {renderInput()}
        {hasError && (
          <span className="field-error-message">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {validationErrors[errorKey]}
          </span>
        )}
        {typeLabel && !hasError && (
          <span className={`field-type-hint ${expectedType}`}>
            {typeLabel}
          </span>
        )}
        {column.sample_values && column.sample_values.length > 0 && !hasError && !typeLabel && (
          <span className="field-sample-hint" title={`Exemples: ${column.sample_values.join(', ')}`}>
            Ex: {column.sample_values[0]}
          </span>
        )}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filtrer les lignes vides (au moins un champ rempli)
    const nonEmptyRows = formRows.filter(row => 
      Object.values(row).some(val => val !== "" && val !== null && val !== undefined)
    );

    if (nonEmptyRows.length === 0) {
      setError("Veuillez remplir au moins une ligne");
      return;
    }

    // Valider toutes les lignes avant soumission
    if (!validateAllRows()) {
      setError("Certains champs contiennent des erreurs de validation. Veuillez les corriger.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingRow) {
        // Mode édition - une seule ligne
        await filesService.updateEntry(decodedFilename, decodedSheetName, { ...formRows[0], _row_id: editingRow });
        setSuccess("Entrée modifiée avec succès !");
        setEditingRow(null);
      } else {
        // Ajouter toutes les lignes non vides
        let addedCount = 0;
        for (const row of nonEmptyRows) {
          await filesService.addEntry(decodedFilename, decodedSheetName, row);
          addedCount++;
        }
        setSuccess(`${addedCount} entrée(s) ajoutée(s) avec succès !`);
      }
      
      // Recharger les données
      await fetchData();
      
      // Réinitialiser le formulaire avec une ligne vide
      initializeEmptyRows(1);
      
      // Passer à l'onglet données après 2 secondes
      setTimeout(() => {
        setActiveTab("data");
      }, 1500);
      
    } catch (err) {
      setError("Erreur lors de l'enregistrement");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingRow(row._row_id);
    const editRow = {};
    columns.forEach(col => {
      let value = row[col.name];
      if (value === null || value === undefined) {
        value = "";
      } else if (typeof value === 'number') {
        value = String(value);
      }
      editRow[col.name] = value;
    });
    setFormRows([editRow]);
    setActiveTab("form");
    setSuccess("");
    setError("");
  };

  const handleDelete = async (rowId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      return;
    }

    try {
      await filesService.deleteEntry(decodedFilename, decodedSheetName, rowId);
      await fetchData();
      setSuccess("Entrée supprimée avec succès");
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
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

  const cancelEdit = () => {
    setEditingRow(null);
    initializeEmptyRows(1);
    setError("");
  };

  // Colonnes visibles dans le tableau
  const visibleHeaders = headers.slice(0, 8);
  
  // Colonnes principales pour le formulaire multi-lignes (les plus importantes)
  // Colonnes principales (dans l'ordre original du fichier Excel)
  const mainColumns = getOrderedColumns().slice(0, MAIN_COLUMNS_COUNT);

  if (loading) {
    return (
      <div className="sheet-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Chargement de la feuille "{decodedSheetName}"...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-detail-page">
      {/* Header */}
      <header className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(`/fichier/${encodeURIComponent(decodedFilename)}`)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div className="sheet-info">
            <span className="file-breadcrumb">{decodedFilename.replace('.xlsx', '')}</span>
            <h1>{decodedSheetName}</h1>
            <span>{data.length} entrées • {columns.length} colonnes</span>
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
          {editingRow ? "Modifier" : `Ajouter (${formRows.length}/${MAX_ROWS})`}
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
              <div className="form-header-content">
                <h2>{editingRow ? "Modifier l'entrée" : "Ajouter de nouvelles entrées"}</h2>
                <p>
                  {editingRow 
                    ? `Modifiez les informations de l'entrée sélectionnée`
                    : `Vous pouvez ajouter jusqu'à ${MAX_ROWS} lignes à la fois. ${formRows.length} ligne(s) en cours.`
                  }
                </p>
              </div>
              {!editingRow && formRows.length < MAX_ROWS && (
                <button type="button" className="add-row-btn" onClick={addNewRow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter une ligne
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="entry-form">
              {/* Multi-row form */}
              <div className="multi-row-container">
                {formRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="row-entry">
                    <div className="row-header">
                      <span className="row-number-badge">Ligne {rowIndex + 1}</span>
                      <div className="row-actions">
                        {!editingRow && (
                          <button 
                            type="button" 
                            className="duplicate-row-btn"
                            onClick={() => duplicateRow(rowIndex)}
                            title="Dupliquer cette ligne"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                        )}
                        {formRows.length > 1 && (
                          <button 
                            type="button" 
                            className="remove-row-btn"
                            onClick={() => removeRow(rowIndex)}
                            title="Supprimer cette ligne"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="row-fields">
                      {mainColumns.map((column, colIdx) => (
                        <div 
                          key={colIdx} 
                          className={`field-group ${column.field_type === 'textarea' ? 'full-width' : ''}`}
                        >
                          <label>
                            {column.name}
                            {column.required && <span className="required">*</span>}
                          </label>
                          {renderFormField(column, rowIndex)}
                        </div>
                      ))}
                    </div>

                    {columns.length > MAIN_COLUMNS_COUNT && (
                      <details className="more-fields">
                        <summary>Afficher plus de champs ({columns.length - MAIN_COLUMNS_COUNT} supplémentaires)</summary>
                        <div className="row-fields extra-fields">
                          {getOrderedColumns().slice(MAIN_COLUMNS_COUNT).map((column, colIdx) => (
                            <div 
                              key={colIdx} 
                              className={`field-group ${column.field_type === 'textarea' ? 'full-width' : ''}`}
                            >
                              <label>{column.name}</label>
                              {renderFormField(column, rowIndex)}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              {/* Add more rows button (inline) */}
              {!editingRow && formRows.length < MAX_ROWS && (
                <button type="button" className="add-row-inline-btn" onClick={addNewRow}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter une autre ligne ({formRows.length}/{MAX_ROWS})
                </button>
              )}

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={saving}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {saving 
                    ? "Enregistrement..." 
                    : editingRow 
                      ? "Modifier l'entrée" 
                      : `Enregistrer ${formRows.length} ligne(s)`
                  }
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
              <div className="data-header-top">
                <div>
                  <h2>Données de "{decodedSheetName}"</h2>
                  <p>
                    {getSortedAndFilteredData().length === data.length 
                      ? `${data.length} entrée(s)` 
                      : `${getSortedAndFilteredData().length} / ${data.length} entrée(s)`
                    } • Affichage des {visibleHeaders.length} premières colonnes
                  </p>
                </div>
                
                {/* Barre de recherche */}
                <div className="search-bar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input 
                    type="text"
                    placeholder="Rechercher dans les données..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {(searchTerm || sortColumn) && (
                    <button className="reset-btn" onClick={resetSort} title="Réinitialiser">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Boutons de tri rapide */}
              {hasQuickSortButtons && (
                <div className="quick-sort-buttons">
                  <span className="quick-sort-label">Trier par :</span>
                  
                  {quickSortColumns.navire && (
                    <button 
                      className={`quick-sort-btn ${sortColumn === quickSortColumns.navire ? 'active' : ''}`}
                      onClick={() => handleSort(quickSortColumns.navire)}
                    >
                      🚢 Navire
                      {sortColumn === quickSortColumns.navire && (
                        <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  )}
                  
                  {quickSortColumns.date && (
                    <button 
                      className={`quick-sort-btn ${sortColumn === quickSortColumns.date ? 'active' : ''}`}
                      onClick={() => handleSort(quickSortColumns.date)}
                    >
                      📅 Date B/L
                      {sortColumn === quickSortColumns.date && (
                        <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Indication du tri actif */}
              {sortColumn && (
                <div className="sort-indicator">
                  <span>Trié par: <strong>{sortColumn}</strong></span>
                  <span className="sort-direction">
                    {sortDirection === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
                  </span>
                </div>
              )}
            </div>

            {data.length === 0 ? (
              <div className="empty-data">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <h3>Aucune donnée</h3>
                <p>Ajoutez de nouvelles entrées en utilisant le formulaire</p>
                <button 
                  className="add-first-btn"
                  onClick={() => setActiveTab("form")}
                >
                  Ajouter des entrées
                </button>
              </div>
            ) : getSortedAndFilteredData().length === 0 ? (
              <div className="empty-data">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <h3>Aucun résultat</h3>
                <p>Aucune ligne ne correspond à "{searchTerm}"</p>
                <button 
                  className="add-first-btn"
                  onClick={() => setSearchTerm('')}
                >
                  Effacer la recherche
                </button>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      {visibleHeaders.map((header, idx) => (
                        <th 
                          key={idx} 
                          title={`Cliquez pour trier par ${header}`}
                          className={`sortable-header ${sortColumn === header ? 'sorted' : ''}`}
                          onClick={() => handleSort(header)}
                        >
                          <span className="header-content">
                            {header.length > 15 ? header.substring(0, 15) + '...' : header}
                            <span className="sort-icon">
                              {sortColumn === header ? (
                                sortDirection === 'asc' ? '▲' : '▼'
                              ) : (
                                <span className="sort-hint">⇅</span>
                              )}
                            </span>
                          </span>
                        </th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedAndFilteredData().map((row, rowIdx) => (
                      <tr key={row._row_id || rowIdx}>
                        <td className="row-number">{rowIdx + 1}</td>
                        {visibleHeaders.map((header, colIdx) => (
                          <td key={colIdx} title={row[header] !== null ? String(row[header]) : ''}>
                            {row[header] !== null && row[header] !== undefined 
                              ? String(row[header]).substring(0, 30) + (String(row[header]).length > 30 ? '...' : '')
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
