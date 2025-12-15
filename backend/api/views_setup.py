"""
Vue de setup pour créer le superuser et charger les données initiales
À SUPPRIMER APRÈS UTILISATION EN PRODUCTION
"""
from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import json
import os


@api_view(['GET'])
@permission_classes([AllowAny])
def setup_database(request):
    """
    Endpoint pour initialiser la base de données avec les utilisateurs et données.
    Accessible via: GET /api/setup/
    """
    results = {
        'users_created': [],
        'users_existing': [],
        'files_created': [],
        'sheets_created': 0,
        'errors': []
    }
    
    # Créer les utilisateurs
    users_to_create = [
        {
            'username': 'Nizar',
            'email': 'nizar@ocp.ma',
            'password': 'nizar',
            'is_superuser': True,
            'is_staff': True
        },
        {
            'username': 'Ahmed',
            'email': 'admin@example.com',
            'password': 'ahmed',
            'is_superuser': True,
            'is_staff': True
        },
        {
            'username': 'Zineb',
            'email': 'zineb@gmail.com',
            'password': 'zineb',
            'is_superuser': False,
            'is_staff': False
        }
    ]
    
    for user_data in users_to_create:
        if User.objects.filter(username=user_data['username']).exists():
            # Mettre à jour le mot de passe au cas où
            user = User.objects.get(username=user_data['username'])
            user.set_password(user_data['password'])
            user.save()
            results['users_existing'].append(f"{user_data['username']} (password reset)")
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
    
    # Charger les données depuis data_export.json si disponible
    try:
        from api.models import FileCache, SheetDataCache
        
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data_export.json')
        
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Charger les fichiers
            for file_data in data.get('files', []):
                if not FileCache.objects.filter(name=file_data['name']).exists():
                    fc = FileCache(
                        name=file_data['name'],
                        filename=file_data['filename'],
                        sheets_json=file_data['sheets_json'],
                        sheets_count=file_data['sheets_count'],
                        total_entries=file_data['total_entries'],
                        file_size=file_data.get('file_size', 0),
                        sheets_details=file_data.get('sheets_details', '{}'),
                        is_deleted=file_data.get('is_deleted', False),
                        last_modified_by_id=file_data.get('last_modified_by_id')
                    )
                    fc.save()
                    results['files_created'].append(file_data['name'])
            
            # Charger les feuilles
            for sheet_data in data.get('sheets', []):
                # Trouver le fichier correspondant par nom
                try:
                    file_cache = None
                    for file_data in data.get('files', []):
                        if file_data['id'] == sheet_data['file_cache_id']:
                            file_cache = FileCache.objects.filter(name=file_data['name']).first()
                            break
                    
                    if file_cache and not SheetDataCache.objects.filter(
                        file_cache=file_cache,
                        sheet_name=sheet_data['sheet_name']
                    ).exists():
                        sdc = SheetDataCache(
                            file_cache=file_cache,
                            sheet_name=sheet_data['sheet_name'],
                            headers=sheet_data['headers'],
                            columns_info=sheet_data.get('columns_info', '[]'),
                            data=sheet_data['data'],
                            rows_count=sheet_data['rows_count']
                        )
                        sdc.save()
                        results['sheets_created'] += 1
                except Exception as e:
                    results['errors'].append(f"Sheet error: {str(e)}")
    except Exception as e:
        results['errors'].append(f"Data load error: {str(e)}")
    
    return JsonResponse({
        'status': 'success',
        'message': 'Base de données initialisée!',
        'details': results,
        'login_info': {
            'admin_url': '/admin/',
            'credentials': [
                {'username': 'Nizar', 'password': 'nizar', 'is_admin': True},
                {'username': 'Ahmed', 'password': 'ahmed', 'is_admin': True},
                {'username': 'Zineb', 'password': 'zineb', 'is_admin': False}
            ]
        }
    })

