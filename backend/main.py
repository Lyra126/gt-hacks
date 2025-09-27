import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv
import firebase_config

# We will create these files in the next steps
#add back in timeline_service
from api.endpoints import agent, auth

app = FastAPI(
    title="Clinical Trial Unified API",
    description="A single API for all clinical trial services"
)


# --- 2. INCLUDE ROUTERS ---
# This step makes the endpoints defined in other files part of the main application.
# We add a '/api' prefix to keep all routes organized.
app.include_router(agent.router, prefix="/api", tags=["Conversational Agent"]) # type: ignore
# app.include_router(timeline.router, prefix="/api", tags=["Timeline Parser"]) # type: ignore
app.include_router(auth.router, prefix="/api", tags=["Authentication & Codes"]) # type: ignore

# A simple root endpoint to confirm the server is running
@app.get("/")
def root():
    return {"message": "Welcome to the Clinical Trial Unified API"}


# --- 3. RUNNER ---
# This allows running the server directly with `python main.py`
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)