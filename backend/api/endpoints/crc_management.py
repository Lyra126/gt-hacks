from fastapi import APIRouter, HTTPException
from firebase_admin import db
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter()

@router.get("/crc/{crc_id}/patients")
async def get_managed_patients(crc_id: str):
    """
    Get all patients managed by a specific CRC.
    """
    try:
        # Get CRC's managed patients
        crc_ref = db.reference(f'crc_assignments/{crc_id}')
        assignments = crc_ref.get()
        
        if not assignments:
            return {"patients": [], "total": 0}
        
        # Get patient details for each assignment
        patients = []
        for patient_id, assignment_data in assignments.items():
            try:
                # Get patient profile
                patient_ref = db.reference(f'users/{patient_id}')
                patient_data = patient_ref.get()
                
                if patient_data:
                    # Get patient's enrollments by searching through all enrollments
                    enrollments_ref = db.reference('enrollments')
                    all_enrollments = enrollments_ref.get() or {}
                    
                    # Filter enrollments for this patient and fetch trial details
                    patient_enrollments = []
                    for enrollment_id, enrollment_data in all_enrollments.items():
                        if enrollment_data.get('patientId') == patient_id and enrollment_data.get('isActive', False):
                            # Fetch trial details for this enrollment
                            trial_id = enrollment_data.get('trialId')
                            if trial_id:
                                try:
                                    trial_ref = db.reference(f'trials/{trial_id}')
                                    trial_data = trial_ref.get()
                                    if trial_data:
                                        enrollment_data['trialDetails'] = {
                                            'title': trial_data.get('title', 'Unknown Trial'),
                                            'condition': trial_data.get('condition', 'Unknown'),
                                            'phases': trial_data.get('phases', 'Unknown'),
                                            'sponsor': trial_data.get('sponsor', 'Unknown'),
                                            'location': trial_data.get('location', 'Unknown'),
                                            'status': trial_data.get('status', 'Unknown')
                                        }
                                except Exception as e:
                                    print(f"Error fetching trial details for {trial_id}: {e}")
                                    enrollment_data['trialDetails'] = {
                                        'title': 'Unknown Trial',
                                        'condition': 'Unknown',
                                        'phases': 'Unknown',
                                        'sponsor': 'Unknown',
                                        'location': 'Unknown',
                                        'status': 'Unknown'
                                    }
                            patient_enrollments.append(enrollment_data)
                    
                    patient_info = {
                        "patientId": patient_id,
                        "firstName": patient_data.get('firstName', 'Unknown'),
                        "lastName": patient_data.get('lastName', 'Unknown'),
                        "email": patient_data.get('email', 'Unknown'),
                        "assignedDate": assignment_data.get('assignedDate', datetime.now().isoformat()),
                        "status": assignment_data.get('status', 'Active'),
                        "enrollments": patient_enrollments,
                        "totalEnrollments": len(patient_enrollments)
                    }
                    patients.append(patient_info)
            except Exception as e:
                print(f"Error fetching patient {patient_id}: {e}")
                continue
        
        return {
            "patients": patients,
            "total": len(patients),
            "crcId": crc_id
        }
        
    except Exception as e:
        print(f"Error fetching managed patients: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch managed patients: {str(e)}")

@router.post("/crc/{crc_id}/assign-patient")
async def assign_patient_to_crc(crc_id: str, patient_id: str):
    """
    Assign a patient to a CRC for management.
    """
    try:
        # Check if patient exists
        patient_ref = db.reference(f'users/{patient_id}')
        patient_data = patient_ref.get()
        
        if not patient_data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Create assignment
        assignment_data = {
            "assignedDate": datetime.now().isoformat(),
            "status": "Active",
            "crcId": crc_id,
            "patientId": patient_id
        }
        
        # Store in CRC assignments
        crc_ref = db.reference(f'crc_assignments/{crc_id}/{patient_id}')
        crc_ref.set(assignment_data)
        
        # Also store in patient's CRC assignment
        patient_crc_ref = db.reference(f'patient_assignments/{patient_id}')
        patient_crc_ref.set({
            "crcId": crc_id,
            "assignedDate": assignment_data["assignedDate"],
            "status": "Active"
        })
        
        return {
            "message": "Patient assigned successfully",
            "crcId": crc_id,
            "patientId": patient_id,
            "assignment": assignment_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning patient: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign patient: {str(e)}")

@router.delete("/crc/{crc_id}/unassign-patient/{patient_id}")
async def unassign_patient_from_crc(crc_id: str, patient_id: str):
    """
    Remove a patient from a CRC's management.
    """
    try:
        # Remove from CRC assignments
        crc_ref = db.reference(f'crc_assignments/{crc_id}/{patient_id}')
        crc_ref.delete()
        
        # Remove from patient's CRC assignment
        patient_crc_ref = db.reference(f'patient_assignments/{patient_id}')
        patient_crc_ref.delete()
        
        return {
            "message": "Patient unassigned successfully",
            "crcId": crc_id,
            "patientId": patient_id
        }
        
    except Exception as e:
        print(f"Error unassigning patient: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unassign patient: {str(e)}")

@router.get("/crc/{crc_id}/dashboard-data")
async def get_crc_dashboard_data(crc_id: str):
    """
    Get comprehensive dashboard data for a CRC including their managed patients.
    """
    try:
        # Get managed patients
        patients_response = await get_managed_patients(crc_id)
        managed_patients = patients_response["patients"]
        
        # Calculate metrics
        total_patients = len(managed_patients)
        active_enrollments = sum(patient["totalEnrollments"] for patient in managed_patients)
        
        # Get recent activity (last 7 days)
        recent_activity = []
        for patient in managed_patients:
            for enrollment in patient["enrollments"]:
                if enrollment.get("isActive", False):
                    recent_activity.append({
                        "patientName": f"{patient['firstName']} {patient['lastName']}",
                        "trialTitle": enrollment.get("trialDetails", {}).get("title", "Unknown Trial"),
                        "status": enrollment.get("status", "Active"),
                        "lastUpdated": enrollment.get("lastUpdated", datetime.now().isoformat()),
                        "complianceRate": enrollment.get("complianceRate", 0)
                    })
        
        # Sort by last updated
        recent_activity.sort(key=lambda x: x["lastUpdated"], reverse=True)
        
        # Calculate compliance metrics
        compliance_rates = [activity["complianceRate"] for activity in recent_activity if activity["complianceRate"] > 0]
        avg_compliance = sum(compliance_rates) / len(compliance_rates) if compliance_rates else 0
        
        # Risk assessment
        high_risk_patients = [p for p in managed_patients if any(
            e.get("complianceRate", 0) < 60 for e in p["enrollments"]
        )]
        
        return {
            "crcId": crc_id,
            "metrics": {
                "totalPatients": total_patients,
                "activeEnrollments": active_enrollments,
                "averageCompliance": round(avg_compliance, 1),
                "highRiskPatients": len(high_risk_patients)
            },
            "managedPatients": managed_patients,
            "recentActivity": recent_activity[:10],  # Last 10 activities
            "alerts": [
                {
                    "type": "high_risk",
                    "message": f"{len(high_risk_patients)} patients have low compliance rates",
                    "priority": "high" if len(high_risk_patients) > 0 else "low"
                },
                {
                    "type": "new_enrollments",
                    "message": f"{active_enrollments} active enrollments across all patients",
                    "priority": "medium"
                }
            ]
        }
        
    except Exception as e:
        print(f"Error fetching CRC dashboard data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch CRC dashboard data: {str(e)}")

@router.post("/crc/seed-demo-data")
async def seed_demo_crc_data():
    """
    Seed demo data for CRC-patient assignments.
    """
    try:
        # Assign the demo patient to the demo CRC
        demo_crc_id = "CRC-12345"
        demo_patient_id = "-OaDtjio4inz8EbIDWg3"
        
        # Create assignment
        assignment_data = {
            "assignedDate": datetime.now().isoformat(),
            "status": "Active",
            "crcId": demo_crc_id,
            "patientId": demo_patient_id
        }
        
        # Store in CRC assignments
        crc_ref = db.reference(f'crc_assignments/{demo_crc_id}/{demo_patient_id}')
        crc_ref.set(assignment_data)
        
        # Store in patient's CRC assignment
        patient_crc_ref = db.reference(f'patient_assignments/{demo_patient_id}')
        patient_crc_ref.set({
            "crcId": demo_crc_id,
            "assignedDate": assignment_data["assignedDate"],
            "status": "Active"
        })
        
        return {
            "message": "Demo CRC data seeded successfully",
            "assignments": [assignment_data]
        }
        
    except Exception as e:
        print(f"Error seeding demo CRC data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to seed demo CRC data: {str(e)}")
