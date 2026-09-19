package com.tezukitchen.api.common.seeder;

import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.menu.entity.MenuItem;
import com.tezukitchen.api.menu.repository.MenuItemRepository;
import com.tezukitchen.api.promotion.entity.Promotion;
import com.tezukitchen.api.promotion.repository.PromotionRepository;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final PromotionRepository promotionRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository,
                          RestaurantRepository restaurantRepository,
                          MenuItemRepository menuItemRepository,
                          PromotionRepository promotionRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.promotionRepository = promotionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            String defaultPassword = passwordEncoder.encode("password");

            // Create Owner
            User owner = User.builder()
                    .name("Restaurant Owner")
                    .email("owner@tezukitchen.com")
                    .phone("9876543210")
                    .passwordHash(defaultPassword)
                    .role(UserRole.OWNER)
                    .build();
            owner = userRepository.save(owner);

            // Create Student
            User student = User.builder()
                    .name("Test Student")
                    .email("student@tezukitchen.com")
                    .phone("1234567890")
                    .passwordHash(defaultPassword)
                    .role(UserRole.STUDENT)
                    .build();
            student = userRepository.save(student);

            // Create Restaurant
            Restaurant restaurant = Restaurant.builder()
                    .name("Tezu Kitchen Official")
                    .description("The official kitchen of Tezpur University")
                    .location("Tezpur University Campus")
                    .isOpen(true)
                    .owner(owner)
                    .build();
            restaurant = restaurantRepository.save(restaurant);

            // Create Menu Items
            MenuItem item1 = MenuItem.builder()
                    .restaurant(restaurant)
                    .name("Chicken Biryani")
                    .description("Delicious chicken biryani with raita")
                    .price(new BigDecimal("150.00"))
                    .category("Main Course")
                    .isAvailable(true)
                    .build();

            MenuItem item2 = MenuItem.builder()
                    .restaurant(restaurant)
                    .name("Paneer Butter Masala")
                    .description("Creamy paneer curry")
                    .price(new BigDecimal("120.00"))
                    .category("Main Course")
                    .isAvailable(true)
                    .build();
            
            menuItemRepository.save(item1);
            menuItemRepository.save(item2);

            // Create Promotion
            Promotion promo = Promotion.builder()
                    .code("WELCOME50")
                    .discountPercentage(50.0)
                    .maxDiscountAmount(50.0)
                    .minOrderAmount(100.0)
                    .active(true)
                    .expirationDate(Instant.now().plus(30, ChronoUnit.DAYS))
                    .build();
            promotionRepository.save(promo);

            System.out.println("Database seeding completed.");
        }
    }
}
