# TezuKitchen — API Testing

This directory contains automated Postman test suites and integration test scripts for all TezuKitchen backend modules.

## Structure

```
testing/
├── README.md
└── postman/
    ├── auth.postman_collection.json          # 26-case automated auth test suite (Implemented)
    ├── users.postman_collection.json         # Users API test suite (Placeholder)
    ├── restaurants.postman_collection.json   # Restaurants API test suite (Placeholder)
    ├── menu.postman_collection.json          # Menu API test suite (Placeholder)
    ├── orders.postman_collection.json        # Orders API test suite (Placeholder)
    └── payments.postman_collection.json      # Payments API test suite (Placeholder)
```

## How to Run in Postman

1. Open Postman.
2. Click **Import** -> **Files** (or drag and drop any collection file from `testing/postman/`).
3. Select the imported collection and click **Run** to execute all test cases with automated assertions.
