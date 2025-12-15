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
python -c "
import os, sys, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.contrib.auth.models import User
from django.db import transaction
from api.models import FileCache, SheetDataCache

print('Chargement des utilisateurs...')
users = [
    {'username': 'Nizar', 'email': 'nizar@ocp.ma', 'password': 'nizar', 'is_superuser': True, 'is_staff': True},
    {'username': 'Ahmed', 'email': 'admin@example.com', 'password': 'ahmed', 'is_superuser': True, 'is_staff': True},
    {'username': 'Zineb', 'email': 'zineb@gmail.com', 'password': 'zineb', 'is_superuser': False, 'is_staff': False}
]
for u in users:
    user, created = User.objects.get_or_create(username=u['username'], defaults={'email': u['email']})
    user.set_password(u['password'])
    user.is_superuser = u['is_superuser']
    user.is_staff = u['is_staff']
    user.save()
    print(f'  User {u[\"username\"]}: {\"created\" if created else \"updated\"}')

print('Chargement des fichiers Excel...')
# Chercher le fichier dans plusieurs emplacements possibles
possible_paths = ['data_export.json', '/opt/render/project/src/backend/data_export.json', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data_export.json')]
json_path = None
for p in possible_paths:
    if os.path.exists(p):
        json_path = p
        break
print(f'Path trouve: {json_path}')
if json_path and os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with transaction.atomic():
        SheetDataCache.objects.all().delete()
        FileCache.objects.all().delete()
        
        file_map = {}
        for fd in data.get('files', []):
            fc = FileCache.objects.create(
                name=fd['name'],
                filename=fd['filename'],
                sheets_json=fd.get('sheets_json', '[]'),
                sheets_count=fd.get('sheets_count', 0),
                total_entries=fd.get('total_entries', 0),
                file_size=fd.get('file_size', 0),
                sheets_details=fd.get('sheets_details', '{}'),
                is_deleted=fd.get('is_deleted', False)
            )
            file_map[fd['id']] = fc
            print(f'  File: {fc.name}')
        
        sheets = []
        for sd in data.get('sheets', []):
            fc = file_map.get(sd.get('file_cache_id'))
            if fc:
                sheets.append(SheetDataCache(
                    file_cache=fc,
                    sheet_name=sd['sheet_name'],
                    headers=sd.get('headers', '[]'),
                    columns_info=sd.get('columns_info', '[]'),
                    data=sd.get('data', '[]'),
                    rows_count=sd.get('rows_count', 0)
                ))
        if sheets:
            SheetDataCache.objects.bulk_create(sheets)
            print(f'  Sheets: {len(sheets)} created')
    print('Donnees chargees avec succes!')
else:
    print('Fichier data_export.json non trouve!')
    print(f'Repertoire courant: {os.getcwd()}')
    print(f'Contenu du repertoire: {os.listdir(\".\")}')
"

echo "=== Build termine avec succes! ==="
