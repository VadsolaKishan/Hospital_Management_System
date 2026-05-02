from django.contrib import admin
from .models import LabTestType, LabRequest, LabReport

admin.site.register(LabTestType)
admin.site.register(LabRequest)
admin.site.register(LabReport)
