# services/trials_service.py
import json
from typing import List, Dict, Optional
from firebase_admin import db as realtime_db

class ClinicalTrialsService:
    """Service for managing clinical trials data in Firebase Realtime Database"""
    
    @staticmethod
    async def get_all_trials() -> List[Dict]:
        """Fetch all clinical trials from the database"""
        try:
            ref = realtime_db.reference('trials')
            trials_data = ref.get()
            
            if not trials_data:
                return []
            
            # Convert dict to list with IDs
            trials_list = []
            for trial_id, trial_data in trials_data.items():
                trial_data['id'] = trial_id
                trials_list.append(trial_data)
            
            return trials_list
        except Exception as e:
            raise Exception(f"Error fetching clinical trials: {str(e)}")
    
    @staticmethod
    async def get_trial_by_id(trial_id: str) -> Optional[Dict]:
        """Fetch a specific clinical trial by ID"""
        try:
            ref = realtime_db.reference(f'trials/{trial_id}')
            trial_data = ref.get()
            
            if trial_data:
                trial_data['id'] = trial_id
                return trial_data
            return None
        except Exception as e:
            raise Exception(f"Error fetching trial {trial_id}: {str(e)}")
    
    @staticmethod
    async def create_trial(trial_data: Dict) -> str:
        """Create a new clinical trial"""
        try:
            ref = realtime_db.reference('trials')
            new_trial_ref = ref.push(trial_data)
            return new_trial_ref.key
        except Exception as e:
            raise Exception(f"Error creating clinical trial: {str(e)}")
    
    @staticmethod
    async def update_trial(trial_id: str, trial_data: Dict) -> bool:
        """Update an existing clinical trial"""
        try:
            ref = realtime_db.reference(f'trials/{trial_id}')
            ref.update(trial_data)
            return True
        except Exception as e:
            raise Exception(f"Error updating trial {trial_id}: {str(e)}")
    
    @staticmethod
    async def delete_trial(trial_id: str) -> bool:
        """Delete a clinical trial"""
        try:
            ref = realtime_db.reference(f'trials/{trial_id}')
            ref.delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting trial {trial_id}: {str(e)}")
    
    @staticmethod
    async def search_trials(query: str = "", status_filter: str = "All") -> List[Dict]:
        """Search and filter clinical trials"""
        try:
            all_trials = await ClinicalTrialsService.get_all_trials()
            
            if not all_trials:
                return []
            
            filtered_trials = []
            query_lower = query.lower()
            
            for trial in all_trials:
                # Apply search filter
                if query:
                    searchable_fields = [
                        trial.get('title', ''),
                        trial.get('condition', ''),
                        trial.get('location', ''),
                        trial.get('sponsor', ''),
                        trial.get('description', '')
                    ]
                    
                    if not any(query_lower in field.lower() for field in searchable_fields):
                        continue
                
                # Apply status filter
                if status_filter != "All" and trial.get('status') != status_filter:
                    continue
                
                filtered_trials.append(trial)
            
            return filtered_trials
        except Exception as e:
            raise Exception(f"Error searching clinical trials: {str(e)}")
    
