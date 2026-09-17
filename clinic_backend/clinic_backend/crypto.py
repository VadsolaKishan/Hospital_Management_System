import logging
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)

_fernet_instance = None


def get_fernet():
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance

    key = getattr(settings, "ENCRYPTION_KEY", None)
    if not key:
        raise ImproperlyConfigured(
            "ENCRYPTION_KEY environment variable is required and missing."
        )

    try:
        if isinstance(key, str):
            key_bytes = key.encode("utf-8")
        else:
            key_bytes = key
        _fernet_instance = Fernet(key_bytes)
        return _fernet_instance
    except Exception as e:
        raise ImproperlyConfigured(
            f"Invalid ENCRYPTION_KEY configured: {e}"
        )


def reset_fernet_cache():
    """Reset cached Fernet instance (useful for testing key variations)."""
    global _fernet_instance
    _fernet_instance = None


def encrypt_val(value):
    """
    Encrypts a string value using Fernet symmetric key encryption.
    Returns None if input value is None.
    """
    if value is None:
        return None

    str_val = str(value)
    if str_val == "":
        return ""

    # Don't re-encrypt if already a valid Fernet token generated with our key
    fernet = get_fernet()
    try:
        # Check if already encrypted
        fernet.decrypt(str_val.encode("utf-8"))
        return str_val
    except Exception:
        pass

    encrypted_bytes = fernet.encrypt(str_val.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_val(value):
    """
    Decrypts a Fernet encrypted token string.
    Returns original value if input is None, empty, or not a valid Fernet token
    (enabling seamless backward compatibility with existing plaintext records).
    """
    if value is None:
        return None

    str_val = str(value)
    if str_val == "":
        return ""

    try:
        fernet = get_fernet()
        decrypted_bytes = fernet.decrypt(str_val.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except (InvalidToken, Exception):
        # Fallback to plaintext value if not encrypted or key invalid
        return str_val
