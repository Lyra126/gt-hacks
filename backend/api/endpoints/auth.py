# api/endpoints/auth.py
from fastapi import APIRouter
import secrets
import string

router = APIRouter()

# In production, this should be replaced with a database like Redis or Firestore
# to ensure codes are unique across server restarts and multiple instances.
generated_codes = set()

def generate_unique_code(length: int = 8):
    """Generates a unique alphanumeric code."""
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(secrets.choice(alphabet) for _ in range(length))
        if code not in generated_codes:
            generated_codes.add(code)
            return code

@router.post("/orgs/{org_id}/generate-code")
async def create_patient_code(org_id: str):
    """
    Generates a new, unique sign-up code for a patient associated with a clinical org.
    """
    # In a real app, you would first validate the org_id against your database.
    new_code = generate_unique_code()
    # TODO: Save the code to your database, linking it to the org_id with an expiration.
    return {"org_id": org_id, "signup_code": new_code}