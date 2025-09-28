import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# --- Initialize Gemini Client ---
try:
    api_key = os.environ["GOOGLE_API_KEY"]
    genai.configure(api_key=api_key) # type: ignore
    gemini_model = genai.GenerativeModel('gemini-2.5-flash') # type: ignore
except Exception as e:
    print(f"Failed to initialize Gemini. Make sure GOOGLE_API_KEY is set. Error: {e}")
    gemini_model = None

async def parse_emr_with_gemini(emr_text: str) -> dict:
    """
    Analyzes raw EMR text using Gemini and extracts key patient details into a structured dictionary.
    """
    if not gemini_model:
        raise ConnectionError("Gemini model is not initialized.")

    prompt = f"""
    You are an expert medical data analyst. Analyze the following Electronic Medical Record (EMR) text.
    Extract the following specific fields and return them ONLY as a single, valid JSON object.

    1.  "age": The patient's age as an integer.
    2.  "gender_at_birth": The patient's sex assigned at birth as a string (e.g., "Male", "Female").
    3.  "underlying_conditions": A list of strings of the patient's chronic medical conditions.
    4.  "prescriptions": A list of objects, where each object has a "name" and "dosage" string.
    5.  "smoker_status": A clear string value: "Current Smoker", "Former Smoker", or "Non-smoker".
    6.  "alcohol_usage": A descriptive string (e.g., "None", "Socially", "Daily", "Frequent").
    7.  "pregnancy_status": A string: "Pregnant", "Not Pregnant", or "Not Applicable".

    If any information is not found, use a null value or an empty list.

    EMR Text to Analyze:
    ---
    {emr_text}
    ---
    """
    try:
        response = await gemini_model.generate_content_async(prompt)
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(json_string)
    except Exception as e:
        print(f"Error parsing with Gemini: {e}")
        return {"error": "Failed to extract data from text using Gemini."}