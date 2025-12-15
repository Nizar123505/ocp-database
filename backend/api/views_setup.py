"""
Vue de setup optimisée pour charger rapidement les données
"""
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from api.models import FileCache, SheetDataCache
import json
import os


@api_view(['GET'])
@permission_classes([AllowAny])
def setup_database(request):
    """
    Endpoint optimisé pour initialiser la base de données.
    GET /api/setup/ - Crée les utilisateurs
    GET /api/setup/?load_data=true - Crée les utilisateurs ET charge les données (RAPIDE)
    """
    load_data = request.GET.get('load_data', 'false').lower() == 'true'
    
    results = {
        'users_created': [],
        'users_updated': [],
        'files_created': 0,
        'sheets_created': 0,
        'errors': []
    }
    
    # Créer les utilisateurs
    users_to_create = [
        {'username': 'Nizar', 'email': 'nizar@ocp.ma', 'password': 'nizar', 'is_superuser': True, 'is_staff': True},
        {'username': 'Ahmed', 'email': 'admin@example.com', 'password': 'ahmed', 'is_superuser': True, 'is_staff': True},
        {'username': 'Zineb', 'email': 'zineb@gmail.com', 'password': 'zineb', 'is_superuser': False, 'is_staff': False}
    ]
    
    for user_data in users_to_create:
        try:
            if User.objects.filter(username=user_data['username']).exists():
                user = User.objects.get(username=user_data['username'])
                user.set_password(user_data['password'])
                user.is_superuser = user_data['is_superuser']
                user.is_staff = user_data['is_staff']
                user.save()
                results['users_updated'].append(user_data['username'])
            else:
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password']
                )
                user.is_superuser = user_data['is_superuser']
                user.is_staff = user_data['is_staff']
                user.save()
                results['users_created'].append(user_data['username'])
        except Exception as e:
            results['errors'].append(f"User {user_data['username']}: {str(e)}")
    
    # Charger les données si demandé - VERSION OPTIMISÉE
    if load_data:
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data_export.json')
        
        if os.path.exists(json_path):
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Utiliser une transaction pour plus de rapidité
                with transaction.atomic():
                    # Supprimer les anciennes données pour éviter les doublons
                    SheetDataCache.objects.all().delete()
                    FileCache.objects.all().delete()
                    
                    # Mapping des anciens IDs vers les nouveaux objets
                    file_id_mapping = {}
                    
                    # BULK CREATE pour les fichiers (très rapide)
                    files_to_create = []
                    for file_data in data.get('files', []):
                        fc = FileCache(
                            name=file_data['name'],
                            filename=file_data['filename'],
                            sheets_json=file_data.get('sheets_json', '[]'),
                            sheets_count=file_data.get('sheets_count', 0),
                            total_entries=file_data.get('total_entries', 0),
                            file_size=file_data.get('file_size', 0),
                            sheets_details=file_data.get('sheets_details', '{}'),
                            is_deleted=file_data.get('is_deleted', False)
                        )
                        files_to_create.append((file_data['id'], fc))
                    
                    # Créer tous les fichiers d'un coup
                    for old_id, fc in files_to_create:
                        fc.save()
                        file_id_mapping[old_id] = fc
                        results['files_created'] += 1
                    
                    # BULK CREATE pour les feuilles (très rapide)
                    sheets_to_create = []
                    for sheet_data in data.get('sheets', []):
                        old_file_id = sheet_data.get('file_cache_id')
                        file_cache = file_id_mapping.get(old_file_id)
                        
                        if file_cache:
                            sdc = SheetDataCache(
                                file_cache=file_cache,
                                sheet_name=sheet_data['sheet_name'],
                                headers=sheet_data.get('headers', '[]'),
                                columns_info=sheet_data.get('columns_info', '[]'),
                                data=sheet_data.get('data', '[]'),
                                rows_count=sheet_data.get('rows_count', 0)
                            )
                            sheets_to_create.append(sdc)
                    
                    # Créer toutes les feuilles d'un coup
                    if sheets_to_create:
                        SheetDataCache.objects.bulk_create(sheets_to_create)
                        results['sheets_created'] = len(sheets_to_create)
                        
            except Exception as e:
                results['errors'].append(f"Data load error: {str(e)}")
        else:
            results['errors'].append(f"data_export.json not found")
    
    return JsonResponse({
        'status': 'success',
        'message': 'Configuration terminée!' if not load_data else f"Données chargées: {results['files_created']} fichiers, {results['sheets_created']} feuilles",
        'details': results,
        'credentials': [
            {'username': 'Nizar', 'password': 'nizar', 'is_admin': True},
            {'username': 'Ahmed', 'password': 'ahmed', 'is_admin': True},
            {'username': 'Zineb', 'password': 'zineb', 'is_admin': False}
        ],
        'frontend_url': 'https://ocp-frontend-r4ip.onrender.com/'
    })
