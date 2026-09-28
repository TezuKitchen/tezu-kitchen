export interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  bannerUrl?: string;
  logoUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  ownerId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  restaurantId?: string;
  imageUrl?: string;
  images?: MenuItemImage[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface OrderItem {
  id?: string;
  menuItemId: string;
  menuItemName?: string;
  itemName?: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  items: OrderItem[];
  placedAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Review {
  id: string;
  userId: string;
  userName?: string;
  restaurantId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface FavoriteRestaurant {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation?: string;
  createdAt: string;
}

export interface UserProfile {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'STUDENT' | 'OWNER';
  avatarUrl?: string;
  savedAddresses?: string[];
  address?: string;
}

export interface ImageData {
  url: string;
  publicId: string;
}

export interface RestaurantImage {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  imageType: 'LOGO' | 'BANNER' | 'GALLERY';
  displayOrder: number;
}

export interface MenuItemImage {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  displayOrder: number;
}

export interface Promotion {
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  discountAmount?: number;
}

export interface Payment {
  id: string;
  orderId: string;
  method: 'COD' | 'ONLINE';
  status: string;
  amount: number;
}
