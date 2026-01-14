export const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceLight: '#252525',
  
  primary: '#ef4444',
  primaryDark: '#dc2626',
  primaryLight: '#f87171',
  
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  
  textPrimary: '#ffffff',
  textSecondary: '#a3a3a3',
  textSubtle: '#737373',
  
  border: '#2a2a2a',
  borderLight: '#3a3a3a',
  
  overlayDark: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};
