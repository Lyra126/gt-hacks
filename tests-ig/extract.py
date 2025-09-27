import PyPDF2
import google.generativeai as genai
import json
import os
import tempfile
import shutil
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
import firebase_admin  # <-- ADDED
from firebase_admin import credentials, firestore  # <-- ADDED

# --- 1. INITIAL SETUP ---
load_dotenv()

# --- INITIALIZE FIREBASE ADMIN SDK ---  # <-- ADDED BLOCK
# Ensure 'serviceAccountKey.json' is in your project directory
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase initialization failed. Error: {e}")
    exit()

# Initialize FastAPI app
app = FastAPI(
    title="EMR Parser API",
    description="Upload a PDF EMR file to extract and save structured patient data to Firestore.",  # <-- UPDATED
)

# Configure the Gemini API
try:
    # Note: Using GOOGLE_API_KEY for Gemini, which is separate from Firebase credentials
    api_key = os.environ["GOOGLE_API_KEY"] 
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables.")
    genai.configure(api_key=api_key) # type: ignore
except KeyError:
    raise ValueError("GOOGLE_API_KEY is not set in the environment.")

# Initialize the Gemini Model
model = genai.GenerativeModel('gemini-2.5-flash') # type: ignore

# --- 2. HELPER FUNCTIONS ---
# (These functions remain the same)

def extract_text_from_pdf(pdf_file_path: str):
    """Reads a PDF file and returns its text content."""
    try:
        full_text = ""
        with open(pdf_file_path, 'rb') as pdf_file:
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
        return full_text
    except Exception as e:
        print(f"Error reading PDF file: {e}")
        return None

def extract_emr_details_from_text(emr_text: str) -> dict:
    """Analyzes raw EMR text using Gemini and extracts key patient details."""
    prompt = f"""
    You are an expert medical data analyst. Analyze the following Electronic Medical Record (EMR) text.
    Extract the following specific fields and return them ONLY as a single, valid JSON object.

    1.  "age": The patient's age as an integer.
    2.  "gender_at_birth": The patient's sex assigned at birth as a string (e.g., "Male", "Female").
    3.  "underlying_conditions": A list of strings of the patient's chronic or significant medical conditions.
    4.  "prescriptions": A list of objects, where each object has a "name" and "dosage" string.
    5.  "smoker_status": A clear string value: "Current Smoker", "Former Smoker", or "Non-smoker".
    6.  "alcohol_usage": A descriptive string (e.g., "None", "Socially", "Daily", "Frequent").
    7.  "pregnancy_status": A string: "Pregnant", "Not Pregnant", or "Not Applicable".

    If any information is not found, use a null value or an empty list [] for list-based fields.

    EMR Text to Analyze:
    ---
    {emr_text}
    ---
    """
    try:
        response = model.generate_content(prompt)
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(json_string)
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error parsing Gemini response: {e}")
        return {"error": "Failed to extract data from text."}

# --- 3. API ENDPOINT ---

# The route now includes a patient_id
@app.post("/emr/parse-pdf/{patient_id}")  # <-- UPDATED
async def parse_emr_from_pdf(patient_id: str, file: UploadFile = File(...)):  # <-- UPDATED
    """
    Accepts a patient_id and a PDF file, extracts text, uses Gemini to parse it,
    and saves the structured data to Firestore in 'users' and 'emr_records' collections.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        shutil.copyfileobj(file.file, temp_pdf)
        temp_pdf_path = temp_pdf.name

    try:
        # Step 1: Extract text from the saved PDF
        raw_text = extract_text_from_pdf(temp_pdf_path)
        if not raw_text or raw_text.isspace():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        # Step 2: Process the text with Gemini
        structured_data = extract_emr_details_from_text(raw_text)
        if "error" in structured_data:
            raise HTTPException(status_code=500, detail=structured_data["error"])

        # --- Step 3: Save to Firestore ---  # <-- ADDED BLOCK
        try:
            # Separate data for PII (users collection) and PHI (emr_records collection)
            profile_data = {
                'age': structured_data.get('age'),
                'gender_at_birth': structured_data.get('gender_at_birth')
            }
            # Filter out None values before saving
            profile_data = {k: v for k, v in profile_data.items() if v is not None}

            emr_data = {
                'underlying_conditions': structured_data.get('underlying_conditions'),
                'prescriptions': structured_data.get('prescriptions'),
                'smoker_status': structured_data.get('smoker_status'),
                'alcohol_usage': structured_data.get('alcohol_usage'),
                'pregnancy_status': structured_data.get('pregnancy_status')
            }
            # Filter out None values before saving
            emr_data = {k: v for k, v in emr_data.items() if v is not None}

            # Write to Firestore using .set(..., merge=True) to avoid overwriting existing data
            if profile_data:
                db.collection('users').document(patient_id).set(profile_data, merge=True)
            if emr_data:
                db.collection('emr_records').document(patient_id).set(emr_data, merge=True)
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save data to Firestore: {e}")

        return {"status": "EMR parsed and saved successfully.", "data": structured_data}

    finally:
        # Clean up by removing the temporary file
        os.remove(temp_pdf_path)

@app.get("/", include_in_schema=False)
def root():
    return {"status": "EMR Parser API is running."}