#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/common.sh"

log_header "Testing Restaurants API Endpoints (/api/v1/restaurants)"

TIMESTAMP=$(date +%s%N)
OWNER_EMAIL="rest_owner_${TIMESTAMP}@tezu.ac.in"
STUDENT_EMAIL="rest_student_${TIMESTAMP}@tezu.ac.in"
PASS="Password123!"

# Setup Owner
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Chef Marco\",\"email\":\"$OWNER_EMAIL\",\"phone\":\"9876543215\",\"password\":\"$PASS\",\"role\":\"OWNER\"}")
BODY=$(echo "$RESP" | sed '$d')
OWNER_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")
OWNER_ID=$(json_get "$BODY" "data['data']['userId']")

# Setup Student
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Diner Sam\",\"email\":\"$STUDENT_EMAIL\",\"phone\":\"9876543216\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
STUDENT_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# 1. Create Restaurant - Unauthorized without token (401)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/restaurants" \
    -H "Content-Type: application/json" \
    -d '{"name":"No Auth Cafe","location":"Gate 1"}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Create restaurant without token returns 401"

# 2. Create Restaurant - Validation Failure Missing Fields (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/restaurants" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"","location":""}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Create restaurant with blank fields returns 400"

# 3. Create Restaurant - Success as Owner (201)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/restaurants" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Tezu Grill House","description":"Barbecue and meals","location":"SAC Food Plaza"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 201 "$STATUS" "Create restaurant returns 201 Created"
assert_json "$BODY" "data.get('success') is True" "Success flag is True"
assert_json "$BODY" "data['data']['name'] == 'Tezu Grill House'" "Restaurant name matches"
assert_json "$BODY" "data['data']['open'] is True" "Default isOpen is True"
RESTAURANT_ID=$(json_get "$BODY" "data['data']['id']")

# 4. List Restaurants - Public Access (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/restaurants?page=0&size=10")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "List restaurants (public) returns 200"
assert_json "$BODY" "isinstance(data['data']['content'], list)" "Contains restaurants content list"

# 5. Get Restaurant by ID - Success (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/restaurants/${RESTAURANT_ID}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get restaurant by ID returns 200"
assert_json "$BODY" "data['data']['id'] == '$RESTAURANT_ID'" "Returned ID matches"
assert_json "$BODY" "data['data']['ownerId'] == '$OWNER_ID'" "Owner ID matches"

# 6. Get Restaurant by Non-Existent ID (404)
FAKE_UUID="00000000-0000-0000-0000-000000000000"
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/restaurants/${FAKE_UUID}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Get non-existent restaurant returns 404"

# 7. Get Restaurants by Owner ID (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/restaurants/owner/${OWNER_ID}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get restaurants by owner returns 200"
assert_json "$BODY" "len(data['data']) >= 1 and data['data'][0]['id'] == '$RESTAURANT_ID'" "Contains owner's restaurant"

# 8. Update Restaurant - Validation Error (400)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/restaurants/${RESTAURANT_ID}" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"","location":""}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Update restaurant with blank fields returns 400"

# 9. Update Restaurant - Forbidden Non-Owner (403)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/restaurants/${RESTAURANT_ID}" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Hijacked Name","location":"Other SAC"}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Non-owner updating restaurant returns 403"

# 10. Update Restaurant - Success as Owner (200)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/restaurants/${RESTAURANT_ID}" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Tezu Grill House Express","description":"Upgraded grill","location":"SAC Level 2","isOpen":false}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Owner updating restaurant returns 200"
assert_json "$BODY" "data['data']['name'] == 'Tezu Grill House Express'" "Updated name confirmed"
assert_json "$BODY" "data['data']['open'] is False" "Updated isOpen confirmed"

# 11. Delete Restaurant - Forbidden Non-Owner (403)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/restaurants/${RESTAURANT_ID}" \
    -H "Authorization: Bearer $STUDENT_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Non-owner deleting restaurant returns 403"

# 12. Delete Restaurant - Success as Owner (204)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/restaurants/${RESTAURANT_ID}" \
    -H "Authorization: Bearer $OWNER_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 204 "$STATUS" "Owner deleting restaurant returns 204"

# 13. Verify Deleted Restaurant - Returns 404
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/restaurants/${RESTAURANT_ID}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Deleted restaurant returns 404 on GET"

print_summary "Restaurants Module Tests"
