"""
Script pour rafraîchir le cache avec l'analyse des types de colonnes
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import FileCache, SheetDataCache
from api.views import update_file_cache, cache_sheet_data
import glob

EXCEL_FOLDER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def refresh_all_caches():
    """Rafraichir tous les caches avec l'analyse des types de colonnes"""
    print("=" * 60)
    print("Rafraichissement du cache avec analyse des types de colonnes")
    print("=" * 60)
    
    # Supprimer les anciens caches de donnees de feuilles
    deleted_sheets = SheetDataCache.objects.all().delete()
    print(f"\n[OK] {deleted_sheets[0]} caches de feuilles supprimes")
    
    # Recuperer tous les fichiers Excel
    pattern = os.path.join(EXCEL_FOLDER, '*.xlsx')
    files = glob.glob(pattern)
    
    print(f"\n[FICHIERS] {len(files)} fichiers Excel trouves")
    
    for filepath in files:
        filename = os.path.basename(filepath)
        if filename.startswith('~$'):
            continue
            
        print(f"\n[FICHIER] Traitement de: {filename}")
        
        # Mettre a jour le cache du fichier
        file_cache = update_file_cache(filepath, filename)
        
        if file_cache:
            print(f"   [OK] Cache fichier mis a jour")
            
            # Mettre en cache chaque feuille avec analyse des types
            for sheet_name in file_cache.sheets_json:
                sheet_cache = cache_sheet_data(file_cache, filepath, sheet_name)
                
                if sheet_cache:
                    # Afficher les types detectes
                    print(f"   [FEUILLE] {sheet_name}")
                    
                    for col_info in sheet_cache.columns_info[:5]:  # Afficher les 5 premieres colonnes
                        data_type = col_info.get('data_type', 'any')
                        name = col_info.get('name', '?')
                        samples = col_info.get('sample_values', [])
                        sample_str = f" (ex: {samples[0]})" if samples else ""
                        print(f"      - {name}: {data_type}{sample_str}")
                    
                    if len(sheet_cache.columns_info) > 5:
                        print(f"      ... et {len(sheet_cache.columns_info) - 5} autres colonnes")
                else:
                    print(f"   [ERREUR] cache feuille: {sheet_name}")
        else:
            print(f"   [ERREUR] cache fichier")
    
    print("\n" + "=" * 60)
    print("[TERMINE] Rafraichissement termine!")
    print("=" * 60)

if __name__ == '__main__':
    refresh_all_caches()

