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

export type UserRole = 'STUDENT' | 'OWNER';

export interface User {
  id?: string | number;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  restaurantId?: number | string;
  avatarUrl?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  primaryImageUrl?: string;
  imageUrl?: string;
}

export interface Restaurant {
  id: string;
  ownerId?: string;
  ownerName?: string;
  name: string;
  description: string;
  location: string;
  isOpen: boolean;
  open?: boolean;
  averageRating?: number;
  reviewCount?: number;
  bannerUrl?: string;
  logoUrl?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  priceAtOrder: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  totalAmount: number;
  deliveryAddress: string;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
}

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
  createdAt: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  transactionRef?: string;
  paidAt?: string;
}

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
}
