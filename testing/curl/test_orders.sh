#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/common.sh"

log_header "Testing Orders API Endpoints (/api/v1/orders)"

TIMESTAMP=$(date +%s%N)
OWNER_EMAIL="order_owner_${TIMESTAMP}@tezu.ac.in"
STUDENT1_EMAIL="order_student1_${TIMESTAMP}@tezu.ac.in"
STUDENT2_EMAIL="order_student2_${TIMESTAMP}@tezu.ac.in"
PASS="Password123!"

# Setup Owner
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Order Chef\",\"email\":\"$OWNER_EMAIL\",\"phone\":\"9876543235\",\"password\":\"$PASS\",\"role\":\"OWNER\"}")
BODY=$(echo "$RESP" | sed '$d')
OWNER_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# Setup Student 1
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Order Student 1\",\"email\":\"$STUDENT1_EMAIL\",\"phone\":\"9876543236\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
STUDENT1_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")
STUDENT1_ID=$(json_get "$BODY" "data['data']['userId']")

# Setup Student 2
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Order Student 2\",\"email\":\"$STUDENT2_EMAIL\",\"phone\":\"9876543237\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
STUDENT2_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# Setup Restaurant
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/restaurants" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Biryani Express","description":"Fast fresh biryani","location":"Hostel Block"}')
BODY=$(echo "$RESP" | sed '$d')
RESTAURANT_ID=$(json_get "$BODY" "data['data']['id']")

# Setup Menu Item
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/menu" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"name\":\"Hyderabadi Dum Biryani\",\"price\":180.00,\"category\":\"Biryani\"}")
BODY=$(echo "$RESP" | sed '$d')
MENU_ITEM_ID=$(json_get "$BODY" "data['data']['id']")

# 1. Create Order - Unauthorized (401)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/orders" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"deliveryAddress\":\"Hostel C\",\"items\":[{\"menuItemId\":\"$MENU_ITEM_ID\",\"quantity\":1}]}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Create order without token returns 401"

# 2. Create Order - Validation Failure Empty Items (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/orders" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"deliveryAddress\":\"Hostel C\",\"items\":[]}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Create order with empty items returns 400"

# 3. Create Order - Success as Student (201)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/orders" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"deliveryAddress\":\"Hostel C Room 204\",\"items\":[{\"menuItemId\":\"$MENU_ITEM_ID\",\"quantity\":2}]}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 201 "$STATUS" "Create order returns 201 Created"
assert_json "$BODY" "data['data']['status'] == 'PLACED'" "Initial status is PLACED"
assert_json "$BODY" "float(data['data']['totalAmount']) == 360.0" "Total amount computed correctly (2 * 180.0)"
ORDER_ID=$(json_get "$BODY" "data['data']['id']")

# 4. Get Order by ID - Success (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/orders/${ORDER_ID}" \
    -H "Authorization: Bearer $STUDENT1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get order by ID returns 200"
assert_json "$BODY" "data['data']['id'] == '$ORDER_ID'" "Order ID matches"
assert_json "$BODY" "len(data['data']['items']) == 1" "Order item returned"

# 5. Get Order by ID - Forbidden Unrelated Student (403)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/orders/${ORDER_ID}" \
    -H "Authorization: Bearer $STUDENT2_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Unrelated student cannot view order (403)"

# 6. Get Orders by User (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/orders/user/${STUDENT1_ID}?page=0&size=10" \
    -H "Authorization: Bearer $STUDENT1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get orders by user returns 200"
assert_json "$BODY" "len(data['data']['content']) >= 1" "Orders list not empty"

# 7. Get Orders by Restaurant - Owner Access (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/orders/restaurant/${RESTAURANT_ID}?page=0&size=10" \
    -H "Authorization: Bearer $OWNER_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get orders by restaurant returns 200"
assert_json "$BODY" "len(data['data']['content']) >= 1" "Restaurant orders returned"

# 8. Update Order Status - Forbidden Non-Owner (403)
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${BASE_URL}/orders/${ORDER_ID}/status" \
    -H "Authorization: Bearer $STUDENT2_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"ACCEPTED"}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Non-owner updating order status returns 403"

# 9. Update Status: PLACED -> ACCEPTED (200)
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${BASE_URL}/orders/${ORDER_ID}/status" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"ACCEPTED"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Status transition to ACCEPTED returns 200"
assert_json "$BODY" "data['data']['status'] == 'ACCEPTED'" "Status updated to ACCEPTED"

# 10. Update Status: ACCEPTED -> PREPARING (200)
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${BASE_URL}/orders/${ORDER_ID}/status" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"PREPARING"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Status transition to PREPARING returns 200"
assert_json "$BODY" "data['data']['status'] == 'PREPARING'" "Status updated to PREPARING"

# 11. Update Status: PREPARING -> OUT_FOR_DELIVERY (200)
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${BASE_URL}/orders/${ORDER_ID}/status" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"OUT_FOR_DELIVERY"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Status transition to OUT_FOR_DELIVERY returns 200"
assert_json "$BODY" "data['data']['status'] == 'OUT_FOR_DELIVERY'" "Status updated to OUT_FOR_DELIVERY"

# 12. Update Status: OUT_FOR_DELIVERY -> DELIVERED (200)
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${BASE_URL}/orders/${ORDER_ID}/status" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"DELIVERED"}')
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Status transition to DELIVERED returns 200"
assert_json "$BODY" "data['data']['status'] == 'DELIVERED'" "Status updated to DELIVERED"

# 13. Invalid Transition: DELIVERED -> ACCEPTED (400)
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${BASE_URL}/orders/${ORDER_ID}/status" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"ACCEPTED"}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Invalid transition from DELIVERED returns 400"

print_summary "Orders Module Tests"
