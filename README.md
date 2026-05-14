# Krypted

A full-stack password manager with encrypted vault storage and JWT authentication

![Python](https://img.shields.io/badge/Python-FastAPI-blue?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React-61dafb?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square)

**Live:** [kryptedvault.vercel.app](https://kryptedvault.vercel.app)

## Features

- Fernet-encrypted password storage
- JWT-based authentication with auto-logout on expired token
- Two-step login flow with master password
- Soft delete implementation and restore support
- Password strength meter and secure password generator
- Password reuse prevention across account history
- Profile page with name editing and master password change

## Setup & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A PostgreSQL database

### 1. Clone the repo

```bash
git clone https://github.com/ufjustinoh/Krypted.git
cd Krypted
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file (or set these as environment variables):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/krypted
JWT_SECRET_KEY=your-secret-key
FERNET_KEY=your-fernet-key          # generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Start the server:

```bash
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be at `http://localhost:5173`.

> **Note:** By default the frontend points to the production backend. To use your local backend, update `BASE` in `frontend/src/api.js` to `http://localhost:8000`.

---

## Dependencies

### Backend (`requirements.txt`)
| Package | Purpose |
|---|---|
| fastapi | API framework |
| uvicorn | ASGI server |
| sqlalchemy | ORM and database layer |
| psycopg2-binary | PostgreSQL driver |
| python-jose[cryptography] | JWT creation and validation |
| bcrypt | Master password hashing |
| cryptography | Fernet encryption for stored passwords |
| python-multipart | Form data parsing |

### Frontend
| Package | Purpose |
|---|---|
| react + react-dom | UI framework |
| vite | Dev server and bundler |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite (Vercel) |
| Backend | FastAPI + SQLAlchemy (Render) |
| Database | PostgreSQL (Render) |
| Auth | JWT (python-jose) + bcrypt |
| Encryption | Fernet (cryptography) |
