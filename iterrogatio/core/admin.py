from django.contrib import admin
from .models import FaceRecording, Interview

@admin.register(FaceRecording)
class FaceRecordingAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'seconds_eyes_open', 'seconds_posture_good')
    list_filter = ('created_at',)
    search_fields = ('id',)

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'professional_area', 'created_at', 'id')
    list_filter = ('professional_area', 'created_at')
    search_fields = ('user__username', 'professional_area', 'transcript')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('user', 'professional_area', 'created_at', 'updated_at')
        }),
        ('Conteúdo', {
            'fields': ('transcript', 'analysis', 'report')
        }),
        ('Dados Comportamentais', {
            'fields': ('behavioral_data', 'recording')
        }),
    )
