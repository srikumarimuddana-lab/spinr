from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import random
import string
from datetime import datetime, timedelta
import jwt
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'spinr-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
OTP_EXPIRY_MINUTES = 5

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="Spinr API", version="1.0.0")

# Create routers
api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper to convert MongoDB documents
def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        doc = dict(doc)
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc
    return doc

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

# Admin Models
class AppSettings(BaseModel):
    id: str = "app_settings"
    google_maps_api_key: str = ""
    stripe_publishable_key: str = ""
    stripe_secret_key: str = ""
    driver_matching_algorithm: str = "nearest"  # nearest, round_robin, rating_based, combined
    min_driver_rating: float = 4.0
    search_radius_km: float = 10.0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceArea(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    polygon: List[Dict[str, float]]  # List of {lat, lng} points
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VehicleType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Spinr Go, Spinr XL, Comfort
    description: str
    icon: str  # icon name
    capacity: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FareConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_area_id: str
    vehicle_type_id: str
    base_fare: float
    per_km_rate: float
    per_minute_rate: float
    minimum_fare: float
    booking_fee: float = 2.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SavedAddress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str  # Home, Work, etc.
    address: str
    lat: float
    lng: float
    icon: str = "location"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Driver(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    photo_url: str = ""
    vehicle_type_id: str
    vehicle_make: str
    vehicle_model: str
    vehicle_color: str
    license_plate: str
    rating: float = 5.0
    total_rides: int = 0
    lat: float
    lng: float
    is_online: bool = True
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Ride(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rider_id: str
    driver_id: Optional[str] = None
    vehicle_type_id: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    distance_km: float
    duration_minutes: int
    base_fare: float
    total_fare: float
    payment_method: str = "card"
    status: str = "searching"  # searching, driver_assigned, driver_arrived, in_progress, completed, cancelled
    pickup_otp: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ============ Helper Functions ============

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=4))

def create_jwt_token(user_id: str, phone: str) -> str:
    payload = {
        'user_id': user_id,
        'phone': phone,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token has expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail='No authorization token provided')
    token = credentials.credentials
    payload = verify_jwt_token(token)
    user = await db.users.find_one({'id': payload['user_id']})
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km using Haversine formula"""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def point_in_polygon(lat: float, lng: float, polygon: List[Dict[str, float]]) -> bool:
    """Check if a point is inside a polygon using ray casting"""
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        if ((polygon[i]['lng'] > lng) != (polygon[j]['lng'] > lng) and
            lat < (polygon[j]['lat'] - polygon[i]['lat']) * (lng - polygon[i]['lng']) / 
            (polygon[j]['lng'] - polygon[i]['lng']) + polygon[i]['lat']):
            inside = not inside
        j = i
    return inside

# ============ Auth Routes ============

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    phone = request.phone.strip()
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail='Invalid phone number')
    
    otp_code = generate_otp()
    otp_record = OTPRecord(
        phone=phone,
        code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    )
    
    await db.otp_records.delete_many({'phone': phone})
    await db.otp_records.insert_one(otp_record.dict())
    
    logger.info(f"📱 MOCKED SMS to {phone} - OTP: {otp_code}")
    
    return {
        'success': True,
        'message': f'OTP sent to {phone}',
        'dev_otp': otp_code
    }

@api_router.post("/auth/verify-otp", response_model=AuthResponse)
async def verify_otp(request: VerifyOTPRequest):
    phone = request.phone.strip()
    code = request.code.strip()
    
    otp_record = await db.otp_records.find_one({
        'phone': phone,
        'code': code,
        'verified': False
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail='Invalid verification code')
    
    if datetime.utcnow() > otp_record['expires_at']:
        await db.otp_records.delete_one({'id': otp_record['id']})
        raise HTTPException(status_code=400, detail='OTP has expired')
    
    await db.otp_records.update_one({'id': otp_record['id']}, {'$set': {'verified': True}})
    
    existing_user = await db.users.find_one({'phone': phone})
    
    if existing_user:
        token = create_jwt_token(existing_user['id'], phone)
        return AuthResponse(token=token, user=UserProfile(**existing_user), is_new_user=False)
    else:
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
        return AuthResponse(token=token, user=UserProfile(**new_user), is_new_user=True)

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(**current_user)

@api_router.post("/users/profile", response_model=UserProfile)
async def create_profile(request: CreateProfileRequest, current_user: dict = Depends(get_current_user)):
    valid_cities = ['Saskatoon', 'Regina']
    if request.city not in valid_cities:
        raise HTTPException(status_code=400, detail=f'City must be one of: {", ".join(valid_cities)}')
    
    update_data = {
        'first_name': request.first_name.strip(),
        'last_name': request.last_name.strip(),
        'email': request.email.strip().lower(),
        'city': request.city,
        'profile_complete': True
    }
    
    await db.users.update_one({'id': current_user['id']}, {'$set': update_data})
    updated_user = await db.users.find_one({'id': current_user['id']})
    return UserProfile(**updated_user)

# ============ Settings Routes ============

@api_router.get("/settings")
async def get_public_settings():
    """Get public settings (API keys for frontend)"""
    settings = await db.settings.find_one({'id': 'app_settings'})
    if not settings:
        return {'google_maps_api_key': '', 'stripe_publishable_key': ''}
    return {
        'google_maps_api_key': settings.get('google_maps_api_key', ''),
        'stripe_publishable_key': settings.get('stripe_publishable_key', '')
    }

# ============ Saved Addresses Routes ============

class SavedAddressCreate(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    icon: str = "location"

@api_router.get("/addresses")
async def get_saved_addresses(current_user: dict = Depends(get_current_user)):
    addresses = await db.saved_addresses.find({'user_id': current_user['id']}).to_list(100)
    return addresses

@api_router.post("/addresses")
async def create_saved_address(request: SavedAddressCreate, current_user: dict = Depends(get_current_user)):
    address = SavedAddress(
        user_id=current_user['id'],
        name=request.name,
        address=request.address,
        lat=request.lat,
        lng=request.lng,
        icon=request.icon
    )
    await db.saved_addresses.insert_one(address.dict())
    return address.dict()

@api_router.delete("/addresses/{address_id}")
async def delete_saved_address(address_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.saved_addresses.delete_one({'id': address_id, 'user_id': current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Address not found')
    return {'success': True}

# ============ Vehicle Types & Fares Routes ============

@api_router.get("/vehicle-types")
async def get_vehicle_types():
    types = await db.vehicle_types.find({'is_active': True}).to_list(100)
    return serialize_doc(types)

@api_router.get("/fares")
async def get_fares_for_location(lat: float = Query(...), lng: float = Query(...)):
    """Get fare configs for a given location"""
    # Find service area containing this point
    service_areas = await db.service_areas.find({'is_active': True}).to_list(100)
    
    matching_area = None
    for area in service_areas:
        if point_in_polygon(lat, lng, area.get('polygon', [])):
            matching_area = area
            break
    
    if not matching_area:
        # Return default fares if no service area found
        vehicle_types = await db.vehicle_types.find({'is_active': True}).to_list(100)
        return [serialize_doc({
            'vehicle_type': vt,
            'base_fare': 3.50,
            'per_km_rate': 1.50,
            'per_minute_rate': 0.25,
            'minimum_fare': 8.00,
            'booking_fee': 2.00
        }) for vt in vehicle_types]
    
    # Get fares for this service area
    fares = await db.fare_configs.find({
        'service_area_id': matching_area['id'],
        'is_active': True
    }).to_list(100)
    
    vehicle_types = await db.vehicle_types.find({'is_active': True}).to_list(100)
    vt_map = {vt['id']: serialize_doc(vt) for vt in vehicle_types}
    
    result = []
    for fare in fares:
        vt = vt_map.get(fare['vehicle_type_id'])
        if vt:
            result.append({
                'vehicle_type': vt,
                'base_fare': fare['base_fare'],
                'per_km_rate': fare['per_km_rate'],
                'per_minute_rate': fare['per_minute_rate'],
                'minimum_fare': fare['minimum_fare'],
                'booking_fee': fare['booking_fee']
            })
    
    return result

# ============ Ride Routes ============

class RideEstimateRequest(BaseModel):
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float

class CreateRideRequest(BaseModel):
    vehicle_type_id: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    payment_method: str = "card"

@api_router.post("/rides/estimate")
async def estimate_ride(request: RideEstimateRequest):
    """Get ride estimates for all vehicle types"""
    distance_km = calculate_distance(
        request.pickup_lat, request.pickup_lng,
        request.dropoff_lat, request.dropoff_lng
    )
    
    # Estimate duration (average speed 30 km/h in city)
    duration_minutes = int(distance_km / 30 * 60) + 5  # +5 for pickup time
    
    # Get fares for pickup location
    fares = await get_fares_for_location(request.pickup_lat, request.pickup_lng)
    
    estimates = []
    for fare_info in fares:
        total = fare_info['base_fare'] + \
                (fare_info['per_km_rate'] * distance_km) + \
                (fare_info['per_minute_rate'] * duration_minutes) + \
                fare_info['booking_fee']
        
        total = max(total, fare_info['minimum_fare'])
        
        estimates.append({
            'vehicle_type': fare_info['vehicle_type'],
            'distance_km': round(distance_km, 2),
            'duration_minutes': duration_minutes,
            'base_fare': fare_info['base_fare'],
            'distance_fare': round(fare_info['per_km_rate'] * distance_km, 2),
            'time_fare': round(fare_info['per_minute_rate'] * duration_minutes, 2),
            'booking_fee': fare_info['booking_fee'],
            'total_fare': round(total, 2)
        })
    
    return estimates

@api_router.post("/rides")
async def create_ride(request: CreateRideRequest, current_user: dict = Depends(get_current_user)):
    """Create a new ride request"""
    distance_km = calculate_distance(
        request.pickup_lat, request.pickup_lng,
        request.dropoff_lat, request.dropoff_lng
    )
    duration_minutes = int(distance_km / 30 * 60) + 5
    
    # Get fare for this vehicle type
    fares = await get_fares_for_location(request.pickup_lat, request.pickup_lng)
    fare_info = next((f for f in fares if f['vehicle_type']['id'] == request.vehicle_type_id), fares[0] if fares else None)
    
    if not fare_info:
        raise HTTPException(status_code=400, detail='Invalid vehicle type')
    
    total_fare = fare_info['base_fare'] + \
                 (fare_info['per_km_rate'] * distance_km) + \
                 (fare_info['per_minute_rate'] * duration_minutes) + \
                 fare_info['booking_fee']
    total_fare = max(total_fare, fare_info['minimum_fare'])
    
    ride = Ride(
        rider_id=current_user['id'],
        vehicle_type_id=request.vehicle_type_id,
        pickup_address=request.pickup_address,
        pickup_lat=request.pickup_lat,
        pickup_lng=request.pickup_lng,
        dropoff_address=request.dropoff_address,
        dropoff_lat=request.dropoff_lat,
        dropoff_lng=request.dropoff_lng,
        distance_km=round(distance_km, 2),
        duration_minutes=duration_minutes,
        base_fare=fare_info['base_fare'],
        total_fare=round(total_fare, 2),
        payment_method=request.payment_method,
        status='searching',
        pickup_otp=generate_otp()
    )
    
    await db.rides.insert_one(ride.dict())
    
    # Simulate driver matching (in real app, this would be async)
    await match_driver_to_ride(ride.id)
    
    # Get updated ride
    updated_ride = await db.rides.find_one({'id': ride.id})
    return updated_ride

async def match_driver_to_ride(ride_id: str):
    """Match a driver to a ride based on configured algorithm"""
    ride = await db.rides.find_one({'id': ride_id})
    if not ride:
        return
    
    settings = await db.settings.find_one({'id': 'app_settings'})
    algorithm = settings.get('driver_matching_algorithm', 'nearest') if settings else 'nearest'
    min_rating = settings.get('min_driver_rating', 4.0) if settings else 4.0
    search_radius = settings.get('search_radius_km', 10.0) if settings else 10.0
    
    # Get available drivers
    drivers = await db.drivers.find({
        'is_online': True,
        'is_available': True,
        'vehicle_type_id': ride['vehicle_type_id']
    }).to_list(100)
    
    if not drivers:
        # Create simulated drivers for demo
        await create_demo_drivers(ride['vehicle_type_id'], ride['pickup_lat'], ride['pickup_lng'])
        drivers = await db.drivers.find({
            'is_online': True,
            'is_available': True,
            'vehicle_type_id': ride['vehicle_type_id']
        }).to_list(100)
    
    if not drivers:
        return
    
    # Filter by rating if using combined or rating_based
    if algorithm in ['rating_based', 'combined']:
        drivers = [d for d in drivers if d.get('rating', 5.0) >= min_rating]
    
    # Filter by distance
    drivers_with_distance = []
    for driver in drivers:
        dist = calculate_distance(
            ride['pickup_lat'], ride['pickup_lng'],
            driver['lat'], driver['lng']
        )
        if dist <= search_radius:
            drivers_with_distance.append((driver, dist))
    
    if not drivers_with_distance:
        return
    
    # Select driver based on algorithm
    selected_driver = None
    
    if algorithm == 'nearest' or algorithm == 'combined':
        drivers_with_distance.sort(key=lambda x: x[1])
        selected_driver = drivers_with_distance[0][0]
    elif algorithm == 'rating_based':
        drivers_with_distance.sort(key=lambda x: x[0].get('rating', 5.0), reverse=True)
        selected_driver = drivers_with_distance[0][0]
    elif algorithm == 'round_robin':
        # Get last assigned driver and pick next
        last_ride = await db.rides.find_one(
            {'driver_id': {'$ne': None}},
            sort=[('created_at', -1)]
        )
        if last_ride:
            last_driver_idx = next(
                (i for i, (d, _) in enumerate(drivers_with_distance) if d['id'] == last_ride['driver_id']),
                -1
            )
            next_idx = (last_driver_idx + 1) % len(drivers_with_distance)
            selected_driver = drivers_with_distance[next_idx][0]
        else:
            selected_driver = drivers_with_distance[0][0]
    
    if selected_driver:
        # Update ride with driver
        await db.rides.update_one(
            {'id': ride_id},
            {'$set': {
                'driver_id': selected_driver['id'],
                'status': 'driver_assigned',
                'updated_at': datetime.utcnow()
            }}
        )
        # Mark driver as unavailable
        await db.drivers.update_one(
            {'id': selected_driver['id']},
            {'$set': {'is_available': False}}
        )

async def create_demo_drivers(vehicle_type_id: str, lat: float, lng: float):
    """Create demo drivers near a location"""
    demo_drivers = [
        {'name': 'Mike Johnson', 'vehicle_make': 'Toyota', 'vehicle_model': 'Camry', 'vehicle_color': 'Silver', 'license_plate': 'SKT 4521'},
        {'name': 'Sarah Williams', 'vehicle_make': 'Honda', 'vehicle_model': 'Civic', 'vehicle_color': 'Blue', 'license_plate': 'REG 8832'},
        {'name': 'David Brown', 'vehicle_make': 'Hyundai', 'vehicle_model': 'Elantra', 'vehicle_color': 'White', 'license_plate': 'SKT 7743'},
    ]
    
    for i, dd in enumerate(demo_drivers):
        offset_lat = random.uniform(-0.02, 0.02)
        offset_lng = random.uniform(-0.02, 0.02)
        driver = Driver(
            name=dd['name'],
            phone=f'+1306555{1000+i}',
            vehicle_type_id=vehicle_type_id,
            vehicle_make=dd['vehicle_make'],
            vehicle_model=dd['vehicle_model'],
            vehicle_color=dd['vehicle_color'],
            license_plate=dd['license_plate'],
            rating=round(random.uniform(4.5, 5.0), 1),
            total_rides=random.randint(50, 500),
            lat=lat + offset_lat,
            lng=lng + offset_lng,
            is_online=True,
            is_available=True
        )
        await db.drivers.update_one(
            {'phone': driver.phone},
            {'$set': driver.dict()},
            upsert=True
        )

@api_router.get("/rides/{ride_id}")
async def get_ride(ride_id: str, current_user: dict = Depends(get_current_user)):
    ride = await db.rides.find_one({'id': ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail='Ride not found')
    
    # Get driver info if assigned
    driver = None
    if ride.get('driver_id'):
        driver = await db.drivers.find_one({'id': ride['driver_id']})
    
    # Get vehicle type
    vehicle_type = await db.vehicle_types.find_one({'id': ride['vehicle_type_id']})
    
    return {
        'ride': ride,
        'driver': driver,
        'vehicle_type': vehicle_type
    }

@api_router.get("/rides")
async def get_user_rides(current_user: dict = Depends(get_current_user)):
    rides = await db.rides.find({'rider_id': current_user['id']}).sort('created_at', -1).to_list(100)
    return rides

@api_router.post("/rides/{ride_id}/cancel")
async def cancel_ride(ride_id: str, current_user: dict = Depends(get_current_user)):
    ride = await db.rides.find_one({'id': ride_id, 'rider_id': current_user['id']})
    if not ride:
        raise HTTPException(status_code=404, detail='Ride not found')
    
    if ride['status'] in ['completed', 'cancelled']:
        raise HTTPException(status_code=400, detail='Cannot cancel this ride')
    
    # Release driver
    if ride.get('driver_id'):
        await db.drivers.update_one(
            {'id': ride['driver_id']},
            {'$set': {'is_available': True}}
        )
    
    await db.rides.update_one(
        {'id': ride_id},
        {'$set': {'status': 'cancelled', 'updated_at': datetime.utcnow()}}
    )
    
    return {'success': True}

@api_router.post("/rides/{ride_id}/simulate-arrival")
async def simulate_driver_arrival(ride_id: str, current_user: dict = Depends(get_current_user)):
    """Simulate driver arriving at pickup (for demo)"""
    ride = await db.rides.find_one({'id': ride_id, 'rider_id': current_user['id']})
    if not ride:
        raise HTTPException(status_code=404, detail='Ride not found')
    
    await db.rides.update_one(
        {'id': ride_id},
        {'$set': {'status': 'driver_arrived', 'updated_at': datetime.utcnow()}}
    )
    
    return {'success': True, 'pickup_otp': ride.get('pickup_otp', '')}

# ============ Admin Routes ============

@admin_router.get("/settings")
async def admin_get_settings():
    settings = await db.settings.find_one({'id': 'app_settings'})
    if not settings:
        default_settings = AppSettings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings.dict()
    return settings

@admin_router.put("/settings")
async def admin_update_settings(settings: Dict[str, Any]):
    settings['id'] = 'app_settings'
    settings['updated_at'] = datetime.utcnow()
    await db.settings.update_one(
        {'id': 'app_settings'},
        {'$set': settings},
        upsert=True
    )
    return await db.settings.find_one({'id': 'app_settings'})

# Service Areas
@admin_router.get("/service-areas")
async def admin_get_service_areas():
    areas = await db.service_areas.find().to_list(100)
    return areas

@admin_router.post("/service-areas")
async def admin_create_service_area(area: Dict[str, Any]):
    new_area = ServiceArea(**area)
    await db.service_areas.insert_one(new_area.dict())
    return new_area.dict()

@admin_router.put("/service-areas/{area_id}")
async def admin_update_service_area(area_id: str, area: Dict[str, Any]):
    area['id'] = area_id
    await db.service_areas.update_one({'id': area_id}, {'$set': area})
    return await db.service_areas.find_one({'id': area_id})

@admin_router.delete("/service-areas/{area_id}")
async def admin_delete_service_area(area_id: str):
    await db.service_areas.delete_one({'id': area_id})
    return {'success': True}

# Vehicle Types
@admin_router.get("/vehicle-types")
async def admin_get_vehicle_types():
    types = await db.vehicle_types.find().to_list(100)
    return types

@admin_router.post("/vehicle-types")
async def admin_create_vehicle_type(vtype: Dict[str, Any]):
    new_type = VehicleType(**vtype)
    await db.vehicle_types.insert_one(new_type.dict())
    return new_type.dict()

@admin_router.put("/vehicle-types/{type_id}")
async def admin_update_vehicle_type(type_id: str, vtype: Dict[str, Any]):
    vtype['id'] = type_id
    await db.vehicle_types.update_one({'id': type_id}, {'$set': vtype})
    return await db.vehicle_types.find_one({'id': type_id})

@admin_router.delete("/vehicle-types/{type_id}")
async def admin_delete_vehicle_type(type_id: str):
    await db.vehicle_types.delete_one({'id': type_id})
    return {'success': True}

# Fare Configs
@admin_router.get("/fare-configs")
async def admin_get_fare_configs():
    configs = await db.fare_configs.find().to_list(100)
    return configs

@admin_router.post("/fare-configs")
async def admin_create_fare_config(config: Dict[str, Any]):
    new_config = FareConfig(**config)
    await db.fare_configs.insert_one(new_config.dict())
    return new_config.dict()

@admin_router.put("/fare-configs/{config_id}")
async def admin_update_fare_config(config_id: str, config: Dict[str, Any]):
    config['id'] = config_id
    await db.fare_configs.update_one({'id': config_id}, {'$set': config})
    return await db.fare_configs.find_one({'id': config_id})

@admin_router.delete("/fare-configs/{config_id}")
async def admin_delete_fare_config(config_id: str):
    await db.fare_configs.delete_one({'id': config_id})
    return {'success': True}

# Drivers
@admin_router.get("/drivers")
async def admin_get_drivers():
    drivers = await db.drivers.find().to_list(100)
    return drivers

# Rides
@admin_router.get("/rides")
async def admin_get_rides():
    rides = await db.rides.find().sort('created_at', -1).to_list(100)
    return rides

# ============ Seed Default Data ============

@api_router.post("/seed-defaults")
async def seed_default_data():
    """Seed default vehicle types and demo data"""
    # Check if already seeded
    existing = await db.vehicle_types.find_one()
    if existing:
        return {'message': 'Already seeded'}
    
    # Create default vehicle types
    vehicle_types = [
        VehicleType(id='spinr-go', name='Spinr Go', description='Affordable rides', icon='car', capacity=4),
        VehicleType(id='spinr-xl', name='Spinr XL', description='Extra space for groups', icon='car-sport', capacity=6),
        VehicleType(id='spinr-comfort', name='Comfort', description='Premium comfort', icon='car-outline', capacity=4),
    ]
    
    for vt in vehicle_types:
        await db.vehicle_types.insert_one(vt.dict())
    
    # Create default service areas (Saskatchewan)
    saskatoon_area = ServiceArea(
        id='saskatoon',
        name='Saskatoon',
        city='Saskatoon',
        polygon=[
            {'lat': 52.18, 'lng': -106.75},
            {'lat': 52.18, 'lng': -106.55},
            {'lat': 52.08, 'lng': -106.55},
            {'lat': 52.08, 'lng': -106.75},
        ]
    )
    
    regina_area = ServiceArea(
        id='regina',
        name='Regina',
        city='Regina',
        polygon=[
            {'lat': 50.50, 'lng': -104.70},
            {'lat': 50.50, 'lng': -104.50},
            {'lat': 50.40, 'lng': -104.50},
            {'lat': 50.40, 'lng': -104.70},
        ]
    )
    
    await db.service_areas.insert_one(saskatoon_area.dict())
    await db.service_areas.insert_one(regina_area.dict())
    
    # Create default fare configs
    fare_configs = [
        # Saskatoon fares
        FareConfig(service_area_id='saskatoon', vehicle_type_id='spinr-go', base_fare=3.50, per_km_rate=1.50, per_minute_rate=0.25, minimum_fare=8.00),
        FareConfig(service_area_id='saskatoon', vehicle_type_id='spinr-xl', base_fare=5.00, per_km_rate=2.00, per_minute_rate=0.35, minimum_fare=12.00),
        FareConfig(service_area_id='saskatoon', vehicle_type_id='spinr-comfort', base_fare=4.50, per_km_rate=1.80, per_minute_rate=0.30, minimum_fare=10.00),
        # Regina fares
        FareConfig(service_area_id='regina', vehicle_type_id='spinr-go', base_fare=3.00, per_km_rate=1.40, per_minute_rate=0.22, minimum_fare=7.50),
        FareConfig(service_area_id='regina', vehicle_type_id='spinr-xl', base_fare=4.50, per_km_rate=1.90, per_minute_rate=0.32, minimum_fare=11.00),
        FareConfig(service_area_id='regina', vehicle_type_id='spinr-comfort', base_fare=4.00, per_km_rate=1.70, per_minute_rate=0.28, minimum_fare=9.50),
    ]
    
    for fc in fare_configs:
        await db.fare_configs.insert_one(fc.dict())
    
    return {'message': 'Default data seeded successfully'}

# ============ Health & Root ============

@api_router.get("/")
async def root():
    return {"message": "Spinr API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include routers
app.include_router(api_router)
app.include_router(admin_router)

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
