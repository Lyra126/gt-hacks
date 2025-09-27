# api/endpoints/organization.py
from fastapi import APIRouter, HTTPException
from services.deep_agent_service import get_active_patients_for_org

router = APIRouter()

@router.get("/org/{org_id}/active-patients")
async def get_active_patients_endpoint(org_id: str):
    """
    Fetches a list of all active patients associated with a specific clinical organization.
    """
    try:
        patient_list = await get_active_patients_for_org(org_id)
        return {"active_patients": patient_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch active patients.")