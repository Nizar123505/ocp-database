import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Supprimer l'utilisateur s'il existe déjà
User.objects.filter(username='Nizar').delete()

# Créer le nouvel utilisateur
user = User.objects.create_user(
    username='Nizar',
    email='nizar@ocp.ma',
    password='nizar123',
    first_name='Nizar',
    last_name='Bouatel'
)

print(f"Utilisateur créé avec succès!")
print(f"  - Username: Nizar")
print(f"  - Password: nizar123")
print(f"  - Nom complet: {user.first_name} {user.last_name}")







