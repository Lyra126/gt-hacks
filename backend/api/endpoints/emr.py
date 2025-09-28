from fastapi import APIRouter, UploadFile, File, HTTPException
from services.extraction_service import parse_emr_with_gemini
from services.timeline_service import extract_text_from_pdf
from firebase_config import realtime_db

router = APIRouter()

@router.post("/emr/upload-pdf/{patient_id}")
async def upload_emr_pdf(patient_id: str, file: UploadFile = File(...)):
    """
    Accepts a patient's EMR PDF, extracts text, uses a specialized Gemini model
    to parse it, and saves the data to the database.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    
    # Step 1: Extract text from the PDF
    text_content = extract_text_from_pdf(file.file)
    if not text_content:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    # Step 2: Use the new Gemini service to parse the text
    structured_data = await parse_emr_with_gemini(text_content)
    if "error" in structured_data:
        raise HTTPException(status_code=500, detail=structured_data["error"])

    # Step 3: Save the parsed data to the correct locations in the database
    try:
        # Separate PII for the 'users' node
        profile_data = {
            'age': structured_data.get('age'),
            'gender_at_birth': structured_data.get('gender_at_birth')
        }
        profile_data = {k: v for k, v in profile_data.items() if v is not None}

        # Separate PHI for the 'emr_records' node
        emr_data = {
            'underlying_conditions': structured_data.get('underlying_conditions'),
            'prescriptions': structured_data.get('prescriptions'),
            'smoker_status': structured_data.get('smoker_status'),
            'alcohol_usage': structured_data.get('alcohol_usage'),
            'pregnancy_status': structured_data.get('pregnancy_status')
        }
        emr_data = {k: v for k, v in emr_data.items() if v is not None}
        
        # Using .update() merges data without overwriting entire nodes
        if profile_data:
            realtime_db.reference(f'users/{patient_id}').update(profile_data)
        if emr_data:
            realtime_db.reference(f'emr_records/{patient_id}').update(emr_data)
            
        return {"status": "EMR uploaded and saved successfully.", "data": structured_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save data to database: {e}")