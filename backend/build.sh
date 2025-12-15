#!/usr/bin/env bash
# Script de build pour Render - Application OCP
set -o errexit

echo "=== Installation des dependances ==="
pip install -r requirements-prod.txt

echo "=== Collecte des fichiers statiques ==="
python manage.py collectstatic --no-input

echo "=== Application des migrations ==="
python manage.py migrate

echo "=== Chargement des donnees ==="
python manage.py shell << 'PYTHON_SCRIPT'
import json
import os
from django.contrib.auth.models import User
from django.db import transaction
from api.models import FileCache, SheetDataCache

print("Debut du chargement...")

# Creer les utilisateurs
users_data = [
    {"username": "Nizar", "email": "nizar@ocp.ma", "password": "nizar", "is_superuser": True, "is_staff": True},
    {"username": "Ahmed", "email": "admin@example.com", "password": "ahmed", "is_superuser": True, "is_staff": True},
    {"username": "Zineb", "email": "zineb@gmail.com", "password": "zineb", "is_superuser": False, "is_staff": False},
]

for u in users_data:
    user, created = User.objects.get_or_create(username=u["username"], defaults={"email": u["email"]})
    user.set_password(u["password"])
    user.is_superuser = u["is_superuser"]
    user.is_staff = u["is_staff"]
    user.save()
    print(f"  User {u['username']}: {'created' if created else 'updated'}")

# Charger les fichiers Excel depuis data_export.json
json_file = "data_export.json"
if os.path.exists(json_file):
    print(f"Fichier {json_file} trouve!")
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    with transaction.atomic():
        # Supprimer les anciennes donnees
        SheetDataCache.objects.all().delete()
        FileCache.objects.all().delete()
        
        # Creer les fichiers
        file_map = {}
        for fd in data.get("files", []):
            fc = FileCache.objects.create(
                name=fd["name"],
                filename=fd["filename"],
                sheets_json=fd.get("sheets_json", "[]"),
                sheets_count=fd.get("sheets_count", 0),
                total_entries=fd.get("total_entries", 0),
                file_size=fd.get("file_size", 0),
                sheets_details=fd.get("sheets_details", "{}"),
                is_deleted=fd.get("is_deleted", False)
            )
            file_map[fd["id"]] = fc
            print(f"  Fichier: {fc.name}")
        
        # Creer les feuilles en bulk
        sheets_to_create = []
        for sd in data.get("sheets", []):
            fc = file_map.get(sd.get("file_cache_id"))
            if fc:
                sheets_to_create.append(SheetDataCache(
                    file_cache=fc,
                    sheet_name=sd["sheet_name"],
                    headers=sd.get("headers", "[]"),
                    columns_info=sd.get("columns_info", "[]"),
                    data=sd.get("data", "[]"),
                    rows_count=sd.get("rows_count", 0)
                ))
        
        if sheets_to_create:
            SheetDataCache.objects.bulk_create(sheets_to_create)
            print(f"  {len(sheets_to_create)} feuilles creees")
    
    print("Donnees chargees avec succes!")
else:
    print(f"ATTENTION: {json_file} non trouve dans {os.getcwd()}")
    print(f"Fichiers disponibles: {os.listdir('.')}")

print("Chargement termine!")
PYTHON_SCRIPT

echo "=== Build termine avec succes! ==="
