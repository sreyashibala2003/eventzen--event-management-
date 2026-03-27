#!/bin/bash

# EventZen Venue & Vendor Service - API Test Script
# This script tests all major endpoints to validate functionality

BASE_URL="http://localhost:3001"
API_BASE="$BASE_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $message"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC}: $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ INFO${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠ WARN${NC}: $message"
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    local headers=$5
    local data=$6

    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X "$method" "$url" \
                  -H "Content-Type: application/json" \
                  ${headers:+-H "$headers"} \
                  -d "$data")
    else
        response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X "$method" "$url" \
                  ${headers:+-H "$headers"})
    fi

    status_code=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

    if [ "$status_code" = "$expected_status" ]; then
        print_status "PASS" "$description (Status: $status_code)"
    else
        print_status "FAIL" "$description (Expected: $expected_status, Got: $status_code)"
    fi
}

# Start testing
echo "=========================================="
echo "EventZen Venue & Vendor Service API Tests"
echo "=========================================="
echo ""

# Test 1: Service Health
print_status "INFO" "Testing service health..."
test_endpoint "GET" "$BASE_URL/health" "200" "Service health check"

# Test 2: API Documentation
test_endpoint "GET" "$API_BASE" "200" "API documentation endpoint"

echo ""
print_status "INFO" "Testing Public Venue Endpoints..."

# Test 3: Get all venues
test_endpoint "GET" "$API_BASE/venues" "200" "Get all venues (public)"

# Test 4: Get venues with filters
test_endpoint "GET" "$API_BASE/venues?city=Delhi&limit=5" "200" "Get venues with city filter"

# Test 5: Get nearby venues
test_endpoint "GET" "$API_BASE/venues/nearby?latitude=28.6279&longitude=77.2090&radius=10" "200" "Get nearby venues"

# Test 6: Advanced venue search
search_data='{"city": "Delhi", "min_capacity": 100, "max_capacity": 1000}'
test_endpoint "POST" "$API_BASE/venues/search" "200" "Advanced venue search" "" "$search_data"

# Test 7: Get non-existent venue (should fail gracefully)
test_endpoint "GET" "$API_BASE/venues/non-existent-id" "404" "Get non-existent venue"

echo ""
print_status "INFO" "Testing Protected Endpoints (without auth - should fail)..."

# Test 8: Protected endpoint without auth (should fail)
test_endpoint "GET" "$API_BASE/vendors" "401" "Get vendors without authentication"

# Test 9: Admin endpoint without auth (should fail)
create_venue_data='{"venue_name": "Test Venue", "address": "Test Address", "city": "Test City", "capacity": 100, "price_per_day": 10000, "venue_type": "banquet_hall", "contact_info": {"phone": "+91-9876543210", "email": "test@venue.com"}, "location": {"coordinates": [77.2090, 28.6279]}}'
test_endpoint "POST" "$API_BASE/venues" "401" "Create venue without authentication" "" "$create_venue_data"

echo ""
print_status "INFO" "Testing Error Handling..."

# Test 10: Invalid JSON
test_endpoint "POST" "$API_BASE/venues/search" "400" "Invalid JSON request" "" "invalid-json"

# Test 11: Invalid endpoint
test_endpoint "GET" "$API_BASE/invalid-endpoint" "404" "Invalid endpoint"

echo ""
print_status "INFO" "Testing Database Operations..."

# Test 12: Database connection (indirect test through data endpoints)
test_endpoint "GET" "$API_BASE/venues?limit=1" "200" "Database connectivity test"

echo ""
print_status "INFO" "Testing Performance and Limits..."

# Test 13: Large limit (should be capped)
test_endpoint "GET" "$API_BASE/venues?limit=1000" "200" "Large limit handling"

# Test 14: Pagination
test_endpoint "GET" "$API_BASE/venues?page=1&limit=5" "200" "Pagination test"

echo ""
echo "=========================================="
echo "Test Summary:"
echo "=========================================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Service is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the service configuration.${NC}"
    exit 1
fi