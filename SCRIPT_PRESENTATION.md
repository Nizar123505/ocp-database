# 📊 Script de Présentation - Application de Gestion de Bases de Données OCP

---

## 🎬 INTRODUCTION (30 secondes)

> Bonjour et bienvenue dans cette présentation de l'application de **Gestion de Bases de Données** développée pour le **Port de Jorf Lasfar - OCP**.
>
> Cette application permet de gérer, consulter et modifier les données d'import et d'export du port de manière simple et sécurisée, en utilisant des fichiers Excel comme support de données.

---

## 🔐 1. AUTHENTIFICATION (1 minute)

### Écran de connexion

> L'application commence par un **écran de connexion sécurisé**.
>
> Chaque utilisateur possède :
> - Un **nom d'utilisateur**
> - Un **mot de passe**
>
> Le système utilise des **tokens JWT** pour sécuriser les sessions. Cela signifie que :
> - Votre session reste active même si vous rafraîchissez la page
> - Après une période d'inactivité, vous serez automatiquement déconnecté pour des raisons de sécurité

### Types d'utilisateurs

> Il existe **deux types d'utilisateurs** :
>
> 1. **Utilisateur standard** : peut consulter, ajouter et modifier des données
> 2. **Administrateur** : en plus des droits standards, peut gérer les utilisateurs et supprimer définitivement des fichiers

---

## 🏠 2. PAGE D'ACCUEIL (2 minutes)

### Vue d'ensemble

> Une fois connecté, vous arrivez sur la **page d'accueil** qui affiche :
>
> - Votre nom en haut à droite
> - Les **4 icônes de fonctionnalités** : Bases de données, Fichiers Excel, Formulaires, Port OCP
> - La **liste des fichiers Excel** disponibles

### Carte de fichier

> Chaque fichier est représenté par une **carte** qui affiche :
>
> - 📊 **L'icône** : différente selon le type (Import/Export)
> - 📝 **Le nom** du fichier
> - 📑 **Le nombre de feuilles** (ex: 3 feuilles)
> - 📈 **Le nombre d'entrées** totales
> - 💾 **La taille** du fichier
> - 📅 **La date de dernière modification**
> - 👤 **Le dernier utilisateur** qui a modifié le fichier

### Actions disponibles

> Depuis la page d'accueil, vous pouvez :
>
> 1. **📥 Importer un fichier** : Bouton "Importer" pour ajouter un fichier Excel existant
> 2. **➕ Créer un fichier** : Bouton "Nouveau fichier" pour créer un fichier vierge
> 3. **🗄️ Voir les archives** : Accéder aux fichiers supprimés
> 4. **👥 Gérer les utilisateurs** : (Admins uniquement)

---

## 📁 3. GESTION DES FICHIERS (2 minutes)

### Importer un fichier existant

> Pour **importer un fichier Excel** depuis votre ordinateur :
>
> 1. Cliquez sur le bouton **"Importer"**
> 2. Sélectionnez un fichier **.xlsx** ou **.xls**
> 3. Le système :
>    - Vérifie que c'est un fichier Excel valide
>    - Compte les feuilles et les entrées
>    - Stocke le fichier dans le système
>    - Met en cache les données pour un accès rapide
>
> ✅ Le fichier apparaît immédiatement dans la liste

### Créer un nouveau fichier

> Pour **créer un nouveau fichier** :
>
> 1. Cliquez sur **"Nouveau fichier"**
> 2. Entrez le **nom du fichier**
> 3. Définissez les **colonnes** :
>    - Nom de la colonne
>    - Type (texte, nombre, date, etc.)
>    - Obligatoire ou non
> 4. Cliquez sur **"Créer"**
>
> ✅ Le fichier est créé avec une feuille "Données" contenant vos colonnes

### Archiver un fichier

> Pour **supprimer/archiver un fichier** :
>
> 1. Cliquez sur l'icône 🗑️ sur la carte du fichier
> 2. Confirmez l'archivage
>
> ⚠️ Le fichier n'est **pas supprimé définitivement** ! Il est déplacé dans les archives et peut être restauré.

---

## 📑 4. CONSULTATION DES FEUILLES (1 minute)

### Liste des feuilles

> En cliquant sur un fichier, vous accédez à la **liste de ses feuilles**.
>
> Chaque feuille affiche :
> - 📋 Son **nom**
> - 🔢 Le **nombre de colonnes**
> - 📊 Le **nombre d'entrées**

### Navigation

> Vous pouvez :
> - Cliquer sur une feuille pour voir ses données
> - Utiliser le fil d'Ariane pour revenir en arrière
> - Télécharger le fichier Excel complet

---

## 📊 5. VISUALISATION ET ÉDITION DES DONNÉES (3 minutes)

### Tableau de données

> En ouvrant une feuille, vous voyez un **tableau interactif** avec :
>
> - Les **en-têtes de colonnes** en haut
> - Les **données** organisées en lignes
> - Un **numéro de ligne** pour chaque entrée

### Ajouter une entrée

> Pour **ajouter une nouvelle entrée** :
>
> 1. Cliquez sur le bouton **"Ajouter une entrée"**
> 2. Un formulaire s'affiche avec tous les champs
> 3. Remplissez les informations :
>    - Les champs **obligatoires** sont marqués d'un astérisque (*)
>    - Les types de champs s'adaptent automatiquement :
>      - 📅 **Dates** : sélecteur de date/heure
>      - 🔢 **Nombres** : clavier numérique
>      - 📝 **Texte** : champ texte libre
>      - ☑️ **Oui/Non** : liste déroulante
> 4. Cliquez sur **"Enregistrer"**
>
> ✅ L'entrée est ajoutée au fichier Excel ET au cache

### Modifier une entrée

> Pour **modifier une entrée existante** :
>
> 1. Cliquez sur la ligne à modifier
> 2. Le formulaire s'ouvre avec les valeurs actuelles
> 3. Modifiez les champs souhaités
> 4. Cliquez sur **"Enregistrer"**
>
> ✅ Les modifications sont enregistrées dans le fichier Excel

### Supprimer une entrée

> Pour **supprimer une entrée** :
>
> 1. Cliquez sur l'icône de suppression (🗑️) de la ligne
> 2. Confirmez la suppression
>
> ⚠️ Cette action est **irréversible** pour les entrées individuelles

---

## 🗄️ 6. SYSTÈME D'ARCHIVES (1 minute)

### Accéder aux archives

> Cliquez sur le bouton **"🗄️ Archives"** dans l'en-tête pour voir les fichiers archivés.

### Informations affichées

> Pour chaque fichier archivé, vous voyez :
> - 📁 Le **nom** du fichier
> - 📅 La **date d'archivage**
> - 👤 **Qui** a archivé le fichier
> - 📊 Le **nombre de feuilles et d'entrées** qu'il contenait

### Restaurer un fichier

> Pour **restaurer un fichier** :
>
> 1. Cliquez sur le bouton **"Restaurer"**
> 2. Le fichier est remis dans la liste principale
>
> ✅ Toutes les données sont récupérées !

---

## 👥 7. GESTION DES UTILISATEURS (Admin uniquement) (1 minute)

### Accès

> Les administrateurs voient un bouton **"👥 Utilisateurs"** dans l'en-tête.

### Fonctionnalités

> Depuis cette page, un admin peut :
>
> 1. **Voir** la liste de tous les utilisateurs
> 2. **Créer** un nouvel utilisateur
> 3. **Modifier** les informations d'un utilisateur
> 4. **Désactiver** un compte
> 5. **Promouvoir** un utilisateur en administrateur

---

## ⚡ 8. SYSTÈME DE CACHE (30 secondes)

### Pourquoi un cache ?

> Pour garantir des **performances optimales**, l'application utilise un système de cache :
>
> - Les **métadonnées** des fichiers sont stockées en base de données
> - Les **données des feuilles** sont également mises en cache
> - À chaque accès, le système vérifie si le fichier a été modifié
>
> 🚀 Résultat : l'affichage est **quasi-instantané**, même pour des fichiers volumineux !

---

## 🔄 9. FLUX DE TRAVAIL TYPIQUE (1 minute)

### Scénario : Ajouter un nouveau navire à l'import

> 1. **Connexion** avec vos identifiants
> 2. **Cliquez** sur le fichier "Base de données Import 2025"
> 3. **Sélectionnez** la feuille appropriée (ex: "Navires")
> 4. **Cliquez** sur "Ajouter une entrée"
> 5. **Remplissez** les informations :
>    - Nom du navire
>    - Date d'arrivée
>    - Tonnage
>    - Client
>    - etc.
> 6. **Enregistrez**
>
> ✅ Le navire est maintenant dans la base de données !

---

## 🏁 CONCLUSION (30 secondes)

> Cette application offre une solution **simple et efficace** pour :
>
> - ✅ Centraliser les données Import/Export
> - ✅ Permettre un accès sécurisé multi-utilisateurs
> - ✅ Conserver la compatibilité avec Excel
> - ✅ Tracer les modifications
> - ✅ Protéger les données avec le système d'archivage
>
> **Merci de votre attention !**
>
> Des questions ?

---

## 📚 ANNEXE : Raccourcis et astuces

| Action | Comment faire |
|--------|---------------|
| Retour à l'accueil | Cliquer sur le logo ou "Accueil" |
| Rafraîchir les données | Recharger la page (F5) |
| Déconnexion | Bouton "Déconnexion" en haut à droite |
| Télécharger un fichier | Icône de téléchargement sur la page des feuilles |

---

*Document généré pour la formation des utilisateurs - OCP Port de Jorf Lasfar*


