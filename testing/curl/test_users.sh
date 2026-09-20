#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/common.sh"

log_header "Testing Users API Endpoints (/api/v1/users)"

TIMESTAMP=$(date +%s%N)
USER1_EMAIL="user1_${TIMESTAMP}@tezu.ac.in"
USER2_EMAIL="user2_${TIMESTAMP}@tezu.ac.in"
PASS="Password123!"

# Setup User 1
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"User One\",\"email\":\"$USER1_EMAIL\",\"phone\":\"9876543201\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
USER1_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")
USER1_ID=$(json_get "$BODY" "data['data']['userId']")

# Setup User 2
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"User Two\",\"email\":\"$USER2_EMAIL\",\"phone\":\"9876543202\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
USER2_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")
USER2_ID=$(json_get "$BODY" "data['data']['userId']")

# 1. Get User without Auth Header (401)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/users/${USER1_ID}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Get user without auth token returns 401"

# 2. Get User by ID - Success (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/users/${USER1_ID}" \
    -H "Authorization: Bearer $USER1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get user by ID returns 200"
assert_json "$BODY" "data['data']['id'] == '$USER1_ID'" "Returned ID matches requested ID"
assert_json "$BODY" "data['data']['email'] == '$USER1_EMAIL'" "Returned email matches"

# 3. Get User by ID - Non-existent ID (404)
FAKE_UUID="00000000-0000-0000-0000-000000000000"
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/users/${FAKE_UUID}" \
    -H "Authorization: Bearer $USER1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Get non-existent user returns 404"

# 4. Get All Users - Paginated (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/users?page=0&size=10" \
    -H "Authorization: Bearer $USER1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get all users returns 200"
assert_json "$BODY" "'content' in data['data'] and isinstance(data['data']['content'], list)" "Users list present"

# 5. Update User - Validation Error Blank Fields (400)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/users/${USER1_ID}" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"","phone":""}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Update user with blank name/phone returns 400"

# 6. Update User - Forbidden updating another user's profile (403)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/users/${USER2_ID}" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Hacked Name","phone":"9876543299"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 403 "$STATUS" "Updating another user's profile returns 403"
assert_json "$BODY" "'only update your own profile' in data.get('message', '')" "Forbidden error message correct"

# 7. Update User - Success (200)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/users/${USER1_ID}" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"User One Updated","phone":"9111222333"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Update own profile returns 200"
assert_json "$BODY" "data['data']['name'] == 'User One Updated'" "Name properly updated"
assert_json "$BODY" "data['data']['phone'] == '9111222333'" "Phone properly updated"

# 8. Delete User - Forbidden deleting another user's account (403)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/users/${USER2_ID}" \
    -H "Authorization: Bearer $USER1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Deleting another user's account returns 403"

# 9. Delete User - Success deleting own account (204)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/users/${USER1_ID}" \
    -H "Authorization: Bearer $USER1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 204 "$STATUS" "Delete own account returns 204"

# 10. Verify Deleted User - Returns 404
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/users/${USER1_ID}" \
    -H "Authorization: Bearer $USER2_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Deleted user returns 404 on GET"

print_summary "Users Module Tests"
