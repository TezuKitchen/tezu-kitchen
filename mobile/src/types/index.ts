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
