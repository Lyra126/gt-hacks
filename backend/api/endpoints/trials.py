# api/endpoints/trials.py
from fastapi import APIRouter, HTTPException
from services.deep_agent_service import get_available_trials
from firebase_config import realtime_db

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

@router.get("/trials/{trial_id}/stages")
async def get_trial_stages_endpoint(trial_id: str):
    """
    Fetches the stages/timeline data for a specific clinical trial.
    """
    try:
        # Get the full trial data first
        trial_ref = realtime_db.reference(f'trials/{trial_id}')
        trial_data = trial_ref.get()
        
        if not trial_data:
            raise HTTPException(status_code=404, detail=f"Trial {trial_id} not found")
        
        # Extract stages from the trial data
        stages = trial_data.get('stages') # type: ignore
        
        if not stages:
            raise HTTPException(status_code=404, detail=f"No stages found for trial {trial_id}")
        
        # Convert array to object format if needed
        if isinstance(stages, list):
            # Filter out null values and convert to object format
            stages_dict = {}
            for i, stage in enumerate(stages):
                if stage is not None:
                    stages_dict[str(i)] = stage
            stages = stages_dict
        
        return {"stages": stages}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch trial stages.")