import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';

export const CaregiverProfile = () => {
  const navigation = useNavigation<any>();
  const { elderUser } = useAppStore();

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);

  const elders = [
    {
      name: 'Ông Minh',
      relation: 'Cha',
      age: 72,
      phone: '0385075856',
      status: 'Bình thường',
      statusOk: true,
    },
    {
      name: 'Bà Lan',
      relation: 'Mẹ',
      age: 68,
      phone: '0912345678',
      status: 'Cần theo dõi',
      statusOk: false,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={theme.colors.text.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hồ sơ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Caregiver Avatar Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={56} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.caregiverBadge}>
              <MaterialIcons name="favorite" size={16} color="white" />
            </View>
          </View>
          <Text style={styles.profileName}>Người chăm sóc</Text>
          <View style={styles.roleTag}>
            <MaterialIcons name="shield" size={14} color={theme.colors.primary} />
            <Text style={styles.roleTagText}>Vai trò: Con cháu / Người giám hộ</Text>
          </View>
        </Card>

        {/* Elders being monitored */}
        <Text style={styles.sectionTitle}>Người thân đang chăm sóc</Text>

        {elders.map((elder, idx) => (
          <Card key={idx} style={styles.elderCard}>
            <View style={styles.elderRow}>
              <View style={styles.elderAvatar}>
                <MaterialIcons name="elderly" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.elderInfo}>
                <Text style={styles.elderName}>{elder.name}</Text>
                <Text style={styles.elderMeta}>{elder.relation} • {elder.age} tuổi</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: elder.statusOk ? '#E8F5E9' : '#FFF3E0' }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: elder.statusOk ? theme.colors.success : theme.colors.warning }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: elder.statusOk ? theme.colors.success : theme.colors.warning }
                  ]}>
                    {elder.status}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleCall(elder.phone)}
              >
                <MaterialIcons name="call" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Settings section */}
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
            <MaterialIcons name="notifications" size={24} color={theme.colors.primary} />
            <Text style={styles.settingLabel}>Thông báo cảnh báo</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
            <MaterialIcons name="volume-up" size={24} color={theme.colors.primary} />
            <Text style={styles.settingLabel}>Âm thanh SOS</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
            <MaterialIcons name="info-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.settingLabel}>Về ứng dụng An Gia</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </Card>

        {/* Logout button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate('RoleSelector')}
        >
          <MaterialIcons name="logout" size={22} color={theme.colors.primary} />
          <Text style={styles.logoutText}>Đăng xuất / Chuyển vai trò</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: theme.spacing.m, backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary },
  title: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary },
  scroll: { padding: theme.spacing.m },

  // Profile card
  profileCard: {
    alignItems: 'center', padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  avatarWrapper: { position: 'relative', marginBottom: theme.spacing.m },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: theme.colors.neutral,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.colors.primary,
  },
  caregiverBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  profileName: {
    fontSize: 22, fontWeight: 'bold',
    color: theme.colors.text.primary, marginBottom: theme.spacing.s,
  },
  roleTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  roleTagText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },

  // Elders
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  elderCard: { padding: theme.spacing.m, marginBottom: theme.spacing.m },
  elderRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  elderAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  elderInfo: { flex: 1 },
  elderName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary },
  elderMeta: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 6 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  callBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: theme.colors.success,
    alignItems: 'center', justifyContent: 'center',
  },

  // Settings
  settingsCard: { padding: 0, marginBottom: theme.spacing.xl, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m,
    padding: theme.spacing.m,
  },
  settingLabel: { flex: 1, fontSize: 15, color: theme.colors.text.primary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginHorizontal: theme.spacing.m },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: theme.spacing.s,
    paddingVertical: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1.5, borderColor: theme.colors.primary,
    backgroundColor: 'white',
    marginBottom: theme.spacing.m,
  },
  logoutText: {
    fontSize: 15, fontWeight: 'bold', color: theme.colors.primary,
  },
});
