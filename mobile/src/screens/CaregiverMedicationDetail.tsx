import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { useAppStore } from '../store/useAppStore';

export const CaregiverMedicationDetail = () => {
  const navigation = useNavigation<any>();
  
  const {
    elderUser,
    isLoading,
    loadElderUser,
    setupSocketListeners,
    removeSocketListeners,
    initSocket
  } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      initSocket();
      loadElderUser();
      setupSocketListeners();

      return () => {
        removeSocketListeners();
      };
    }, [initSocket, loadElderUser, setupSocketListeners, removeSocketListeners])
  );

  const meds = elderUser?.elderProfile?.medications || [];
  const takenCount = meds.filter(m => m.status === 'TAKEN').length;
  const pendingCount = meds.length - takenCount;
  const progress = meds.length > 0 ? (takenCount / meds.length) * 100 : 0;

  const PERIODS = [
    { key: 'MORNING', label: 'BUỔI SÁNG', icon: 'wb-sunny' },
    { key: 'NOON', label: 'BUỔI TRƯA', icon: 'wb-cloudy' },
    { key: 'EVENING', label: 'BUỔI TỐI', icon: 'nights-stay' },
  ];

  if (isLoading && !elderUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết uống thuốc</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tổng quan hôm nay</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{takenCount}</Text>
              <Text style={styles.statLabel}>Đã uống</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Chưa uống</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}% hoàn thành</Text>
          </View>
        </Card>

        {PERIODS.map(period => {
          const items = meds.filter(m => m.period === period.key);
          if (items.length === 0) return null;

          return (
            <View key={period.key} style={styles.periodSection}>
              <View style={styles.periodHeader}>
                <MaterialIcons name={period.icon as any} size={24} color={theme.colors.text.secondary} />
                <Text style={styles.periodTitle}>{period.label}</Text>
              </View>

              {items.map(med => (
                <Card 
                  key={med.id} 
                  style={[
                    styles.medCard, 
                    med.status === 'TAKEN' ? styles.medTaken : styles.medPending
                  ]}
                >
                  <View style={styles.medRow}>
                    <View style={[
                      styles.statusIndicator, 
                      { backgroundColor: med.status === 'TAKEN' ? theme.colors.success : theme.colors.warning }
                    ]} />
                    <View style={styles.medInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetail}>{med.time} • {med.dosage}</Text>
                    </View>
                    <View style={styles.medStatus}>
                      <Text style={[
                        styles.statusText, 
                        { color: med.status === 'TAKEN' ? theme.colors.success : theme.colors.warning }
                      ]}>
                        {med.status === 'TAKEN' ? 'Đã uống' : 'Chưa uống'}
                      </Text>
                      {med.status === 'TAKEN' && (
                        <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          );
        })}

        {meds.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="info-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>Chưa có lịch thuốc cho hôm nay</Text>
          </View>
        )}
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
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary },
  scroll: { padding: theme.spacing.m },
  summaryCard: { padding: theme.spacing.l, marginBottom: theme.spacing.l },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: theme.spacing.l, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: theme.spacing.l },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },
  progressContainer: { marginTop: theme.spacing.s },
  progressBg: { height: 8, backgroundColor: theme.colors.neutral, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: theme.colors.success },
  progressPercent: { fontSize: 12, color: theme.colors.text.secondary, textAlign: 'center' },
  periodSection: { marginBottom: theme.spacing.l },
  periodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.m },
  periodTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text.secondary, letterSpacing: 1 },
  medCard: { marginBottom: theme.spacing.s, padding: theme.spacing.m },
  medTaken: { opacity: 0.9 },
  medPending: { borderLeftWidth: 4, borderLeftColor: theme.colors.warning },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
  medInfo: { flex: 1 },
  medName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary },
  medDetail: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 },
  medStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 16 },
  emptyText: { fontSize: 16, color: theme.colors.text.secondary },
});
