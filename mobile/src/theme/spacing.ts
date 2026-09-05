export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 48,
};

export const layout = {
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#1F2937',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#1F2937',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 8,
    },
    // Warm amber-tinted shadow for active elements (from DESIGN.md)
    brand: {
      shadowColor: '#FF5722',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    }
  }
};
