import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';

export const RoleSelectorScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.brand}>An Gia</Text>
      <Text style={styles.tagline}>Chăm sóc cha mẹ – Yên tâm mọi lúc</Text>
      <View style={styles.iconCircle}>
        <MaterialIcons name="family-restroom" size={80} color={theme.colors.primary} />
      </View>
      <Text style={styles.question}>Bạn là ai?</Text>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => navigation.navigate('ElderlyHome')}
        activeOpacity={0.85}
      >
        <View style={[styles.roleIcon, { backgroundColor: '#FFF3E0' }]}>
          <MaterialIcons name="elderly" size={36} color={theme.colors.orange} />
        </View>
        <View style={styles.roleInfo}>
          <Text style={styles.roleTitle}>Tôi là Ông/Bà</Text>
          <Text style={styles.roleDesc}>Người cao tuổi cần theo dõi sức khỏe</Text>
        </View>
        <MaterialIcons name="chevron-right" size={28} color={theme.colors.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => navigation.navigate('CaregiverDashboard')}
        activeOpacity={0.85}
      >
        <View style={[styles.roleIcon, { backgroundColor: '#E3F2FD' }]}>
          <MaterialIcons name="family-restroom" size={36} color="#1565C0" />
        </View>
        <View style={styles.roleInfo}>
          <Text style={styles.roleTitle}>Tôi là Con/Cháu</Text>
          <Text style={styles.roleDesc}>Người chăm sóc, muốn theo dõi sức khỏe cha mẹ</Text>
        </View>
        <MaterialIcons name="chevron-right" size={28} color={theme.colors.textLight} />
      </TouchableOpacity>

      <Text style={styles.footer}>© An Gia – Phiên bản thử nghiệm</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: '#FAFAFA',
    alignItems: 'center', paddingHorizontal: theme.spacing.m,
  },
  brand: {
    fontSize: 32, fontWeight: '900', color: theme.colors.primary,
    marginTop: theme.spacing.xl,
  },
  tagline: { fontSize: 14, color: theme.colors.textMedium, marginBottom: theme.spacing.l },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#FFF0EC', alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.l,
    shadowColor: theme.colors.primary, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  question: { fontSize: 22, fontWeight: '800', color: theme.colors.textDark, marginBottom: theme.spacing.l },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.m, width: '100%', marginBottom: theme.spacing.m,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  roleIcon: {
    width: 60, height: 60, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.textDark, marginBottom: 3 },
  roleDesc: { fontSize: 12, color: theme.colors.textMedium, lineHeight: 17 },
  footer: { position: 'absolute', bottom: 16, fontSize: 11, color: theme.colors.textLight },
});
