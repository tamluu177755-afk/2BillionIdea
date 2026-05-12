export const theme = {
  colors: {
    primary: '#E32D2D', // Red for SOS & Branding
    success: '#27AE60', // Green for Safe/Taken
    warning: '#F2994A', // Orange for Pending/Attention
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      inverse: '#FFFFFF',
    },
    neutral: '#E0E0E0',
    border: '#EEEEEE',
  },
  typography: {
    fontFamily: 'System', // Fallback to System as fonts are not loaded yet
    fontFamilyBold: 'System',
    elder: {
      title: 28,
      header: 24,
      body: 22,
      caption: 18,
    },
    caregiver: {
      title: 20,
      header: 18,
      body: 16,
      caption: 14,
    }
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    round: 999,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  }
};
