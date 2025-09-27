import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

# We will create these files in the next steps
from api.endpoints import agent, timeline, auth

# --- 1. INITIALIZATION ---
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Clinical Trial Unified API",
    description="A single API for all clinical trial services, including the conversational agent and utility parsers."
)

# Initialize Firebase ONCE when the application starts
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"FATAL: Firebase initialization failed. Make sure 'serviceAccountKey.json' is present. Error: {e}")
    exit()


# --- 2. INCLUDE ROUTERS ---
# This step makes the endpoints defined in other files part of the main application.
# We add a '/api' prefix to keep all routes organized.
app.include_router(agent.router, prefix="/api", tags=["Conversational Agent"]) # type: ignore
app.include_router(timeline.router, prefix="/api", tags=["Timeline Parser"]) # type: ignore
app.include_router(auth.router, prefix="/api", tags=["Authentication & Codes"]) # type: ignore

# A simple root endpoint to confirm the server is running
@app.get("/")
def root():
    return {"message": "Welcome to the Clinical Trial Unified API"}


# --- 3. RUNNER ---
# This allows running the server directly with `python main.py`
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)