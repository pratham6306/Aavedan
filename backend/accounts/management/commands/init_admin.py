import os
import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Creates an initial superuser if no superuser exists in the database."

    def handle(self, *args, **options):
        try:
            User = get_user_model()
            username = os.getenv("ADMIN_USERNAME", "admin")
            email = os.getenv("ADMIN_EMAIL", "admin@aavedan.gov.in")
            password = os.getenv("ADMIN_PASSWORD", "Admin@123456")

            if not User.objects.filter(is_superuser=True).exists():
                self.stdout.write("No superuser found. Creating default admin superuser...")
                User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                    first_name="System",
                    last_name="Admin"
                )
                self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created successfully!"))
            else:
                self.stdout.write("Superuser already exists. Skipping creation.")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Init admin skipped: {e}"))
