import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Vibration, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { triggerSos, confirmMedication } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';

export const ElderlyHome = () => {
  const navigation = useNavigation<any>();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [loadingMed, setLoadingMed] = useState(false);

  // Get state from store
  const {
    elderUser,
    isLoading,
    initSocket,
    loadElderUser,
    setupSocketListeners,
    removeSocketListeners
  } = useAppStore();

  useFocusEffect(
    React.useCallback(() => {
      // Initialize socket and load data when screen comes into focus
      initSocket();
      loadElderUser();
      setupSocketListeners();

      // SOS button pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      return () => {
        removeSocketListeners();
      };
    }, [initSocket, loadElderUser, setupSocketListeners, removeSocketListeners])
  );

  const handleSos = async () => {
    Vibration.vibrate(500);
    navigation.navigate('SosSending', { elderName: elderUser?.name || 'Ông Minh' });
  };

  const handleConfirmMed = async (medId: string) => {
    setLoadingMed(true);
    try {
      await confirmMedication(medId);
      // Reload data to show updated status
      await loadElderUser();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xác nhận uống thuốc');
      console.error('Confirm error', e);
    } finally {
      setLoadingMed(false);
    }
  };

  const profile = elderUser?.elderProfile;
  const meds = profile?.medications || [];
  const nextMed = meds.find((m: any) => m.status === 'PENDING');
  const takenCount = meds.filter((m: any) => m.status === 'TAKEN').length;

  const getHourGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng,';
    if (h < 18) return 'Chào buổi chiều,';
    return 'Chào buổi tối,';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { borderColor: nextMed ? theme.colors.warning : theme.colors.success }]}>
            <MaterialIcons name="person" size={28} color={theme.colors.text.secondary} />
          </View>
          <View>
            <Text style={styles.greeting}>{getHourGreeting()}</Text>
            <Text style={styles.name}>{elderUser?.name || 'Ông Minh'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => loadElderUser()}>
          <Ionicons name="refresh-circle" size={40} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.question}>Hôm nay ông{'\n'}thấy thế nào?</Text>

        {/* SOS Button Center */}
        <View style={styles.sosContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={styles.sosBtn} 
              onPress={handleSos}
              activeOpacity={0.7}
            >
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.sosHint}>Nhấn để gọi cứu trợ khẩn cấp</Text>
        </View>

        {/* Quick Med Widget */}
        {nextMed && (
          <Card variant="warning" style={styles.medCard}>
            <View style={styles.medRow}>
              <MaterialIcons name="access-alarm" size={32} color={theme.colors.warning} />
              <View style={styles.medInfo}>
                <Text style={styles.medLabel}>Sắp đến giờ: {nextMed.time}</Text>
                <Text style={styles.medName}>{nextMed.name}</Text>
              </View>
            </View>
            <Button 
              title={loadingMed ? "Đang xử lý..." : "ĐÃ UỐNG"} 
              variant="success" 
              size="large" 
              onPress={() => handleConfirmMed(nextMed.id)}
              disabled={loadingMed}
              style={styles.medBtn}
            />
          </Card>
        )}

        {/* Progress Summary */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {takenCount > 0 ? `✅ Đã uống ${takenCount}/${meds.length} liều` : '🕒 Chưa uống liều nào hôm nay'}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Simplified Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MedicationReminder')}>
          <MaterialIcons name="medication" size={32} color={theme.colors.primary} />
          <Text style={styles.navText}>Lịch thuốc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ElderlyProfile')}>
          <MaterialIcons name="person" size={32} color={theme.colors.primary} />
          <Text style={styles.navText}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: theme.spacing.m, backgroundColor: theme.colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.neutral,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3,
  },
  greeting: { fontSize: theme.typography.elder.caption, color: theme.colors.text.secondary },
  name: { fontSize: theme.typography.elder.header, fontWeight: 'bold', color: theme.colors.text.primary },
  bellBtn: { padding: 4 },
  scroll: { padding: theme.spacing.m },
  question: {
    fontSize: theme.typography.elder.title, fontWeight: 'bold', 
    color: theme.colors.text.primary, marginBottom: theme.spacing.xl,
  },
  sosContainer: { alignItems: 'center', marginBottom: theme.spacing.xxl },
  sosBtn: {
    width: 220, height: 220, borderRadius: 110, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.colors.primary, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10,
  },
  sosText: { fontSize: 50, fontWeight: '900', color: theme.colors.text.inverse },
  sosHint: { fontSize: theme.typography.elder.caption, color: theme.colors.text.secondary, marginTop: theme.spacing.m, fontWeight: 'bold' },
  medCard: { padding: theme.spacing.l, marginBottom: theme.spacing.l },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginBottom: theme.spacing.m },
  medInfo: { flex: 1 },
  medLabel: { fontSize: theme.typography.elder.caption, color: theme.colors.warning, fontWeight: 'bold' },
  medName: { fontSize: theme.typography.elder.header, fontWeight: 'bold', color: theme.colors.text.primary },
  medBtn: { marginTop: theme.spacing.s },
  progressContainer: { 
    padding: theme.spacing.m, backgroundColor: theme.colors.neutral, 
    borderRadius: theme.borderRadius.m, alignItems: 'center' 
  },
  progressText: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.text.primary },
  bottomNav: {
    flexDirection: 'row', backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.border,
    justifyContent: 'space-around', position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: theme.typography.caregiver.body, fontWeight: 'bold', color: theme.colors.primary, marginTop: 4 },
});
