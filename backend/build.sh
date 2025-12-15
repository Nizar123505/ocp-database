#!/usr/bin/env bash
# Script de build pour Render - Application OCP

set -o errexit

echo "=== Installation des dependances ==="
pip install -r requirements-prod.txt

echo "=== Collecte des fichiers statiques ==="
python manage.py collectstatic --no-input

echo "=== Application des migrations ==="
python manage.py migrate

echo "=== Chargement des donnees depuis la base locale ==="
python manage.py load_data || echo "Pas de donnees a charger"

echo "=== Build termine avec succes! ==="
