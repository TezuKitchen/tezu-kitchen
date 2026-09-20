#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/common.sh"

log_header "Testing Payments API Endpoints (/api/v1/payments)"

TIMESTAMP=$(date +%s%N)
OWNER_EMAIL="pay_owner_${TIMESTAMP}@tezu.ac.in"
STUDENT1_EMAIL="pay_student1_${TIMESTAMP}@tezu.ac.in"
STUDENT2_EMAIL="pay_student2_${TIMESTAMP}@tezu.ac.in"
PASS="Password123!"

# Setup Owner
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Payment Owner\",\"email\":\"$OWNER_EMAIL\",\"phone\":\"9876543240\",\"password\":\"$PASS\",\"role\":\"OWNER\"}")
BODY=$(echo "$RESP" | sed '$d')
OWNER_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# Setup Student 1 (Order Owner)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Payment Student 1\",\"email\":\"$STUDENT1_EMAIL\",\"phone\":\"9876543241\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
STUDENT1_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# Setup Student 2 (Unrelated Student)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Payment Student 2\",\"email\":\"$STUDENT2_EMAIL\",\"phone\":\"9876543242\",\"password\":\"$PASS\",\"role\":\"STUDENT\"}")
BODY=$(echo "$RESP" | sed '$d')
STUDENT2_TOKEN=$(json_get "$BODY" "data['data']['accessToken']")

# Setup Restaurant
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/restaurants" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Payments Canteen","description":"Fast fresh food","location":"Hostel Block"}')
BODY=$(echo "$RESP" | sed '$d')
RESTAURANT_ID=$(json_get "$BODY" "data['data']['id']")

# Setup Menu Item
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/menu" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"name\":\"Veg Meal Box\",\"price\":120.00,\"category\":\"Meals\"}")
BODY=$(echo "$RESP" | sed '$d')
MENU_ITEM_ID=$(json_get "$BODY" "data['data']['id']")

# Place Order as Student 1
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/orders" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"restaurantId\":\"$RESTAURANT_ID\",\"deliveryAddress\":\"Hostel D 102\",\"items\":[{\"menuItemId\":\"$MENU_ITEM_ID\",\"quantity\":2}]}")
BODY=$(echo "$RESP" | sed '$d')
ORDER_ID=$(json_get "$BODY" "data['data']['id']")

NON_EXISTENT_UUID="c0000000-0000-0000-0000-000000000005"

# 1. Create Payment - Unauthorized (401)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/payments" \
    -H "Content-Type: application/json" \
    -d "{\"orderId\":\"$ORDER_ID\",\"method\":\"UPI\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 401 "$STATUS" "Create payment without token returns 401"

# 2. Create Payment - Validation Error Missing OrderId (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/payments" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"method":"UPI"}')
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Create payment without orderId returns 400"

# 3. Create Payment - Invalid Payment Method (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/payments" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"orderId\":\"$ORDER_ID\",\"method\":\"BITCOIN\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Create payment with invalid method returns 400"

# 4. Create Payment - Non-existent Order (404)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/payments" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"orderId\":\"$NON_EXISTENT_UUID\",\"method\":\"UPI\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Create payment for non-existent order returns 404"

# 5. Create Payment - Forbidden Other User's Order (403)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/payments" \
    -H "Authorization: Bearer $STUDENT2_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"orderId\":\"$ORDER_ID\",\"method\":\"UPI\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Create payment for another user's order returns 403"

# 6. Create Payment - Success as Student 1 (201)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/payments" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"orderId\":\"$ORDER_ID\",\"method\":\"UPI\"}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 201 "$STATUS" "Create payment returns 201 Created"
assert_json "$BODY" "data['data']['orderId'] == '$ORDER_ID'" "Payment orderId matches"
assert_json "$BODY" "data['data']['method'] == 'UPI'" "Payment method is UPI"
assert_json "$BODY" "data['data']['status'] == 'PENDING'" "Payment status is PENDING"
assert_json "$BODY" "float(data['data']['amount']) == 240.0" "Payment amount is 240.0 (2 * 120.0)"
PAYMENT_ID=$(json_get "$BODY" "data['data']['id']")

# 7. Create Payment - Duplicate Payment for Same Order (400)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/payments" \
    -H "Authorization: Bearer $STUDENT1_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"orderId\":\"$ORDER_ID\",\"method\":\"COD\"}")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 400 "$STATUS" "Duplicate payment for same order returns 400"

# 8. Get Payment By ID - Success as Student Owner (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/${PAYMENT_ID}" \
    -H "Authorization: Bearer $STUDENT1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get payment by ID as student owner returns 200"
assert_json "$BODY" "data['data']['id'] == '$PAYMENT_ID'" "Payment ID matches"

# 9. Get Payment By ID - Success as Restaurant Owner (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/${PAYMENT_ID}" \
    -H "Authorization: Bearer $OWNER_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 200 "$STATUS" "Get payment by ID as restaurant owner returns 200"

# 10. Get Payment By ID - Forbidden Unrelated Student (403)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/${PAYMENT_ID}" \
    -H "Authorization: Bearer $STUDENT2_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Get payment by ID as unrelated student returns 403"

# 11. Get Payment By ID - Non-existent ID (404)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/${NON_EXISTENT_UUID}" \
    -H "Authorization: Bearer $STUDENT1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Get payment with non-existent ID returns 404"

# 12. Get Payment By Order ID - Success as Student Owner (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/order/${ORDER_ID}" \
    -H "Authorization: Bearer $STUDENT1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$STATUS" "Get payment by order ID as student owner returns 200"
assert_json "$BODY" "data['data']['orderId'] == '$ORDER_ID'" "Order ID matches in payment response"

# 13. Get Payment By Order ID - Success as Restaurant Owner (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/order/${ORDER_ID}" \
    -H "Authorization: Bearer $OWNER_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 200 "$STATUS" "Get payment by order ID as restaurant owner returns 200"

# 14. Get Payment By Order ID - Forbidden Unrelated Student (403)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/order/${ORDER_ID}" \
    -H "Authorization: Bearer $STUDENT2_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 403 "$STATUS" "Get payment by order ID as unrelated student returns 403"

# 15. Get Payment By Order ID - Non-existent Order ID (404)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/payments/order/${NON_EXISTENT_UUID}" \
    -H "Authorization: Bearer $STUDENT1_TOKEN")
STATUS=$(echo "$RESP" | tail -n1)
assert_status 404 "$STATUS" "Get payment with non-existent order ID returns 404"

print_summary "Payments Module Tests"
