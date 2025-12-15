from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ExcelFileViewSet, 
    get_current_user,
    get_excel_files,
    get_file_sheets,
    get_sheet_columns,
    get_sheet_data,
    add_sheet_entry,
    update_sheet_entry,
    delete_sheet_entry,
    download_excel,
    create_excel_file,
    import_excel_file,
    add_sheet_to_file,
    delete_excel_file,
    refresh_files_cache,
    get_archived_files,
    restore_excel_file,
    permanent_delete_file
)
from .views_users import (
    get_all_users,
    create_user,
    update_user,
    delete_user,
    change_password,
    CustomTokenObtainPairView
)

router = DefaultRouter()
router.register(r'excel-files', ExcelFileViewSet, basename='excel-file')

urlpatterns = [
    # Authentification JWT (avec mise à jour de last_login)
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Utilisateur courant
    path("me/", get_current_user, name="current_user"),
    
    # Gestion des fichiers Excel
    path("files/", get_excel_files, name="get_excel_files"),
    path("files/refresh/", refresh_files_cache, name="refresh_files_cache"),
    path("files/create/", create_excel_file, name="create_excel_file"),
    path("files/import/", import_excel_file, name="import_excel_file"),
    path("files/<str:filename>/sheets/", get_file_sheets, name="get_file_sheets"),
    path("files/<str:filename>/sheets/create/", add_sheet_to_file, name="add_sheet_to_file"),
    path("files/<str:filename>/sheets/<str:sheet_name>/columns/", get_sheet_columns, name="get_sheet_columns"),
    path("files/<str:filename>/sheets/<str:sheet_name>/data/", get_sheet_data, name="get_sheet_data"),
    path("files/<str:filename>/sheets/<str:sheet_name>/add/", add_sheet_entry, name="add_sheet_entry"),
    path("files/<str:filename>/sheets/<str:sheet_name>/update/", update_sheet_entry, name="update_sheet_entry"),
    path("files/<str:filename>/sheets/<str:sheet_name>/delete/", delete_sheet_entry, name="delete_sheet_entry"),
    path("files/<str:filename>/download/", download_excel, name="download_excel"),
    path("files/<str:filename>/delete/", delete_excel_file, name="delete_excel_file"),
    
    # Gestion des fichiers archivés
    path("files/archived/", get_archived_files, name="get_archived_files"),
    path("files/archived/<int:file_id>/restore/", restore_excel_file, name="restore_excel_file"),
    path("files/archived/<int:file_id>/permanent-delete/", permanent_delete_file, name="permanent_delete_file"),
    
    # Gestion des utilisateurs
    path("users/", get_all_users, name="get_all_users"),
    path("users/create/", create_user, name="create_user"),
    path("users/<int:user_id>/update/", update_user, name="update_user"),
    path("users/<int:user_id>/delete/", delete_user, name="delete_user"),
    path("users/change-password/", change_password, name="change_password"),
    
    # Routes du router (ancien système)
    path("", include(router.urls)),
]
