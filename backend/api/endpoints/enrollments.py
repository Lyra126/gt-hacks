from fastapi import APIRouter, HTTPException
from firebase_config import realtime_db
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter()

@router.get("/enrollments/{patient_id}")
async def get_patient_enrollments(patient_id: str):
    """
    Get all active enrollments for a specific patient.
    """
    try:
        print(f"RTDB: Fetching enrollments for patient '{patient_id}'")
        
        # Get patient's enrollments
        enrollments_ref = realtime_db.reference(f'enrollments')
        all_enrollments = enrollments_ref.get() or {}
        
        # Filter enrollments for this patient
        patient_enrollments = []
        for enrollment_id, enrollment_data in all_enrollments.items():
            if enrollment_data.get('patientId') == patient_id and enrollment_data.get('isActive', True):
                # Get trial details
                trial_ref = realtime_db.reference(f'trials/{enrollment_data.get("trialId")}')
                trial_data = trial_ref.get()
                
                if trial_data:
                    enrollment_data['trialDetails'] = trial_data
                    enrollment_data['enrollmentId'] = enrollment_id
                    patient_enrollments.append(enrollment_data)
        
        print(f"Found {len(patient_enrollments)} active enrollments for patient {patient_id}")
        return {
            "patientId": patient_id,
            "enrollments": patient_enrollments,
            "totalEnrollments": len(patient_enrollments)
        }
        
    except Exception as e:
        print(f"Error fetching patient enrollments: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch enrollments: {str(e)}")

@router.post("/enrollments")
async def create_enrollment(enrollment_data: Dict[str, Any]):
    """
    Create a new enrollment for a patient in a trial.
    """
    try:
        patient_id = enrollment_data.get('patientId')
        trial_id = enrollment_data.get('trialId')
        
        if not patient_id or not trial_id:
            raise HTTPException(status_code=400, detail="patientId and trialId are required")
        
        # Check if trial exists
        trial_ref = realtime_db.reference(f'trials/{trial_id}')
        trial_data = trial_ref.get()
        
        if not trial_data:
            raise HTTPException(status_code=404, detail="Trial not found")
        
        # Check if patient is already enrolled
        enrollments_ref = realtime_db.reference('enrollments')
        all_enrollments = enrollments_ref.get() or {}
        
        for enrollment_id, existing_enrollment in all_enrollments.items():
            if (existing_enrollment.get('patientId') == patient_id and 
                existing_enrollment.get('trialId') == trial_id and 
                existing_enrollment.get('isActive', True)):
                raise HTTPException(status_code=400, detail="Patient is already enrolled in this trial")
        
        # Create new enrollment
        new_enrollment = {
            "patientId": patient_id,
            "trialId": trial_id,
            "enrollmentDate": datetime.now().isoformat(),
            "status": "Active",
            "isActive": True,
            "currentStage": 1,
            "complianceRate": 0,
            "lastUpdated": datetime.now().isoformat()
        }
        
        # Save to database
        enrollments_ref.push(new_enrollment)
        
        return {
            "message": "Enrollment created successfully",
            "enrollment": new_enrollment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating enrollment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create enrollment: {str(e)}")

@router.put("/enrollments/{enrollment_id}")
async def update_enrollment(enrollment_id: str, update_data: Dict[str, Any]):
    """
    Update an existing enrollment (e.g., progress, compliance).
    """
    try:
        enrollments_ref = realtime_db.reference(f'enrollments/{enrollment_id}')
        enrollment_data = enrollments_ref.get()
        
        if not enrollment_data:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Update the enrollment
        update_data['lastUpdated'] = datetime.now().isoformat()
        enrollments_ref.update(update_data)
        
        return {
            "message": "Enrollment updated successfully",
            "enrollmentId": enrollment_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating enrollment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update enrollment: {str(e)}")

@router.delete("/enrollments/{enrollment_id}")
async def deactivate_enrollment(enrollment_id: str):
    """
    Deactivate an enrollment (patient withdraws from trial).
    """
    try:
        enrollments_ref = realtime_db.reference(f'enrollments/{enrollment_id}')
        enrollment_data = enrollments_ref.get()
        
        if not enrollment_data:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Deactivate the enrollment
        enrollments_ref.update({
            "isActive": False,
            "status": "Withdrawn",
            "lastUpdated": datetime.now().isoformat()
        })
        
        return {
            "message": "Enrollment deactivated successfully",
            "enrollmentId": enrollment_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deactivating enrollment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to deactivate enrollment: {str(e)}")

@router.put("/enrollments/{enrollment_id}/progress")
async def update_enrollment_progress(enrollment_id: str, progress_data: dict):
    """
    Update enrollment progress based on timeline completion.
    """
    try:
        enrollments_ref = realtime_db.reference('enrollments')
        enrollment = enrollments_ref.child(enrollment_id).get()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Calculate progress based on completed tasks
        taskStatus = progress_data.get('taskStatus', [])
        totalTasks = sum(len(stage) for stage in taskStatus)
        completedTasks = sum(sum(stage) for stage in taskStatus)
        completionRate = round((completedTasks / totalTasks) * 100) if totalTasks > 0 else 0
        
        # Update current stage based on completion
        currentStage = 1
        for i, stage in enumerate(taskStatus):
            if all(stage):  # All tasks in this stage are completed
                currentStage = i + 2
            else:
                break
        
        # Update enrollment
        enrollment['currentStage'] = min(currentStage, len(taskStatus))
        enrollment['complianceRate'] = completionRate
        enrollment['lastUpdated'] = datetime.now().isoformat()
        
        enrollments_ref.child(enrollment_id).set(enrollment)
        
        return {
            "message": "Enrollment progress updated successfully",
            "enrollmentId": enrollment_id,
            "currentStage": enrollment['currentStage'],
            "completionRate": completionRate
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating enrollment progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update enrollment progress: {str(e)}")

@router.delete("/enrollments/clear-all")
async def clear_all_enrollments():
    """
    Clear all enrollments (for demo purposes).
    """
    try:
        enrollments_ref = realtime_db.reference('enrollments')
        all_enrollments = enrollments_ref.get() or {}
        
        # Clear all enrollments
        enrollments_ref.delete()
        
        return {
            "message": f"Cleared {len(all_enrollments)} enrollments successfully",
            "clearedCount": len(all_enrollments)
        }
        
    except Exception as e:
        print(f"Error clearing enrollments: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear enrollments: {str(e)}")
