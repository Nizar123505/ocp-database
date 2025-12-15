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
python manage.py createsuperuser --username Nizar --email nbouatel@outlook.ma --noinput || true
python manage.py shell -c "from django.contrib.auth.models import User; u = User.objects.get(username='Nizar'); u.set_password('nizar'); u.save(); print('Password set!')" || true

echo "=== Build termine avec succes! ==="
