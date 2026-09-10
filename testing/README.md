# TezuKitchen — API Testing

This directory contains automated Postman test suites and integration test scripts for all TezuKitchen backend modules.

## Structure

```
testing/
├── README.md
└── postman/
    ├── auth.postman_collection.json          # 26-case automated auth test suite (Implemented)
    ├── users.postman_collection.json         # 10-case automated users test suite (Implemented)
    ├── restaurants.postman_collection.json   # 15-case automated restaurants test suite (Implemented)
    ├── menu.postman_collection.json          # 16-case automated menu test suite (Implemented)
    ├── orders.postman_collection.json        # 17-case automated orders test suite (Implemented)
    └── payments.postman_collection.json      # 16-case automated payments test suite (Implemented)
```

## How to Run in Postman

1. Open Postman.
2. Click **Import** -> **Files** (or drag and drop any collection file from `testing/postman/`).
3. Select the imported collection and click **Run** to execute all test cases with automated assertions.
