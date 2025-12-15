from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personnalisé pour mettre à jour last_login lors de la connexion"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Mettre à jour la date de dernière connexion
        self.user.last_login = timezone.now()
        self.user.save(update_fields=['last_login'])
        
        # Ajouter des informations utilisateur dans la réponse
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'full_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username,
            'is_admin': self.user.is_staff or self.user.is_superuser
        }
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vue personnalisée pour obtenir les tokens JWT et mettre à jour last_login"""
    serializer_class = CustomTokenObtainPairSerializer


def is_admin(user):
    """Vérifier si l'utilisateur est administrateur"""
    return user.is_staff or user.is_superuser


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    """Récupérer la liste de tous les utilisateurs - ADMIN SEULEMENT"""
    if not is_admin(request.user):
        return Response(
            {"error": "Accès refusé. Seuls les administrateurs peuvent voir la liste des utilisateurs."},
            status=403
        )
    
    users = User.objects.all().order_by('-date_joined')
    
    users_data = []
    for user in users:
        users_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "date_joined": user.date_joined.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None
        })
    
    return Response({
        "users": users_data,
        "total": len(users_data)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """Créer un nouvel utilisateur - ADMIN SEULEMENT"""
    if not is_admin(request.user):
        return Response(
            {"error": "Accès refusé. Seuls les administrateurs peuvent créer des utilisateurs."},
            status=403
        )
    
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    email = request.data.get('email', '').strip()
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    is_staff = request.data.get('is_staff', False)
    
    # Validation
    if not username:
        return Response({"error": "Le nom d'utilisateur est requis"}, status=400)
    
    if not password:
        return Response({"error": "Le mot de passe est requis"}, status=400)
    
    if len(password) < 4:
        return Response({"error": "Le mot de passe doit contenir au moins 4 caractères"}, status=400)
    
    # Vérifier si l'utilisateur existe déjà
    if User.objects.filter(username=username).exists():
        return Response({"error": f"L'utilisateur '{username}' existe déjà"}, status=400)
    
    # Créer l'utilisateur
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        # Synchroniser is_staff et is_superuser pour le statut administrateur
        user.is_staff = is_staff
        user.is_superuser = is_staff  # Les deux doivent être identiques
        user.save()
        
        return Response({
            "message": "Utilisateur créé avec succès",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff
            }
        }, status=201)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    """Modifier un utilisateur existant - ADMIN SEULEMENT"""
    if not is_admin(request.user):
        return Response(
            {"error": "Accès refusé. Seuls les administrateurs peuvent modifier les utilisateurs."},
            status=403
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur non trouvé"}, status=404)
    
    # Mettre à jour les champs
    if 'username' in request.data:
        new_username = request.data['username'].strip()
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exists():
                return Response({"error": f"L'utilisateur '{new_username}' existe déjà"}, status=400)
            user.username = new_username
    
    if 'email' in request.data:
        user.email = request.data['email'].strip()
    
    if 'first_name' in request.data:
        user.first_name = request.data['first_name'].strip()
    
    if 'last_name' in request.data:
        user.last_name = request.data['last_name'].strip()
    
    if 'password' in request.data and request.data['password']:
        password = request.data['password']
        if len(password) >= 4:
            user.set_password(password)
    
    if 'is_active' in request.data:
        user.is_active = request.data['is_active']
    
    # Mettre à jour le statut administrateur (is_staff ET is_superuser ensemble)
    if 'is_staff' in request.data:
        is_admin_value = request.data['is_staff']
        user.is_staff = is_admin_value
        user.is_superuser = is_admin_value  # Synchroniser les deux champs
    
    user.save()
    
    return Response({
        "message": "Utilisateur modifié avec succès",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_staff": user.is_staff
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    """Supprimer un utilisateur - ADMIN SEULEMENT"""
    if not is_admin(request.user):
        return Response(
            {"error": "Accès refusé. Seuls les administrateurs peuvent supprimer des utilisateurs."},
            status=403
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur non trouvé"}, status=404)
    
    # Empêcher la suppression de son propre compte
    if user.id == request.user.id:
        return Response({"error": "Vous ne pouvez pas supprimer votre propre compte"}, status=400)
    
    username = user.username
    user.delete()
    
    return Response({
        "message": f"Utilisateur '{username}' supprimé avec succès"
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Changer son propre mot de passe"""
    old_password = request.data.get('old_password', '')
    new_password = request.data.get('new_password', '')
    
    if not old_password or not new_password:
        return Response({"error": "Les deux mots de passe sont requis"}, status=400)
    
    if len(new_password) < 4:
        return Response({"error": "Le nouveau mot de passe doit contenir au moins 4 caractères"}, status=400)
    
    user = request.user
    
    if not user.check_password(old_password):
        return Response({"error": "Ancien mot de passe incorrect"}, status=400)
    
    user.set_password(new_password)
    user.save()
    
    return Response({"message": "Mot de passe modifié avec succès"})


