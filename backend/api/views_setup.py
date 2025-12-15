"""
Vue de setup pour créer le superuser et charger les données initiales
"""
from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def setup_database(request):
    """
    Endpoint pour initialiser la base de données avec les utilisateurs.
    Accessible via: GET /api/setup/
    """
    results = {
        'users_created': [],
        'users_updated': [],
    }
    
    # Créer les utilisateurs avec les mêmes mots de passe qu'en local
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
    
    return JsonResponse({
        'status': 'success',
        'message': 'Utilisateurs créés avec succès!',
        'details': results,
        'next_steps': {
            'admin_url': 'https://ocp-database.onrender.com/admin/',
            'frontend_url': 'https://ocp-frontend-r4ip.onrender.com/',
            'credentials': [
                {'username': 'Nizar', 'password': 'nizar', 'is_admin': True},
                {'username': 'Ahmed', 'password': 'ahmed', 'is_admin': True},
                {'username': 'Zineb', 'password': 'zineb', 'is_admin': False}
            ]
        }
    })
