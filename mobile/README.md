# TezuKitchen Mobile App

This is the mobile application for TezuKitchen, built using **React Native (Expo)**, **TypeScript**, and **Expo Router**.

## Current Implementation Status

### ✅ What is Working
1. **Authentication Flow (`app/(auth)`)**
   - User Registration (Student & Owner roles)
   - User Login with JWT
   - Secure token storage using `expo-secure-store`
   - Auto-redirect based on role (Student → Home, Owner → Dashboard)

2. **Student Flow (`app/(student)` + root screens)**
   - **Home** (`index.tsx`): Fetches and displays real restaurants from `GET /api/v1/restaurants`.
   - **Restaurant Menu** (`app/restaurant/[id].tsx`): Fetches real restaurant details and menu items. Items can be added to cart with quantity steppers. Floating cart banner appears when items are in cart.
   - **Cart & Checkout** (`app/cart.tsx`): Full checkout with delivery address, payment method (COD/UPI), bill breakdown, and order placement via `POST /api/v1/orders` + `POST /api/v1/payments`.
   - **Orders** (`orders.tsx`): Active/Past order tabs with status badges, cancel functionality for PLACED/ACCEPTED orders.
   - **Search** (`search.tsx`): Debounced client-side search across restaurant name, description, and location.
   - **Profile** (`profile.tsx`): User info display + logout.

3. **Owner Flow (`app/(owner)`)**
   - **Live Orders** (`index.tsx`): Real-time order dashboard with auto-refresh (30s). Accept/Reject incoming orders, advance order status through PREPARING → OUT_FOR_DELIVERY → DELIVERED.
   - **Menu Management** (`menu.tsx`): Add, edit, delete menu items. Toggle availability. Items grouped by category.
   - **Store Settings** (`store.tsx`): Create restaurant profile (for new owners), edit store details, open/closed toggle.
   - **Analytics** (`analytics.tsx`): Placeholder — not yet implemented.

4. **State Management**
   - `AuthContext`: Global user state, JWT token lifecycle, SecureStore persistence.
   - `CartContext`: Cart items, restaurant lock, quantity management, totals.

### 🚧 Features to be Implemented Next (What Still Needs Work)
- **Owner Analytics Dashboard** (`app/(owner)/analytics.tsx`): Still a placeholder. Needs charts for daily revenue and order volume.
- **Push Notifications**: Real-time order status updates for students and new order alerts for owners using Expo Push Notifications.
- **User Reviews & Ratings**: Allow students to rate and review restaurants and specific menu items after an order is delivered.
- **Payment Gateway Integration**: Replace the dummy COD/UPI selection with a real payment provider like Razorpay or Stripe.
- **Favorite Restaurants**: Let students bookmark their favorite dhabas for quick access.
- **Advanced User Profiles**: Allow users to save multiple delivery addresses, change passwords, and update contact info.
- **Promotions & Discount Codes**: System for owners to create promo codes and students to apply them during checkout.
- **Database Seeding**: A backend `CommandLineRunner` script to pre-populate test users, restaurants, and menu items so they don't have to be created manually.

## Connecting to the Backend API

The mobile application connects to the Spring Boot REST API (`http://<host>:8080/api/v1`).
Backend base URL resolution is handled in `src/services/api.ts`:

1. **Explicit Environment Variable (`.env`)**:
   Create a `.env` file in `mobile/`:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```
2. **Auto-detection**:
   In development mode (`__DEV__`), the app automatically detects the host IP from the Expo Metro bundler across Expo SDK 51 properties.
3. **Fallback**:
   Falls back to local machine network IP. (Note: Tunnel domains like `exp.direct` / `ngrok` are intentionally ignored for port 8080 to prevent routing backend requests to non-forwarded tunnel ports).

---

## Running the App

### Option 1: Over USB via ADB (Recommended & Most Reliable)
Use this option to bypass campus Wi-Fi AP isolation and mobile hotspot client isolation:

1. **Connect your phone via USB** and enable **USB Debugging** in Developer Options.
2. **Verify connection**:
   ```bash
   adb devices
   ```
3. **Forward backend and Metro ports**:
   ```bash
   adb reverse tcp:8080 tcp:8080 && adb reverse tcp:8081 tcp:8081
   ```
4. **Configure `.env`**:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```
5. **Start Expo with cleared cache**:
   ```bash
   npm start -- -c
   ```
6. **Launch the app on your phone**:
   - Run via terminal:
     ```bash
     adb shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"
     ```
   - OR open **Expo Go** on your phone → tap **"Enter URL manually"** → type `exp://localhost:8081`.

---

### Option 2: Over Wireless LAN (Same Wi-Fi / Hotspot)
1. Ensure both your computer and phone are connected to the same Wi-Fi network.
2. Start Expo in LAN mode:
   ```bash
   npx expo start --lan -c
   ```
3. Open **Expo Go** on your phone and scan the QR code displayed in the terminal.

> ⚠️ **Campus / Hotspot Isolation Notice**:
> If you are on university campus Wi-Fi or using your phone as a mobile hotspot, the router/phone often enforces **AP/Client Isolation**, preventing the phone from sending packets to the computer's local IP. In that case, use **Option 1 (USB ADB)**.

---

### Testing the Full Flow
1. Register as **Owner** → go to Store tab → create restaurant → go to Menu tab → add items.
2. Register as **Student** → see the restaurant on Home → tap it → add items → checkout → place order.
3. Switch to **Owner** → see the order in Live Orders → Accept → Preparing → Delivered.
4. Switch to **Student** → see order status updates in Orders tab.
