import os
import logging
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Seeds database with categories, departments, knowledge base, locations, schemes, and analytics."

    def handle(self, *args, **options):
        self.stdout.write("Starting automated database seeding...")
        try:
            import seed_categories
            self.stdout.write("✓ Categories seeded")
        except Exception as e:
            self.stdout.write(f"Categories seed skipped: {e}")

        try:
            import seed_departments
            self.stdout.write("✓ Departments seeded")
        except Exception as e:
            self.stdout.write(f"Departments seed skipped: {e}")

        try:
            import seed_knowledge
            self.stdout.write("✓ Knowledge base seeded")
        except Exception as e:
            self.stdout.write(f"Knowledge base seed skipped: {e}")

        try:
            import seed_locations
            self.stdout.write("✓ Locations (States & Districts) seeded")
        except Exception as e:
            self.stdout.write(f"Locations seed skipped: {e}")

        try:
            import seed_schemes
            self.stdout.write("✓ Welfare Schemes seeded")
        except Exception as e:
            self.stdout.write(f"Welfare Schemes seed skipped: {e}")

        try:
            import seed_rich_district_analytics
            seed_rich_district_analytics.seed()
            self.stdout.write("✓ Rich District Analytics seeded")
        except Exception as e:
            self.stdout.write(f"Analytics seed skipped: {e}")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
