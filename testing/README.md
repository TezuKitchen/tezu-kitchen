# TezuKitchen — API Testing

This directory contains automated Postman test suites and curl integration test scripts for all TezuKitchen backend modules.

## Structure

```
testing/
├── README.md
├── run_all_curl_tests.sh                     # Master test runner for all curl test suites
├── curl/                                     # Automated CLI curl integration tests
│   ├── common.sh                             # Assertions, JSON evaluation & color logging helpers
│   ├── test_auth.sh                          # 15 tests: register, login, refresh, logout, errors
│   ├── test_users.sh                         # 16 tests: user profile, roles, auth checks, deletion
│   ├── test_restaurants.sh                  # 22 tests: restaurant lifecycle, public/owner endpoints
│   ├── test_menu.sh                          # 20 tests: menu item CRUD, category & availability
│   ├── test_orders.sh                        # 23 tests: order creation, transitions, role checks
│   └── test_payments.sh                      # 21 tests: payments, order linking, role authorization
└── postman/                                  # Postman Collection v2.1 suites
    ├── auth.postman_collection.json          # 26-case automated auth test suite
    ├── users.postman_collection.json         # 10-case automated users test suite
    ├── restaurants.postman_collection.json   # 15-case automated restaurants test suite
    ├── menu.postman_collection.json          # 16-case automated menu test suite
    ├── orders.postman_collection.json        # 17-case automated orders test suite
    └── payments.postman_collection.json      # 16-case automated payments test suite
```

## Running Curl Tests (CLI)

Ensure the Docker stack or local backend is running (`http://localhost:8080`):

```bash
# Run all test suites:
./testing/run_all_curl_tests.sh

# Or run individual module suites:
bash testing/curl/test_auth.sh
bash testing/curl/test_users.sh
bash testing/curl/test_restaurants.sh
bash testing/curl/test_menu.sh
bash testing/curl/test_orders.sh
bash testing/curl/test_payments.sh
```

## Running Postman Collections

1. Open Postman.
2. Click **Import** -> **Files** (or drag and drop any collection file from `testing/postman/`).
3. Select the imported collection and click **Run** to execute all test cases with automated assertions.
