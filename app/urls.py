from django.urls import path
from .views import *

urlpatterns = [
    path('', game, name='game'),
    path('check-guess/', check_guess, name='check_guess'),
]
