from django.contrib import admin
from django.utils.html import format_html
from .models import ExcelFile, ExcelColumn, FileCache, SheetDataCache


class ExcelColumnInline(admin.TabularInline):
    model = ExcelColumn
    extra = 1


@admin.register(ExcelFile)
class ExcelFileAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_by', 'entries_count', 'created_at', 'updated_at']
    list_filter = ['created_by', 'created_at']
    search_fields = ['name', 'description']
    inlines = [ExcelColumnInline]
    readonly_fields = ['entries_count', 'created_at', 'updated_at']


@admin.register(ExcelColumn)
class ExcelColumnAdmin(admin.ModelAdmin):
    list_display = ['name', 'excel_file', 'field_type', 'required', 'order']
    list_filter = ['field_type', 'required', 'excel_file']
    search_fields = ['name']


class SheetDataCacheInline(admin.TabularInline):
    """Affiche les feuilles d'un fichier en inline"""
    model = SheetDataCache
    extra = 0
    readonly_fields = ['sheet_name', 'rows_count', 'headers_display', 'cached_at']
    fields = ['sheet_name', 'rows_count', 'headers_display', 'cached_at']
    can_delete = False
    
    def headers_display(self, obj):
        if obj.headers:
            return ", ".join(obj.headers[:5]) + ("..." if len(obj.headers) > 5 else "")
        return "-"
    headers_display.short_description = "Colonnes"
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(FileCache)
class FileCacheAdmin(admin.ModelAdmin):
    """Administration des fichiers Excel (Cache)"""
    list_display = [
        'name', 
        'filename', 
        'sheets_count', 
        'total_entries', 
        'file_size_display',
        'file_modified',
        'last_modified_by',
        'status_display'
    ]
    list_filter = ['is_deleted', 'sheets_count', 'last_modified_by']
    search_fields = ['name', 'filename']
    readonly_fields = [
        'filename', 
        'file_path', 
        'sheets_count', 
        'sheets_list_display',
        'sheets_details_display',
        'total_entries', 
        'file_size_display',
        'file_modified', 
        'cached_at',
        'last_modified_by',
        'is_deleted',
        'deleted_at',
        'deleted_by',
        'archived_path'
    ]
    inlines = [SheetDataCacheInline]
    
    fieldsets = (
        ('📁 Informations du fichier', {
            'fields': ('name', 'filename', 'file_path', 'file_size_display')
        }),
        ('📊 Contenu', {
            'fields': ('sheets_count', 'sheets_list_display', 'total_entries', 'sheets_details_display')
        }),
        ('📅 Dates', {
            'fields': ('file_modified', 'cached_at', 'last_modified_by')
        }),
        ('🗄️ Archive', {
            'fields': ('is_deleted', 'deleted_at', 'deleted_by', 'archived_path'),
            'classes': ('collapse',)
        }),
    )
    
    def file_size_display(self, obj):
        size = obj.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"
    file_size_display.short_description = "Taille"
    
    def sheets_list_display(self, obj):
        if obj.sheets_json:
            return ", ".join(obj.sheets_json)
        return "-"
    sheets_list_display.short_description = "Liste des feuilles"
    
    def sheets_details_display(self, obj):
        if obj.sheets_details:
            html = "<table style='border-collapse: collapse; width: 100%;'>"
            html += "<tr style='background: #f0f0f0;'><th style='padding: 8px; border: 1px solid #ddd;'>Feuille</th><th style='padding: 8px; border: 1px solid #ddd;'>Colonnes</th><th style='padding: 8px; border: 1px solid #ddd;'>Entrées</th></tr>"
            for sheet_name, details in obj.sheets_details.items():
                html += f"<tr><td style='padding: 8px; border: 1px solid #ddd;'>{sheet_name}</td>"
                html += f"<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{details.get('columns', 0)}</td>"
                html += f"<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{details.get('entries', 0)}</td></tr>"
            html += "</table>"
            return format_html(html)
        return "-"
    sheets_details_display.short_description = "Détails des feuilles"
    
    def status_display(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: red;">🗄️ Archivé</span>')
        return format_html('<span style="color: green;">✅ Actif</span>')
    status_display.short_description = "Status"


@admin.register(SheetDataCache)
class SheetDataCacheAdmin(admin.ModelAdmin):
    """Administration des données des feuilles Excel"""
    list_display = [
        'sheet_name',
        'file_cache',
        'rows_count',
        'columns_count',
        'cached_at'
    ]
    list_filter = ['file_cache', 'cached_at']
    search_fields = ['sheet_name', 'file_cache__filename']
    readonly_fields = [
        'file_cache',
        'sheet_name',
        'headers_display',
        'columns_info_display',
        'data_preview',
        'rows_count',
        'cached_at'
    ]
    
    fieldsets = (
        ('📑 Informations de la feuille', {
            'fields': ('file_cache', 'sheet_name', 'rows_count', 'cached_at')
        }),
        ('📋 Colonnes', {
            'fields': ('headers_display', 'columns_info_display')
        }),
        ('📊 Aperçu des données (10 premières lignes)', {
            'fields': ('data_preview',)
        }),
    )
    
    def columns_count(self, obj):
        return len(obj.headers) if obj.headers else 0
    columns_count.short_description = "Colonnes"
    
    def headers_display(self, obj):
        if obj.headers:
            html = "<ul style='margin: 0; padding-left: 20px;'>"
            for header in obj.headers:
                html += f"<li>{header}</li>"
            html += "</ul>"
            return format_html(html)
        return "-"
    headers_display.short_description = "En-têtes"
    
    def columns_info_display(self, obj):
        if obj.columns_info:
            html = "<table style='border-collapse: collapse; width: 100%;'>"
            html += "<tr style='background: #f0f0f0;'>"
            html += "<th style='padding: 8px; border: 1px solid #ddd;'>#</th>"
            html += "<th style='padding: 8px; border: 1px solid #ddd;'>Colonne</th>"
            html += "<th style='padding: 8px; border: 1px solid #ddd;'>Type</th>"
            html += "<th style='padding: 8px; border: 1px solid #ddd;'>Obligatoire</th>"
            html += "</tr>"
            for col in obj.columns_info:
                required = "✅" if col.get('required') else ""
                html += f"<tr>"
                html += f"<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{col.get('index', '-')}</td>"
                html += f"<td style='padding: 8px; border: 1px solid #ddd;'>{col.get('name', '-')}</td>"
                html += f"<td style='padding: 8px; border: 1px solid #ddd;'>{col.get('field_type', '-')}</td>"
                html += f"<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{required}</td>"
                html += f"</tr>"
            html += "</table>"
            return format_html(html)
        return "-"
    columns_info_display.short_description = "Informations des colonnes"
    
    def data_preview(self, obj):
        if obj.data:
            # Afficher les 10 premières lignes
            preview_data = obj.data[:10]
            headers = obj.headers or []
            
            html = f"<p><strong>Total: {obj.rows_count} lignes</strong> (affichage des 10 premières)</p>"
            html += "<div style='overflow-x: auto;'>"
            html += "<table style='border-collapse: collapse; font-size: 12px;'>"
            
            # En-têtes
            html += "<tr style='background: #2E7D32; color: white;'>"
            html += "<th style='padding: 6px; border: 1px solid #ddd;'>Ligne</th>"
            for header in headers[:10]:  # Limiter à 10 colonnes
                html += f"<th style='padding: 6px; border: 1px solid #ddd; white-space: nowrap;'>{header[:20]}</th>"
            if len(headers) > 10:
                html += f"<th style='padding: 6px; border: 1px solid #ddd;'>...</th>"
            html += "</tr>"
            
            # Données
            for row in preview_data:
                row_id = row.get('_row_id', '-')
                html += f"<tr>"
                html += f"<td style='padding: 6px; border: 1px solid #ddd; text-align: center; background: #f5f5f5;'>{row_id}</td>"
                for header in headers[:10]:
                    value = row.get(header, '')
                    if value is None:
                        value = ''
                    value_str = str(value)[:30]
                    html += f"<td style='padding: 6px; border: 1px solid #ddd; white-space: nowrap;'>{value_str}</td>"
                if len(headers) > 10:
                    html += f"<td style='padding: 6px; border: 1px solid #ddd;'>...</td>"
                html += "</tr>"
            
            html += "</table></div>"
            return format_html(html)
        return "Aucune donnée"
    data_preview.short_description = "Aperçu des données"
