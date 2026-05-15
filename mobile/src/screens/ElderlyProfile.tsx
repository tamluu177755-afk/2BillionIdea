import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { getElderUser } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

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
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
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

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={32} color={theme.colors.text.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hồ sơ sức khỏe</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={60} color={theme.colors.text.secondary} />
          </View>
          <Text style={styles.profileName}>{userData?.name || 'Ông Minh'}</Text>
          <Text style={styles.profileMeta}>{profile.age || '72'} tuổi • {profile.gender || 'Nam'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cao</Text>
              <Text style={styles.statValue}>{profile.height || '165'}cm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Nặng</Text>
              <Text style={styles.statValue}>{profile.weight || '68'}kg</Text>
            </View>
          </View>
        </Card>

        {/* Health Conditions */}
        <Text style={styles.sectionTitle}>Bệnh nền & Tình trạng</Text>
        <Card style={styles.sectionCard}>
          {conditions.map((item, index) => (
            <View key={index} style={styles.conditionItem}>
              <MaterialIcons name="check-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.conditionText}>{item}</Text>
            </View>
          ))}
          {conditions.length === 0 && (
            <Text style={styles.emptyText}>Chưa có thông tin bệnh lý</Text>
          )}
        </Card>

        {/* Emergency Contacts */}
        <Text style={styles.sectionTitle}>Liên hệ khẩn cấp</Text>
        <Card variant="primary" style={styles.sectionCard}>
          <View style={styles.contactItem}>
            <View style={styles.contactRank}>
              <Text style={styles.rankText}>1</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Tuấn - Con trai</Text>
              <Text style={styles.contactPhone}>0385 075 856</Text>
            </View>
            <TouchableOpacity style={styles.callIcon} onPress={() => handleCall('0385 075 856')}>
              <MaterialIcons name="call" size={28} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.contactItem, { marginTop: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.m }]}>
            <View style={[styles.contactRank, { backgroundColor: theme.colors.neutral }]}>
              <Text style={[styles.rankText, { color: theme.colors.text.secondary }]}>2</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Nhung - Con gái</Text>
              <Text style={styles.contactPhone}>0912 345 678</Text>
            </View>
            <TouchableOpacity style={[styles.callIcon, { backgroundColor: theme.colors.neutral }]} onPress={() => handleCall('0912345678')}>
              <MaterialIcons name="call" size={28} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Logout button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate('RoleSelector')}
        >
          <MaterialIcons name="logout" size={22} color={theme.colors.primary} />
          <Text style={styles.logoutText}>Đăng xuất / Chuyển vai trò</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: theme.spacing.m, backgroundColor: theme.colors.surface,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: theme.typography.elder.body, fontWeight: 'bold' },
  title: { fontSize: theme.typography.elder.header, fontWeight: 'bold' },
  scroll: { padding: theme.spacing.m },
  profileCard: { alignItems: 'center', padding: theme.spacing.l, marginBottom: theme.spacing.xl },
  avatar: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.neutral,
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.m
  },
  profileName: { fontSize: theme.typography.elder.title, fontWeight: 'bold', color: theme.colors.text.primary },
  profileMeta: { fontSize: theme.typography.elder.body, color: theme.colors.text.secondary, marginBottom: theme.spacing.l },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xl },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: theme.typography.elder.caption, color: theme.colors.text.secondary },
  statValue: { fontSize: theme.typography.elder.header, fontWeight: 'bold', color: theme.colors.text.primary },
  statDivider: { width: 1, height: 30, backgroundColor: theme.colors.border },
  sectionTitle: { 
    fontSize: theme.typography.elder.header, fontWeight: 'bold', 
    color: theme.colors.text.primary, marginBottom: theme.spacing.m 
  },
  sectionCard: { padding: theme.spacing.m, marginBottom: theme.spacing.xl },
  conditionItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginBottom: theme.spacing.s },
  conditionText: { fontSize: theme.typography.elder.body, color: theme.colors.text.primary },
  emptyText: { fontStyle: 'italic', color: theme.colors.text.secondary },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  contactRank: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  rankText: { color: theme.colors.text.inverse, fontWeight: 'bold' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: theme.typography.elder.body, fontWeight: 'bold' },
  contactPhone: { fontSize: theme.typography.elder.body, color: theme.colors.primary, fontWeight: 'bold' },
  callIcon: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.success,
    alignItems: 'center', justifyContent: 'center'
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: theme.spacing.s,
    paddingVertical: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1.5, borderColor: theme.colors.primary,
    backgroundColor: 'white',
    marginTop: theme.spacing.l,
  },
  logoutText: {
    fontSize: 15, fontWeight: 'bold', color: theme.colors.primary,
  },
});
