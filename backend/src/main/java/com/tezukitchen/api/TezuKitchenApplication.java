package com.tezukitchen.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TezuKitchenApplication {

    public static void main(String[] args) {
        SpringApplication.run(TezuKitchenApplication.class, args);
    }
}
