export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  xxl: '1.5rem',
  xxxl: '2rem',
  hero: '3rem',
} as const;

export const layout = {
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    pill: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(31, 41, 55, 0.05)',
    md: '0 4px 8px rgba(31, 41, 55, 0.08)',
    lg: '0 10px 15px rgba(17, 24, 39, 0.1)',
    brand: '0 4px 10px rgba(255, 87, 34, 0.2)',
  },
  sidebarWidth: '260px',
  sidebarCollapsedWidth: '72px',
  headerHeight: '64px',
  maxContentWidth: '1200px',
} as const;
