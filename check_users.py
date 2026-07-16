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

def check():
    try:
        users = User.objects.all()
        print(f"Total users in DB: {users.count()}")
        for u in users:
            print(f"  - Username: '{u.username}', Email: '{u.email}', Is Staff: {u.is_staff}, Is Superuser: {u.is_superuser}, Is Active: {u.is_active}")
    except Exception as e:
        print(f"Error querying users: {e}")

if __name__ == '__main__':
    check()
