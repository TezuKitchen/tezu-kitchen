package com.tezukitchen.api.restaurant.repository;

import com.tezukitchen.api.restaurant.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {

    List<Restaurant> findByOwnerId(UUID ownerId);

    Page<Restaurant> findAll(Pageable pageable);
}
