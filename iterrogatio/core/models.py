from django.db import models
from django.contrib.auth.models import User

class FaceRecording(models.Model):
    # Armazena o resultado agregando segundos em vez de salvar frame/imagem
    created_at = models.DateTimeField(auto_now_add=True)

    seconds_eyes_open = models.FloatField(default=0)
    seconds_eyes_closed = models.FloatField(default=0)

    seconds_posture_good = models.FloatField(default=0)
    seconds_posture_bad = models.FloatField(default=0)

    def __str__(self) -> str:
        return f"FaceRecording(id={self.id}, eyes_open={self.seconds_eyes_open:.2f}s, posture_good={self.seconds_posture_good:.2f}s)"


class Interview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews')
    professional_area = models.CharField(max_length=255, help_text="Área profissional selecionada")
    transcript = models.TextField(help_text="Transcrição da entrevista")
    analysis = models.JSONField(help_text="Análise estruturada da entrevista via LLM")
    report = models.TextField(help_text="Relatório final personalizado")
    behavioral_data = models.JSONField(default=dict, help_text="Dados comportamentais da gravação")
    recording = models.OneToOneField(FaceRecording, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Interview({self.user.username}, {self.professional_area}, {self.created_at.strftime('%d/%m/%Y')})"
