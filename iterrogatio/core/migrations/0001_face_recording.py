from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="FaceRecording",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("seconds_eyes_open", models.FloatField(default=0)),
                ("seconds_eyes_closed", models.FloatField(default=0)),
                ("seconds_posture_good", models.FloatField(default=0)),
                ("seconds_posture_bad", models.FloatField(default=0)),
            ],
        ),
    ]

