from django.urls import path
from .views import StateListView, DistrictListView, SeedDatabaseView

urlpatterns = [
    path('states/', StateListView.as_view(), name='state-list'),
    path('districts/', DistrictListView.as_view(), name='district-list'),
    path('seed/', SeedDatabaseView.as_view(), name='seed-database'),
]

