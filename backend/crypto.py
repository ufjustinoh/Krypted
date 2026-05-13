from cryptography.fernet import Fernet
import os

# read the encryption key from the environment — must be a fixed key so stored passwords
# can still be decrypted after a server restart (generate_key() would produce a new key every time)
ENCRYPTION_KEY = os.environ["FERNET_KEY"].encode()
fernet = Fernet(ENCRYPTION_KEY)                 # creates a Fernet instance using that key

def encrypt_password(plain_password: str) -> str:
    return fernet.encrypt(plain_password.encode()).decode()             # encrypt and convert to str for storage

def decrypt_password(encrypted_password: str) -> str:
    return fernet.decrypt(encrypted_password.encode()).decode()         # decrypt and convert back to str for use in frontend

def decrypt_safe(value: str) -> str:
    try:
        return fernet.decrypt(value.encode()).decode()
    except Exception:
        return value  # fallback for rows stored before encryption was added
