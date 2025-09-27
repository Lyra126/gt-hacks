# api/endpoints/patient.py
from fastapi import APIRouter, HTTPException
# Import the new function from your service file
from services.deep_agent_service import generate_personalized_timeline, get_patient_emr_for_dashboard, get_patient_profile_for_dashboard

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

@router.get("/patient/{patient_id}/emr")
async def get_emr_for_patient_dashboard(patient_id: str):
    """
    Fetches the EMR data for a specific patient to display on their dashboard.
    """
    try:
        emr_data = await get_patient_emr_for_dashboard(patient_id)
        return emr_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch EMR data.")
    
@router.get("/patient/{patient_id}/profile")
async def get_profile_for_patient_dashboard(patient_id: str):
    """
    Fetches the PII profile data for a specific patient.
    """
    try:
        profile_data = await get_patient_profile_for_dashboard(patient_id)
        return profile_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch profile data.")