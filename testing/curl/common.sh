#!/usr/bin/env bash
# Common test utilities for TezuKitchen curl test suites

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASSED_COUNT=0
FAILED_COUNT=0
TOTAL_COUNT=0

log_header() {
    echo -e "\n${CYAN}====================================================${NC}"
    echo -e "${CYAN} $1 ${NC}"
    echo -e "${CYAN}====================================================${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

assert_status() {
    local expected="$1"
    local actual="$2"
    local test_name="$3"
    TOTAL_COUNT=$((TOTAL_COUNT + 1))

    if [ "$actual" -eq "$expected" ]; then
        echo -e "  ${GREEN}✔ PASS:${NC} $test_name (HTTP $actual)"
        PASSED_COUNT=$((PASSED_COUNT + 1))
        return 0
    else
        echo -e "  ${RED}✖ FAIL:${NC} $test_name (Expected HTTP $expected, got $actual)"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        return 1
    fi
}

assert_json() {
    local json_str="$1"
    local py_expr="$2"
    local test_name="$3"
    TOTAL_COUNT=$((TOTAL_COUNT + 1))

    local result
    result=$(python3 -c "
import json, sys
try:
    data = json.loads('''$json_str''')
    res = bool($py_expr)
    print('TRUE' if res else 'FALSE')
except Exception as e:
    print('ERROR: ' + str(e))
" 2>/dev/null)

    if [ "$result" = "TRUE" ]; then
        echo -e "  ${GREEN}✔ PASS:${NC} $test_name"
        PASSED_COUNT=$((PASSED_COUNT + 1))
        return 0
    else
        echo -e "  ${RED}✖ FAIL:${NC} $test_name (Condition: $py_expr, Result: $result)"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        return 1
    fi
}

json_get() {
    local json_str="$1"
    local py_expr="$2"
    python3 -c "
import json, sys
try:
    data = json.loads('''$json_str''')
    val = $py_expr
    print(val if val is not None else '')
except Exception:
    print('')
" 2>/dev/null
}

print_summary() {
    local suite_name="$1"
    echo -e "\n${CYAN}----------------------------------------------------${NC}"
    echo -e " Suite: ${YELLOW}$suite_name${NC}"
    echo -e " Total: $TOTAL_COUNT | ${GREEN}Passed: $PASSED_COUNT${NC} | ${RED}Failed: $FAILED_COUNT${NC}"
    echo -e "${CYAN}----------------------------------------------------${NC}"

    if [ "$FAILED_COUNT" -gt 0 ]; then
        return 1
    fi
    return 0
}
