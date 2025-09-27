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
import firebase_config
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import ssl

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
        user_id = list(users_query.keys())[0]
        user_data = list(users_query.values())[0]
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
    """Register a new user with email verification."""
    try:
        # Check if user already exists
        existing_user_id, existing_user = find_user_by_email(user_data.email)
        if existing_user_id:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user document (initially unverified)
        user_doc = {
            'email': user_data.email,
            'name': user_data.name,
            'userType': user_data.userType,
            'password': hashed_password,
            'isVerified': False,
            'createdAt': int(time.time()),  # Unix timestamp for Realtime DB
        }
        
        # Add to Realtime Database
        db_ref = get_db_ref()
        users_ref = db_ref.child('users')
        new_user_ref = users_ref.push(user_doc)
        user_id = new_user_ref.key
        
        # Generate and send verification code
        # verification_code = generate_verification_code()
        # verification_codes[user_data.email] = {
        #     "code": verification_code,
        #     "expires": datetime.utcnow() + timedelta(minutes=10),
        #     "verified": False,
        #     "user_id": user_id
        # }
        
        # # Send verification email
        # email_sent = await send_verification_email(user_data.email, verification_code)
        
        # if not email_sent:
        #     # If email fails, still return success but inform about manual verification
        #     return {
        #         "message": "User registered successfully. Email service unavailable - contact admin for verification.",
        #         "user_id": user_id,
        #         "requires_verification": True
        #     }
        
        return {
            "message": "User registered successfully.",
            "user_id": user_id,
            "requires_verification": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Registration failed")

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
    """Login user with email/password and send 2FA code."""
    try:
        # Find user by email
        user_id, user_data = find_user_by_email(login_data.email)
        
        if not user_id or not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is verified
        if not user_data.get('isVerified', False):
            raise HTTPException(status_code=400, detail="Please verify your email first")
        
        # Check user type matches
        if user_data['userType'] != login_data.userType:
            raise HTTPException(status_code=400, detail="Invalid user type")
        
        # # Verify password
        # if not verify_password(login_data.password, user_data['password']):
        #     raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # # Generate and send 2FA code
        # two_fa_code = generate_verification_code()
        # print(f"[DEBUG] Generated verification code for {user_data["email"]}: {two_fa_code}")
        # verification_codes[login_data.email] = {
        #     "code": two_fa_code,
        #     "expires": datetime.utcnow() + timedelta(minutes=5),
        #     "verified": False,
        #     "user_id": user_id,
        #     "is_login": True
        # }

        # # Send 2FA code
        # email_sent = await send_verification_email(login_data.email, two_fa_code)
        # print(f"[DEBUG] Email sent? {email_sent}")
        return {
            "message": "2FA code sent to your email",
            "requires_2fa": True,
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

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
        token = create_jwt_token(user_id, user_data['email'], user_data['userType'])
        
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
                "email": user_data['email'],
                "name": user_data['name'],
                "userType": user_data['userType']
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