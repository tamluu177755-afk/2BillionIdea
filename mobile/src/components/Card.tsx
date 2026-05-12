import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../theme/theme';

type CardVariant = 'default' | 'success' | 'warning' | 'primary';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'success': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'primary': return theme.colors.primary;
      default: return theme.colors.border;
    }
  };

  return (
    <View style={[
      styles.card, 
      { borderColor: getBorderColor(), borderWidth: variant !== 'default' ? 2 : 1 },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    ...theme.shadow,
  },
});
