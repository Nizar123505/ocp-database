import axios from "axios";

// URL de l'API - utilise la variable d'environnement en production
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Services pour la gestion des fichiers Excel multiples
export const filesService = {
  // Récupérer tous les fichiers Excel disponibles
  getFiles: () => api.get("/files/"),
  
  // Créer un nouveau fichier Excel
  createFile: (data) => api.post("/files/create/", data),
  
  // Importer un fichier Excel existant
  importFile: (formData) => api.post("/files/import/", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  
  // Supprimer un fichier Excel
  deleteFile: (filename) => api.delete(`/files/${encodeURIComponent(filename)}/delete/`),
  
  // Récupérer les feuilles d'un fichier
  getSheets: (filename) => api.get(`/files/${encodeURIComponent(filename)}/sheets/`),
  
  // Ajouter une nouvelle feuille à un fichier
  addSheet: (filename, data) => api.post(`/files/${encodeURIComponent(filename)}/sheets/create/`, data),
  
  // Récupérer les colonnes d'une feuille
  getColumns: (filename, sheetName) => 
    api.get(`/files/${encodeURIComponent(filename)}/sheets/${encodeURIComponent(sheetName)}/columns/`),
  
  // Récupérer les données d'une feuille
  getData: (filename, sheetName) => 
    api.get(`/files/${encodeURIComponent(filename)}/sheets/${encodeURIComponent(sheetName)}/data/`),
  
  // Ajouter une entrée
  addEntry: (filename, sheetName, data) => 
    api.post(`/files/${encodeURIComponent(filename)}/sheets/${encodeURIComponent(sheetName)}/add/`, data),
  
  // Modifier une entrée
  updateEntry: (filename, sheetName, data) => 
    api.put(`/files/${encodeURIComponent(filename)}/sheets/${encodeURIComponent(sheetName)}/update/`, data),
  
  // Supprimer une entrée
  deleteEntry: (filename, sheetName, rowId) => 
    api.delete(`/files/${encodeURIComponent(filename)}/sheets/${encodeURIComponent(sheetName)}/delete/?row_id=${rowId}`),
  
  // Télécharger un fichier
  download: (filename) => 
    api.get(`/files/${encodeURIComponent(filename)}/download/`, { responseType: 'blob' }),
  
  // Gestion des fichiers archivés
  getArchivedFiles: () => api.get("/files/archived/"),
  restoreFile: (fileId) => api.post(`/files/archived/${fileId}/restore/`),
  permanentDeleteFile: (fileId) => api.delete(`/files/archived/${fileId}/permanent-delete/`),
};

// Service utilisateur
export const userService = {
  getCurrentUser: () => api.get("/me/"),
  
  // Gestion des utilisateurs
  getAllUsers: () => api.get("/users/"),
  createUser: (data) => api.post("/users/create/", data),
  updateUser: (userId, data) => api.put(`/users/${userId}/update/`, data),
  deleteUser: (userId) => api.delete(`/users/${userId}/delete/`),
  changePassword: (data) => api.post("/users/change-password/", data),
};

export default api;
