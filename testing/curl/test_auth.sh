#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/common.sh"

log_header "Testing Auth API Endpoints (/api/v1/auth)"

TIMESTAMP=$(date +%s%N)
TEST_STUDENT_EMAIL="curl_student_${TIMESTAMP}@tezu.ac.in"
TEST_OWNER_EMAIL="curl_owner_${TIMESTAMP}@tezu.ac.in"
TEST_PASS="Password123!"

# 1. Register Missing Fields (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"","email":"","phone":"","password":""}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 400 "$STATUS" "Register with missing fields returns 400"
assert_json "$BODY" "data.get('status') == 400 and len(data.get('errors', [])) > 0" "Validation errors present"

# 2. Register Invalid Email Format (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Alice\",\"email\":\"invalid-email\",\"phone\":\"9876543210\",\"password\":\"$TEST_PASS\",\"role\":\"STUDENT\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Register with invalid email format returns 400"

# 3. Register Student - Success (201)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Curl Student\",\"email\":\"$TEST_STUDENT_EMAIL\",\"phone\":\"9876543210\",\"password\":\"$TEST_PASS\",\"role\":\"STUDENT\"}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 201 "$STATUS" "Register student returns 201"
assert_json "$BODY" "data.get('success') is True and 'accessToken' in data.get('data', {})" "Contains accessToken"
STUDENT_ACCESS_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")
STUDENT_REFRESH_TOKEN=$(json_get "$BODY" "data['data']['refreshToken']")

# 4. Register Duplicate Email (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Duplicate\",\"email\":\"$TEST_STUDENT_EMAIL\",\"phone\":\"9876543210\",\"password\":\"$TEST_PASS\",\"role\":\"STUDENT\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Register duplicate email returns 400"

# 5. Register Owner - Success (201)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Curl Owner\",\"email\":\"$TEST_OWNER_EMAIL\",\"phone\":\"9876543211\",\"password\":\"$TEST_PASS\",\"role\":\"OWNER\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 201 "$STATUS" "Register owner returns 201"

# 6. Login Invalid Password (401)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_STUDENT_EMAIL\",\"password\":\"WrongPassword!\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Login with incorrect password returns 401"

# 7. Login Success (200)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_STUDENT_EMAIL\",\"password\":\"$TEST_PASS\"}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Login returns 200 OK"
assert_json "$BODY" "data.get('success') is True and data['data']['role'] == 'STUDENT'" "Login returns student role"
ROTATION_REFRESH_TOKEN=$(json_get "$BODY" "data['data']['refreshToken']")

# 8. Refresh Token Rotation (200)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$ROTATION_REFRESH_TOKEN\"}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Refresh token returns 200 OK"
NEW_REFRESH_TOKEN=$(json_get "$BODY" "data['data']['refreshToken']")
assert_json "$BODY" "'accessToken' in data['data']" "New accessToken returned"

# 9. Replay Attack with Old Rotated Refresh Token (401)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$ROTATION_REFRESH_TOKEN\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Replay of previously rotated refresh token returns 401"

# 10. Logout Revocation (200)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/logout" \
    -H "Authorization: Bearer $STUDENT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$NEW_REFRESH_TOKEN\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 200 "$STATUS" "Logout returns 200 OK"

# 11. Refresh with Revoked Token (401)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$NEW_REFRESH_TOKEN\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Refresh with revoked token returns 401"

print_summary "Auth Module Tests"
