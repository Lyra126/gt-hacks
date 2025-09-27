# services/deep_agent_service.py
import json
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent
from langgraph.checkpoint.redis import RedisSaver
from firebase_admin import firestore

# --- 1. GET FIRESTORE CLIENT ---
# The Firebase app is initialized in main.py, so we can get the client instance here.
db = firestore.client()

# --- 2. TOOL DEFINITIONS ---

@tool
def get_patient_profile(patient_id: str) -> str:
    """
    Retrieves a patient's personal profile (PII) like first name, last name, and email from the 'users' collection.
    """
    try:
        print(f"FIRESTORE: Fetching profile from 'users' collection for patient '{patient_id}'")
        doc = db.collection('users').document(patient_id).get()
        return json.dumps(doc.to_dict()) if doc.exists else f"No profile for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching profile: {e}"

@tool
def get_patient_emr(patient_id: str) -> str:
    """Retrieves the patient's sensitive medical record (EMR/PHI) from the 'emr_records' collection."""
    try:
        print(f"FIRESTORE: Fetching EMR from 'emr_records' collection for patient '{patient_id}'")
        doc = db.collection('emr_records').document(patient_id).get()
        return json.dumps(doc.to_dict()) if doc.exists else f"No EMR for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching EMR: {e}"

@tool
def update_patient_emr(patient_id: str, new_entry: str) -> str:
    """Updates a patient's EMR with a new entry (e.g., side effect) in the 'emr_records' collection."""
    try:
        print(f"FIRESTORE: Updating EMR in 'emr_records' for patient '{patient_id}'")
        emr_ref = db.collection('emr_records').document(patient_id)
        emr_ref.update({'log': firestore.ArrayUnion([new_entry])}) # type: ignore
        return "EMR updated successfully in Firestore."
    except Exception as e:
        return f"Error updating EMR: {e}"

@tool
def get_trial_info(trial_id: str, stage_number: int = None) -> str: # type: ignore
    """Provides info about a clinical trial. If stage_number is given, provides stage-specific info."""
    try:
        if stage_number:
            doc_ref = db.collection('clinicalTrials').document(trial_id).collection('stages').document(str(stage_number))
        else:
            doc_ref = db.collection('clinicalTrials').document(trial_id)
        doc = doc_ref.get()
        return json.dumps(doc.to_dict()) if doc.exists else f"Info not found for trial '{trial_id}'."
    except Exception as e:
        return f"Error fetching trial info: {e}"

@tool
def get_patient_progress(patient_id: str) -> str:
    """Gets a patient's progress from the 'enrollments' collection."""
    try:
        enrollments_ref = db.collection('enrollments').where('patientId', '==', patient_id).where('isActive', '==', True)
        docs = enrollments_ref.stream()
        enrollment = next(docs, None)
        if enrollment:
            return json.dumps(enrollment.to_dict())
        return f"No active enrollment found for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching patient progress: {e}"

@tool
def update_trial_protocol(trial_id: str, stage_number: int, update_description: str) -> str:
    """Updates the protocol for a specific stage of a clinical trial."""
    try:
        stage_ref = db.collection('clinicalTrials').document(trial_id).collection('stages').document(str(stage_number))
        stage_ref.update({'summary': update_description})
        return "Trial protocol changes made successfully."
    except Exception as e:
        return f"Error updating trial protocol: {e}"

@tool
def update_checklist_item(patient_id: str, stage_number: int, item_description: str, is_complete: bool) -> str:
    """Updates a single checklist item for a patient's specific trial stage."""
    try:
        enrollments_ref = db.collection('enrollments').where('patientId', '==', patient_id).where('isActive', '==', True)
        docs = list(enrollments_ref.stream())
        if not docs:
            return f"No active enrollment found for patient '{patient_id}'."
        enrollment_doc_ref = docs[0].reference
        field_path = f"checklistProgress.stage{stage_number}.{item_description}"
        enrollment_doc_ref.update({field_path: is_complete})
        status = "marked as complete" if is_complete else "marked as incomplete"
        return f"Checklist item '{item_description}' for stage {stage_number} was successfully {status}."
    except Exception as e:
        return f"An error occurred while updating the checklist: {e}"

# --- Additional Service Functions ---
# This function is NOT a tool. It's a separate service called by its own API endpoint.

async def generate_personalized_timeline(patient_id: str, trial_id: str) -> dict:
    """
    Fetches a generic trial protocol and a patient's EMR, then uses an LLM
    to generate a personalized timeline and checklist for that patient.
    """
    try:
        # Step 1: Fetch the patient's EMR
        emr_doc = db.collection('emr_records').document(patient_id).get()
        if not emr_doc.exists:
            return {"error": f"No EMR found for patient {patient_id}"}
        patient_emr = emr_doc.to_dict()

        # Step 2: Fetch the generic trial protocol and all its stages
        stages_ref = db.collection('clinicalTrials').document(trial_id).collection('stages').stream()
        generic_protocol = {f"Stage {stage.id}": stage.to_dict() for stage in stages_ref}

        if not generic_protocol:
            return {"error": f"No protocol found for trial {trial_id}"}

        # Step 3: Craft a detailed prompt for the LLM
        prompt = f"""
        You are a helpful clinical trial assistant with deep medical expertise.
        Your task is to personalize a generic clinical trial protocol for a specific patient based on their EMR.

        **Patient's EMR:**
        {json.dumps(patient_emr, indent=2)}

        **Generic Trial Protocol:**
        {json.dumps(generic_protocol, indent=2)}

        **Instructions:**
        Rewrite the generic protocol to be personalized for this patient. For each stage, you MUST:
        1.  Rewrite the 'summary' to include specific advice relevant to the patient's conditions.
        2.  Rewrite each 'checklist' item from a generic instruction to a specific, tailored actionable task for THIS patient, such as mentioning their exact medications where applicable (e.g., "Discontinue blood thinners" becomes "Stop taking your Aspirin 81mg").
        3.  Return ONLY a single, valid JSON object that has the same structure as the generic protocol, but with the personalized 'summary' and 'checklist' fields.
        """
        
        response = await llm.ainvoke(prompt)
        json_string = response.content.strip().replace("```json", "").replace("```", "") # type: ignore
        return json.loads(json_string)

    except Exception as e:
        print(f"Error generating personalized timeline: {e}")
        return {"error": "Failed to generate personalized timeline."}
    
# --- 3. AGENT CONFIGURATION & INITIALIZATION ---

all_tools = [get_patient_profile, get_patient_emr, update_patient_emr, get_trial_info, get_patient_progress, update_trial_protocol, update_checklist_item]

emr_subagent = {
    "name": "EMR_Manager",
    "description": "Manages all patient-specific data, including both personal profiles (name, email), sensitive medical records (EMR), and checklist items. Use this for any task related to reading, writing, or updating any of a patient's data.",
    "prompt": "You are a diligent patient data assistant. You handle both personal and medical records with accuracy. Always confirm when an update is complete.",
    "tools": [get_patient_profile, get_patient_emr, update_patient_emr, update_checklist_item]
}

trial_info_subagent = {
    "name": "Trial_Info_Specialist",
    "description": "Provides information to patients about the clinical trial. Use this to answer questions about the trial's purpose, specific stages, or what to expect next.",
    "prompt": "You are a helpful and clear communicator. Your job is to explain the clinical trial to patients in an easy-to-understand way.",
    "tools": [get_trial_info]
}

clinical_org_subagent = {
    "name": "Clinical_Org_Assistant",
    "description": "An assistant for the clinical trial organization staff. Use this to query patient progress, update checklists, or make administrative updates to the trial protocol.",
    "prompt": "You are an administrative assistant for the clinical trial staff. Be precise and formal. Confirm all administrative changes.",
    "tools": [get_patient_progress, update_trial_protocol, update_checklist_item]
}

main_agent_instructions = """
You are the central router for a clinical trial chat system. Your primary role is to determine the user's intent and delegate the task to the appropriate sub-agent.
- EMR_Manager: For anything related to a patient's personal AND medical records, including checklists.
- Trial_Info_Specialist: For general questions about the trial itself.
- Clinical_Org_Assistant: For staff-related queries about patient progress or trial administration.
Analyze the user's message and call the single best sub-agent to handle the request. Do NOT call the tools directly.
"""

llm = ChatOpenAI(model="gpt-5-nano")

agent = create_deep_agent(
    tools=all_tools,
    instructions=main_agent_instructions,
    subagents=[emr_subagent, trial_info_subagent, clinical_org_subagent], # type: ignore
    model=llm,
)

agent.checkpointer = RedisSaver.from_conn_string("redis://localhost:6379") # type: ignore