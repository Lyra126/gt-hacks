from fastapi import FastAPI, HTTPException, Query
from typing import Optional, List
import httpx
import json
from pydantic import BaseModel

app = FastAPI(
    title="ClinicalTrials.gov API Tester",
    description="A FastAPI application to test and interact with the ClinicalTrials.gov REST API",
    version="1.0.0"
)

# Base URL for ClinicalTrials.gov API
CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2"

# Response models
class StudyResponse(BaseModel):
    totalCount: Optional[int] = None
    studies: List[dict] = []
    nextPageToken: Optional[str] = None

class VersionResponse(BaseModel):
    apiVersion: str
    dataTimestamp: Optional[str] = None

@app.get("/", summary="Welcome endpoint")
async def root():
    return {
        "message": "ClinicalTrials.gov API Tester",
        "description": "Use the endpoints below to test various ClinicalTrials.gov API features",
        "available_endpoints": [
            "/version",
            "/search-studies",
            "/study/{nct_id}",
            "/studies-by-condition",
            "/recent-studies"
        ]
    }

@app.get("/version", response_model=VersionResponse, summary="Get API version")
async def get_version():
    """Get the current API and data version from ClinicalTrials.gov."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/version")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Error fetching version: {str(e)}")

@app.get("/search-studies", response_model=StudyResponse, summary="Search clinical trials")
async def search_studies(
    condition: Optional[str] = Query(None, description="Search by condition (e.g., 'lung cancer')"),
    intervention: Optional[str] = Query(None, description="Search by intervention (e.g., 'immunotherapy')"),
    location: Optional[str] = Query(None, description="Search by location"),
    status: Optional[List[str]] = Query(None, description="Filter by status (e.g., RECRUITING, COMPLETED)"),
    page_size: int = Query(10, description="Number of studies per page (max 1000)", le=1000),
    count_total: bool = Query(True, description="Include total count in response"),
    fields: Optional[List[str]] = Query(None, description="Specific fields to return")
):
    """
    Ex:
    - Search for lung cancer studies: ?condition=lung cancer
    - Search recruiting studies: ?status=RECRUITING
    - Search by intervention: ?intervention=immunotherapy
    """
    params = {
        "format": "json",
        "pageSize": page_size,
        "countTotal": count_total
    }
    
    # Add query parameters
    if condition:
        params["query.cond"] = condition
    if intervention:
        params["query.intr"] = intervention
    if location:
        params["query.locn"] = location
    if status:
        params["filter.overallStatus"] = "|".join(status)
    if fields:
        params["fields"] = "|".join(fields)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/studies", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Error searching studies: {str(e)}")

@app.get("/study/{nct_id}", summary="Get single study by NCT ID")
async def get_study(
    nct_id: str,
    fields: Optional[List[str]] = Query(None, description="Specific fields to return")
):
    """
    Ex: /study/NCT03540771
    """
    params = {"format": "json"}
    if fields:
        params["fields"] = "|".join(fields)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/studies/{nct_id}", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Study {nct_id} not found")
            raise HTTPException(status_code=500, detail=f"Error fetching study: {str(e)}")

@app.get("/studies-by-condition", response_model=StudyResponse, summary="Get studies by medical condition")
async def get_studies_by_condition(
    condition: str = Query(..., description="Medical condition to search for"),
    recruiting_only: bool = Query(False, description="Only show recruiting studies"),
    page_size: int = Query(20, le=100)
):
    """
    Ex:
    - Diabetes studies: ?condition=diabetes
    - Cancer studies (recruiting only): ?condition=cancer&recruiting_only=true
    """
    params = {
        "query.cond": condition,
        "format": "json",
        "pageSize": page_size,
        "countTotal": True,
        "fields": "NCTId|BriefTitle|OverallStatus|Phase|StudyType|BriefSummary"
    }
    
    if recruiting_only:
        params["filter.overallStatus"] = "RECRUITING"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/studies", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Error fetching studies: {str(e)}")

@app.get("/recent-studies", response_model=StudyResponse, summary="Get recently updated studies")
async def get_recent_studies(
    days: int = Query(30, description="Number of days back to search", le=365),
    page_size: int = Query(10, le=50)
):
    """
    Ex: ?days=7 (studies updated in last 7 days)
    """
    # Calculate the date range (this is a simplified example)
    from datetime import datetime, timedelta
    
    recent_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    params = {
        "query.term": f"AREA[LastUpdatePostDate]RANGE[{recent_date},MAX]",
        "format": "json",
        "pageSize": page_size,
        "countTotal": True,
        "sort": "LastUpdatePostDate:desc",
        "fields": "NCTId|BriefTitle|OverallStatus|LastUpdatePostDate|Phase"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/studies", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Error fetching recent studies: {str(e)}")

@app.get("/studies-near-location", response_model=StudyResponse, summary="Find studies near a location")
async def get_studies_near_location(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    distance_miles: int = Query(50, description="Search radius in miles"),
    condition: Optional[str] = Query(None, description="Optional condition filter"),
    page_size: int = Query(20, le=100)
):
    """
    Ex:
    ?latitude=39.0035707&longitude=-77.1013313&distance_miles=50
    """
    params = {
        "filter.geo": f"distance({latitude},{longitude},{distance_miles}mi)",
        "format": "json",
        "pageSize": page_size,
        "countTotal": True,
        "fields": "NCTId|BriefTitle|OverallStatus|Phase|LocationFacility|LocationCity|LocationState"
    }
    
    if condition:
        params["query.cond"] = condition
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/studies", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Error fetching location-based studies: {str(e)}")

@app.get("/field-stats", summary="Get field value statistics")
async def get_field_stats(
    field_type: Optional[List[str]] = Query(None, description="Field types (ENUM, STRING, etc.)")
):
    params = {}
    if field_type:
        params["types"] = "|".join(field_type)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/stats/field/values", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Error fetching field stats: {str(e)}")

@app.get("/enums", summary="Get enumeration values")
async def get_enums():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLINICAL_TRIALS_BASE_URL}/studies/enums")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Error fetching enums: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)