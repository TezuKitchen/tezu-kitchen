# TezuKitchen Mobile App

This is the mobile application for TezuKitchen, built using **React Native (Expo)**, **TypeScript**, and **Expo Router**.

## Current Implementation Status

### ✅ What is Working
1. **Authentication Flow (`app/(auth)`)**
   - User Registration (Student & Owner roles)
   - User Login
   - JWT integration with the Spring Boot backend
   - Secure token storage using `expo-secure-store`
2. **Student Dashboard (`app/(student)`)**
   - Bottom tab navigation configured.
   - **Student Home (`index.tsx`)**: Fetches and displays real restaurants (Dhabas) from the backend API (`GET /api/v1/restaurants`).
   - **Restaurant Menu (`app/restaurant/[id].tsx`)**: Full-screen view that fetches and displays active menu items for a selected restaurant (`GET /api/v1/menu/restaurant/{id}/available`).
3. **Owner Dashboard (`app/(owner)`)**
   - Bottom tab navigation configured (Live Orders, Menu, Analytics, Store).
4. **State Management**
   - `AuthContext` managing global user state and token lifecycle.
   - `CartContext` created and wrapping the app, ready to manage cart items.

### 🚧 What Needs to be Implemented Next (Next Phases)
Future developers (and AI agents), here is the roadmap to complete the mobile app:

1. **Phase 2.5: Cart & Checkout (Student Flow)**
   - Wire up the `+ ADD` buttons on the `MenuItemCard` to the existing `CartContext`.
   - Build a Floating Cart Banner that appears at the bottom of the restaurant menu when items are added.
   - Complete `app/cart.tsx` to display cart items, allow quantity modifications, and submit the order to `POST /api/v1/orders`.
2. **Phase 3: Owner Flow & Store Settings**
   - **Crucial:** Build the `app/(owner)/store.tsx` screen so that newly registered owners can create their actual Restaurant profile (`POST /api/v1/restaurants`). Right now, an owner account exists but their restaurant won't appear until this profile is created.
   - Complete `app/(owner)/index.tsx` (Live Orders) to fetch incoming orders and allow owners to accept/reject/update status.
3. **Phase 4: Order Tracking**
   - Complete `app/(student)/orders.tsx` to list the student's active and past orders.

## Running the App

```bash
# Install dependencies
npm install

# Start the Expo server
npm run start
```
*Note: Make sure your Android/iOS physical device is on the exact same Wi-Fi network as the machine running the backend so the local IP routing works.*
