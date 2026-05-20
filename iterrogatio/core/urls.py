from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path('api/face/analyze/', views.analyze_face),
    path('api/face/save/', views.save_recording),
    path('api/face/delete/', views.delete_recording),
    path('api/interview/analyze-transcript/', views.analyze_interview_transcript),
    path('api/interview/generate-report/', views.generate_interview_report),
    path('api/interview/list/', views.list_interviews),
    path('api/interview/<int:interview_id>/', views.get_interview_detail),
    path('api/interview/compare/', views.compare_interviews),
]