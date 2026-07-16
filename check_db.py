import os
import sys
import django
from django.db import connection

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_path)

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django
django.setup()

def check():
    try:
        print("Checking database connection...")
        # Force database connection
        connection.ensure_connection()
        print("✓ Database connection: SUCCESSFUL!")
        
        # Get host and database name
        db_settings = connection.settings_dict
        print(f"Connected to Host: {db_settings.get('HOST')}")
        print(f"Database Name: {db_settings.get('NAME')}")
        
        # Retrieve list of tables
        tables = connection.introspection.table_names()
        print(f"\nFound {len(tables)} tables in the database:")
        for table in sorted(tables):
            print(f"  - {table}")
            
        if len(tables) == 0:
            print("\n⚠ Warning: Database is connected but empty! No tables have been created yet.")
        else:
            print("\n✓ Success: Migrations have been applied successfully and all tables are present!")
            
    except Exception as e:
        print("\n❌ Error: Database connection failed!")
        print("Error details:")
        print(str(e))

if __name__ == '__main__':
    check()
