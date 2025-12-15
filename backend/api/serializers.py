from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ExcelFile, ExcelColumn


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'is_staff', 'is_superuser', 'is_admin']
    
    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username
    
    def get_is_admin(self, obj):
        """Retourne True si l'utilisateur est admin (staff ou superuser)"""
        return obj.is_staff or obj.is_superuser


class ExcelColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExcelColumn
        fields = ['id', 'name', 'field_type', 'required', 'options', 'order']


class ExcelFileSerializer(serializers.ModelSerializer):
    columns = ExcelColumnSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ExcelFile
        fields = [
            'id', 'name', 'description', 'file', 'created_at', 
            'updated_at', 'created_by', 'created_by_name', 
            'entries_count', 'columns'
        ]
        read_only_fields = ['created_at', 'updated_at', 'entries_count']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            if obj.created_by.first_name and obj.created_by.last_name:
                return f"{obj.created_by.first_name} {obj.created_by.last_name}"
            return obj.created_by.username
        return "Inconnu"


class ExcelFileCreateSerializer(serializers.ModelSerializer):
    columns = ExcelColumnSerializer(many=True, required=False)
    
    class Meta:
        model = ExcelFile
        fields = ['id', 'name', 'description', 'columns']
    
    def create(self, validated_data):
        columns_data = validated_data.pop('columns', [])
        excel_file = ExcelFile.objects.create(**validated_data)
        
        for i, column_data in enumerate(columns_data):
            column_data['order'] = i
            ExcelColumn.objects.create(excel_file=excel_file, **column_data)
        
        return excel_file



