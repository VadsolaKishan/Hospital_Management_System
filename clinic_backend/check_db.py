import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("DESCRIBE appointments;")
    rows = cursor.fetchall()
    for row in rows:
        print(row[0])
