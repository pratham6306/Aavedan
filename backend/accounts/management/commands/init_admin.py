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
            admin_configs = [
                {
                    "email": os.getenv("ADMIN_EMAIL", "admin@aavedan.gov.in"),
                    "password": os.getenv("ADMIN_PASSWORD", "Admin@123456"),
                    "phone": os.getenv("ADMIN_PHONE", "9999999990"),
                    "name": "System Admin"
                },
                {
                    "email": "admin@aavedansetu.gov.in",
                    "password": "adminpassword123",
                    "phone": "9999999991",
                    "name": "Aavedan Admin"
                }
            ]

            for cfg in admin_configs:
                u = User.objects.filter(email=cfg["email"]).first()
                if not u:
                    u = User.objects.create_superuser(
                        email=cfg["email"],
                        password=cfg["password"],
                        phone=cfg["phone"],
                        full_name=cfg["name"],
                        is_staff=True,
                        is_superuser=True
                    )
                    self.stdout.write(self.style.SUCCESS(f"Superuser '{cfg['email']}' created!"))
                else:
                    u.set_password(cfg["password"])
                    u.is_superuser = True
                    u.is_staff = True
                    u.save()
                    self.stdout.write(self.style.SUCCESS(f"Updated superuser '{cfg['email']}' password."))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Init admin skipped: {e}"))
