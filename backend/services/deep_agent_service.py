import json
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent
from langgraph.checkpoint.redis import RedisSaver
from firebase_config import realtime_db 


@tool
def get_patient_profile(patient_id: str) -> str:
    """Retrieves a patient's personal profile (PII) like first name, last name, and email from 'users'."""
    try:
        print(f"RTDB: Fetching profile from 'users/{patient_id}'")
        snapshot = realtime_db.reference(f'users/{patient_id}').get()
        return json.dumps(snapshot) if snapshot else f"No profile for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching profile: {e}"

@tool
def get_patient_emr(patient_id: str) -> str:
    """Retrieves the patient's sensitive medical record (EMR/PHI) from 'emr_records'."""
    try:
        print(f"RTDB: Fetching EMR from 'emr_records/{patient_id}'")
        snapshot = realtime_db.reference(f'emr_records/{patient_id}').get()
        return json.dumps(snapshot) if snapshot else f"No EMR for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching EMR: {e}"

# @tool
# def update_patient_emr(patient_id: str, new_entry: str) -> str:
#     """Appends a new entry to a patient's EMR log in 'emr_records'."""
#     try:
#         print(f"RTDB: Updating EMR log for patient '{patient_id}'")
#         ref = realtime_db.reference(f'emr_records/{patient_id}/log')
#         current_log = ref.get() or []
#         current_log.append(new_entry) # type: ignore
#         ref.set(current_log)
#         return "EMR updated successfully in Realtime DB."
#     except Exception as e:
#         return f"Error updating EMR: {e}"

@tool
def update_patient_emr(patient_id: str, new_entry: dict) -> str:
    """Appends a new JSON entry to a patient's EMR log in 'emr_records'."""
    try:
        print(f"RTDB: Updating EMR log for patient '{patient_id}'")
        ref = realtime_db.reference(f'emr_records/{patient_id}/log')
        current_log = ref.get() or []
        current_log.append(new_entry)  # append dict directly
        ref.set(current_log)
        return "EMR updated successfully in Realtime DB."
    except Exception as e:
        return f"Error updating EMR: {e}"


@tool
def get_trial_info(trial_id: str, stage_number: int = None) -> str:  # type: ignore
    """Provides info about a clinical trial. If stage_number is given, provides stage-specific info."""
    try:
        if stage_number:
            ref = realtime_db.reference(f'clinicalTrials/{trial_id}/stages/{stage_number}')
        else:
            ref = realtime_db.reference(f'clinicalTrials/{trial_id}')
        snapshot = ref.get()
        return json.dumps(snapshot) if snapshot else f"Info not found for trial '{trial_id}'."
    except Exception as e:
        return f"Error fetching trial info: {e}"

@tool
def get_patient_progress(patient_id: str) -> str:
    """Gets a patient's progress from 'enrollments' (active enrollment only)."""
    try:
        enrollments_ref = realtime_db.reference('enrollments')
        all_enrollments = enrollments_ref.get() or {}
        # Find first active enrollment for this patient
        for _, enrollment in all_enrollments.items(): # type: ignore
            if enrollment.get("patientId") == patient_id and enrollment.get("isActive") is True:
                return json.dumps(enrollment)
        return f"No active enrollment found for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching patient progress: {e}"

@tool
def update_trial_protocol(trial_id: str, stage_number: int, update_description: str) -> str:
    """Updates the protocol for a specific stage of a clinical trial."""
    try:
        stage_ref = realtime_db.reference(f'clinicalTrials/{trial_id}/stages/{stage_number}')
        stage_ref.update({'summary': update_description})
        return "Trial protocol changes made successfully."
    except Exception as e:
        return f"Error updating trial protocol: {e}"

@tool
def update_checklist_item(patient_id: str, stage_number: int, item_description: str, is_complete: bool) -> str:
    """Updates a single checklist item for a patient's trial stage."""
    try:
        enrollments_ref = realtime_db.reference('enrollments')
        all_enrollments = enrollments_ref.get() or {}
        target_ref = None
        for key, enrollment in all_enrollments.items(): # type: ignore
            if enrollment.get("patientId") == patient_id and enrollment.get("isActive") is True:
                target_ref = enrollments_ref.child(key)
                break
        if not target_ref:
            return f"No active enrollment found for patient '{patient_id}'."

        field_path = f"checklistProgress/stage{stage_number}/{item_description}"
        target_ref.child(field_path).set(is_complete)
        status = "marked as complete" if is_complete else "marked as incomplete"
        return f"Checklist item '{item_description}' for stage {stage_number} was successfully {status}."
    except Exception as e:
        return f"An error occurred while updating the checklist: {e}"

# --- Additional Service Functions ---
async def generate_personalized_timeline(patient_id: str, trial_id: str) -> dict:
    """Fetches trial protocol & patient's EMR, then personalizes via LLM."""
    try:
        # Step 1: Fetch EMR
        patient_emr = realtime_db.reference(f'emr_records/{patient_id}').get()
        if not patient_emr:
            return {"error": f"No EMR found for patient {patient_id}"}

        # Step 2: Fetch protocol stages
        stages = realtime_db.reference(f'clinicalTrials/{trial_id}/stages').get() or {}
        if not stages:
            return {"error": f"No protocol found for trial {trial_id}"}

        # Step 3: Prompt LLM
        prompt = f"""
        You are a clinical trial assistant. Personalize this trial protocol for the patient.

        **Patient's EMR:**
        {json.dumps(patient_emr, indent=2)}

        **Generic Trial Protocol:**
        {json.dumps(stages, indent=2)}

        Instructions:
        - Rewrite 'summary' for each stage with patient-specific advice.
        - Rewrite each checklist item into a patient-tailored task (mention exact meds, etc.).
        - Return ONLY valid JSON, same structure as protocol.
        """
        response = await llm.ainvoke(prompt)
        json_string = response.content.strip().replace("```json", "").replace("```", "")  # type: ignore
        return json.loads(json_string)

    except Exception as e:
        print(f"Error generating personalized timeline: {e}")
        return {"error": "Failed to generate personalized timeline."}
    
async def get_patient_emr_for_dashboard(patient_id: str):
    """Service function to fetch a patient's EMR data for their dashboard from RTDB."""
    try:
        print(f"RTDB: Fetching EMR from 'emr_records/{patient_id}' for dashboard")
        snapshot = realtime_db.reference(f'emr_records/{patient_id}').get()
        if snapshot:
            return snapshot
        else:
            raise ValueError(f"No EMR found for patient '{patient_id}'.")
    except Exception as e:
        print(f"Error fetching EMR for dashboard: {e}")
        raise

async def get_active_patients_for_org(org_id: str) -> list:
    """
    Service function to fetch a list of active patients for a clinical org from RTDB.
    This performs a "join" by fetching enrollments and then user profiles.
    """
    try:
        print(f"RTDB: Fetching active patients for org '{org_id}'")
        
        # Step 1: Fetch the entire 'enrollments' node
        all_enrollments = realtime_db.reference('enrollments').get() or {}
        
        patient_list = []
        # Step 2: Filter enrollments in Python
        for _, enrollment in all_enrollments.items(): # type: ignore
            if enrollment.get("orgId") == org_id and enrollment.get("isActive") is True:
                patient_id = enrollment.get("patientId")
                
                if patient_id:
                    # Step 3: For each match, fetch the corresponding user profile
                    user_snapshot = realtime_db.reference(f'users/{patient_id}').get()
                    if user_snapshot:
                        # Step 4: Combine the data for the final list
                        patient_list.append({
                            "patientId": patient_id,
                            "firstName": user_snapshot.get('firstName'), # type: ignore
                            "lastName": user_snapshot.get('lastName'), # type: ignore
                            "currentStage": enrollment.get('currentStage'),
                            "trialId": enrollment.get('trialId')
                        })
        return patient_list
    except Exception as e:
        print(f"Error fetching active patients: {e}")
        raise

# --- 3. AGENT CONFIGURATION & INITIALIZATION ---
all_tools = [
    get_patient_profile,
    get_patient_emr,
    update_patient_emr,
    get_trial_info,
    get_patient_progress,
    update_trial_protocol,
    update_checklist_item,
]

emr_subagent = {
    "name": "EMR_Manager",
    "description": "Manages patient data (profiles, EMRs, checklist).",
    "prompt": "You are a diligent patient data assistant. Handle both personal and medical records accurately.",
    "tools": [get_patient_profile, get_patient_emr, update_patient_emr, update_checklist_item],
}

trial_info_subagent = {
    "name": "Trial_Info_Specialist",
    "description": "Explains trial details clearly to patients.",
    "prompt": "You are a clear communicator. Explain trial details simply.",
    "tools": [get_trial_info],
}

clinical_org_subagent = {
    "name": "Clinical_Org_Assistant",
    "description": "Helps trial staff with progress, checklists, and protocol updates.",
    "prompt": "Be precise and formal. Confirm administrative changes.",
    "tools": [get_patient_progress, update_trial_protocol, update_checklist_item],
}

main_agent_instructions = """
You are the router for a clinical trial chat system.
- EMR_Manager → for patient profiles/EMR/checklists.
- Trial_Info_Specialist → for trial details.
- Clinical_Org_Assistant → for staff/admin tasks.
Route to the best sub-agent. Do NOT call tools directly.
"""

llm = ChatOpenAI(model="gpt-5-nano")

agent = create_deep_agent(
    tools=all_tools,
    instructions=main_agent_instructions,
    subagents=[emr_subagent, trial_info_subagent, clinical_org_subagent],  # type: ignore
    model=llm,
)

agent.checkpointer = RedisSaver.from_conn_string("redis://localhost:6379")  # type: ignore