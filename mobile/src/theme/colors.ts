export const lightColors = {
  // Brand
  primary: '#FF5722',
  primaryHover: '#E64A19',
  secondary: '#10B981',
  secondaryDark: '#059669',
  tertiary: '#F59E0B',
  
  // Surfaces & Canvas
  background: '#FAFAF8',
  surface: '#FFFFFF',
  
  // Text & Neutrals
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  
  // Functional / Semantic
  success: '#10B981',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Status Colors (from user specification: placed=grey, middle=orange, outForDelivery & delivered=green)
  status: {
    placed: '#6B7280',         // Grey / neutral
    accepted: '#F97316',       // Orange (middle kitchen step)
    preparing: '#F97316',      // Orange (middle kitchen step)
    ready: '#10B981',          // Green
    out_for_delivery: '#10B981', // Green
    outForDelivery: '#10B981', // Green
    delivered: '#10B981',      // Green
    cancelled: '#DC2626',      // Red
    rejected: '#DC2626',       // Red
  }
};

export const darkColors = {
  // Brand
  primary: '#FF6E40',
  primaryHover: '#FF5722',
  secondary: '#10B981',
  secondaryDark: '#059669',
  tertiary: '#FBBF24',
  
  // Surfaces & Canvas
  background: '#121214',
  surface: '#1E1E24',
  
  // Text & Neutrals
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  textLight: '#6B7280',
  border: '#2E2E38',
  borderSubtle: '#272730',
  
  // Functional / Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#60A5FA',

  // Status Colors
  status: {
    placed: '#9CA3AF',         // Grey / neutral
    accepted: '#FB923C',       // Orange
    preparing: '#FB923C',      // Orange
    ready: '#34D399',          // Green
    out_for_delivery: '#34D399', // Green
    outForDelivery: '#34D399', // Green
    delivered: '#34D399',      // Green
    cancelled: '#EF4444',      // Red
    rejected: '#EF4444',       // Red
  }
};

export const colors = lightColors;

export type ThemeColors = typeof lightColors;
