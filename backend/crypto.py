from cryptography.fernet import Fernet

ENCRYPTION_KEY = Fernet.generate_key()          # generates a random encryption key on startup
fernet = Fernet(ENCRYPTION_KEY)                 # creates a Fernet instance using that key

def encrypt_password(plain_password: str) -> str:
    return fernet.encrypt(plain_password.encode()).decode()             # encrypt and convert to str for storage

def decrypt_password(encrypted_password: str) -> str:
    return fernet.decrypt(encrypted_password.encode()).decode()         # decrypt and convert back to str for use in frontend
