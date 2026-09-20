#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/common.sh"

log_header "Testing Menu API Endpoints (/api/v1/menu)"

TIMESTAMP=$(date +%s%N)
OWNER_EMAIL="menu_owner_${TIMESTAMP}@tezu.ac.in"
STUDENT_EMAIL="menu_student_${TIMESTAMP}@tezu.ac.in"
PASS="Password123!"

# Setup Owner
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Chef Luigi\",\"email\":\"$OWNER_EMAIL\",\"phone\":\"9876543225\",\"password\":\"$PASS\",\"role\":\"OWNER\"}")
BODY=$(echo "$RESP" | sed '$d')
OWNER_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# Setup Student
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Foodie Student\",\"email\":\"$STUDENT_EMAIL\",\"phone\":\"9876543226\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
STUDENT_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# Setup Restaurant
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/restaurants" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Pasta & Pizza House","description":"Italian cuisine","location":"Central Canteen"}')
BODY=$(echo "$RESP" | sed '$d')
RESTAURANT_ID=$(json_get "$BODY" "data['data']['id']")

# 1. Create Menu Item - Unauthorized (401)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/menu" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"name\":\"Margherita Pizza\",\"price\":199.00,\"category\":\"Pizza\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Create menu item without token returns 401"

# 2. Create Menu Item - Validation Failure Blank/Negative (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/menu" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"name\":\"\",\"price\":-10.00,\"category\":\"\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Create menu item with invalid fields returns 400"

# 3. Create Menu Item - Forbidden Non-Owner (403)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/menu" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"name\":\"Hack Pizza\",\"price\":100.00,\"category\":\"Pizza\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Non-owner creating menu item returns 403"

# 4. Create Menu Item - Success (201)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/menu" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"name\":\"Margherita Pizza\",\"description\":\"Fresh basil and mozzarella\",\"price\":199.00,\"category\":\"Pizza\"}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 201 "$STATUS" "Create menu item returns 201"
assert_json "$BODY" "data['data']['name'] == 'Margherita Pizza'" "Menu item name matches"
assert_json "$BODY" "data['data']['available'] is True" "Menu item available defaults to True"
MENU_ITEM_ID=$(json_get "$BODY" "data['data']['id']")

# 5. Get Menu Item by ID - Success (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/menu/${MENU_ITEM_ID}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get menu item by ID returns 200"
assert_json "$BODY" "data['data']['id'] == '$MENU_ITEM_ID'" "ID matches"

# 6. Get Menu Item by Non-Existent ID (404)
FAKE_UUID="00000000-0000-0000-0000-000000000000"
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/menu/${FAKE_UUID}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Get non-existent menu item returns 404"

# 7. Get Menu Items by Restaurant (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/menu/restaurant/${RESTAURANT_ID}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get menu items by restaurant returns 200"
assert_json "$BODY" "len(data['data']) >= 1 and data['data'][0]['id'] == '$MENU_ITEM_ID'" "Item present in restaurant menu"

# 8. Get Available Menu Items (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/menu/restaurant/${RESTAURANT_ID}/available")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get available menu items returns 200"
assert_json "$BODY" "len(data['data']) >= 1 and data['data'][0]['available'] is True" "Available items returned"

# 9. Update Menu Item - Forbidden Non-Owner (403)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/menu/${MENU_ITEM_ID}" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Hacked Name","price":50.00,"isAvailable":false,"category":"Pizza"}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Non-owner updating menu item returns 403"

# 10. Update Menu Item - Success as Owner (200)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/menu/${MENU_ITEM_ID}" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Margherita Supreme","description":"Extra cheese","price":249.00,"isAvailable":false,"category":"Gourmet Pizza"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Owner updating menu item returns 200"
assert_json "$BODY" "data['data']['name'] == 'Margherita Supreme'" "Updated name confirmed"
assert_json "$BODY" "data['data']['available'] is False" "Updated availability confirmed"

# 11. Delete Menu Item - Forbidden Non-Owner (403)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/menu/${MENU_ITEM_ID}" \
    -H "Authorization: Bearer $STUDENT_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Non-owner deleting menu item returns 403"

# 12. Delete Menu Item - Success as Owner (204)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/menu/${MENU_ITEM_ID}" \
    -H "Authorization: Bearer $OWNER_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 204 "$STATUS" "Owner deleting menu item returns 204"

# 13. Verify Deleted Menu Item (404)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/menu/${MENU_ITEM_ID}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Deleted menu item returns 404 on GET"

print_summary "Menu Module Tests"
