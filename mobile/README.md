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

## Running the App

```bash
# Install dependencies
npm install

# Start the Expo server
npm run start
```

### Testing the Full Flow
1. Register as **Owner** → go to Store tab → create restaurant → go to Menu tab → add items.
2. Register as **Student** → see the restaurant on Home → tap it → add items → checkout → place order.
3. Switch to **Owner** → see the order in Live Orders → Accept → Preparing → Delivered.
4. Switch to **Student** → see order status updates in Orders tab.

*Note: Your Android/iOS device must be on the same Wi-Fi network as the machine running the backend.*
