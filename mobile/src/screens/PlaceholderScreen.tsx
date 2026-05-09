import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export const PlaceholderScreen = ({ route }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{route.name || 'Sắp ra mắt'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  }
});
