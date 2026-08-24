package com.tezukitchen.api.user.repository;

import com.tezukitchen.api.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * User JPA repository.
 * <p>
 * TODO: Add custom query methods (findByEmail, existsByEmail, etc.)
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // TODO: Add custom query methods
}
