import os
import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Creates or updates initial superuser if no superuser exists in the database."

    def handle(self, *args, **options):
        try:
            User = get_user_model()
            username = os.getenv("ADMIN_USERNAME", "admin")
            email = os.getenv("ADMIN_EMAIL", "admin@aavedan.gov.in")
            password = os.getenv("ADMIN_PASSWORD", "Admin@123456")
            phone = os.getenv("ADMIN_PHONE", "9999999990")

            admin_user = User.objects.filter(username=username).first() or User.objects.filter(email=email).first()
            if not admin_user:
                self.stdout.write("Creating default admin superuser...")
                User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                    phone=phone,
                    first_name="System",
                    last_name="Admin"
                )
                self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created successfully!"))
            else:
                admin_user.set_password(password)
                admin_user.is_superuser = True
                admin_user.is_staff = True
                admin_user.save()
                self.stdout.write(self.style.SUCCESS(f"Updated superuser '{username}' password."))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Init admin skipped: {e}"))
