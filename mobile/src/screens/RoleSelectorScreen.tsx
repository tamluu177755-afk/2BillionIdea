import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';

export const RoleSelectorScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.brand}>An Gia</Text>
        <Text style={styles.tagline}>Chăm sóc cha mẹ – Yên tâm mọi lúc</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="family-restroom" size={80} color={theme.colors.primary} />
        </View>
        <Text style={styles.question}>Chào bạn, bạn là ai?</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('ElderlyHome')}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          <Card variant="warning" style={styles.roleCard}>
            <View style={styles.roleIcon}>
              <MaterialIcons name="elderly" size={40} color={theme.colors.warning} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Tôi là Ông/Bà</Text>
              <Text style={styles.roleDesc}>Giao diện chữ to, dễ dùng cho người cao tuổi</Text>
            </View>
            <MaterialIcons name="chevron-right" size={32} color={theme.colors.text.secondary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('CaregiverDashboard')}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          <Card variant="primary" style={styles.roleCard}>
            <View style={styles.roleIcon}>
              <MaterialIcons name="family-restroom" size={40} color={theme.colors.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Tôi là Con/Cháu</Text>
              <Text style={styles.roleDesc}>Theo dõi sức khỏe cha mẹ từ xa</Text>
            </View>
            <MaterialIcons name="chevron-right" size={32} color={theme.colors.text.secondary} />
          </Card>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© An Gia – Phiên bản v2.0</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', marginTop: theme.spacing.xl },
  brand: { fontSize: 40, fontWeight: '900', color: theme.colors.primary },
  tagline: { fontSize: 16, color: theme.colors.text.secondary, fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.m, width: '100%' },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl,
    ...theme.shadow,
  },
  question: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: theme.spacing.xl },
  touchable: { width: '100%', marginBottom: theme.spacing.m },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, padding: theme.spacing.m },
  roleIcon: { width: 70, height: 70, borderRadius: 16, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 4 },
  roleDesc: { fontSize: 14, color: theme.colors.text.secondary },
  footer: { textAlign: 'center', paddingBottom: theme.spacing.m, fontSize: 12, color: theme.colors.text.secondary, fontWeight: 'bold' },
});
