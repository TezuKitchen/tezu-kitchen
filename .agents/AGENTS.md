# TezuKitchen Workspace Guidelines

Hello fellow AI Agent! If you are working in this workspace, you should adhere to the following project-scoped rules and context to ensure consistency.

## Project Context
TezuKitchen is a campus food delivery app consisting of:
1. **Backend (`/backend`)**: Java Spring Boot (17+) with PostgreSQL. REST API running at `http://localhost:8080/api/v1`.
2. **Frontend (`/mobile`)**: React Native built with Expo Router and TypeScript. Uses `axios` for API calls and Context API for state management.

## State of the Project (as of Sept 2026)
- **What works**: Authentication (JWT), Student Home (restaurant list), Restaurant Menu (with cart integration), Cart & Checkout (order placement + payment), Student Orders (active/past with cancel), Search (client-side filtering), Owner Live Orders (accept/reject/status transitions with auto-refresh), Owner Menu Management (CRUD + availability toggles), Owner Store Settings (create/edit restaurant, open/close toggle).
- **Features to be Implemented Next (What is missing)**: 
  - Owner Analytics dashboard (placeholder).
  - Push notifications for real-time order updates.
  - User Reviews & Ratings (for restaurants and menu items).
  - Payment Gateway Integration (replacing dummy COD/UPI).
  - Favorite Restaurants (bookmarks for students).
  - Advanced User Profiles (address book, profile editing).
  - Promotions & Discount Codes.
  - Database seeding (no CommandLineRunner to pre-populate test data).

## AI Agent Rules

### 1. Mobile Development Rules
- **No Tailwind/NativeWind**: We are strictly using React Native `StyleSheet` and vanilla CSS. Do NOT introduce NativeWind.
- **Expo Router**: We are using Expo Router v3 file-based routing. Remember that screens that should not appear in the tab bar (like `cart.tsx` or `restaurant/[id].tsx`) should be placed at the root `app/` level and NOT inside the `(student)` or `(owner)` tab directories, otherwise Expo Router will throw "extraneous screen" warnings.
- **Theme**: Always import and use colors, typography, layout, and spacing from `mobile/src/theme/`. Do not use hardcoded hex codes.

### 2. Backend Development Rules
- The API is versioned at `/api/v1/`.
- Use DTOs for all requests and responses.
- Wrap all responses in the standard `ApiResponse<T>` generic class located in `com.tezukitchen.api.common.response.ApiResponse`.

### 3. API Communication
- In the mobile app, always use the pre-configured `api` instance from `mobile/src/services/api.ts`. It automatically handles injecting the JWT token via interceptors.
- Backend response payload is always at `response.data.data` (axios parses the HTTP body into `response.data`, and `ApiResponse` wraps the actual payload in a `data` field).
- For physical device testing on Android, `api.ts` correctly points to the `LOCAL_IP` of the host machine. Do not use `10.0.2.2` (Emulator IP) unless you explicitly detect the user is on an emulator.

### 4. Order Status Transitions
The backend strictly enforces these transitions:
- **Owner can**: PLACED→ACCEPTED, PLACED→REJECTED, ACCEPTED→PREPARING, PREPARING→OUT_FOR_DELIVERY, OUT_FOR_DELIVERY→DELIVERED
- **Student can**: PLACED→CANCELLED, ACCEPTED→CANCELLED
