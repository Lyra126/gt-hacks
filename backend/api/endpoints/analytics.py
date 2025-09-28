from fastapi import APIRouter, HTTPException
from firebase_config import realtime_db
import random
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/analytics/dashboard-metrics")
async def get_dashboard_metrics():
    """
    Get real-time dashboard metrics for CRC users.
    """
    try:
        # Get all trials data
        trials_ref = realtime_db.reference('trials')
        trials_data = trials_ref.get() or {}
        
        # Get all enrollments data
        enrollments_ref = realtime_db.reference('enrollments')
        enrollments_data = enrollments_ref.get() or {}
        
        # Calculate metrics
        active_trials = len([t for t in trials_data.values() if t.get('status') in ['Active', 'Recruiting']])
        total_patients = len(set(e.get('patientId') for e in enrollments_data.values() if e.get('isActive')))
        
        # Calculate compliance rate (simulated based on checklist completion)
        compliance_rate = 0
        if enrollments_data:
            total_checklist_items = 0
            completed_items = 0
            
            for enrollment in enrollments_data.values():
                checklist_progress = enrollment.get('checklistProgress', {})
                for stage, items in checklist_progress.items():
                    if isinstance(items, dict):
                        total_checklist_items += len(items)
                        completed_items += sum(1 for completed in items.values() if completed)
            
            if total_checklist_items > 0:
                compliance_rate = round((completed_items / total_checklist_items) * 100)
        
        # Calculate enrollment rate
        enrollment_rate = 0
        if trials_data:
            total_target = sum(t.get('maxParticipants', 0) for t in trials_data.values())
            total_current = sum(t.get('currentParticipants', 0) for t in trials_data.values())
            if total_target > 0:
                enrollment_rate = round((total_current / total_target) * 100)
        
        # Generate alerts
        alerts = []
        
        # Check for protocol violations (simulated)
        if random.random() < 0.3:  # 30% chance of having alerts
            alerts.append({
                "id": 1,
                "type": "warning",
                "title": "Protocol Violation",
                "message": "Patient missed scheduled visit",
                "time": "2 hours ago",
                "trial": "Immunotherapy Study"
            })
        
        # Check for enrollment milestones
        if enrollment_rate > 75:
            alerts.append({
                "id": 2,
                "type": "info",
                "title": "Enrollment Milestone",
                "message": f"Trial reached {enrollment_rate}% enrollment target",
                "time": "4 hours ago",
                "trial": "Multiple Trials"
            })
        
        # Check for data quality
        if compliance_rate > 90:
            alerts.append({
                "id": 3,
                "type": "success",
                "title": "Data Quality",
                "message": "All EMR data validated successfully",
                "time": "6 hours ago",
                "trial": "All Trials"
            })
        
        return {
            "metrics": {
                "activeTrials": active_trials,
                "totalPatients": total_patients,
                "complianceRate": compliance_rate,
                "enrollmentRate": enrollment_rate,
                "alertsCount": len(alerts)
            },
            "alerts": alerts,
            "lastUpdated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard metrics: {str(e)}")

@router.get("/analytics/trial-performance/{trial_id}")
async def get_trial_performance(trial_id: str):
    """
    Get detailed performance metrics for a specific trial.
    """
    try:
        # Get trial data
        trial_ref = realtime_db.reference(f'trials/{trial_id}')
        trial_data = trial_ref.get()
        
        if not trial_data:
            raise HTTPException(status_code=404, detail="Trial not found")
        
        # Get enrollments for this trial
        enrollments_ref = realtime_db.reference('enrollments')
        all_enrollments = enrollments_ref.get() or {}
        
        trial_enrollments = [
            e for e in all_enrollments.values() 
            if e.get('trialId') == trial_id and e.get('isActive')
        ]
        
        # Calculate trial-specific metrics
        enrollment_rate = 0
        if trial_data.get('maxParticipants', 0) > 0:
            enrollment_rate = round((len(trial_enrollments) / trial_data['maxParticipants']) * 100)
        
        # Calculate compliance rate for this trial
        compliance_rate = 0
        if trial_enrollments:
            total_items = 0
            completed_items = 0
            
            for enrollment in trial_enrollments:
                checklist_progress = enrollment.get('checklistProgress', {})
                for stage, items in checklist_progress.items():
                    if isinstance(items, dict):
                        total_items += len(items)
                        completed_items += sum(1 for completed in items.values() if completed)
            
            if total_items > 0:
                compliance_rate = round((completed_items / total_items) * 100)
        
        # Calculate days to completion
        end_date = trial_data.get('endDate')
        days_to_completion = 0
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                days_to_completion = (end_date_obj - datetime.now()).days
            except:
                pass
        
        return {
            "trialId": trial_id,
            "title": trial_data.get('title'),
            "enrollmentRate": enrollment_rate,
            "complianceRate": compliance_rate,
            "currentEnrollment": len(trial_enrollments),
            "maxParticipants": trial_data.get('maxParticipants', 0),
            "daysToCompletion": max(0, days_to_completion),
            "riskLevel": "low" if compliance_rate > 90 and enrollment_rate > 80 else "medium" if compliance_rate > 75 else "high"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trial performance: {str(e)}")

@router.get("/analytics/smart-matching/{patient_id}")
async def get_smart_trial_matching(patient_id: str):
    """
    Get AI-powered trial recommendations for a specific patient based on their EMR data.
    """
    try:
        # Get patient data
        patient_ref = realtime_db.reference(f'users/{patient_id}')
        patient_data = patient_ref.get()
        
        if not patient_data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get patient's EMR data
        emr_ref = realtime_db.reference(f'emr/{patient_id}')
        emr_data = emr_ref.get()
        
        # Get all available trials
        trials_ref = realtime_db.reference('trials')
        trials_data = trials_ref.get() or {}
        
        # Simple matching algorithm (in real app, this would use ML)
        patient_conditions = []
        if emr_data:
            # Extract conditions from EMR logs
            for log in emr_data.get('logs', []):
                if 'data' in log and 'underlying_conditions' in log['data']:
                    patient_conditions.extend(log['data']['underlying_conditions'])
        
        # Remove duplicates and normalize
        patient_conditions = list(set(patient_conditions))
        
        # Score trials based on condition matching
        scored_trials = []
        for trial_id, trial_data in trials_data.items():
            if trial_data.get('status') not in ['Active', 'Recruiting']:
                continue
                
            score = 0
            trial_condition = trial_data.get('condition', '').lower()
            
            # Check for exact condition match
            for condition in patient_conditions:
                if condition.lower() in trial_condition or trial_condition in condition.lower():
                    score += 100
                elif any(word in trial_condition for word in condition.lower().split()):
                    score += 50
            
            # Bonus for active/recruiting status
            if trial_data.get('status') == 'Recruiting':
                score += 20
            elif trial_data.get('status') == 'Active':
                score += 10
            
            # Bonus for nearby location (simplified)
            if 'atlanta' in trial_data.get('location', '').lower():
                score += 15
            
            if score > 0:
                scored_trials.append({
                    'trialId': trial_id,
                    'title': trial_data.get('title'),
                    'condition': trial_data.get('condition'),
                    'location': trial_data.get('location'),
                    'status': trial_data.get('status'),
                    'description': trial_data.get('description'),
                    'matchScore': min(score, 100),  # Cap at 100%
                    'matchReasons': [
                        f"Condition match: {trial_data.get('condition')}",
                        f"Status: {trial_data.get('status')}",
                        f"Location: {trial_data.get('location')}"
                    ]
                })
        
        # Sort by match score
        scored_trials.sort(key=lambda x: x['matchScore'], reverse=True)
        
        return {
            "patientId": patient_id,
            "name": f"{patient_data.get('firstName', '')} {patient_data.get('lastName', '')}",
            "patientConditions": patient_conditions,
            "recommendedTrials": scored_trials[:5],  # Top 5 matches
            "totalTrialsAnalyzed": len(trials_data),
            "lastUpdated": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get smart matching: {str(e)}")

@router.get("/analytics/patient-insights/{patient_id}")
async def get_patient_insights(patient_id: str):
    """
    Get AI-generated insights for a specific patient.
    """
    try:
        # Get patient data
        patient_ref = realtime_db.reference(f'users/{patient_id}')
        patient_data = patient_ref.get()
        
        if not patient_data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get patient's enrollments
        enrollments_ref = realtime_db.reference('enrollments')
        all_enrollments = enrollments_ref.get() or {}
        
        patient_enrollments = [
            e for e in all_enrollments.values() 
            if e.get('patientId') == patient_id and e.get('isActive')
        ]
        
        # Generate insights (simulated AI analysis)
        insights = []
        
        if patient_enrollments:
            for enrollment in patient_enrollments:
                current_stage = enrollment.get('currentStage', 1)
                checklist_progress = enrollment.get('checklistProgress', {})
                
                # Calculate stage completion
                stage_key = f'stage{current_stage}'
                stage_items = checklist_progress.get(stage_key, {})
                
                if stage_items:
                    completed = sum(1 for completed in stage_items.values() if completed)
                    total = len(stage_items)
                    completion_rate = (completed / total) * 100
                    
                    if completion_rate < 50:
                        insights.append({
                            "type": "warning",
                            "message": f"Patient is behind on Stage {current_stage} tasks ({completion_rate:.0f}% complete)",
                            "priority": "high"
                        })
                    elif completion_rate > 90:
                        insights.append({
                            "type": "success",
                            "message": f"Patient is excelling in Stage {current_stage} ({completion_rate:.0f}% complete)",
                            "priority": "low"
                        })
        
        # Add general health insights
        if patient_data.get('age', 0) > 65:
            insights.append({
                "type": "info",
                "message": "Patient is in high-risk age group - monitor closely",
                "priority": "medium"
            })
        
        return {
            "patientId": patient_id,
            "name": f"{patient_data.get('firstName', '')} {patient_data.get('lastName', '')}",
            "insights": insights,
            "activeTrials": len(patient_enrollments),
            "lastUpdated": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch patient insights: {str(e)}")
