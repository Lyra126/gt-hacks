from pydantic import BaseModel
from deep import EMRUploadRequest, update_emr_info  # import the model & function
import asyncio

# --- 1. Create a sample EMR JSON ---
sample_emr_data = {
    "patientId": "12345",
    "name": "CC",
    "dob": "2002-06-15",
    "gender": "Female",
    "age": 38,
    "address": "123 Main St",
    "city": "Gainesville",
    "state": "FL",
    "phone": "555-123-4567",
    "email": "lyra4126@gmail.com",
    "emergency_contact": "John Doe",
    "ec_relationship": "Spouse",
    "ec_phone": "555-987-6543",
    "bloodType": "O+",
    "insurance": "HealthCare Inc.",
    "conditions": ["Hypertension", "Asthma"],
    "surgeries": ["Appendectomy"]
}

# --- 2. Convert JSON into a Pydantic model ---
emr_request = EMRUploadRequest(**sample_emr_data)

# --- 3. Call the LangChain tool correctly ---
async def main():
    # Wrap in a dict with the parameter name as expected by the tool
    result = await update_emr_info({"request": emr_request})
    print(result)

# Run the async function
asyncio.run(main())
