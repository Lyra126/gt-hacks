# api/endpoints/timeline.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
# This will import the parsing logic from our service file
from services.timeline_service import generate_timeline_from_text, extract_text_from_pdf

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/timeline/from-text")
async def create_timeline_from_text(request: TextRequest):
    """
    Accepts a block of text and returns a structured JSON timeline.
    """
    if not request.text or request.text.isspace():
        raise HTTPException(status_code=400, detail="Text content cannot be empty.")
    
    timeline_json = await generate_timeline_from_text(request.text)
    if "error" in timeline_json:
        raise HTTPException(status_code=500, detail=timeline_json["error"])
        
    return timeline_json

@router.post("/timeline/from-pdf")
async def create_timeline_from_pdf(file: UploadFile = File(...)):
    """
    Accepts a PDF file, extracts its text, and returns a structured JSON timeline.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    text_content = extract_text_from_pdf(file.file)
    if not text_content:
        raise HTTPException(status_code=400, detail="Could not extract text from the uploaded PDF.")
    
    timeline_json = await generate_timeline_from_text(text_content)
    if "error" in timeline_json:
        raise HTTPException(status_code=500, detail=timeline_json["error"])

    return timeline_json