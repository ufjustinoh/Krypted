from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()         # create the app
app.add_middleware(     
    CORSMiddleware,     # this tells backend its ok to accept requests from localhost:5172 (react app) otherwise browser would block this
    allow_origins = ["http://localhost:5173"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.get("/")           # create first APi endpoint. At localhost:8000/ theres a message "Password Manager API is running!"
def root():
    return {"message": "Password Manager API is running!"}
