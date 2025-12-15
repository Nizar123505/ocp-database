"""
Vue de setup pour créer les utilisateurs et charger les données
"""
from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from api.models import FileCache, SheetDataCache
import json
import os


@api_view(['GET'])
@permission_classes([AllowAny])
def setup_database(request):
    """
    Endpoint pour initialiser la base de données.
    GET /api/setup/ - Crée les utilisateurs
    GET /api/setup/?load_data=true - Crée les utilisateurs ET charge les données
    """
    load_data = request.GET.get('load_data', 'false').lower() == 'true'
    
    results = {
        'users_created': [],
        'users_updated': [],
        'files_created': [],
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
    
    # Charger les données si demandé
    if load_data:
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data_export.json')
        
        if os.path.exists(json_path):
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Mapping des anciens IDs vers les nouveaux
                file_id_mapping = {}
                
                # Charger les fichiers
                for file_data in data.get('files', []):
                    try:
                        if not FileCache.objects.filter(name=file_data['name']).exists():
                            fc = FileCache.objects.create(
                                name=file_data['name'],
                                filename=file_data['filename'],
                                sheets_json=file_data.get('sheets_json', '[]'),
                                sheets_count=file_data.get('sheets_count', 0),
                                total_entries=file_data.get('total_entries', 0),
                                file_size=file_data.get('file_size', 0),
                                sheets_details=file_data.get('sheets_details', '{}'),
                                is_deleted=file_data.get('is_deleted', False)
                            )
                            file_id_mapping[file_data['id']] = fc.id
                            results['files_created'].append(file_data['name'])
                        else:
                            existing = FileCache.objects.get(name=file_data['name'])
                            file_id_mapping[file_data['id']] = existing.id
                    except Exception as e:
                        results['errors'].append(f"File {file_data.get('name', 'unknown')}: {str(e)}")
                
                # Charger les feuilles
                for sheet_data in data.get('sheets', []):
                    try:
                        old_file_id = sheet_data.get('file_cache_id')
                        new_file_id = file_id_mapping.get(old_file_id)
                        
                        if new_file_id:
                            if not SheetDataCache.objects.filter(
                                file_cache_id=new_file_id,
                                sheet_name=sheet_data['sheet_name']
                            ).exists():
                                SheetDataCache.objects.create(
                                    file_cache_id=new_file_id,
                                    sheet_name=sheet_data['sheet_name'],
                                    headers=sheet_data.get('headers', '[]'),
                                    columns_info=sheet_data.get('columns_info', '[]'),
                                    data=sheet_data.get('data', '[]'),
                                    rows_count=sheet_data.get('rows_count', 0)
                                )
                                results['sheets_created'] += 1
                    except Exception as e:
                        results['errors'].append(f"Sheet: {str(e)}")
                        
            except Exception as e:
                results['errors'].append(f"JSON load error: {str(e)}")
        else:
            results['errors'].append(f"data_export.json not found at {json_path}")
    
    return JsonResponse({
        'status': 'success',
        'message': 'Configuration terminée!',
        'details': results,
        'next_step': 'Visitez /api/setup/?load_data=true pour charger les données des fichiers' if not load_data else 'Données chargées!',
        'credentials': [
            {'username': 'Nizar', 'password': 'nizar', 'is_admin': True},
            {'username': 'Ahmed', 'password': 'ahmed', 'is_admin': True},
            {'username': 'Zineb', 'password': 'zineb', 'is_admin': False}
        ]
    })
