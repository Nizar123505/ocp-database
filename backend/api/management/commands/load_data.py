"""
Commande Django pour charger les données exportées de la base locale
"""
import json
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import FileCache, SheetDataCache


class Command(BaseCommand):
    help = 'Charge les données depuis data_export.json'

    def handle(self, *args, **options):
        json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data_export.json')
        
        if not os.path.exists(json_path):
            self.stdout.write(self.style.WARNING(f'Fichier {json_path} non trouvé'))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Charger les utilisateurs
        users_created = 0
        for user_data in data.get('users', []):
            if not User.objects.filter(username=user_data['username']).exists():
                user = User(
                    id=user_data['id'],
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password'],  # Mot de passe déjà haché
                    is_superuser=user_data['is_superuser'],
                    is_staff=user_data['is_staff'] if 'is_staff' in user_data else user_data['is_superuser'],
                    is_active=user_data.get('is_active', True),
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', '')
                )
                user.save()
                users_created += 1
                self.stdout.write(f'  Utilisateur créé: {user.username}')
        
        self.stdout.write(self.style.SUCCESS(f'Utilisateurs: {users_created} créés'))

        # Charger les FileCache
        files_created = 0
        for file_data in data.get('files', []):
            if not FileCache.objects.filter(name=file_data['name']).exists():
                fc = FileCache(
                    id=file_data['id'],
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
                files_created += 1
                self.stdout.write(f'  Fichier créé: {fc.name}')
        
        self.stdout.write(self.style.SUCCESS(f'Fichiers: {files_created} créés'))

        # Charger les SheetDataCache
        sheets_created = 0
        for sheet_data in data.get('sheets', []):
            if not SheetDataCache.objects.filter(
                file_cache_id=sheet_data['file_cache_id'],
                sheet_name=sheet_data['sheet_name']
            ).exists():
                try:
                    sdc = SheetDataCache(
                        id=sheet_data['id'],
                        file_cache_id=sheet_data['file_cache_id'],
                        sheet_name=sheet_data['sheet_name'],
                        headers=sheet_data['headers'],
                        columns_info=sheet_data.get('columns_info', '[]'),
                        data=sheet_data['data'],
                        rows_count=sheet_data['rows_count']
                    )
                    sdc.save()
                    sheets_created += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'  Erreur feuille {sheet_data["sheet_name"]}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Feuilles: {sheets_created} créées'))
        self.stdout.write(self.style.SUCCESS('=== Chargement terminé ==='))

