# EventZen Venue & Vendor Service - Test Cases

## Overview

This document contains comprehensive test cases for the EventZen Venue & Vendor Management Service. The service provides endpoints for managing venues, vendors, bookings, and contracts.

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- JWT tokens for authentication (get from Auth Service)

### Setup
```bash
cd venue-vendor-service
npm install
npm run seed  # Populate test data
npm run dev   # Start development server
```

### Base URLs
- Development: `http://localhost:3001`
- API Base: `http://localhost:3001/api/v1`

## Authentication

All protected endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### User Roles
- **Public**: No authentication required
- **User**: Basic authenticated user
- **Organizer**: Can create events and book venues/vendors
- **Vendor**: Can manage their own profile and contracts
- **Admin**: Full access to all resources

## Test Categories

### 1. Health & Service Status

#### 1.1 Service Health Check
```http
GET /health
```
**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Venue & Vendor Service is healthy",
  "timestamp": "2024-03-21T10:00:00.000Z",
  "service": "eventzen-venue-vendor-service",
  "version": "1.0.0",
  "uptime": 123.45,
  "environment": "development"
}
```

#### 1.2 API Documentation
```http
GET /api
```
**Expected Response:** 200 OK with API documentation

---

## 2. Venue Management Tests

### 2.1 Public Venue Endpoints

#### 2.1.1 Get All Venues (Basic)
```http
GET /api/v1/venues
```
**Test Cases:**
- ✅ Should return paginated list of active venues
- ✅ Should include pagination metadata
- ✅ Should exclude deleted venues
- ✅ Should return 200 status code

#### 2.1.2 Get All Venues with Filters
```http
GET /api/v1/venues?city=Delhi&venue_type=banquet_hall&min_capacity=100&max_capacity=500&page=1&limit=10
```
**Test Cases:**
- ✅ Should filter by city (case-insensitive)
- ✅ Should filter by venue type
- ✅ Should filter by capacity range
- ✅ Should filter by price range
- ✅ Should filter by amenities
- ✅ Should apply pagination correctly
- ✅ Should sort by specified field

#### 2.1.3 Get Venue by ID
```http
GET /api/v1/venues/{venue_id}
```
**Test Cases:**
- ✅ Should return venue details for valid ID
- ❌ Should return 404 for non-existent venue
- ❌ Should return 404 for deleted venue
- ❌ Should return 400 for invalid UUID format

#### 2.1.4 Get Nearby Venues
```http
GET /api/v1/venues/nearby?latitude=28.6279&longitude=77.2090&radius=10
```
**Test Cases:**
- ✅ Should return venues within specified radius
- ✅ Should sort by distance from center point
- ❌ Should return 400 if latitude/longitude missing
- ✅ Should use default radius if not specified
- ✅ Should handle edge cases (no venues in radius)

#### 2.1.5 Advanced Venue Search
```http
POST /api/v1/venues/search
Content-Type: application/json

{
  "city": "Delhi",
  "venue_type": "conference_center",
  "min_capacity": 200,
  "max_capacity": 1000,
  "amenities": ["wifi", "parking"],
  "latitude": 28.6279,
  "longitude": 77.2090,
  "radius": 15,
  "page": 1,
  "limit": 10
}
```
**Test Cases:**
- ✅ Should combine multiple filters correctly
- ✅ Should handle geospatial + attribute filters
- ✅ Should validate input parameters
- ❌ Should return 400 for invalid filter values

#### 2.1.6 Get Venue Halls
```http
GET /api/v1/venues/{venue_id}/halls
```
**Test Cases:**
- ✅ Should return halls for valid venue
- ✅ Should filter halls by hall_type if specified
- ✅ Should include hall pricing and capacity
- ❌ Should return 404 for non-existent venue

### 2.2 Protected Venue Endpoints (JWT Required)

#### 2.2.1 Check Venue Availability
```http
GET /api/v1/venues/{venue_id}/availability?start_date=2024-12-01&end_date=2024-12-03
Authorization: Bearer {jwt_token}
```
**Test Cases:**
- ✅ Should return availability status for valid dates
- ✅ Should calculate total price for date range
- ✅ Should identify conflicting bookings
- ❌ Should return 401 without authentication
- ❌ Should return 400 for invalid date format
- ❌ Should return 400 if end_date < start_date
- ❌ Should return 404 for non-existent venue

### 2.3 Organizer Venue Endpoints

#### 2.3.1 Book Venue
```http
POST /api/v1/venues/{venue_id}/book
Authorization: Bearer {organizer_token}
Content-Type: application/json

{
  "event_id": "event-uuid-123",
  "booking_start": "2024-12-01T00:00:00Z",
  "booking_end": "2024-12-01T23:59:59Z",
  "guest_count": 200,
  "event_type": "corporate_meeting",
  "halls_booked": [
    {
      "hall_id": "hall-uuid-123",
      "setup_type": "theater",
      "expected_capacity": 200
    }
  ]
}
```
**Test Cases:**
- ✅ Should create booking for available venue
- ✅ Should calculate pricing correctly (base + tax)
- ✅ Should set payment schedule (advance + balance)
- ❌ Should return 401 without organizer role
- ❌ Should return 409 if venue not available
- ❌ Should return 400 if guest_count > venue.capacity
- ❌ Should return 400 for invalid date range
- ❌ Should return 404 for non-existent venue

### 2.4 Admin Venue Endpoints

#### 2.4.1 Create Venue
```http
POST /api/v1/venues
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "venue_name": "Test Conference Center",
  "address": "123 Test Street",
  "city": "New Delhi",
  "location": {
    "coordinates": [77.2090, 28.6279]
  },
  "capacity": 500,
  "price_per_day": 75000,
  "venue_type": "conference_center",
  "contact_info": {
    "phone": "+91-9876543210",
    "email": "test@venue.com"
  }
}
```
**Test Cases:**
- ✅ Should create venue with valid data
- ✅ Should generate unique venue_id
- ✅ Should set created_by to admin user
- ❌ Should return 401 without admin role
- ❌ Should return 400 for missing required fields
- ❌ Should return 400 for invalid coordinates
- ❌ Should return 400 for invalid email format

#### 2.4.2 Update Venue
```http
PUT /api/v1/venues/{venue_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "venue_name": "Updated Conference Center",
  "price_per_day": 80000,
  "status": "active"
}
```
**Test Cases:**
- ✅ Should update specified fields only
- ✅ Should set updated_by and updated_at
- ❌ Should return 401 without admin role
- ❌ Should return 404 for non-existent venue
- ❌ Should return 400 for invalid field values

#### 2.4.3 Delete Venue (Soft Delete)
```http
DELETE /api/v1/venues/{venue_id}
Authorization: Bearer {admin_token}
```
**Test Cases:**
- ✅ Should mark venue as deleted (soft delete)
- ✅ Should set updated_by and updated_at
- ✅ Deleted venue should not appear in public listings
- ❌ Should return 401 without admin role
- ❌ Should return 404 for non-existent venue

#### 2.4.4 Get Venue Bookings
```http
GET /api/v1/venues/{venue_id}/bookings?status=confirmed&from_date=2024-01-01&to_date=2024-12-31
Authorization: Bearer {admin_token}
```
**Test Cases:**
- ✅ Should return venue bookings with filters
- ✅ Should include booking details and guest info
- ❌ Should return 401 without admin role
- ❌ Should return 404 for non-existent venue

#### 2.4.5 Add Hall to Venue
```http
POST /api/v1/venues/{venue_id}/halls
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "hall_name": "Conference Room A",
  "hall_type": "conference_room",
  "capacity": 50,
  "pricing": {
    "base_price_per_hour": 2000,
    "base_price_per_day": 15000
  }
}
```
**Test Cases:**
- ✅ Should add hall to existing venue
- ✅ Should validate hall capacity <= venue capacity
- ❌ Should return 401 without admin role
- ❌ Should return 404 for non-existent venue

---

## 3. Vendor Management Tests

### 3.1 Protected Vendor Endpoints (JWT Required)

#### 3.1.1 Get All Vendors
```http
GET /api/v1/vendors?service_type=catering&city=Delhi&min_rating=4.0
Authorization: Bearer {jwt_token}
```
**Test Cases:**
- ✅ Should return verified active vendors only
- ✅ Should filter by service type
- ✅ Should filter by city (case-insensitive)
- ✅ Should filter by rating range
- ✅ Should exclude sensitive business details
- ❌ Should return 401 without authentication

#### 3.1.2 Get Vendor by ID
```http
GET /api/v1/vendors/{vendor_id}
Authorization: Bearer {jwt_token}
```
**Test Cases:**
- ✅ Should return vendor profile details
- ✅ Should include recent reviews/ratings
- ✅ Should exclude sensitive information
- ❌ Should return 401 without authentication
- ❌ Should return 404 for non-existent vendor

#### 3.1.3 Get Vendors by Service Type
```http
GET /api/v1/vendors/service/catering?city=Delhi&min_price=300&max_price=800
Authorization: Bearer {jwt_token}
```
**Test Cases:**
- ✅ Should return vendors of specified service type
- ✅ Should filter by city and price range
- ✅ Should sort by rating (highest first)
- ❌ Should return 400 if city parameter missing

#### 3.1.4 Get Nearby Vendors
```http
GET /api/v1/vendors/nearby?latitude=28.6279&longitude=77.2090&service_type=photography&radius=25
Authorization: Bearer {jwt_token}
```
**Test Cases:**
- ✅ Should return vendors within radius
- ✅ Should filter by service type if specified
- ✅ Should sort by distance from location
- ❌ Should return 400 if coordinates missing

#### 3.1.5 Get Top Rated Vendors
```http
GET /api/v1/vendors/top-rated/catering?limit=10
Authorization: Bearer {jwt_token}
```
**Test Cases:**
- ✅ Should return highest-rated vendors
- ✅ Should limit results to specified count
- ✅ Should only include vendors with reviews
- ✅ Should sort by average rating DESC

#### 3.1.6 Advanced Vendor Search
```http
POST /api/v1/vendors/search
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "service_type": "catering",
  "city": "Delhi",
  "min_price": 300,
  "max_price": 800,
  "min_rating": 4.0,
  "keywords": "indian buffet"
}
```
**Test Cases:**
- ✅ Should combine multiple search criteria
- ✅ Should perform text search on keywords
- ✅ Should handle geospatial filters
- ✅ Should apply pagination correctly

#### 3.1.7 Get Vendor Contracts
```http
GET /api/v1/vendors/{vendor_id}/contracts
Authorization: Bearer {vendor_token_or_admin}
```
**Test Cases:**
- ✅ Should return contracts for vendor owner
- ✅ Should return contracts for admin
- ✅ Should filter by status and date range
- ❌ Should return 403 for other users
- ❌ Should return 404 for non-existent vendor

### 3.2 Organizer Vendor Endpoints

#### 3.2.1 Hire Vendor (Create Contract)
```http
POST /api/v1/vendors/events/{event_id}/hire
Authorization: Bearer {organizer_token}
Content-Type: application/json

{
  "vendor_id": "vendor-uuid-123",
  "service_description": "Indian buffet catering for 200 guests",
  "service_date": "2024-12-15T00:00:00Z",
  "service_start_time": "12:00",
  "service_end_time": "16:00",
  "guest_count": 200,
  "base_amount": 100000,
  "agreed_price": 140500,
  "advance_percentage": 30
}
```
**Test Cases:**
- ✅ Should create contract for verified vendor
- ✅ Should check vendor availability for date
- ✅ Should validate advance booking requirements
- ✅ Should calculate payment schedule
- ❌ Should return 401 without organizer role
- ❌ Should return 404 for non-existent vendor
- ❌ Should return 409 if vendor not available
- ❌ Should return 400 for insufficient advance notice

### 3.3 Admin Vendor Endpoints

#### 3.3.1 Create Vendor
```http
POST /api/v1/vendors
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "vendor_name": "Test Catering Services",
  "service_type": "catering",
  "contact_info": {
    "primary_email": "test@catering.com",
    "primary_phone": "+91-9876543210"
  },
  "address": {
    "city": "New Delhi",
    "location": {
      "coordinates": [77.2090, 28.6279]
    }
  },
  "pricing": {
    "base_price_range": {
      "min": 250,
      "max": 600
    },
    "pricing_model": "per_person"
  }
}
```
**Test Cases:**
- ✅ Should create vendor with valid data
- ✅ Should set status to 'under_review' initially
- ✅ Should validate unique email address
- ❌ Should return 401 without admin role
- ❌ Should return 409 for duplicate email
- ❌ Should return 400 for invalid service type

#### 3.3.2 Update Vendor
```http
PUT /api/v1/vendors/{vendor_id}
Authorization: Bearer {admin_token_or_vendor_owner}
Content-Type: application/json

{
  "status": "active",
  "pricing": {
    "advancement_percentage": 35
  }
}
```
**Test Cases:**
- ✅ Admin should update any vendor
- ✅ Vendor should update own profile only
- ✅ Should validate pricing ranges (max > min)
- ❌ Should return 403 for unauthorized access
- ❌ Should return 404 for non-existent vendor

#### 3.3.3 Delete Vendor
```http
DELETE /api/v1/vendors/{vendor_id}
Authorization: Bearer {admin_token}
```
**Test Cases:**
- ✅ Should soft delete vendor
- ✅ Should set status to 'inactive'
- ✅ Deleted vendor should not appear in searches
- ❌ Should return 401 without admin role

#### 3.3.4 Update Contract Status
```http
PATCH /api/v1/vendors/contracts/{contract_id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "approved",
  "notes": "Contract approved after review"
}
```
**Test Cases:**
- ✅ Should update contract status
- ✅ Should add communication log entry
- ✅ Should update vendor metrics on completion
- ❌ Should return 401 without admin role
- ❌ Should return 404 for non-existent contract

---

## 4. Error Handling Tests

### 4.1 Authentication Errors

#### 4.1.1 Missing JWT Token
```http
GET /api/v1/venues/{venue_id}/availability
# No Authorization header
```
**Expected Response:** 401 Unauthorized
```json
{
  "success": false,
  "error": "AUTH_TOKEN_MISSING",
  "message": "Authorization header is required"
}
```

#### 4.1.2 Invalid JWT Token
```http
GET /api/v1/venues/{venue_id}/availability
Authorization: Bearer invalid_token
```
**Expected Response:** 401 Unauthorized
```json
{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Invalid JWT token"
}
```

#### 4.1.3 Expired JWT Token
```http
GET /api/v1/venues/{venue_id}/availability
Authorization: Bearer {expired_token}
```
**Expected Response:** 401 Unauthorized
```json
{
  "success": false,
  "error": "TOKEN_EXPIRED",
  "message": "JWT token has expired"
}
```

### 4.2 Authorization Errors

#### 4.2.1 Insufficient Role Permissions
```http
POST /api/v1/venues
Authorization: Bearer {user_token}  # Non-admin token
```
**Expected Response:** 403 Forbidden
```json
{
  "success": false,
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "Access denied. Required roles: admin"
}
```

### 4.3 Validation Errors

#### 4.3.1 Missing Required Fields
```http
POST /api/v1/venues
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "venue_name": "Test Venue"
  # Missing required fields
}
```
**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "address",
      "message": "address is required",
      "type": "any.required"
    }
  ]
}
```

#### 4.3.2 Invalid Field Values
```http
POST /api/v1/venues/{venue_id}/book
Authorization: Bearer {organizer_token}
Content-Type: application/json

{
  "booking_start": "2024-12-01T00:00:00Z",
  "booking_end": "2024-11-30T00:00:00Z",  # End before start
  "guest_count": -10  # Negative capacity
}
```
**Expected Response:** 400 Bad Request

### 4.4 Resource Not Found

#### 4.4.1 Non-existent Venue
```http
GET /api/v1/venues/non-existent-uuid
```
**Expected Response:** 404 Not Found
```json
{
  "success": false,
  "error": "VENUE_NOT_FOUND",
  "message": "Venue not found"
}
```

#### 4.4.2 Non-existent Endpoint
```http
GET /api/v1/invalid-endpoint
```
**Expected Response:** 404 Not Found
```json
{
  "success": false,
  "error": "ENDPOINT_NOT_FOUND",
  "message": "The endpoint GET /api/v1/invalid-endpoint was not found"
}
```

### 4.5 Business Logic Errors

#### 4.5.1 Venue Not Available
```http
POST /api/v1/venues/{venue_id}/book
Authorization: Bearer {organizer_token}
# Attempting to book already booked dates
```
**Expected Response:** 409 Conflict
```json
{
  "success": false,
  "error": "VENUE_NOT_AVAILABLE",
  "message": "Venue is not available for the selected dates",
  "conflicting_bookings": [...]
}
```

#### 4.5.2 Capacity Exceeded
```http
POST /api/v1/venues/{venue_id}/book
Authorization: Bearer {organizer_token}
Content-Type: application/json

{
  "guest_count": 10000  # Exceeds venue capacity
}
```
**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "error": "CAPACITY_EXCEEDED",
  "message": "Guest count (10000) exceeds venue capacity (500)"
}
```

---

## 5. Performance Tests

### 5.1 Response Time Tests
- All GET endpoints should respond within 500ms
- POST/PUT endpoints should respond within 1000ms
- Search endpoints should respond within 2000ms
- Database queries should be optimized with indexes

### 5.2 Load Testing
- Test concurrent requests (50+ simultaneous users)
- Test database connection pooling
- Test rate limiting effectiveness
- Verify memory usage stays stable

### 5.3 Geospatial Performance
- Nearby venue/vendor searches should be fast
- MongoDB 2dsphere indexes should be utilized
- Large radius searches should have reasonable limits

---

## 6. Security Tests

### 6.1 Input Sanitization
- SQL injection attempts should be blocked
- XSS attempts should be sanitized
- File upload vulnerabilities should be prevented

### 6.2 Rate Limiting
- Should enforce rate limits per user role
- Should block excessive requests from same IP
- Should return proper rate limit headers

### 6.3 Data Privacy
- Sensitive vendor data should be hidden from public
- Personal information should be protected
- Admin-only fields should not leak to other users

---

## 7. Integration Tests

### 7.1 Database Integration
- Test MongoDB connection handling
- Test transaction support for bookings
- Test data consistency across collections

### 7.2 External Service Integration
- Test JWT token validation with Auth Service
- Test service discovery and communication
- Test graceful handling of service unavailability

---

## 8. Manual Testing Checklist

### 8.1 Pre-Testing Setup
- [ ] Start MongoDB instance
- [ ] Start venue-vendor service
- [ ] Import Postman collection and environments
- [ ] Run seed script to populate test data
- [ ] Obtain valid JWT tokens for different roles

### 8.2 Core Functionality
- [ ] Venue CRUD operations work correctly
- [ ] Vendor CRUD operations work correctly
- [ ] Booking creation and management functions
- [ ] Contract creation and status updates work
- [ ] Search and filtering return accurate results
- [ ] Geospatial queries work with proper coordinates

### 8.3 Authentication & Authorization
- [ ] All protected endpoints require authentication
- [ ] Role-based access control works correctly
- [ ] Rate limiting is enforced properly
- [ ] JWT token expiry is handled gracefully

### 8.4 Error Scenarios
- [ ] Invalid input is rejected with proper error messages
- [ ] Business rule violations are caught and reported
- [ ] Database connection errors are handled gracefully
- [ ] 404 errors for non-existent resources

### 8.5 Performance & Scalability
- [ ] Response times are acceptable under normal load
- [ ] Database queries are optimized
- [ ] Large result sets are paginated properly
- [ ] Memory usage remains stable during load

---

## 9. Automated Testing Commands

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load

# Lint code
npm run lint

# Format code
npm run format
```

---

## 10. Common Issues & Troubleshooting

### 10.1 Database Connection Issues
- Ensure MongoDB is running on correct port
- Check database connection string in .env
- Verify network connectivity and firewall settings

### 10.2 Authentication Issues
- Verify JWT secret is consistent across services
- Check token expiry and refresh logic
- Ensure proper role assignments in tokens

### 10.3 Geospatial Query Issues
- Ensure coordinates are in [longitude, latitude] format
- Verify 2dsphere indexes are created
- Check coordinate bounds (longitude: -180 to 180, latitude: -90 to 90)

### 10.4 Performance Issues
- Monitor database query performance with explain()
- Check if proper indexes are being used
- Verify connection pooling is working correctly
- Monitor memory usage and garbage collection

---

## Test Environment Variables

```env
# Required for testing
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://localhost:27017/eventzen_venues_test
JWT_SECRET=test-secret-key
RATE_LIMIT_MAX_REQUESTS=10000

# Optional for extended testing
ENABLE_DETAIL_LOGGING=true
TEST_TIMEOUT=30000
```

---

This test case document provides comprehensive coverage of all API endpoints, error scenarios, and edge cases. Use it in conjunction with the Postman collection for thorough testing of the Venue & Vendor Service.