# api/endpoints/patient.py
from fastapi import APIRouter, HTTPException
# Import the new function from your service file
from services.deep_agent_service import generate_personalized_timeline

router = APIRouter()

@router.get("/patient/{patient_id}/personalized-timeline/{trial_id}")
async def get_personalized_timeline_endpoint(patient_id: str, trial_id: str):
    """
    Generates and returns a personalized timeline and checklist for a specific
    patient enrolled in a specific trial.
    """
    timeline = await generate_personalized_timeline(patient_id, trial_id)
    if "error" in timeline:
        raise HTTPException(status_code=404, detail=timeline["error"])
    return timeline