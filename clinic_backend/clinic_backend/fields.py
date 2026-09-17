from django.db import models
from .crypto import encrypt_val, decrypt_val


class EncryptedCharField(models.CharField):
    """
    Custom Django CharField that transparently encrypts data before saving
    to PostgreSQL and decrypts data when fetching from database.
    """

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_val(value)

    def to_python(self, value):
        if isinstance(value, str):
            return decrypt_val(value)
        return super().to_python(value)

    def get_prep_value(self, value):
        prep_value = super().get_prep_value(value)
        if prep_value is None:
            return None
        return encrypt_val(prep_value)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs


class EncryptedTextField(models.TextField):
    """
    Custom Django TextField that transparently encrypts data before saving
    to PostgreSQL and decrypts data when fetching from database.
    """

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_val(value)

    def to_python(self, value):
        if isinstance(value, str):
            return decrypt_val(value)
        return super().to_python(value)

    def get_prep_value(self, value):
        prep_value = super().get_prep_value(value)
        if prep_value is None:
            return None
        return encrypt_val(prep_value)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs
