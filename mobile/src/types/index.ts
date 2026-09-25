export interface ImageData {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  displayOrder: number;
}

export interface RestaurantImage extends ImageData {
  imageType: 'LOGO' | 'BANNER' | 'GALLERY';
}

export interface MenuItemImage extends ImageData {
  isPrimary: boolean;
}

export interface FavoriteRestaurant {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantDescription?: string;
  restaurantLocation?: string;
  restaurantIsOpen?: boolean;
  restaurantLogoUrl?: string;
  restaurantBannerUrl?: string;
  createdAt?: string;
}
