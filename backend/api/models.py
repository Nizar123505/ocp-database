from django.db import models
from django.contrib.auth.models import User


class FileCache(models.Model):
    """Cache des métadonnées des fichiers Excel pour un chargement rapide"""
    filename = models.CharField(max_length=500, unique=True, verbose_name="Nom du fichier")
    name = models.CharField(max_length=255, verbose_name="Nom affiché")
    file_path = models.CharField(max_length=1000, verbose_name="Chemin du fichier")
    sheets_count = models.IntegerField(default=0, verbose_name="Nombre de feuilles")
    sheets_json = models.JSONField(default=list, verbose_name="Liste des feuilles")
    sheets_details = models.JSONField(default=dict, verbose_name="Détails des feuilles")
    total_entries = models.IntegerField(default=0, verbose_name="Nombre d'entrées")
    file_size = models.BigIntegerField(default=0, verbose_name="Taille du fichier")
    file_modified = models.DateTimeField(verbose_name="Date de modification du fichier")
    cached_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise en cache")
    # Suivi du dernier utilisateur qui a modifié le fichier
    last_modified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_files',
        verbose_name="Dernier modifié par"
    )
    
    # Champs pour la suppression douce (soft delete)
    is_deleted = models.BooleanField(default=False, verbose_name="Supprimé")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")
    deleted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_files',
        verbose_name="Supprimé par"
    )
    # Chemin d'archive pour le fichier supprimé
    archived_path = models.CharField(max_length=1000, blank=True, null=True, verbose_name="Chemin d'archive")
    
    class Meta:
        verbose_name = "Cache de fichier"
        verbose_name_plural = "Cache des fichiers"
        ordering = ['-file_modified']
    
    def __str__(self):
        return self.filename


class SheetDataCache(models.Model):
    """Cache des données des feuilles Excel"""
    file_cache = models.ForeignKey(FileCache, on_delete=models.CASCADE, related_name='sheet_data')
    sheet_name = models.CharField(max_length=255, verbose_name="Nom de la feuille")
    headers = models.JSONField(default=list, verbose_name="En-têtes des colonnes")
    columns_info = models.JSONField(default=list, verbose_name="Infos des colonnes")
    data = models.JSONField(default=list, verbose_name="Données de la feuille")
    rows_count = models.IntegerField(default=0, verbose_name="Nombre de lignes")
    cached_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise en cache")
    
    class Meta:
        verbose_name = "Cache de feuille"
        verbose_name_plural = "Cache des feuilles"
        unique_together = ['file_cache', 'sheet_name']
    
    def __str__(self):
        return f"{self.file_cache.filename} - {self.sheet_name}"


class ExcelFile(models.Model):
    """Modèle pour stocker les métadonnées des fichiers Excel"""
    name = models.CharField(max_length=255, verbose_name="Nom du fichier")
    description = models.TextField(blank=True, verbose_name="Description")
    file = models.FileField(upload_to='excel_files/', verbose_name="Fichier Excel")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='excel_files',
        verbose_name="Créé par"
    )
    entries_count = models.IntegerField(default=0, verbose_name="Nombre d'entrées")
    
    class Meta:
        verbose_name = "Fichier Excel"
        verbose_name_plural = "Fichiers Excel"
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.name


class ExcelColumn(models.Model):
    """Structure des colonnes d'un fichier Excel"""
    FIELD_TYPES = [
        ('text', 'Texte'),
        ('number', 'Nombre'),
        ('date', 'Date'),
        ('email', 'Email'),
        ('phone', 'Téléphone'),
        ('select', 'Liste déroulante'),
        ('radio', 'Choix unique'),
        ('checkbox', 'Choix multiples'),
        ('textarea', 'Zone de texte'),
    ]
    
    excel_file = models.ForeignKey(
        ExcelFile, 
        on_delete=models.CASCADE, 
        related_name='columns',
        verbose_name="Fichier Excel"
    )
    name = models.CharField(max_length=255, verbose_name="Nom de la colonne")
    field_type = models.CharField(
        max_length=20, 
        choices=FIELD_TYPES, 
        default='text',
        verbose_name="Type de champ"
    )
    required = models.BooleanField(default=False, verbose_name="Obligatoire")
    options = models.JSONField(
        blank=True, 
        null=True, 
        verbose_name="Options (pour select, radio, checkbox)"
    )
    order = models.IntegerField(default=0, verbose_name="Ordre d'affichage")
    
    class Meta:
        verbose_name = "Colonne Excel"
        verbose_name_plural = "Colonnes Excel"
        ordering = ['order']
    
    def __str__(self):
        return f"{self.excel_file.name} - {self.name}"
