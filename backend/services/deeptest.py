import os
import json
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI # <-- CHANGED
from deepagents import create_deep_agent
from langgraph.checkpoint.redis import RedisSaver
from backend.firebase_config import realtime_db  

# --- 1. SETUP & INITIALIZATION ---
load_dotenv()

# --- 2. TOOL DEFINITIONS (for Firebase Realtime Database) ---

@tool
def get_patient_profile(patient_id: str) -> str:
    """Retrieves a patient's personal profile (PII) like first name, last name, and email from 'users'."""
    try:
        snapshot = realtime_db.reference(f'users/{patient_id}').get()
        return json.dumps(snapshot) if snapshot else f"No profile for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching profile: {e}"

@tool
def get_patient_emr(patient_id: str) -> str:
    """Retrieves the patient's sensitive medical record (EMR/PHI) from 'emr_records'."""
    try:
        snapshot = realtime_db.reference(f'emr_records/{patient_id}').get()
        return json.dumps(snapshot) if snapshot else f"No EMR for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching EMR: {e}"

@tool
def update_patient_emr(patient_id: str, new_entry: str) -> str:
    """Appends a new entry to a patient's EMR log in 'emr_records'."""
    try:
        ref = realtime_db.reference(f'emr_records/{patient_id}/log')
        current_log = ref.get() or []
        current_log.append(new_entry) # type: ignore
        ref.set(current_log)
        return "EMR updated successfully in Realtime DB."
    except Exception as e:
        return f"Error updating EMR: {e}"

# ... (Other tools like get_trial_info, get_patient_progress, etc. remain the same) ...
@tool
def get_trial_info(trial_id: str, stage_number: int = None) -> str: # type: ignore
    """Provides info about a clinical trial. If stage_number is given, provides stage-specific info."""
    try:
        ref = realtime_db.reference(f'clinicalTrials/{trial_id}/stages/{stage_number}' if stage_number else f'clinicalTrials/{trial_id}')
        snapshot = ref.get()
        return json.dumps(snapshot) if snapshot else f"Info not found for trial '{trial_id}'."
    except Exception as e:
        return f"Error fetching trial info: {e}"

@tool
def get_patient_progress(patient_id: str) -> str:
    """Gets a patient's progress from 'enrollments' (active enrollment only)."""
    try:
        all_enrollments = realtime_db.reference('enrollments').get() or {}
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
        realtime_db.reference(f'clinicalTrials/{trial_id}/stages/{stage_number}').update({'summary': update_description})
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
        target_ref.child(f"checklistProgress/stage{stage_number}/{item_description}").set(is_complete)
        status = "marked as complete" if is_complete else "marked as incomplete"
        return f"Checklist item '{item_description}' was successfully {status}."
    except Exception as e:
        return f"An error occurred while updating the checklist: {e}"


# --- 3. AGENT CONFIGURATION & INITIALIZATION ---

all_tools = [get_patient_profile, get_patient_emr, update_patient_emr, get_trial_info, get_patient_progress, update_trial_protocol, update_checklist_item]
emr_subagent = {"name": "EMR_Manager", "description": "Manages patient data (profiles, EMRs, checklist).", "prompt": "You are a diligent patient data assistant.", "tools": [get_patient_profile, get_patient_emr, update_patient_emr, update_checklist_item]}
trial_info_subagent = {"name": "Trial_Info_Specialist", "description": "Explains trial details to patients.", "prompt": "You are a clear communicator.", "tools": [get_trial_info]}
clinical_org_subagent = {"name": "Clinical_Org_Assistant", "description": "Helps trial staff with progress and protocol updates.", "prompt": "Be precise and formal.", "tools": [get_patient_progress, update_trial_protocol, update_checklist_item]}
main_agent_instructions = "You are the router for a clinical trial chat system. Route to the best sub-agent. Do NOT call tools directly."

# --- MODEL SWAPPED TO GEMINI ---
llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0)

agent = create_deep_agent(
    tools=all_tools,
    instructions=main_agent_instructions,
    subagents=[emr_subagent, trial_info_subagent, clinical_org_subagent], # type: ignore
    model=llm,
)


# --- 4. TEST SUITE ---

if __name__ == "__main__":
    # Use a 'with' block to correctly initialize the Redis checkpointer for the script
    with RedisSaver.from_conn_string("redis://localhost:6379") as checkpointer:
        
        agent.checkpointer = checkpointer

        # --- DATA SEEDING (Prerequisite for Tests) ---
        test_patient_id_1 = 'patient-gemini-123'
        test_patient_id_2 = 'patient-gemini-456'
        test_trial_id = 'htn-04'
        print(f"--- Seeding test data into Realtime DB... ---")
        realtime_db.reference(f'users/{test_patient_id_1}').set({'firstName': 'Gemini', 'lastName': 'Test'})
        realtime_db.reference(f'emr_records/{test_patient_id_1}').set({'log': ['Initial consultation.']})
        realtime_db.reference(f'users/{test_patient_id_2}').set({'firstName': 'Jade', 'lastName': 'Programmer'})
        realtime_db.reference(f'emr_records/{test_patient_id_2}').set({'log': ['Enrolled in trial HTN-04.']})
        print("Data seeding complete.\n" + "="*50 + "\n")

        # --- TEST CASE 1: Multi-Tool "Full Summary" Test ---
        print("--- 🧠 TEST CASE 1: Full Summary (Multi-Tool Usage) ---")
        config_1 = {"configurable": {"thread_id": "gemini-test-1"}}
        query_1 = f"Give me a full summary for patient '{test_patient_id_1}'."
        result_1 = agent.invoke({"messages": [{"role": "user", "content": query_1}]}, config=config_1)  # type: ignore
        print("\n✅ Final Answer:", result_1['messages'][-1].content)
        print("\n" + "="*50 + "\n")

        # --- TEST CASE 2: Conversation Memory ---
        print("--- 🧠 TEST CASE 2: Conversation Memory (Redis Checkpointer) ---")
        config_2 = {"configurable": {"thread_id": "gemini-test-2"}}
        query_2_1 = f"Add to the EMR for patient '{test_patient_id_2}': 'Reports feeling energetic.'"
        agent.invoke({"messages": [{"role": "user", "content": query_2_1}]}, config=config_2) # type: ignore
        query_2_2 = f"What was the last log entry for patient '{test_patient_id_2}'?"
        result_2_2 = agent.invoke({"messages": [{"role": "user", "content": query_2_2}]}, config=config_2) # type: ignore
        print("\n✅ Final Answer:", result_2_2['messages'][-1].content)
        print("\n" + "="*50 + "\n")