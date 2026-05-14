# Krypted

A full-stack password manager with encrypted vault storage and JWT authentication

![Python](https://img.shields.io/badge/Python-FastAPI-blue?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React-61dafb?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square)

**Live:** [kryptedvault.vercel.app](https://kryptedvault.vercel.app)

## Features

- Fernet-encrypted password storage
- JWT-based authentication with auto-logout on expiry
- Two-step login flow with master password
- Password categories (Website / Wi-Fi)
- Soft delete with a Recently Deleted bin and restore support
- Password strength meter and secure password generator
- Password reuse prevention across account history
- Profile page with name editing and master password change

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite (Vercel) |
| Backend | FastAPI + SQLAlchemy (Render) |
| Database | PostgreSQL (Render) |
| Auth | JWT (python-jose) + bcrypt |
| Encryption | Fernet (cryptography) |
