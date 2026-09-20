package com.tezukitchen.api.menu.repository;

import com.tezukitchen.api.menu.entity.MenuItemImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MenuItemImageRepository extends JpaRepository<MenuItemImage, UUID> {
    List<MenuItemImage> findByMenuItemIdOrderByDisplayOrderAsc(UUID menuItemId);
    Optional<MenuItemImage> findByMenuItemIdAndIsPrimaryTrue(UUID menuItemId);
    long countByMenuItemId(UUID menuItemId);
}
