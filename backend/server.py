from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
import random
import string
from datetime import datetime, timedelta
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret (in production, use a proper secret)
JWT_SECRET = os.environ.get('JWT_SECRET', 'spinr-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
OTP_EXPIRY_MINUTES = 5

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Models ============

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    code: str

class CreateProfileRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    city: str

class UserProfile(BaseModel):
    id: str
    phone: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    role: str = 'rider'
    created_at: datetime
    profile_complete: bool = False

class OTPRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    code: str
    expires_at: datetime
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuthResponse(BaseModel):
    token: str
    user: UserProfile
    is_new_user: bool

# ============ Helper Functions ============

def generate_otp() -> str:
    """Generate a 6-digit OTP code"""
    return ''.join(random.choices(string.digits, k=6))

def create_jwt_token(user_id: str, phone: str) -> str:
    """Create JWT token for user"""
    payload = {
        'user_id': user_id,
        'phone': phone,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token has expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from JWT token"""
    if not credentials:
        raise HTTPException(status_code=401, detail='No authorization token provided')
    
    token = credentials.credentials
    payload = verify_jwt_token(token)
    
    user = await db.users.find_one({'id': payload['user_id']})
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    
    return user

# ============ Auth Routes ============

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone number (MOCKED - logs to console)"""
    phone = request.phone.strip()
    
    # Validate phone format (basic check)
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail='Invalid phone number')
    
    # Generate OTP
    otp_code = generate_otp()
    
    # Store OTP in database
    otp_record = OTPRecord(
        phone=phone,
        code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    )
    
    # Remove any existing OTP for this phone
    await db.otp_records.delete_many({'phone': phone})
    
    # Insert new OTP
    await db.otp_records.insert_one(otp_record.dict())
    
    # MOCKED: Log OTP to console (replace with Twilio in production)
    logger.info(f"========================================")
    logger.info(f"📱 MOCKED SMS to {phone}")
    logger.info(f"🔐 OTP Code: {otp_code}")
    logger.info(f"⏰ Expires in {OTP_EXPIRY_MINUTES} minutes")
    logger.info(f"========================================")
    
    return {
        'success': True,
        'message': f'OTP sent to {phone}',
        # ONLY FOR DEVELOPMENT - Remove in production!
        'dev_otp': otp_code
    }

@api_router.post("/auth/verify-otp", response_model=AuthResponse)
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and return JWT token"""
    phone = request.phone.strip()
    code = request.code.strip()
    
    # Find OTP record
    otp_record = await db.otp_records.find_one({
        'phone': phone,
        'code': code,
        'verified': False
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail='Invalid verification code')
    
    # Check if expired
    if datetime.utcnow() > otp_record['expires_at']:
        await db.otp_records.delete_one({'id': otp_record['id']})
        raise HTTPException(status_code=400, detail='OTP has expired. Please request a new one.')
    
    # Mark OTP as verified
    await db.otp_records.update_one(
        {'id': otp_record['id']},
        {'$set': {'verified': True}}
    )
    
    # Check if user exists
    existing_user = await db.users.find_one({'phone': phone})
    
    if existing_user:
        # Existing user - return token
        token = create_jwt_token(existing_user['id'], phone)
        user_profile = UserProfile(**existing_user)
        return AuthResponse(
            token=token,
            user=user_profile,
            is_new_user=False
        )
    else:
        # New user - create basic profile
        user_id = str(uuid.uuid4())
        new_user = {
            'id': user_id,
            'phone': phone,
            'role': 'rider',
            'created_at': datetime.utcnow(),
            'profile_complete': False
        }
        await db.users.insert_one(new_user)
        
        token = create_jwt_token(user_id, phone)
        user_profile = UserProfile(**new_user)
        return AuthResponse(
            token=token,
            user=user_profile,
            is_new_user=True
        )

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(**current_user)

# ============ User Routes ============

@api_router.post("/users/profile", response_model=UserProfile)
async def create_profile(request: CreateProfileRequest, current_user: dict = Depends(get_current_user)):
    """Create or update user profile"""
    # Validate city
    valid_cities = ['Saskatoon', 'Regina']
    if request.city not in valid_cities:
        raise HTTPException(status_code=400, detail=f'City must be one of: {", ".join(valid_cities)}')
    
    # Update user profile
    update_data = {
        'first_name': request.first_name.strip(),
        'last_name': request.last_name.strip(),
        'email': request.email.strip().lower(),
        'city': request.city,
        'profile_complete': True
    }
    
    await db.users.update_one(
        {'id': current_user['id']},
        {'$set': update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({'id': current_user['id']})
    return UserProfile(**updated_user)

@api_router.get("/users/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    return UserProfile(**current_user)

# ============ Health Check ============

@api_router.get("/")
async def root():
    return {"message": "Spinr API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
