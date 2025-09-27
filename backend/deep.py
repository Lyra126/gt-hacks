import json
from dotenv import load_dotenv
import typer # For CLI
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent
from langgraph.checkpoint.redis import RedisSaver
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_config import realtime_db 

# --- 1. SETUP & INITIALIZATION ---
load_dotenv()

# Initialize FastAPI and Typer apps
app = FastAPI(title="Clinical Trial Deep Agent API")
cli = typer.Typer()


# --- 2. TOOL DEFINITIONS (Now fully implemented) ---

@tool
def get_patient_profile(patient_id: str) -> str:
    """Fetch patient PII from Realtime Database"""
    try:
        ref = realtime_db.reference(f'users/{patient_id}')
        profile = ref.get()
        return json.dumps(profile) if profile else f"No profile for '{patient_id}'."
    except Exception as e:
        return f"Error fetching profile: {e}"

@tool
def get_patient_emr(patient_id: str) -> str:
    """Fetch patient EMR from Realtime Database"""
    try:
        ref = realtime_db.reference(f'emr_records/{patient_id}')
        emr = ref.get()
        return json.dumps(emr) if emr else f"No EMR for '{patient_id}'."
    except Exception as e:
        return f"Error fetching EMR: {e}"

@tool
def update_patient_emr(patient_id: str, new_entry: str) -> str:
    """Append a new entry to the patient's EMR log in Realtime Database"""
    try:
        ref = realtime_db.reference(f'emr_records/{patient_id}/log')
        current_log = ref.get() or []
        current_log.append(new_entry)
        ref.set(current_log)
        return "EMR updated successfully in Realtime Database."
    except Exception as e:
        return f"Error updating EMR: {e}"
    

# Model for EMR upload
class EMRUploadRequest(BaseModel):
    patientId: str
    name: str
    dob: str
    gender: str
    age: int
    address: str
    city: str
    state: str
    phone: str
    email: str
    emergency_contact: str
    ec_relationship: str
    ec_phone: str
    bloodType: str
    insurance: str
    conditions: list[str]
    surgeries: list[str]
    

def update_emr_info(request: EMRUploadRequest):
    """
    Endpoint to upload EMR data for a patient to Realtime DB
    """
    try:
        ref = realtime_db.reference(f'emr_records/{request.patientId}')
        # Store the full EMR info
        emr_dict = request.dict()
        emr_dict["log"] = [] 
        ref.set(emr_dict)
        return {"status": "success", "message": f"EMR data uploaded for {request.patientId}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading EMR data: {e}")

@tool
def get_trial_info(trial_id: str, stage_number: int = None) -> str:
    """Fetch clinical trial info from Realtime Database"""
    try:
        if stage_number is not None:
            ref = realtime_db.reference(f'clinicalTrials/{trial_id}/stages/{stage_number}')
        else:
            ref = realtime_db.reference(f'clinicalTrials/{trial_id}')
        data = ref.get()
        return json.dumps(data) if data else f"No info found for trial '{trial_id}'."
    except Exception as e:
        return f"Error fetching trial info: {e}"
    
@tool
def get_patient_progress(patient_id: str) -> str:
    """Fetch patient's trial enrollment and progress from Realtime Database"""
    try:
        ref = realtime_db.reference(f'enrollments/{patient_id}')
        enrollment = ref.get()
        if enrollment and enrollment.get('isActive', False):
            return json.dumps(enrollment)
        return f"No active enrollment found for patient '{patient_id}'."
    except Exception as e:
        return f"Error fetching patient progress: {e}"

@tool
def update_trial_protocol(trial_id: str, stage_number: int, update_description: str) -> str:
    """Updates the description of a specific stage in a clinical trial."""
    try:
        ref = realtime_db.reference(f'clinicalTrials/{trial_id}/stages/{stage_number}/summary')
        ref.set(update_description)
        return "Trial protocol changes made successfully."
    except Exception as e:
        return f"Error updating trial protocol: {e}"

#TO DO SWITCH TO REALTIME DB
@tool
def update_checklist_item(patient_id: str, stage_number: int, item_description: str, is_complete: bool) -> str:
    """
    Updates a single checklist item for a patient's specific trial stage.
    Can be used to mark an item as complete/incomplete or to add a new ad-hoc item.
    """
    try:
        print(f"FIRESTORE: Updating checklist for patient '{patient_id}', stage {stage_number}")
        
        # Find the active enrollment document for the patient
        enrollments_ref = db.collection('enrollments').where('patientId', '==', patient_id).where('isActive', '==', True)
        docs = list(enrollments_ref.stream())
        if not docs:
            return f"No active enrollment found for patient '{patient_id}'."
        
        enrollment_doc_ref = docs[0].reference

        # Use dot notation to update the specific nested field in the map
        field_path = f"checklistProgress.stage{stage_number}.{item_description}"
        enrollment_doc_ref.update({
            field_path: is_complete
        })
        
        status = "marked as complete" if is_complete else "marked as incomplete"
        return f"Checklist item '{item_description}' for stage {stage_number} was successfully {status}."
        
    except Exception as e:
        return f"An error occurred while updating the checklist: {e}"


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

main_agent_instructions = "You are the central router for a clinical trial chat system..."

llm = ChatOpenAI(model="gpt-4o", temperature=0)

agent = create_deep_agent(
    tools=all_tools, instructions=main_agent_instructions, subagents=[emr_subagent, trial_info_subagent, clinical_org_subagent], model=llm # type: ignore
) 
agent.checkpointer = RedisSaver.from_conn_string("redis://localhost:6379") # type: ignore

# --- 4. API MODELS & ENDPOINTS ---

class AgentRequest(BaseModel):
    content: str

@app.post("/agent/invoke/{thread_id}")
async def invoke_agent(thread_id: str, request: AgentRequest):
    """Invokes the agent for a specific conversation thread, maintaining history via Redis."""
    try:
        config = {"configurable": {"thread_id": thread_id}}
        input_data = {"messages": [{"role": "user", "content": request.content}]}
        result = await agent.ainvoke(input_data, config=config) # type: ignore
        final_answer = result['messages'][-1].content
        return {"response": final_answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred in the agent: {e}")

@app.get("/", include_in_schema=False)
def root():
    return {"status": "Clinical Trial Deep Agent API is running."}


# --- 5. COMMAND-LINE INTERFACE (CLI) FOR RUNNING SERVER OR TESTS ---

@cli.command()
def run_tests():
    """Runs the full test suite against the agent."""
    # The 'with' block is only needed for script-based tests, not the long-running server.
    with RedisSaver.from_conn_string("redis://localhost:6379") as checkpointer:
        agent.checkpointer = checkpointer
        
        test_patient_id_1 = 'patient-xyz-123'
        test_patient_id_2 = 'patient-abc-456'
        test_trial_id = 'htn-04'

        print("--- Seeding test data into Firestore... ---")
        db.collection('users').document(test_patient_id_1).set({'firstName': 'John', 'lastName': 'Smith'})
        db.collection('emr_records').document(test_patient_id_1).set({'log': ['Initial consultation.']})
        db.collection('users').document(test_patient_id_2).set({'firstName': 'Jane', 'lastName': 'Doe'})
        db.collection('emr_records').document(test_patient_id_2).set({'log': ['Enrolled in trial HTN-04.']})
        print("Data seeding complete.\n" + "="*50 + "\n")

        # --- TEST CASE 1: Full Summary ---
        print("--- 🧠 TEST CASE 1: Full Summary (Multi-Tool Usage) ---")
        config_1 = {"configurable": {"thread_id": "test-thread-1"}}
        query_1 = f"Give me a full summary for patient '{test_patient_id_1}'."
        result_1 = agent.invoke({"messages": [{"role": "user", "content": query_1}]}, config=config_1) # type: ignore
        print("\n✅ Final Answer:", result_1['messages'][-1].content)
        print("\n" + "="*50 + "\n")

        # --- TEST CASE 2: Conversation Memory ---
        print("--- 🧠 TEST CASE 2: Conversation Memory (Redis Checkpointer) ---")
        config_2 = {"configurable": {"thread_id": "test-thread-2"}}
        query_2_1 = f"Add to the EMR for patient '{test_patient_id_2}': 'Completed daily walk.'"
        agent.invoke({"messages": [{"role": "user", "content": query_2_1}]}, config=config_2) # type: ignore
        query_2_2 = f"What was the last log entry for patient '{test_patient_id_2}'?"
        result_2_2 = agent.invoke({"messages": [{"role": "user", "content": query_2_2}]}, config=config_2) # type: ignore
        print("\n✅ Final Answer:", result_2_2['messages'][-1].content)
        print("\n" + "="*50 + "\n")

        # --- TEST CASE 3: Other Sub-Agents ---
        print("--- 🧠 TEST CASE 3: Other Sub-Agent Tools ---")
        config_3 = {"configurable": {"thread_id": "test-thread-3"}}
        query_3_1 = f"What is stage 2 of trial '{test_trial_id}'?"
        result_3_1 = agent.invoke({"messages": [{"role": "user", "content": query_3_1}]}, config=config_3) # type: ignore
        print("\n✅ Final Answer:", result_3_1['messages'][-1].content)

@cli.command()
def run_server(host: str = "0.0.0.0", port: int = 8080):
    """Runs the FastAPI server."""
    import uvicorn
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    cli()