from fastapi import APIRouter, UploadFile, File, HTTPException
from services.emr_service import process_emr_pdf_and_update_db

router = APIRouter()

@router.post("/emr/upload-pdf/{patient_id}")
async def upload_emr_pdf(patient_id: str, file: UploadFile = File(...)):
    """
    Accepts a patient's EMR PDF, processes it, and updates their record.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    try:
        # The service function handles the entire workflow
        result = await process_emr_pdf_and_update_db(patient_id, file.file)
        return result
    except ValueError as e:
        # Handles errors from text extraction or data parsing
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        # Handles errors from database updates
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # A general catch-all for other unexpected errors
        print(f"An unexpected error occurred during EMR upload: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")