import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/api";
import "./Users.css";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    is_staff: false,
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data.users);
    } catch (err) {
      console.error("Erreur:", err);
      // Vérifier si l'erreur est un accès refusé (403)
      if (err.response?.status === 403) {
        setAccessDenied(true);
        setError("Accès refusé. Seuls les administrateurs peuvent accéder à cette page.");
      } else {
        setError("Impossible de charger les utilisateurs");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
      is_staff: false,
      is_active: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setFormData({
      username: user.username,
      password: "", // Ne pas remplir le mot de passe
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      is_staff: user.is_staff,
      is_active: user.is_active
    });
    setModalMode("edit");
    setEditingUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (modalMode === "create") {
        await userService.createUser(formData);
        setSuccess("Utilisateur créé avec succès !");
      } else {
        // Pour la modification, n'envoyer le mot de passe que s'il est rempli
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await userService.updateUser(editingUser.id, updateData);
        setSuccess("Utilisateur modifié avec succès !");
      }
      
      closeModal();
      fetchUsers();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.response?.data?.error || "Une erreur est survenue");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      setSuccess(`Utilisateur "${user.username}" supprimé avec succès`);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.response?.data?.error || "Impossible de supprimer l'utilisateur");
    }
  };

  if (loading) {
    return <div className="users-loading">Chargement des utilisateurs...</div>;
  }

  // Page d'accès refusé pour les non-administrateurs
  if (accessDenied) {
    return (
      <div className="users-container">
        <div className="access-denied">
          <div className="access-denied-icon">🔒</div>
          <h1>Accès Refusé</h1>
          <p>Seuls les administrateurs peuvent accéder à la gestion des utilisateurs.</p>
          <button onClick={() => navigate("/accueil")} className="back-home-btn">
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>👥 Gestion des Utilisateurs</h1>
        <div className="users-header-actions">
          <button onClick={() => navigate("/accueil")} className="back-btn">
            ← Retour
          </button>
          <button onClick={openCreateModal} className="create-user-btn">
            + Nouvel utilisateur
          </button>
        </div>
      </div>

      {error && <div className="users-error">{error}</div>}
      {success && <div className="users-success">{success}</div>}

      <div className="users-stats">
        <div className="stat-card">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Utilisateurs total</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => u.is_active).length}</span>
          <span className="stat-label">Actifs</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => u.is_staff).length}</span>
          <span className="stat-label">Administrateurs</span>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom d'utilisateur</th>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Admin</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={!user.is_active ? "inactive-user" : ""}>
                <td>{user.id}</td>
                <td className="username-cell">
                  <span className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  {user.username}
                </td>
                <td>{user.full_name}</td>
                <td>{user.email || "-"}</td>
                <td>
                  <span className={`status-badge ${user.is_active ? "active" : "inactive"}`}>
                    {user.is_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td>
                  {user.is_staff ? (
                    <span className="admin-badge">Admin</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "Jamais"
                  }
                </td>
                <td className="actions-cell">
                  <button 
                    onClick={() => openEditModal(user)} 
                    className="edit-btn"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(user)} 
                    className="delete-btn"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === "create" ? "Créer un utilisateur" : "Modifier l'utilisateur"}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Nom d'utilisateur *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: jean.dupont"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">
                    Mot de passe {modalMode === "create" ? "*" : "(laisser vide pour ne pas modifier)"}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={modalMode === "create"}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Prénom</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Ex: Jean"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Nom</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Ex: Dupont"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ex: jean.dupont@ocp.ma"
                />
              </div>

              <div className="form-row checkboxes">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Compte actif
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_staff"
                      checked={formData.is_staff}
                      onChange={handleInputChange}
                    />
                    Administrateur
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  {modalMode === "create" ? "Créer" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


