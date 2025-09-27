# api/endpoints/trials.py
from fastapi import APIRouter, HTTPException
from services.deep_agent_service import get_available_trials

router = APIRouter()

@router.get("/trials/available")
async def get_available_trials_endpoint():
    """
    Fetches a list of all clinical trials that are currently active or recruiting.
    """
    try:
        trials_list = await get_available_trials()
        return {"available_trials": trials_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch available trials.")