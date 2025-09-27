from fastapi import FastAPI, HTTPException
import secrets
import string

app = FastAPI()

# In a real app, you'd store this in a database (e.g., Redis or PostgreSQL)
# with an expiration and an association to the clinical org.
generated_codes = set()

def generate_unique_code(length: int = 8):
    """Generates a unique alphanumeric code."""
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(secrets.choice(alphabet) for _ in range(length))
        if code not in generated_codes:
            generated_codes.add(code)
            return code

@app.post("/clinical-orgs/{org_id}/generate-code")
async def create_patient_code(org_id: str):
    """Endpoint to generate a new, unique sign-up code for a patient."""
    # Here you would verify that the org_id is valid
    new_code = generate_unique_code()
    # TODO: Save the code to your database, linking it to the org_id
    return {"org_id": org_id, "signup_code": new_code}
