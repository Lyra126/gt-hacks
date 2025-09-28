import json
from typing import IO

# Import functions and clients from your existing services
from services.timeline_service import extract_text_from_pdf, medgemma_client
from services.deep_agent_service import update_patient_emr

async def extract_emr_details_from_text(emr_text: str) -> dict:
    """Analyzes raw EMR text using MedGemma and extracts key patient details."""
    prompt = f"""
    You are an expert medical data analyst. Analyze the following Electronic Medical Record (EMR) text.
    Extract any relevant fields such as age, conditions, prescriptions, smoker status, etc.
    Return them ONLY as a single, valid JSON object. If a field is not found, omit it.

    EMR Text to Analyze:
    ---
    {emr_text}
    ---
    """
    try:
        response_text = await medgemma_client.generate(prompt)
        return json.loads(response_text)
    except Exception as e:
        print(f"Error parsing MedGemma response for EMR: {e}")
        return {"error": "Failed to extract structured data from text."}

async def process_emr_pdf_and_update_db(patient_id: str, pdf_file_stream: IO[bytes]) -> dict:
    """
    Orchestrates the EMR PDF processing: text extraction, AI analysis, and DB update.
    """
    # 1. Extract raw text from the PDF
    raw_text = extract_text_from_pdf(pdf_file_stream)
    if not raw_text or raw_text.isspace():
        raise ValueError("Could not extract text from PDF. The file might be empty or an image.")

    # 2. Get structured data from the text using MedGemma
    structured_data = await extract_emr_details_from_text(raw_text)
    if "error" in structured_data:
        raise ValueError(structured_data["error"])

    # 3. Create a log entry with the new data to be stored
    log_entry = {
        "source": "PDF Upload",
        "data": structured_data
    }

    # 4. Update the patient's EMR in the database
    update_status = await update_patient_emr.ainvoke( # type: ignore
        {"patient_id": patient_id, "new_entry": log_entry}
    )
    if "Error" in update_status:
        raise ConnectionError(f"Failed to update database: {update_status}")

    # 5. Return a summary for the frontend
    summary = f"Successfully extracted {len(structured_data.keys())} fields from the EMR."
    return {"summary": summary, "extracted_data": structured_data}