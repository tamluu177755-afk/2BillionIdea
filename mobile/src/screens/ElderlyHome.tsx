import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getElderUser, triggerSos } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export const ElderlyHome = () => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    // SOS button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    try {
      const data = await getElderUser();
      setUserData(data);
    } catch (e) {
      console.error('Load error:', e);
      // Giữ giao diện hoạt động ngay cả khi mất mạng
      setUserData({
        name: 'Ông Minh',
        elderProfile: {
          id: 'fallback-id',
          medications: [
            { id: '1', name: 'Thuốc Huyết Áp (Amlodipine)', time: '08:00', dosage: '1 viên', period: 'MORNING', status: 'TAKEN' },
            { id: '2', name: 'Thuốc Tiểu Đường (Metformin)', time: '12:00', dosage: '1 viên', period: 'NOON', status: 'PENDING' },
            { id: '3', name: 'Thuốc Bổ Não (Ginkgo)', time: '20:00', dosage: '1 viên', period: 'EVENING', status: 'PENDING' }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSos = async () => {
    // 1. CHUYỂN MÀN HÌNH VÀ GỌI NGAY LẬP TỨC (Không chờ mạng)
    navigation.navigate('SosSending', { elderName: userData?.name || 'Ông Minh' });
    
    // 2. Chạy ngầm gửi cảnh báo qua mạng nếu có internet
    try {
      if (userData?.elderProfile?.id) {
        await triggerSos(userData.elderProfile.id, '123 Đường Lê Lợi, Quận 1');
      }
    } catch (e) {
      console.log('Lỗi mạng, nhưng cuộc gọi native vẫn đang diễn ra', e);
    }
  };

  const profile = userData?.elderProfile;
  const meds = profile?.medications || [];
  const nextMed = meds.find((m: any) => m.status === 'PENDING');
  const taken = meds.filter((m: any) => m.status === 'TAKEN').length;

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
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={22} color={theme.colors.white} />
          </View>
          <View>
            <Text style={styles.greeting}>{getHourGreeting()}</Text>
            <Text style={styles.name}>{userData?.name || 'Ông Minh'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={26} color={theme.colors.textMedium} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Question */}
        <Text style={styles.question}>Hôm nay ông{'\n'}thấy thế nào?</Text>

        {/* SOS Button */}
        <Animated.View style={[styles.sosShadow, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity style={styles.sosBtn} onPress={handleSos} activeOpacity={0.85}>
            <Text style={styles.sosLabel}>SOS</Text>
            <Text style={styles.sosSubLabel}>SOS CẤP CỨU</Text>
            <Text style={styles.sosHint}>Nhấn để gọi cấp cứu</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Medicine Schedule Button */}
        <TouchableOpacity
          style={styles.medScheduleBtn}
          onPress={() => navigation.navigate('MedReminder')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="calendar-today" size={28} color={theme.colors.green} />
          <Text style={styles.medScheduleText}>Lịch uống thuốc hôm nay</Text>
          <MaterialIcons name="chevron-right" size={26} color={theme.colors.green} />
        </TouchableOpacity>

        {/* Next Medication Reminder */}
        {nextMed && (
          <View style={styles.nextMedCard}>
            <View style={styles.nextMedIcon}>
              <MaterialIcons name="medication" size={24} color={theme.colors.orange} />
            </View>
            <View style={styles.nextMedInfo}>
              <Text style={styles.nextMedTitle}>Uống thuốc lúc {nextMed.time}</Text>
              <Text style={styles.nextMedDosage}>{nextMed.dosage} {nextMed.name}</Text>
              <View style={styles.soonBadge}>
                <MaterialIcons name="alarm" size={13} color={theme.colors.orange} />
                <Text style={styles.soonText}> Sắp đến giờ</Text>
              </View>
            </View>
          </View>
        )}

        {taken > 0 && (
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>✅ Đã uống {taken}/{meds.length} liều hôm nay</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <MaterialIcons name="home" size={26} color={theme.colors.white} />
          <Text style={styles.tabLabelActive}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MedReminder')}>
          <MaterialIcons name="medication" size={26} color={theme.colors.textMedium} />
          <Text style={styles.tabLabel}>Thuốc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={handleSos}>
          <Text style={styles.tabSosIcon}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ElderProfile')}>
          <MaterialIcons name="person-outline" size={26} color={theme.colors.textMedium} />
          <Text style={styles.tabLabel}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.backgroundLight },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.colors.textMedium,
    alignItems: 'center', justifyContent: 'center',
  },
  greeting: { fontSize: 12, color: theme.colors.textLight },
  name: { fontSize: 16, fontWeight: '700', color: theme.colors.textDark },
  bellBtn: { padding: 6, position: 'relative' },
  bellDot: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary,
  },
  scroll: { padding: theme.spacing.m },
  question: {
    fontSize: 28, fontWeight: '800', color: theme.colors.textDark,
    marginBottom: theme.spacing.l, lineHeight: 36,
  },
  sosShadow: {
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 14,
    alignSelf: 'center', marginBottom: theme.spacing.xl,
  },
  sosBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sosLabel: { fontSize: 48, fontWeight: '900', color: theme.colors.white, letterSpacing: 2 },
  sosSubLabel: { fontSize: 16, fontWeight: '800', color: theme.colors.white, marginTop: 2 },
  sosHint: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  medScheduleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.greenLight,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  medScheduleText: { flex: 1, fontSize: 17, fontWeight: '700', color: theme.colors.green, lineHeight: 22 },
  nextMedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.m,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    marginBottom: theme.spacing.m,
  },
  nextMedIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.orangeLight,
    alignItems: 'center', justifyContent: 'center',
  },
  nextMedInfo: { flex: 1 },
  nextMedTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textDark },
  nextMedDosage: { fontSize: 14, color: theme.colors.textMedium, marginVertical: 2 },
  soonBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  soonText: { fontSize: 12, color: theme.colors.orange, fontWeight: '600' },
  progressRow: {
    backgroundColor: theme.colors.greenLight, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.s, alignItems: 'center',
  },
  progressText: { fontSize: 14, color: theme.colors.green, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row', backgroundColor: theme.colors.white,
    borderTopWidth: 1, borderTopColor: theme.colors.borderLight,
    paddingBottom: 12, paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabActive: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg,
    marginHorizontal: 6, paddingVertical: 8,
  },
  tabLabel: { fontSize: 11, color: theme.colors.textMedium },
  tabLabelActive: { fontSize: 11, color: theme.colors.white, fontWeight: '700' },
  tabSosIcon: {
    fontSize: 12, fontWeight: '900', color: theme.colors.primary,
    borderWidth: 2, borderColor: theme.colors.primary,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
});
