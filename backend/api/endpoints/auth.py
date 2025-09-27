from fastapi import APIRouter
import secrets
import string
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from firebase_admin import db as firebase_db
from datetime import datetime, timedelta
import secrets
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional
import bcrypt
import jwt
import traceback
import time
from firebase_config import realtime_db
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import ssl
import hashlib

load_dotenv()

router = APIRouter()
def get_db_ref():
    return firebase_db.reference()


generated_codes = set()
verification_codes = {}
user_sessions = {}

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


# Pydantic models
class UserSignUp(BaseModel):
    email: str
    password: str
    name: str
    userType: str  # "patient" or "crc"
    organizationCode: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    userType: str

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResendCodeRequest(BaseModel):
    email: EmailStr



def generate_verification_code():
    """Generates a 6-digit verification code for 2FA."""
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, user_type: str) -> str:
    """Create JWT token for user session."""
    payload = {
        "user_id": user_id,
        "email": email,
        "user_type": user_type,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, os.getenv("JWT_SECRET", "your-secret-key"), algorithm="HS256")

def find_user_by_email(email: str):
    """Find user by email in Realtime Database."""
    db_ref = get_db_ref()
    users_ref = db_ref.child('users')
    
    # Query users by email
    users_query = users_ref.order_by_child('email').equal_to(email).get()
    
    if users_query:
        # Return first match with user ID
        user_id = list(users_query.keys())[0] # type: ignore
        user_data = list(users_query.values())[0] # type: ignore
        return user_id, user_data
    return None, None

async def send_verification_email(email: str, verification_code: str):
    try:
        # MAILTRAP_HOST = os.getenv("MAILTRAP_HOST")
        # MAILTRAP_PORT = os.getenv("MAILTRAP_PORT")
        # MAILTRAP_USER = os.getenv("MAILTRAP_USER")
        # MAILTRAP_PASS = os.getenv("MAILTRAP_PASSWORD")

        # msg = MIMEMultipart()
        # msg['From'] = "lyra4126@gmail.com"
        # msg['To'] = email
        # msg['Subject'] = "Verify your email"

        # body = f"Your verification code is: {verification_code}"
        # msg.attach(MIMEText(body, 'plain'))

        # # Connect to Mailtrap SMTP
        # context = ssl.create_default_context()
        # with smtplib.SMTP(MAILTRAP_HOST, MAILTRAP_PORT) as server:
        #     server.starttls(context=context)
        #     server.login(MAILTRAP_USER, MAILTRAP_PASS)
        #     server.send_message(msg)

        print(f"[DEBUG] Verification email sent to {email} with code {verification_code}")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to send verification email: {e}")
        return False

# Authentication endpoints
@router.post("/signup")
async def sign_up(user_data: UserSignUp):
    user_id, existing_user = find_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user_doc = {
        'email': user_data.email,
        'name': user_data.name,
        'userType': user_data.userType,
        'password': hashed_password,
        'createdAt': int(time.time()),
    }
    
    new_user_ref = realtime_db.reference('users').push(user_doc) # type: ignore
    main_id = new_user_ref.key
    emr_id = create_emr_id(main_id) # type: ignore
    
    # Store the emrId with the user's profile and create the EMR record
    new_user_ref.update({'emrId': emr_id, 'mainId': main_id})
    realtime_db.reference('emr_records').child(emr_id).set({'log': ['Patient account created.']})
    
    return {"message": "User registered successfully.", "mainId": main_id}

@router.post("/verify-email")
async def verify_email(verify_data: VerifyCodeRequest):
    """Verify email with the sent code."""
    try:
        if verify_data.email not in verification_codes:
            raise HTTPException(status_code=400, detail="No verification code found for this email")
        
        stored_data = verification_codes[verify_data.email]
        
        # Check if code expired
        if datetime.utcnow() > stored_data["expires"]:
            del verification_codes[verify_data.email]
            raise HTTPException(status_code=400, detail="Verification code expired")
        
        # Check if code matches
        if stored_data["code"] != verify_data.code:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Update user as verified in Realtime Database
        user_id = stored_data["user_id"]
        db_ref = get_db_ref()
        user_ref = db_ref.child('users').child(user_id)
        user_ref.update({'isVerified': True})
        
        # Mark as verified and clean up
        stored_data["verified"] = True
        
        return {"success": True, "message": "Email verified successfully", "user_id": user_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")

@router.post("/login")
async def login(login_data: UserLogin):
    user_id, user_data = find_user_by_email(login_data.email)
    if not user_data or not verify_password(login_data.password, user_data['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode(
        {"user_id": user_id, "exp": datetime.utcnow() + timedelta(days=7)},
        os.getenv("JWT_SECRET", "your-secret-key"),
        algorithm="HS256"
    )
    
    return {
        "message": "Login successful",
        "token": token,
        "mainId": user_id,
        "emrId": user_data.get('emrId'),
        "name": user_data.get('name'),
        "email": user_data.get('email'),
        "userType": user_data.get('userType')
    }

@router.post("/verify-2fa")
async def verify_2fa(verify_data: VerifyCodeRequest):
    """Verify 2FA code and complete login."""
    try:
        if verify_data.email not in verification_codes:
            raise HTTPException(status_code=400, detail="No 2FA code found")
        
        stored_data = verification_codes[verify_data.email]
        
        # Check if this is a login verification
        if not stored_data.get("is_login", False):
            raise HTTPException(status_code=400, detail="Invalid verification type")
        
        # Check if code expired
        if datetime.utcnow() > stored_data["expires"]:
            del verification_codes[verify_data.email]
            raise HTTPException(status_code=400, detail="2FA code expired")
        
        # Check if code matches
        if stored_data["code"] != verify_data.code:
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
        # Get user data from Realtime Database
        user_id = stored_data["user_id"]
        db_ref = get_db_ref()
        user_ref = db_ref.child('users').child(user_id)
        user_data = user_ref.get()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create JWT token
        token = create_jwt_token(user_id, user_data['email'], user_data['userType']) # type: ignore
        
        # Store session in Realtime Database
        sessions_ref = db_ref.child('user_sessions').child(user_id)
        session_data = {
            "token": token,
            "expires": int((datetime.utcnow() + timedelta(days=7)).timestamp()),
            "lastActive": int(time.time())
        }
        sessions_ref.set(session_data)
        
        # Also store in memory for quick access
        user_sessions[user_id] = {
            "token": token,
            "expires": datetime.utcnow() + timedelta(days=7)
        }
        
        # Clean up verification code
        del verification_codes[verify_data.email]
        
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user_id,
                "email": user_data['email'], # type: ignore
                "name": user_data['name'], # type: ignore
                "userType": user_data['userType'] # type: ignore
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"2FA verification error: {e}")
        raise HTTPException(status_code=500, detail="2FA verification failed")

# @router.post("/resend-code")
# async def resend_verification_code(resend_data: ResendCodeRequest):
#     """Resend verification or 2FA code."""
#     try:
#         if resend_data.email not in verification_codes:
#             raise HTTPException(status_code=400, detail="No active verification for this email")
        
#         # Generate new code
#         new_code = generate_verification_code()
#         stored_data = verification_codes[resend_data.email]
        
#         # Update with new code and extended time
#         verification_codes[resend_data.email] = {
#             **stored_data,
#             "code": new_code,
#             "expires": datetime.utcnow() + timedelta(minutes=10)
#         }
        
#         # Send new code
#         email_sent = await send_verification_email(resend_data.email, new_code)
        
#         return {
#             "message": "New verification code sent" if email_sent else "Code regenerated - email service unavailable"
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Resend code error: {e}")
#         raise HTTPException(status_code=500, detail="Failed to resend code")

@router.post("/logout")
async def logout(user_id: str):
    """Logout user and invalidate session."""
    try:
        # Remove from Realtime Database
        db_ref = get_db_ref()
        session_ref = db_ref.child('user_sessions').child(user_id)
        session_ref.delete()
        
        # Remove from memory
        if user_id in user_sessions:
            del user_sessions[user_id]
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        print(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")
    
def create_emr_id(main_id: str) -> str:
    """Creates a secure, one-way hash of the main ID to use as the EMR ID."""
    return hashlib.sha256(main_id.encode()).hexdigest()