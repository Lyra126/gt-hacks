import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi import FastAPI, HTTPException

# --- ADDED: Firebase Imports ---
import firebase_admin
from firebase_admin import credentials, firestore

# --- 1. INITIAL SETUP ---
load_dotenv()

# --- ADDED: Initialize FastAPI and Firebase ---
app = FastAPI(
    title="Conversational EMR Agent API",
    description="An API for a stateful conversational agent that updates an EMR in Firestore.",
)

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase initialization failed. Make sure 'serviceAccountKey.json' is present. Error: {e}")
    exit()

# Configure Gemini
try:
    api_key = os.environ["GOOGLE_API_KEY"]
    genai.configure(api_key=api_key) # type: ignore
except KeyError:
    raise ValueError("GOOGLE_API_KEY is not set in the environment or .env file.")

model = genai.GenerativeModel('gemini-2.5-flash') # type: ignore


# --- 2. Pydantic Models ---
class Prescription(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None

class EMRProfile(BaseModel):
    # This model now includes the 'height_cm' from your requirements
    age: Optional[int] = None
    gender_at_birth: Optional[str] = None
    height_cm: Optional[int] = None
    underlying_conditions: List[str] = Field(default_factory=list)
    prescriptions: List[Prescription] = Field(default_factory=list)
    smoker_status: Optional[str] = None
    alcohol_usage: Optional[str] = None
    pregnancy_status: Optional[str] = None

class ChatRequest(BaseModel):
    message: str


# --- 3. AI Helper Functions ---
# (These are unchanged from your script)
def parse_general_information(user_message: str) -> dict:
    """Parses a block of text for any and all EMR fields."""
    prompt = f"""
    You are an expert medical data analyst. Analyze the following text from a patient.
    Extract any fields that match the EMR profile and return them ONLY as a single, valid JSON object.
    The possible fields are: "age", "gender_at_birth", "height_cm", "underlying_conditions", "prescriptions", "smoker_status", "alcohol_usage", "pregnancy_status".

    If any information is not found, simply omit it from the JSON.

    Text to Analyze:
    ---
    {user_message}
    ---
    """
    try:
        response = model.generate_content(prompt)
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(json_string)
    except (json.JSONDecodeError, Exception):
        return {}

def generate_request_for_missing_info(missing_fields: List[str]) -> str:
    """Generates a friendly request for missing information."""
    fields_str = " and ".join(missing_fields)
    prompt = f"""
    You are a friendly AI medical assistant. You need to collect more information from a patient.
    The specific information you need is: {fields_str}.
    Generate a single, friendly, and conversational message that asks the user for this missing information.
    Start the message with a phrase like "Uh oh, it seems we need a bit more information."
    """
    response = model.generate_content(prompt)
    return response.text.strip()


# --- 4. CORE CONVERSATION LOGIC ---
# This new function handles fetching/saving state and running the agent logic
async def process_turn(patient_id: str, user_message: Optional[str] = None):
    # Define the requirements for the study
    requirements = {
        "age": "Age must be provided and over 26.",
        "height_cm": "Height must be provided.",
        "smoker_status": "Smoker status must be known."
    }

    # Fetch the patient's current profile from Firestore
    doc_ref = db.collection('emr_profiles').document(patient_id)
    doc = doc_ref.get()
    if doc.exists:
        profile = EMRProfile(**doc.to_dict()) # type: ignore
    else:
        profile = EMRProfile()

    # If the user sent a message, parse it and update the profile
    if user_message:
        extracted_data = parse_general_information(user_message)
        if extracted_data:
            profile = profile.model_copy(update=extracted_data)
    
    # --- Requirement Checking Stage ---
    missing_for_requirements = []
    for field in requirements.keys():
        # Use hasattr to check for field existence before getattr
        if not hasattr(profile, field) or getattr(profile, field) is None:
            missing_for_requirements.append(field)

    is_age_invalid = profile.age is not None and profile.age <= 26
    
    bot_message = ""
    # Determine the bot's response
    if is_age_invalid:
        bot_message = f"Uh oh, it looks like there's an issue. For this study, the requirement is an age over 26, but your profile shows {profile.age}. Unfortunately, we can't proceed with this profile."
    elif missing_for_requirements:
        bot_message = generate_request_for_missing_info(missing_for_requirements)
    else:
        bot_message = "Looks like we have all the required information! Your profile is ready."

    # If this was the first interaction, start with a greeting
    if not doc.exists and not user_message:
        bot_message = "Hey there! How are you doing today? To help get your profile ready, could you tell me a bit about yourself and your medical history?"

    # Save the updated profile back to Firestore
    doc_ref.set(profile.model_dump())

    return {"bot_message": bot_message, "current_profile": profile.model_dump()}


# --- 5. API ENDPOINTS ---

@app.get("/chat/{patient_id}/start")
async def start_chat(patient_id: str):
    """
    Starts or continues a conversation. Fetches the patient's current EMR profile
    and returns the next logical question or a greeting.
    """
    return await process_turn(patient_id)

@app.post("/chat/{patient_id}")
async def send_message(patient_id: str, request: ChatRequest):
    """
    Receives a user's message, updates their EMR profile, saves it to Firestore,
    and returns the bot's next response.
    """
    return await process_turn(patient_id, request.message)

@app.get("/", include_in_schema=False)
def root():
    return {"status": "Conversational EMR Agent API is running."}