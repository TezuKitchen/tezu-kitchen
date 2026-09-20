#!/usr/bin/env bash
# ==============================================================================
# TezuKitchen - Run All Curl Integration & API Test Suites
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURL_DIR="$DIR/curl"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "======================================================================"
echo "          TEZUKITCHEN API AUTOMATED CURL TEST SUITE RUNNER           "
echo "======================================================================"
echo -e "${NC}"

SUITES=(
    "test_auth.sh"
    "test_users.sh"
    "test_restaurants.sh"
    "test_menu.sh"
    "test_orders.sh"
    "test_payments.sh"
)

TOTAL_SUITES=${#SUITES[@]}
PASSED_SUITES=0
FAILED_SUITES=0

for suite in "${SUITES[@]}"; do
    suite_path="$CURL_DIR/$suite"
    echo -e "\n${BOLD}${YELLOW}>>> Running suite: $suite ...${NC}"
    if bash "$suite_path"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
        echo -e "${GREEN}>>> Suite $suite PASSED.${NC}"
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        echo -e "${RED}>>> Suite $suite FAILED.${NC}"
    fi
done

echo -e "\n${BOLD}${CYAN}======================================================================${NC}"
echo -e "${BOLD}                       FINAL TEST RUN SUMMARY                         ${NC}"
echo -e "${BOLD}${CYAN}======================================================================${NC}"
echo -e " Total Suites Run : ${BOLD}$TOTAL_SUITES${NC}"
echo -e " Suites Passed    : ${GREEN}${BOLD}$PASSED_SUITES${NC}"
echo -e " Suites Failed    : ${RED}${BOLD}$FAILED_SUITES${NC}"

if [ "$FAILED_SUITES" -gt 0 ]; then
    echo -e "\n${RED}${BOLD}✖ OVERALL RESULT: FAILED${NC}\n"
    exit 1
else
    echo -e "\n${GREEN}${BOLD}✔ OVERALL RESULT: ALL TEST SUITES PASSED PERFECTLY${NC}\n"
    exit 0
fi
