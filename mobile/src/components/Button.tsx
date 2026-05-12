import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'emergency' | 'outline' | 'ghost';
type ButtonSize = 'standard' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'standard',
  icon, 
  style, 
  textStyle,
  disabled = false
}) => {
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'success': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'emergency': return theme.colors.primary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline': return theme.colors.primary;
      case 'ghost': return theme.colors.text.primary;
      default: return theme.colors.text.inverse;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return theme.colors.primary;
    return 'transparent';
  };

  const isLarge = size === 'large';

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          opacity: disabled ? 0.5 : 1,
          height: isLarge ? 64 : 48,
          borderRadius: isLarge ? theme.borderRadius.l : theme.borderRadius.m,
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
          size={isLarge ? 32 : 24} 
          color={getTextColor()} 
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text, 
        { 
          color: getTextColor(),
          fontSize: isLarge ? theme.typography.elder.body : theme.typography.caregiver.body,
        },
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
    paddingHorizontal: theme.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.s,
  },
  text: {
    fontWeight: 'bold',
  },
  emergencyText: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});
