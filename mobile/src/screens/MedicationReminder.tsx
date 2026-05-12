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
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const MedicationReminder = () => {
  const navigation = useNavigation<any>();
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const data = await getElderUser();
      setMeds(data?.elderProfile?.medications || []);
    } catch (e) {
      console.error(e);
      setMeds([
        { id: '1', name: 'Thuốc Huyết Áp', time: '08:00', dosage: '1 viên', period: 'MORNING', status: 'TAKEN' },
        { id: '2', name: 'Thuốc Tiểu Đường', time: '12:00', dosage: '1 viên', period: 'NOON', status: 'PENDING' },
        { id: '3', name: 'Thuốc Bổ Não', time: '20:00', dosage: '1 viên', period: 'EVENING', status: 'PENDING' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (med: any) => {
    try {
      await confirmMedication(med.id);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xác nhận uống thuốc.');
    }
  };

  const takenCount = meds.filter(m => m.status === 'TAKEN').length;
  const progress = meds.length > 0 ? (takenCount / meds.length) * 100 : 0;

  const PERIODS = [
    { key: 'MORNING', label: 'BUỔI SÁNG', icon: 'wb-sunny' },
    { key: 'NOON', label: 'BUỔI TRƯA', icon: 'wb-cloudy' },
    { key: 'EVENING', label: 'BUỔI TỐI', icon: 'nights-stay' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={32} color={theme.colors.text.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Lịch thuốc</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Giant Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Đã uống {takenCount}/{meds.length} liều</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {PERIODS.map(period => {
          const items = meds.filter(m => m.period === period.key);
          if (items.length === 0) return null;

          return (
            <View key={period.key} style={styles.periodSection}>
              <View style={styles.periodHeader}>
                <MaterialIcons name={period.icon as any} size={32} color={theme.colors.warning} />
                <Text style={styles.periodTitle}>{period.label}</Text>
              </View>

              {items.map(med => (
                <Card 
                  key={med.id} 
                  variant={med.status === 'TAKEN' ? 'success' : 'warning'} 
                  style={[styles.medCard, med.status === 'TAKEN' && styles.medTaken]}
                >
                  <View style={styles.medRow}>
                    <View style={styles.medIconBg}>
                      <MaterialIcons 
                        name="medication" 
                        size={40} 
                        color={med.status === 'TAKEN' ? theme.colors.success : theme.colors.warning} 
                      />
                    </View>
                    <View style={styles.medInfo}>
                      <Text style={styles.medTime}>{med.time}</Text>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDosage}>{med.dosage}</Text>
                    </View>
                    {med.status === 'TAKEN' && (
                      <MaterialIcons name="check-circle" size={40} color={theme.colors.success} />
                    )}
                  </View>
                  
                  {med.status !== 'TAKEN' && (
                    <Button 
                      title="XÁC NHẬN ĐÃ UỐNG" 
                      variant="success" 
                      size="large"
                      onPress={() => handleConfirm(med)}
                      style={styles.confirmBtn}
                    />
                  )}
                </Card>
              ))}
            </View>
          );
        })}

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
  progressContainer: { 
    backgroundColor: theme.colors.surface, padding: theme.spacing.l, 
    borderRadius: theme.borderRadius.l, marginBottom: theme.spacing.xl,
    ...theme.shadow,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.m },
  progressLabel: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.primary },
  progressPercent: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.success },
  progressBg: { height: 24, backgroundColor: theme.colors.neutral, borderRadius: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 12 },
  periodSection: { marginBottom: theme.spacing.xl },
  periodHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginBottom: theme.spacing.m },
  periodTitle: { fontSize: theme.typography.elder.header, fontWeight: 'bold', color: theme.colors.text.primary },
  medCard: { marginBottom: theme.spacing.m, padding: theme.spacing.m },
  medTaken: { opacity: 0.7 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  medIconBg: { 
    width: 70, height: 70, borderRadius: 12, backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center' 
  },
  medInfo: { flex: 1 },
  medTime: { fontSize: theme.typography.elder.caption, fontWeight: 'bold', color: theme.colors.warning },
  medName: { fontSize: theme.typography.elder.header, fontWeight: 'bold', color: theme.colors.text.primary },
  medDosage: { fontSize: theme.typography.elder.body, color: theme.colors.text.secondary },
  confirmBtn: { marginTop: theme.spacing.m },
});
