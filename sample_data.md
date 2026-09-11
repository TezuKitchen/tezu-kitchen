# TezuKitchen Sample Test Data & Credentials

This document provides credentials, seeded restaurant details, menu catalogs, and API usage examples for the TezuKitchen application connected to **Neon PostgreSQL**.

---

## 🔐 Universal Test Credentials

All seeded owner and student accounts are configured with the same default password:

- **Password**: `Password@123`

---

## 👨‍🍳 Dhaba Owners (5 Accounts)

| # | Owner Name | Email / Username | Password | Phone | Role | Managed Dhaba |
|---|------------|------------------|----------|-------|------|---------------|
| 1 | **Ramesh Borah** | `ramesh.sac@tezukitchen.in` | `Password@123` | `9854011001` | `OWNER` | Central SAC Canteen |
| 2 | **Pradeep Kalita** | `pradeep.kbr@tezukitchen.in` | `Password@123` | `9854011002` | `OWNER` | KBR Dhaba & Eatery |
| 3 | **Anita Devi** | `anita.dhansiri@tezukitchen.in` | `Password@123` | `9854011003` | `OWNER` | Dhansiri Food Point |
| 4 | **Biren Das** | `biren.brahma@tezukitchen.in` | `Password@123` | `9854011004` | `OWNER` | Brahmaputra Fast Food & Momos |
| 5 | **Manoj Saikia** | `manoj.nilachal@tezukitchen.in` | `Password@123` | `9854011005` | `OWNER` | Nilachal Night Canteen |

---

## 🏪 Campus Dhabas & Eateries (5 Restaurants)

| Dhaba Name | UUID | Location | Owner | Status | Items |
|------------|------|----------|-------|--------|-------|
| **Central SAC Canteen** | `22222222-2222-2222-2222-222222222201` | Student Activity Centre (SAC), Ground Floor | Ramesh Borah | Open (`true`) | 6 |
| **KBR Dhaba & Eatery** | `22222222-2222-2222-2222-222222222202` | Opposite KBR Auditorium, Academic Complex | Pradeep Kalita | Open (`true`) | 6 |
| **Dhansiri Food Point** | `22222222-2222-2222-2222-222222222203` | Near Dhansiri & Subansiri Hostels | Anita Devi | Open (`true`) | 6 |
| **Brahmaputra Fast Food & Momos** | `22222222-2222-2222-2222-222222222204` | Commercial Complex, Near SBI ATM | Biren Das | Open (`true`) | 6 |
| **Nilachal Night Canteen** | `22222222-2222-2222-2222-222222222205` | Near Nilachal & Charaideo Boys Hostels | Manoj Saikia | Open (`true`) | 6 |

---

## 🍽️ Dhaba Menu Catalogs (30 Items Total)

### 1. Central SAC Canteen
*Location: Student Activity Centre (SAC), Ground Floor*

| Item Name | Category | Price | Description | Available |
|-----------|----------|-------|-------------|-----------|
| Aloo Paratha with Curd & Pickle | Breakfast | ₹60.00 | Crispy, shallow-fried whole wheat paratha stuffed with spiced mashed potatoes. | Yes |
| Hot Samosa (2 pcs) with Chutney | Snacks | ₹25.00 | Traditional spiced potato samosas served with tangy tamarind and mint chutney. | Yes |
| Special Assam Milk Tea | Beverages | ₹15.00 | Brewed with fresh garden CTC tea leaves and fragrant cardamom. | Yes |
| Veg Maggi with Veggies | Quick Bites | ₹40.00 | Classic 2-minute noodles tossed with fresh onion, capsicum, peas, and house spices. | Yes |
| Egg Chowmein | Chinese & Fast Food | ₹70.00 | Street-style wok-tossed noodles with scrambled eggs, shredded cabbage, and carrots. | Yes |
| Cold Coffee with Ice Cream | Beverages | ₹65.00 | Thick blended iced coffee topped with a rich vanilla scoop. | Yes |

---

### 2. KBR Dhaba & Eatery
*Location: Opposite KBR Auditorium, Academic Complex*

| Item Name | Category | Price | Description | Available |
|-----------|----------|-------|-------------|-----------|
| Paneer Kathi Roll | Rolls & Wraps | ₹75.00 | Soft paratha wrap rolled with marinated grilled paneer cubes and sliced onions. | Yes |
| Chicken Kathi Roll | Rolls & Wraps | ₹90.00 | Flaky egg-layered paratha rolled with smoky shredded chicken and green chutney. | Yes |
| Grilled Cheese Sandwich | Quick Bites | ₹55.00 | Toasted bread loaded with melted cheddar and mozzarella cheese and herb butter. | Yes |
| South Indian Filter Coffee | Beverages | ₹25.00 | Aromatic roasted chicory blend with frothy steamed milk. | Yes |
| Paneer Pakoda (6 pcs) | Snacks | ₹60.00 | Deep-fried cottage cheese cubes coated in spiced gram flour batter. | Yes |
| Fresh Lime Soda | Beverages | ₹30.00 | Refreshing soda with fresh lime juice, mint, and black salt. | Yes |

---

### 3. Dhansiri Food Point
*Location: Near Dhansiri & Subansiri Hostels*

| Item Name | Category | Price | Description | Available |
|-----------|----------|-------|-------------|-----------|
| Standard Veg Thali | Thalis & Meals | ₹90.00 | Steamed Joha rice, yellow dal tadka, seasonal sabzi, aloo bhaja, papad, and pickle. | Yes |
| Special Chicken Thali | Thalis & Meals | ₹150.00 | Assamese-style homestyle chicken curry, steamed rice, mati mahar dal, aloo pitika, and salad. | Yes |
| Egg Curry with Steamed Rice | Thalis & Meals | ₹110.00 | Two boiled and golden fried eggs cooked in rich onion-tomato gravy with steamed rice. | Yes |
| Paneer Butter Masala with 3 Rotis | Main Course | ₹130.00 | Cottage cheese simmered in buttery tomato cashew gravy served with fresh tawa rotis. | Yes |
| Tawa Roti (Set of 4) | Breads | ₹30.00 | Soft whole wheat flatbreads with fresh desi ghee brush. | Yes |
| Gulab Jamun (2 pcs) | Desserts | ₹35.00 | Warm, soft milk dough balls soaked in cardamom saffron syrup. | Yes |

---

### 4. Brahmaputra Fast Food & Momos
*Location: Commercial Complex, Near SBI ATM*

| Item Name | Category | Price | Description | Available |
|-----------|----------|-------|-------------|-----------|
| Steamed Veg Momos (8 pcs) | Momos | ₹60.00 | Delicate dumplings stuffed with minced cabbage, onion, and spices with spicy red dip. | Yes |
| Steamed Chicken Momos (8 pcs) | Momos | ₹90.00 | Juicy seasoned minced chicken dumplings served with clear soup and fiery chilli chutney. | Yes |
| Fried Chicken Momos (8 pcs) | Momos | ₹100.00 | Crispy golden fried chicken momos served with creamy mayonnaise and red garlic sauce. | Yes |
| Chicken Fried Rice | Chinese & Fast Food | ₹110.00 | Aromatic wok-fried rice with tender chicken chunks, egg ribbons, spring onions, and soya. | Yes |
| Veg Hakka Noodles | Chinese & Fast Food | ₹75.00 | Classic wok-tossed long wheat noodles with crunchy bell peppers and cabbage. | Yes |
| Hot & Sour Veg Soup | Soups | ₹50.00 | Spicy and tangy vegetable broth with mushrooms, carrots, tofu, and black pepper. | Yes |

---

### 5. Nilachal Night Canteen
*Location: Near Nilachal & Charaideo Boys Hostels*

| Item Name | Category | Price | Description | Available |
|-----------|----------|-------|-------------|-----------|
| Double Egg Bhurji with 2 Pav | Late Night Bites | ₹60.00 | Spicy scrambled eggs tempered with green chilies, onions, and tomatoes served with butter pav. | Yes |
| Paneer Paratha with Butter | Parathas | ₹70.00 | Stuffed cottage cheese paratha served hot with butter dollop and pickle. | Yes |
| Cheese Maggi with Green Chillies | Quick Bites | ₹55.00 | Cheesy comforting noodles with melted cheese blend and spicy kick. | Yes |
| Chicken Club Sandwich | Quick Bites | ₹65.00 | Double-decker sandwich with chicken mayo, sliced cucumbers, and tomato chutney. | Yes |
| Masala Omelette (2 Eggs) | Late Night Bites | ₹45.00 | Fluffy pan-fried beaten eggs with fresh coriander, onions, and green chilies. | Yes |
| Hot Bournvita / Horlicks | Beverages | ₹30.00 | Warm wholesome malt drink made with steaming fresh milk. | Yes |

---

## 🎓 Student Accounts (10 Users)

| # | Student Name | Email / Login | Password | Phone | Role | Campus Hostel / Room |
|---|--------------|---------------|----------|-------|------|-----------------------|
| 1 | **Rahul Sharma** | `rahul.sharma@tezu.ac.in` | `Password@123` | `9876543210` | `STUDENT` | Patkai Men's Hostel, Room 104 |
| 2 | **Priya Gogoi** | `priya.gogoi@tezu.ac.in` | `Password@123` | `9876543211` | `STUDENT` | Dhansiri Women's Hostel, Room 212 |
| 3 | **Arnab Dutta** | `arnab.dutta@tezu.ac.in` | `Password@123` | `9876543212` | `STUDENT` | Charaideo Men's Hostel, Room 305 |
| 4 | **Sneha Baruah** | `sneha.baruah@tezu.ac.in` | `Password@123` | `9876543213` | `STUDENT` | Subansiri Women's Hostel, Room 118 |
| 5 | **Vikram Nath** | `vikram.nath@tezu.ac.in` | `Password@123` | `9876543214` | `STUDENT` | Nilachal Men's Hostel, Room 202 |
| 6 | **Ankita Roy** | `ankita.roy@tezu.ac.in` | `Password@123` | `9876543215` | `STUDENT` | Kopili Women's Hostel, Room 314 |
| 7 | **Debojit Medhi** | `debojit.medhi@tezu.ac.in` | `Password@123` | `9876543216` | `STUDENT` | Kanchenjunga Men's Hostel, Room 115 |
| 8 | **Pooja Chetry** | `pooja.chetry@tezu.ac.in` | `Password@123` | `9876543217` | `STUDENT` | Pragjyotika Women's Hostel, Room 206 |
| 9 | **Rituraj Hazarika** | `rituraj.hazarika@tezu.ac.in` | `Password@123` | `9876543218` | `STUDENT` | Saraighat Men's Hostel, Room 120 |
| 10 | **Shweta Bora** | `shweta.bora@tezu.ac.in` | `Password@123` | `9876543219` | `STUDENT` | Bordoichila Women's Hostel, Room 108 |

---

## 🚀 Quick Testing Guide (cURL Examples)

### 1. Login as Dhaba Owner
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ramesh.sac@tezukitchen.in",
    "password": "Password@123"
  }'
```

### 2. Login as Student
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rahul.sharma@tezu.ac.in",
    "password": "Password@123"
  }'
```

### 3. List All Restaurants (Public Endpoint)
```bash
curl -X GET "http://localhost:8080/api/v1/restaurants?page=0&size=10"
```

### 4. Fetch Menu Items for Central SAC Canteen
```bash
curl -X GET "http://localhost:8080/api/v1/menu/restaurant/22222222-2222-2222-2222-222222222201"
```
