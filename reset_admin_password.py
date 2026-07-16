import os
import sys
import django

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_path)

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django
django.setup()

from django.contrib.auth.models import User

def reset():
    try:
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@example.com', 'is_staff': True, 'is_superuser': True}
        )
        user.set_password('LunaAdmin2026!')
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        if created:
            print("SUCCESS: User 'admin' did not exist. Created successfully with password 'LunaAdmin2026!'")
        else:
            print("SUCCESS: User 'admin' already existed. Password successfully reset to 'LunaAdmin2026!'")
    except Exception as e:
        print(f"Error resetting admin password: {e}")

if __name__ == '__main__':
    reset()
