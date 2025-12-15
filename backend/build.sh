#!/usr/bin/env bash
# Script de build pour Render - Application OCP

set -o errexit

echo "=== Installation des dependances ==="
pip install -r requirements-prod.txt

echo "=== Collecte des fichiers statiques ==="
python manage.py collectstatic --no-input

echo "=== Application des migrations ==="
python manage.py migrate

echo "=== Creation du superuser Nizar ==="
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.contrib.auth.models import User
username = 'Nizar'
email = 'nbouatel@outlook.ma'
password = 'nizar'
if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    user.set_password(password)
    user.save()
    print(f'User {username} password updated!')
else:
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'Superuser {username} created!')
"

echo "=== Build termine avec succes! ==="
