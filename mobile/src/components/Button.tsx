import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'emergency' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon, 
  style, 
  textStyle,
  disabled = false
}) => {
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'emergency': return theme.colors.sosRed;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline': return theme.colors.primary;
      case 'ghost': return theme.colors.textDark;
      default: return theme.colors.white;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return theme.colors.primary;
    return 'transparent';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          opacity: disabled ? 0.5 : 1
        },
        style
      ]} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && (
        <MaterialIcons 
          name={icon} 
          size={variant === 'emergency' ? 48 : 24} 
          color={getTextColor()} 
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text, 
        { color: getTextColor() },
        variant === 'emergency' && styles.emergencyText,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.s,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyText: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});
