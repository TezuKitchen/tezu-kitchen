-- V4__seed_sample_data.sql
-- Password for all seeded users: Password@123
-- BCrypt hash (cost 10): $2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.

-- 1. Seed Dhaba Owners
INSERT INTO users (id, name, email, phone, password_hash, role, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Ramesh Borah', 'ramesh.sac@tezukitchen.in', '9854011001', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'OWNER', now()),
    ('11111111-1111-1111-1111-111111111102', 'Pradeep Kalita', 'pradeep.kbr@tezukitchen.in', '9854011002', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'OWNER', now()),
    ('11111111-1111-1111-1111-111111111103', 'Anita Devi', 'anita.dhansiri@tezukitchen.in', '9854011003', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'OWNER', now()),
    ('11111111-1111-1111-1111-111111111104', 'Biren Das', 'biren.brahma@tezukitchen.in', '9854011004', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'OWNER', now()),
    ('11111111-1111-1111-1111-111111111105', 'Manoj Saikia', 'manoj.nilachal@tezukitchen.in', '9854011005', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'OWNER', now())
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Campus Dhabas (Restaurants)
INSERT INTO restaurants (id, owner_id, name, description, location, is_open, created_at)
VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Central SAC Canteen', 'Popular campus hub serving authentic Assamese snacks, hot parathas, samosas, and special milk tea.', 'Student Activity Centre (SAC), Ground Floor', true, now()),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'KBR Dhaba & Eatery', 'Your go-to spot between lectures for freshly brewed filter coffee, grilled sandwiches, and crispy rolls.', 'Opposite KBR Auditorium, Academic Complex', true, now()),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 'Dhansiri Food Point', 'Comforting homestyle thalis, Assamese dal-bhat, and wholesome North Indian curries for hostelers.', 'Near Dhansiri & Subansiri Hostels', true, now()),
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111104', 'Brahmaputra Fast Food & Momos', 'Finest steamed and fried dumplings, spicy thukpa, and sizzling fried rice on campus.', 'Commercial Complex, Near SBI ATM', true, now()),
    ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111105', 'Nilachal Night Canteen', 'Late-night hunger savior delivering hot parathas, egg poaches, and midnight snacks directly to hostels.', 'Near Nilachal & Charaideo Boys Hostels', true, now())
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Menu Items for each Dhaba
INSERT INTO menu_items (id, restaurant_id, name, description, price, is_available, category)
VALUES
    -- Dhaba 1: Central SAC Canteen
    ('44444444-4444-4444-4444-444444440101', '22222222-2222-2222-2222-222222222201', 'Aloo Paratha with Curd & Pickle', 'Crispy, shallow-fried whole wheat paratha stuffed with spiced mashed potatoes.', 60.00, true, 'Breakfast'),
    ('44444444-4444-4444-4444-444444440102', '22222222-2222-2222-2222-222222222201', 'Hot Samosa (2 pcs) with Chutney', 'Traditional spiced potato samosas served with tangy tamarind and mint chutney.', 25.00, true, 'Snacks'),
    ('44444444-4444-4444-4444-444444440103', '22222222-2222-2222-2222-222222222201', 'Special Assam Milk Tea', 'Brewed with fresh garden CTC tea leaves and fragrant cardamom.', 15.00, true, 'Beverages'),
    ('44444444-4444-4444-4444-444444440104', '22222222-2222-2222-2222-222222222201', 'Veg Maggi with Veggies', 'Classic 2-minute noodles tossed with fresh onion, capsicum, peas, and house spices.', 40.00, true, 'Quick Bites'),
    ('44444444-4444-4444-4444-444444440105', '22222222-2222-2222-2222-222222222201', 'Egg Chowmein', 'Street-style wok-tossed noodles with scrambled eggs, shredded cabbage, and carrots.', 70.00, true, 'Chinese & Fast Food'),
    ('44444444-4444-4444-4444-444444440106', '22222222-2222-2222-2222-222222222201', 'Cold Coffee with Ice Cream', 'Thick blended iced coffee topped with a rich vanilla scoop.', 65.00, true, 'Beverages'),

    -- Dhaba 2: KBR Dhaba & Eatery
    ('44444444-4444-4444-4444-444444440201', '22222222-2222-2222-2222-222222222202', 'Paneer Kathi Roll', 'Soft paratha wrap rolled with marinated grilled paneer cubes and sliced onions.', 75.00, true, 'Rolls & Wraps'),
    ('44444444-4444-4444-4444-444444440202', '22222222-2222-2222-2222-222222222202', 'Chicken Kathi Roll', 'Flaky egg-layered paratha rolled with smoky shredded chicken and green chutney.', 90.00, true, 'Rolls & Wraps'),
    ('44444444-4444-4444-4444-444444440203', '22222222-2222-2222-2222-222222222202', 'Grilled Cheese Sandwich', 'Toasted bread loaded with melted cheddar and mozzarella cheese and herb butter.', 55.00, true, 'Quick Bites'),
    ('44444444-4444-4444-4444-444444440204', '22222222-2222-2222-2222-222222222202', 'South Indian Filter Coffee', 'Aromatic roasted chicory blend with frothy steamed milk.', 25.00, true, 'Beverages'),
    ('44444444-4444-4444-4444-444444440205', '22222222-2222-2222-2222-222222222202', 'Paneer Pakoda (6 pcs)', 'Deep-fried cottage cheese cubes coated in spiced gram flour batter.', 60.00, true, 'Snacks'),
    ('44444444-4444-4444-4444-444444440206', '22222222-2222-2222-2222-222222222202', 'Fresh Lime Soda', 'Refreshing soda with fresh lime juice, mint, and black salt.', 30.00, true, 'Beverages'),

    -- Dhaba 3: Dhansiri Food Point
    ('44444444-4444-4444-4444-444444440301', '22222222-2222-2222-2222-222222222203', 'Standard Veg Thali', 'Steamed Joha rice, yellow dal tadka, seasonal sabzi, aloo bhaja, papad, and pickle.', 90.00, true, 'Thalis & Meals'),
    ('44444444-4444-4444-4444-444444440302', '22222222-2222-2222-2222-222222222203', 'Special Chicken Thali', 'Assamese-style homestyle chicken curry, steamed rice, mati mahar dal, aloo pitika, and salad.', 150.00, true, 'Thalis & Meals'),
    ('44444444-4444-4444-4444-444444440303', '22222222-2222-2222-2222-222222222203', 'Egg Curry with Steamed Rice', 'Two boiled and golden fried eggs cooked in rich onion-tomato gravy with steamed rice.', 110.00, true, 'Thalis & Meals'),
    ('44444444-4444-4444-4444-444444440304', '22222222-2222-2222-2222-222222222203', 'Paneer Butter Masala with 3 Rotis', 'Cottage cheese simmered in buttery tomato cashew gravy served with fresh tawa rotis.', 130.00, true, 'Main Course'),
    ('44444444-4444-4444-4444-444444440305', '22222222-2222-2222-2222-222222222203', 'Tawa Roti (Set of 4)', 'Soft whole wheat flatbreads with fresh desi ghee brush.', 30.00, true, 'Breads'),
    ('44444444-4444-4444-4444-444444440306', '22222222-2222-2222-2222-222222222203', 'Gulab Jamun (2 pcs)', 'Warm, soft milk dough balls soaked in cardamom saffron syrup.', 35.00, true, 'Desserts'),

    -- Dhaba 4: Brahmaputra Fast Food & Momos
    ('44444444-4444-4444-4444-444444440401', '22222222-2222-2222-2222-222222222204', 'Steamed Veg Momos (8 pcs)', 'Delicate dumplings stuffed with minced cabbage, onion, and spices with spicy red dip.', 60.00, true, 'Momos'),
    ('44444444-4444-4444-4444-444444440402', '22222222-2222-2222-2222-222222222204', 'Steamed Chicken Momos (8 pcs)', 'Juicy seasoned minced chicken dumplings served with clear soup and fiery chilli chutney.', 90.00, true, 'Momos'),
    ('44444444-4444-4444-4444-444444440403', '22222222-2222-2222-2222-222222222204', 'Fried Chicken Momos (8 pcs)', 'Crispy golden fried chicken momos served with creamy mayonnaise and red garlic sauce.', 100.00, true, 'Momos'),
    ('44444444-4444-4444-4444-444444440404', '22222222-2222-2222-2222-222222222204', 'Chicken Fried Rice', 'Aromatic wok-fried rice with tender chicken chunks, egg ribbons, spring onions, and soya.', 110.00, true, 'Chinese & Fast Food'),
    ('44444444-4444-4444-4444-444444440405', '22222222-2222-2222-2222-222222222204', 'Veg Hakka Noodles', 'Classic wok-tossed long wheat noodles with crunchy bell peppers and cabbage.', 75.00, true, 'Chinese & Fast Food'),
    ('44444444-4444-4444-4444-444444440406', '22222222-2222-2222-2222-222222222204', 'Hot & Sour Veg Soup', 'Spicy and tangy vegetable broth with mushrooms, carrots, tofu, and black pepper.', 50.00, true, 'Soups'),

    -- Dhaba 5: Nilachal Night Canteen
    ('44444444-4444-4444-4444-444444440501', '22222222-2222-2222-2222-222222222205', 'Double Egg Bhurji with 2 Pav', 'Spicy scrambled eggs tempered with green chilies, onions, and tomatoes served with butter pav.', 60.00, true, 'Late Night Bites'),
    ('44444444-4444-4444-4444-444444440502', '22222222-2222-2222-2222-222222222205', 'Paneer Paratha with Butter', 'Stuffed cottage cheese paratha served hot with butter dollop and pickle.', 70.00, true, 'Parathas'),
    ('44444444-4444-4444-4444-444444440503', '22222222-2222-2222-2222-222222222205', 'Cheese Maggi with Green Chillies', 'Cheesy comforting noodles with melted cheese blend and spicy kick.', 55.00, true, 'Quick Bites'),
    ('44444444-4444-4444-4444-444444440504', '22222222-2222-2222-2222-222222222205', 'Chicken Club Sandwich', 'Double-decker sandwich with chicken mayo, sliced cucumbers, and tomato chutney.', 65.00, true, 'Quick Bites'),
    ('44444444-4444-4444-4444-444444440505', '22222222-2222-2222-2222-222222222205', 'Masala Omelette (2 Eggs)', 'Fluffy pan-fried beaten eggs with fresh coriander, onions, and green chilies.', 45.00, true, 'Late Night Bites'),
    ('44444444-4444-4444-4444-444444440506', '22222222-2222-2222-2222-222222222205', 'Hot Bournvita / Horlicks', 'Warm wholesome malt drink made with steaming fresh milk.', 30.00, true, 'Beverages')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed 10 Student Users
INSERT INTO users (id, name, email, phone, password_hash, role, created_at)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'Rahul Sharma', 'rahul.sharma@tezu.ac.in', '9876543210', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333302', 'Priya Gogoi', 'priya.gogoi@tezu.ac.in', '9876543211', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333303', 'Arnab Dutta', 'arnab.dutta@tezu.ac.in', '9876543212', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333304', 'Sneha Baruah', 'sneha.baruah@tezu.ac.in', '9876543213', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333305', 'Vikram Nath', 'vikram.nath@tezu.ac.in', '9876543214', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333306', 'Ankita Roy', 'ankita.roy@tezu.ac.in', '9876543215', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333307', 'Debojit Medhi', 'debojit.medhi@tezu.ac.in', '9876543216', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333308', 'Pooja Chetry', 'pooja.chetry@tezu.ac.in', '9876543217', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333309', 'Rituraj Hazarika', 'rituraj.hazarika@tezu.ac.in', '9876543218', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now()),
    ('33333333-3333-3333-3333-333333333310', 'Shweta Bora', 'shweta.bora@tezu.ac.in', '9876543219', '$2a$10$eLBDPJXWTTaaJ4nRrASel.m0fHWwwbTyB4kvJ6/U4.hiKpDdif.c.', 'STUDENT', now())
ON CONFLICT (email) DO NOTHING;
