"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()

# Automatic database seeding check on startup (for environments without shell access)
try:
    from locations.models import State
    if State.objects.count() == 0:
        print("⚡ Database is empty! Running automatic database seeding on startup...")
        import seed_categories
        import seed_departments
        import seed_knowledge
        import seed_locations
        import seed_schemes
        print("✅ Automatic database seeding completed successfully!")
except Exception as e:
    print(f"⚠️ Auto-seed startup check skipped: {e}")

