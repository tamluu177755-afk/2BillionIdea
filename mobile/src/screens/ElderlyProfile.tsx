import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { getElderUser } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export const ElderlyProfile = () => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const data = await getElderUser();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load elder user profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const profile = userData?.elderProfile || {};
  let conditions: string[] = [];
  try {
    conditions = typeof profile.conditions === 'string' ? JSON.parse(profile.conditions || '[]') : (profile.conditions || []);
  } catch (e) {
    conditions = [];
  }

  const handleCall = () => Linking.openURL('tel:0962664000');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="chevron-left" size={32} color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
        <TouchableOpacity>
          <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={64} color={theme.colors.white} />
          </View>
          <Text style={styles.profileName}>{userData?.name || 'Ông Minh'}</Text>
          <Text style={styles.profileDetail}>{profile.age || '72'} tuổi • {profile.gender || 'Nam'}</Text>
        </View>

        {/* Basic Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Chiều cao</Text>
            <Text style={styles.statValue}>{profile.height || '165'} <Text style={styles.statUnit}>cm</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cân nặng</Text>
            <Text style={styles.statValue}>{profile.weight || '68'} <Text style={styles.statUnit}>kg</Text></Text>
          </View>
        </View>

        {/* Health Conditions */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <MaterialIcons name="medical-services" size={24} color={theme.colors.primary} />
            <Text style={styles.infoCardTitle}>Bệnh nền & Tình trạng</Text>
          </View>
          <View style={styles.conditionList}>
            {conditions.map((item, index) => (
              <View key={index} style={styles.conditionItem}>
                <View style={styles.bullet} />
                <Text style={styles.conditionText}>{item}</Text>
              </View>
            ))}
            {conditions.length === 0 && (
              <Text style={{ color: theme.colors.textLight, fontStyle: 'italic' }}>Chưa có thông tin bệnh lý</Text>
            )}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={[styles.infoCard, { borderLeftWidth: 5, borderLeftColor: theme.colors.primary }]}>
          <View style={styles.infoCardHeader}>
            <MaterialIcons name="contact-phone" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoCardTitle, { color: theme.colors.primary }]}>Liên hệ khẩn cấp</Text>
          </View>
          <View style={styles.contactRow}>
            <View>
              <Text style={styles.contactName}>Nhung - Con gái</Text>
              <Text style={styles.contactPhone}>0962 664 000</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <MaterialIcons name="call" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={() => navigation.navigate('RoleSelector')}
        >
          <MaterialIcons name="logout" size={20} color={theme.colors.textMedium} />
          <Text style={styles.logoutText}>Đăng xuất / Đổi vai trò</Text>
        </TouchableOpacity>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ElderlyHome')}>
          <MaterialIcons name="home" size={26} color={theme.colors.textMedium} />
          <Text style={styles.tabLabel}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MedReminder')}>
          <MaterialIcons name="medication" size={26} color={theme.colors.textMedium} />
          <Text style={styles.tabLabel}>Thuốc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('SosSending', {})}>
          <Text style={styles.tabSosIcon}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <MaterialIcons name="person" size={26} color={theme.colors.white} />
          <Text style={styles.tabLabelActive}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundLight },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.textDark },
  container: { padding: theme.spacing.m },
  profileSection: { alignItems: 'center', marginBottom: theme.spacing.l, marginTop: theme.spacing.m },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: theme.colors.textMedium, alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  profileName: { fontSize: 24, fontWeight: '800', color: theme.colors.textDark, marginBottom: 4 },
  profileDetail: { fontSize: 16, color: theme.colors.textMedium },
  statsRow: { flexDirection: 'row', gap: theme.spacing.m, marginBottom: theme.spacing.l },
  statCard: {
    flex: 1, backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.m, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  statLabel: { fontSize: 13, color: theme.colors.textLight, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: theme.colors.textDark },
  statUnit: { fontSize: 14, color: theme.colors.textLight },
  infoCard: {
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.m, marginBottom: theme.spacing.m,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.m },
  infoCardTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.textDark },
  conditionList: { gap: 8 },
  conditionItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  conditionText: { fontSize: 15, color: theme.colors.textMedium },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contactName: { fontSize: 16, fontWeight: '700', color: theme.colors.textDark },
  contactPhone: { fontSize: 18, fontWeight: '800', color: theme.colors.primary, marginTop: 2 },
  callButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.green, alignItems: 'center', justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: theme.spacing.m, paddingVertical: 12,
  },
  logoutText: { fontSize: 14, color: theme.colors.textMedium, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row', backgroundColor: theme.colors.white,
    borderTopWidth: 1, borderTopColor: theme.colors.borderLight,
    paddingBottom: 12, paddingTop: 8, position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabActive: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, marginHorizontal: 6, paddingVertical: 8 },
  tabLabel: { fontSize: 11, color: theme.colors.textMedium },
  tabLabelActive: { fontSize: 11, color: theme.colors.white, fontWeight: '700' },
  tabSosIcon: { fontSize: 12, fontWeight: '900', color: theme.colors.primary, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
});
