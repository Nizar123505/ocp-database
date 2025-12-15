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
python manage.py shell << EOF
from django.contrib.auth.models import User
if not User.objects.filter(username='Nizar').exists():
    User.objects.create_superuser('Nizar', 'nizar@ocp.ma', 'Nizar@OCP2025!')
    print('Superuser Nizar cree avec succes!')
else:
    print('Superuser Nizar existe deja.')
EOF

echo "=== Build termine avec succes! ==="
