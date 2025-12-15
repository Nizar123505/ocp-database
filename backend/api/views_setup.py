"""
Vue de setup pour charger les données
"""
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from api.models import FileCache, SheetDataCache
from datetime import datetime
import json
import os


@api_view(['GET'])
@permission_classes([AllowAny])
def setup_database(request):
    """
    GET /api/setup/?load_data=true - Charge les utilisateurs ET les données
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
    
    # Charger les données
    if load_data:
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data_export.json')
        
        if os.path.exists(json_path):
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                with transaction.atomic():
                    SheetDataCache.objects.all().delete()
                    FileCache.objects.all().delete()
                    
                    file_map = {}
                    now = timezone.now()
                    
                    for fd in data.get('files', []):
                        try:
                            # Parser la date file_modified
                            file_mod = fd.get('file_modified')
                            if file_mod:
                                if isinstance(file_mod, str):
                                    try:
                                        file_mod = datetime.fromisoformat(file_mod.replace('Z', '+00:00'))
                                    except:
                                        file_mod = now
                            else:
                                file_mod = now
                            
                            fc = FileCache.objects.create(
                                name=fd['name'],
                                filename=fd['filename'],
                                file_path=fd.get('file_path', fd['filename']),
                                sheets_json=fd.get('sheets_json', '[]'),
                                sheets_count=fd.get('sheets_count', 0),
                                total_entries=fd.get('total_entries', 0),
                                file_size=fd.get('file_size', 0),
                                sheets_details=fd.get('sheets_details', '{}'),
                                is_deleted=fd.get('is_deleted', False),
                                file_modified=file_mod
                            )
                            file_map[fd['id']] = fc
                            results['files_created'] += 1
                        except Exception as e:
                            results['errors'].append(f"File {fd.get('name', '?')}: {str(e)}")
                    
                    sheets_to_create = []
                    for sd in data.get('sheets', []):
                        fc = file_map.get(sd.get('file_cache_id'))
                        if fc:
                            sheets_to_create.append(SheetDataCache(
                                file_cache=fc,
                                sheet_name=sd['sheet_name'],
                                headers=sd.get('headers', '[]'),
                                columns_info=sd.get('columns_info', '[]'),
                                data=sd.get('data', '[]'),
                                rows_count=sd.get('rows_count', 0)
                            ))
                    
                    if sheets_to_create:
                        SheetDataCache.objects.bulk_create(sheets_to_create)
                        results['sheets_created'] = len(sheets_to_create)
                        
            except Exception as e:
                results['errors'].append(f"Data load error: {str(e)}")
        else:
            results['errors'].append(f"data_export.json not found at {json_path}")
    
    return JsonResponse({
        'status': 'success',
        'message': f"Données chargées: {results['files_created']} fichiers, {results['sheets_created']} feuilles",
        'details': results,
        'credentials': [
            {'username': 'Nizar', 'password': 'nizar', 'is_admin': True},
            {'username': 'Ahmed', 'password': 'ahmed', 'is_admin': True},
            {'username': 'Zineb', 'password': 'zineb', 'is_admin': False}
        ],
        'frontend_url': 'https://ocp-frontend-r4ip.onrender.com/'
    })
