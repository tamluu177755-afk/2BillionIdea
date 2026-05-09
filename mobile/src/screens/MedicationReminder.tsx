import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getElderUser, confirmMedication } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  TAKEN:   { label: 'ĐÃ UỐNG',   bg: theme.colors.green,      text: theme.colors.white },
  PENDING: { label: 'UỐNG',       bg: theme.colors.primary,    text: theme.colors.white },
  SOON:    { label: 'SẮP TỚI',   bg: '#FFF3E0',                text: theme.colors.orange },
  XONG:    { label: 'XONG',       bg: '#E0E0E0',                text: theme.colors.textMedium },
};

const PERIOD_LABELS: Record<string, { label: string; icon: string }> = {
  MORNING: { label: 'BUỔI SÁNG', icon: '☀️' },
  NOON:    { label: 'BUỔI TRƯA', icon: '🌤️' },
  EVENING: { label: 'BUỔI TỐI', icon: '🌙' },
};

export const MedicationReminder = () => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const data = await getElderUser();
      setUserData(data);
      const mockMeds = data?.elderProfile?.medications || [];
      setMeds(mockMeds);
    } catch (e) {
      console.error(e);
      // Fallback data when network fails
      setUserData({ name: 'Ông Minh' });
      setMeds([
        { id: '1', name: 'Thuốc Huyết Áp (Amlodipine)', time: '08:00', dosage: '1 viên', period: 'MORNING', status: 'TAKEN', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' },
        { id: '2', name: 'Thuốc Tiểu Đường (Metformin)', time: '12:00', dosage: '1 viên', period: 'NOON', status: 'PENDING', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' },
        { id: '3', name: 'Thuốc Bổ Não (Ginkgo)', time: '20:00', dosage: '1 viên', period: 'EVENING', status: 'PENDING', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (med: any) => {
    if (med.status === 'TAKEN') return;
    
    // Optimistic UI update
    const originalMeds = [...meds];
    setMeds(prev => prev.map(m => m.id === med.id ? { ...m, status: 'TAKEN' } : m));
    setConfirming(med.id);

    try {
      await confirmMedication(med.id);
    } catch (e) {
      // Rollback on error
      setMeds(originalMeds);
      Alert.alert('Lỗi', 'Không thể xác nhận uống thuốc. Vui lòng thử lại.');
    } finally {
      setConfirming(null);
    }
  };

  const takenCount = meds.filter(m => m.status === 'TAKEN').length;
  const progress = meds.length > 0 ? takenCount / meds.length : 0;

  const grouped = [
    { key: 'MORNING', label: 'BUỔI SÁNG', icon: '☀️' },
    { key: 'NOON', label: 'BUỔI TRƯA', icon: '☀️' },
    { key: 'EVENING', label: 'BUỔI TỐI', icon: '🌙' },
  ].map(p => ({
    ...p,
    items: meds.filter(m => m.period === p.key),
  })).filter(g => g.items.length > 0);

  if (loading) return (
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color="#E53935" />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.brand}>An Gia</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerHello}>Chào {userData?.name || 'Ông Minh'}</Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1544144433-d50aff500b91?w=200' }} 
            style={styles.avatarImg} 
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Thuốc cần uống{'\n'}hôm nay</Text>

        {/* ── PROGRESS CARD ─────────────────────────────────────────────────── */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Tiến độ hôm nay: {takenCount}/{meds.length} liều</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
        </View>

        {/* ── PERIOD GROUPS ─────────────────────────────────────────────────── */}
        {grouped.map((group) => (
          <View key={group.key} style={styles.periodSection}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodIcon}>{group.icon}</Text>
              <Text style={styles.periodTitle}>{group.label}</Text>
            </View>

            {group.items.map((med) => {
              const isTaken = med.status === 'TAKEN';
              const isSoon = !isTaken && med.time && (parseInt(med.time.split(':')[0]) - new Date().getHours() <= 1);

              return (
                <View key={med.id} style={styles.medCard}>
                  {/* Left accent border */}
                  <View style={[styles.cardAccent, { backgroundColor: isTaken ? '#2E7D32' : '#C62828' }]} />
                  
                  <View style={styles.cardContent}>
                    {/* Medication Image */}
                    <View style={styles.medIconWrap}>
                      <Image 
                        source={{ uri: med.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' }} 
                        style={styles.medImg} 
                      />
                    </View>

                    {/* Info */}
                    <View style={styles.medInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medTime}>{med.dosage ? `${med.dosage} • ` : ''}{med.time || '08:00'}</Text>
                      
                      {/* Status Badge */}
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: isTaken ? '#A5D6A7' : (isSoon ? '#FFEBEE' : '#F5F5F5') }
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          { color: isTaken ? '#2E7D32' : (isSoon ? '#D32F2F' : '#757575') }
                        ]}>
                          {isTaken ? 'ĐÃ UỐNG' : (isSoon ? 'SẮP TỚI' : 'CHƯA UỐNG')}
                        </Text>
                      </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleConfirm(med)}
                      disabled={isTaken || confirming === med.id}
                      style={[
                        styles.actionBtn, 
                        { backgroundColor: isTaken ? '#F5F5F5' : '#E66B24' },
                        !isTaken && styles.actionBtnShadow
                      ]}
                    >
                      {confirming === med.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={[
                          styles.actionBtnText, 
                          { color: isTaken ? '#9E9E9E' : '#FFF' }
                        ]}>
                          {isTaken ? 'XONG' : 'UỐNG'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FLOATING SOS ───────────────────────────────────────────────────── */}
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={() => navigation.navigate('SosSending')}
      >
        <View style={styles.sosInner}>
          <Ionicons name="location" size={24} color="#FFF" />
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </TouchableOpacity>

      {/* ── BOTTOM TAB BAR (Synchronized) ─────────────────────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ElderlyHome')}>
          <MaterialIcons name="home" size={26} color="#616161" />
          <Text style={styles.tabLabel}>Trang chủ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <MaterialIcons name="medication" size={26} color="#FFFFFF" />
          <Text style={styles.tabLabelActive}>Thuốc</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('SosSending')}>
          <Text style={styles.tabSosIcon}>SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ElderProfile')}>
          <MaterialIcons name="person-outline" size={26} color="#616161" />
          <Text style={styles.tabLabel}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FCFCFC' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  brand: { fontSize: 24, fontWeight: '900', color: '#B71C1C' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerHello: { fontSize: 16, color: '#424242', marginRight: 10, fontWeight: '600' },
  avatarImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },

  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#212121', marginBottom: 20, lineHeight: 40 },

  progressCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 25,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  progressLabel: { fontSize: 18, fontWeight: '900', color: '#B71C1C', marginBottom: 12 },
  progressBg: { height: 20, backgroundColor: '#EEEEEE', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#B71C1C', borderRadius: 10 },

  periodSection: { marginBottom: 25 },
  periodHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  periodIcon: { fontSize: 20, marginRight: 8 },
  periodTitle: { fontSize: 14, fontWeight: '700', color: '#5D4037', letterSpacing: 1.5 },

  medCard: {
    backgroundColor: '#FFF', borderRadius: 30, marginBottom: 15, flexDirection: 'row',
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#F5F5F5'
  },
  cardAccent: { width: 10 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15 },
  medIconWrap: { width: 80, height: 80, backgroundColor: '#F9F9F9', borderRadius: 20, overflow: 'hidden', marginRight: 15 },
  medImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  medInfo: { flex: 1 },
  medName: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 2 },
  medTime: { fontSize: 15, color: '#616161', marginBottom: 6, fontWeight: '600' },
  
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },

  actionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, minWidth: 80, alignItems: 'center' },
  actionBtnShadow: { shadowColor: '#E66B24', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  actionBtnText: { fontSize: 16, fontWeight: '900' },

  sosButton: {
    position: 'absolute', right: 20, bottom: 100, width: 70, height: 70,
    borderRadius: 35, backgroundColor: '#B71C1C', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#B71C1C', shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
    borderWidth: 3, borderColor: '#FFF'
  },
  sosInner: { alignItems: 'center' },
  sosText: { color: '#FFF', fontSize: 12, fontWeight: '900', marginTop: -2 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingBottom: 12, paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabActive: {
    backgroundColor: '#B71C1C', borderRadius: 16,
    marginHorizontal: 6, paddingVertical: 8,
  },
  tabLabel: { fontSize: 11, color: '#616161' },
  tabLabelActive: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  tabSosIcon: {
    fontSize: 12, fontWeight: '900', color: '#B71C1C',
    borderWidth: 2, borderColor: '#B71C1C',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
});
