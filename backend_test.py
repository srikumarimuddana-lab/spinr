#!/usr/bin/env python3
"""
Spinr Backend API Testing Suite
Tests admin settings, vehicle types, service areas, fare configs, and ride estimation APIs
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://spinr-ride.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class SpinrAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.created_ids = {
            'vehicle_types': [],
            'service_areas': [],
            'fare_configs': []
        }
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()
        
    def test_admin_settings_get(self):
        """Test GET /api/admin/settings"""
        try:
            response = requests.get(f"{self.base_url}/admin/settings", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['google_maps_api_key', 'stripe_publishable_key', 'driver_matching_algorithm']
                
                if all(field in data for field in required_fields):
                    self.log_test("Admin Settings GET", True, f"Retrieved settings with all required fields")
                    return data
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Admin Settings GET", False, f"Missing fields: {missing}", data)
            else:
                self.log_test("Admin Settings GET", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Admin Settings GET", False, f"Exception: {str(e)}")
            
        return None
        
    def test_admin_settings_put(self):
        """Test PUT /api/admin/settings"""
        try:
            test_settings = {
                "google_maps_api_key": "test_maps_key_123",
                "stripe_publishable_key": "pk_test_123",
                "stripe_secret_key": "sk_test_123",
                "driver_matching_algorithm": "nearest",
                "min_driver_rating": 4.5,
                "search_radius_km": 15.0
            }
            
            response = requests.put(f"{self.base_url}/admin/settings", 
                                  headers=self.headers, 
                                  json=test_settings, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('google_maps_api_key') == test_settings['google_maps_api_key']:
                    self.log_test("Admin Settings PUT", True, "Settings updated successfully")
                    return True
                else:
                    self.log_test("Admin Settings PUT", False, "Settings not updated correctly", data)
            else:
                self.log_test("Admin Settings PUT", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Admin Settings PUT", False, f"Exception: {str(e)}")
            
        return False
        
    def test_create_vehicle_types(self):
        """Test POST /api/admin/vehicle-types - Create 3 vehicle types"""
        vehicle_types = [
            {
                "name": "Spinr Go",
                "description": "Economy ride for everyday trips",
                "icon": "car",
                "capacity": 4,
                "is_active": True
            },
            {
                "name": "Spinr XL", 
                "description": "SUV for larger groups and extra space",
                "icon": "suv",
                "capacity": 6,
                "is_active": True
            },
            {
                "name": "Spinr Lux",
                "description": "Luxury vehicles for premium experience", 
                "icon": "luxury",
                "capacity": 4,
                "is_active": True
            }
        ]
        
        created_count = 0
        for vt in vehicle_types:
            try:
                response = requests.post(f"{self.base_url}/admin/vehicle-types",
                                       headers=self.headers,
                                       json=vt,
                                       timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data and data.get('name') == vt['name']:
                        self.created_ids['vehicle_types'].append(data['id'])
                        self.log_test(f"Create Vehicle Type: {vt['name']}", True, 
                                    f"Created with ID: {data['id']}")
                        created_count += 1
                    else:
                        self.log_test(f"Create Vehicle Type: {vt['name']}", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test(f"Create Vehicle Type: {vt['name']}", False, 
                                f"HTTP {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_test(f"Create Vehicle Type: {vt['name']}", False, f"Exception: {str(e)}")
                
        return created_count == 3
        
    def test_create_service_area(self):
        """Test POST /api/admin/service-areas - Create Saskatoon service area"""
        # Saskatoon polygon coordinates (approximate city boundaries)
        saskatoon_polygon = [
            {"lat": 52.2000, "lng": -106.8000},  # Northwest
            {"lat": 52.2000, "lng": -106.5000},  # Northeast  
            {"lat": 52.0500, "lng": -106.5000},  # Southeast
            {"lat": 52.0500, "lng": -106.8000},  # Southwest
            {"lat": 52.2000, "lng": -106.8000}   # Close polygon
        ]
        
        service_area = {
            "name": "Saskatoon City",
            "city": "Saskatoon", 
            "polygon": saskatoon_polygon,
            "is_active": True
        }
        
        try:
            response = requests.post(f"{self.base_url}/admin/service-areas",
                                   headers=self.headers,
                                   json=service_area,
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data.get('name') == service_area['name']:
                    self.created_ids['service_areas'].append(data['id'])
                    self.log_test("Create Service Area: Saskatoon", True, 
                                f"Created with ID: {data['id']}")
                    return data['id']
                else:
                    self.log_test("Create Service Area: Saskatoon", False, 
                                "Invalid response format", data)
            else:
                self.log_test("Create Service Area: Saskatoon", False, 
                            f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Create Service Area: Saskatoon", False, f"Exception: {str(e)}")
            
        return None
        
    def test_create_fare_configs(self, service_area_id):
        """Test POST /api/admin/fare-configs - Create fare configs for each vehicle type"""
        if not service_area_id or not self.created_ids['vehicle_types']:
            self.log_test("Create Fare Configs", False, "Missing service area or vehicle types")
            return False
            
        # Fare configurations for each vehicle type
        fare_configs = [
            {
                "service_area_id": service_area_id,
                "vehicle_type_id": self.created_ids['vehicle_types'][0],  # Spinr Go
                "base_fare": 3.50,
                "per_km_rate": 1.25,
                "per_minute_rate": 0.20,
                "minimum_fare": 7.00,
                "booking_fee": 2.00,
                "is_active": True
            },
            {
                "service_area_id": service_area_id,
                "vehicle_type_id": self.created_ids['vehicle_types'][1],  # Spinr XL
                "base_fare": 4.50,
                "per_km_rate": 1.75,
                "per_minute_rate": 0.30,
                "minimum_fare": 9.00,
                "booking_fee": 2.50,
                "is_active": True
            },
            {
                "service_area_id": service_area_id,
                "vehicle_type_id": self.created_ids['vehicle_types'][2],  # Spinr Lux
                "base_fare": 6.00,
                "per_km_rate": 2.25,
                "per_minute_rate": 0.40,
                "minimum_fare": 12.00,
                "booking_fee": 3.00,
                "is_active": True
            }
        ]
        
        created_count = 0
        for i, fare in enumerate(fare_configs):
            try:
                response = requests.post(f"{self.base_url}/admin/fare-configs",
                                       headers=self.headers,
                                       json=fare,
                                       timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data and data.get('base_fare') == fare['base_fare']:
                        self.created_ids['fare_configs'].append(data['id'])
                        vehicle_names = ["Spinr Go", "Spinr XL", "Spinr Lux"]
                        self.log_test(f"Create Fare Config: {vehicle_names[i]}", True, 
                                    f"Created with ID: {data['id']}")
                        created_count += 1
                    else:
                        self.log_test(f"Create Fare Config: {vehicle_names[i]}", False, 
                                    "Invalid response format", data)
                else:
                    self.log_test(f"Create Fare Config: {vehicle_names[i]}", False, 
                                f"HTTP {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_test(f"Create Fare Config: {vehicle_names[i]}", False, f"Exception: {str(e)}")
                
        return created_count == 3
        
    def test_ride_estimation(self):
        """Test POST /api/rides/estimate - Test ride estimation with Saskatoon coordinates"""
        # Sample coordinates within Saskatoon
        pickup_coords = {"lat": 52.1332, "lng": -106.6700}  # Downtown Saskatoon
        dropoff_coords = {"lat": 52.1579, "lng": -106.6702}  # University area
        
        estimate_request = {
            "pickup_lat": pickup_coords["lat"],
            "pickup_lng": pickup_coords["lng"], 
            "dropoff_lat": dropoff_coords["lat"],
            "dropoff_lng": dropoff_coords["lng"]
        }
        
        try:
            response = requests.post(f"{self.base_url}/rides/estimate",
                                   headers=self.headers,
                                   json=estimate_request,
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if estimates have required fields
                    required_fields = ['vehicle_type', 'distance_km', 'duration_minutes', 'total_fare']
                    
                    valid_estimates = 0
                    for estimate in data:
                        if all(field in estimate for field in required_fields):
                            valid_estimates += 1
                            
                    if valid_estimates > 0:
                        self.log_test("Ride Estimation", True, 
                                    f"Got {valid_estimates} valid estimates, distance: {data[0].get('distance_km', 'N/A')}km")
                        return True
                    else:
                        self.log_test("Ride Estimation", False, 
                                    "No valid estimates with required fields", data)
                else:
                    self.log_test("Ride Estimation", False, 
                                "Empty or invalid response format", data)
            else:
                self.log_test("Ride Estimation", False, 
                            f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Ride Estimation", False, f"Exception: {str(e)}")
            
        return False
        
    def test_public_settings(self):
        """Test GET /api/settings - Public settings endpoint"""
        try:
            response = requests.get(f"{self.base_url}/settings", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Should contain public keys only (no secret keys)
                expected_fields = ['google_maps_api_key', 'stripe_publishable_key']
                
                if all(field in data for field in expected_fields):
                    # Ensure no secret keys are exposed
                    if 'stripe_secret_key' not in data:
                        self.log_test("Public Settings GET", True, 
                                    "Retrieved public settings without exposing secrets")
                        return True
                    else:
                        self.log_test("Public Settings GET", False, 
                                    "Secret key exposed in public endpoint", data)
                else:
                    missing = [f for f in expected_fields if f not in data]
                    self.log_test("Public Settings GET", False, f"Missing fields: {missing}", data)
            else:
                self.log_test("Public Settings GET", False, 
                            f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Public Settings GET", False, f"Exception: {str(e)}")
            
        return False
        
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Spinr Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Admin Settings GET
        self.test_admin_settings_get()
        
        # Test 2: Admin Settings PUT  
        self.test_admin_settings_put()
        
        # Test 3: Create Vehicle Types (seed data)
        self.test_create_vehicle_types()
        
        # Test 4: Create Service Area (seed data)
        service_area_id = self.test_create_service_area()
        
        # Test 5: Create Fare Configs (seed data)
        if service_area_id:
            self.test_create_fare_configs(service_area_id)
        
        # Test 6: Test Ride Estimation
        self.test_ride_estimation()
        
        # Test 7: Public Settings
        self.test_public_settings()
        
        # Summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
                    
        print("\n🔧 CREATED TEST DATA:")
        print(f"  Vehicle Types: {len(self.created_ids['vehicle_types'])}")
        print(f"  Service Areas: {len(self.created_ids['service_areas'])}")
        print(f"  Fare Configs: {len(self.created_ids['fare_configs'])}")
        
        # Return exit code
        return 0 if passed == total else 1

if __name__ == "__main__":
    tester = SpinrAPITester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)