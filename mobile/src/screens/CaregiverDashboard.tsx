import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, Animated, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { useAppStore } from '../store/useAppStore';

const CAMERAS = [
  { label: 'Phòng khách', status: 'Bình thường', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600' },
  { label: 'Phòng ngủ', status: 'Phát hiện di chuyển', image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600' },
];

export const CaregiverDashboard = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Bố');
  const [statusText, setStatusText] = useState('Đang hoạt động bình thường');
  const [sosAlertData, setSosAlertData] = useState<any>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const {
    elderUser,
    isLoading,
    initSocket,
    loadElderUser,
    setupSocketListeners,
    removeSocketListeners,
    activeSos
  } = useAppStore();

  useEffect(() => {
    if (sosAlertData) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 500, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0, duration: 500, easing: Easing.linear, useNativeDriver: false }),
        ])
      ).start();
    } else {
      flashAnim.setValue(0);
    }
  }, [sosAlertData]);

  useFocusEffect(
    useCallback(() => {
      // Initialize socket and listeners
      initSocket();
      loadElderUser();
      
      // Set up real-time listeners
      const socket = useAppStore.getState().socket;
      if (socket) {
        // Listen for medication taken
        socket.off('medication_taken');
        socket.on('medication_taken', (data: any) => {
          setStatusText(`Vừa uống thuốc ${data.name} xong`);
          loadElderUser();
        });

        // Listen for SOS alert
        socket.off('sos_alert');
        socket.on('sos_alert', (data: any) => {
          const elderName = activeTab === 'Bố' ? 'Ông Minh' : 'Bà Lan';
          setSosAlertData({ ...data, elderName });
        });

        // Listen for SOS resolution to clear alert
        socket.off('sos_resolved');
        socket.on('sos_resolved', () => {
          setSosAlertData(null);
        });

        socket.off('sos_cancelled');
        socket.on('sos_cancelled', () => {
          setSosAlertData(null);
        });
      }

      return () => {
        removeSocketListeners();
      };
    }, [activeTab, initSocket, loadElderUser, setupSocketListeners, removeSocketListeners, navigation])
  );

  const meds = elderUser?.elderProfile?.medications || [];
  const takenCount = meds.filter((m: any) => m.status === 'TAKEN').length;
  const progress = meds.length > 0 ? (takenCount / meds.length) : 0;

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 0, 0, 0.9)']
  });

  if (isLoading) {
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
      {sosAlertData && (
        <Animated.View style={[styles.sosOverlay, { backgroundColor }]}>
          <MaterialIcons name="report-problem" size={100} color="white" />
          <Text style={styles.sosOverlayTitle}>CẢNH BÁO NGUY CẤP!</Text>
          <Text style={styles.sosOverlayName}>{sosAlertData.elderName} ĐANG CẦN TRỢ GIÚP</Text>
          <TouchableOpacity 
            style={styles.sosOverlayBtn}
            onPress={() => {
              navigation.navigate('SosAlert', { 
                sosId: sosAlertData.sosId, 
                elderName: sosAlertData.elderName, 
                locationAddr: sosAlertData.locationAddr, 
                createdAt: sosAlertData.createdAt 
              });
              setSosAlertData(null);
            }}
          >
            <Text style={styles.sosOverlayBtnText}>XEM VỊ TRÍ & HỖ TRỢ NGAY</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>An Gia</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CON CÁI</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Role Switcher */}
      <View style={styles.tabContainer}>
        {['Bố (Ông Minh)', 'Mẹ (Bà Lan)'].map((name) => {
          const key = name.split(' ')[0];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Real-time Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.dot} />
            <Text style={styles.statusLabel}>TRẠNG THÁI AI THỜI GIAN THỰC</Text>
          </View>
          <Text style={styles.statusBig}>{statusText}</Text>
          <Text style={styles.statusTime}>Cập nhật vừa xong</Text>
        </Card>

        {/* Med Progress Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Theo dõi thuốc</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CaregiverMedicationDetail')}>
            <Text style={styles.sectionLink}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.medCard}>
          <View style={styles.medProgressRow}>
            <View style={styles.medInfo}>
              <Text style={styles.medCountText}>{activeTab} đã uống</Text>
              <Text style={styles.medCountBig}>{takenCount}/{meds.length}</Text>
              <Text style={styles.medSubText}>liều thuốc hôm nay</Text>
            </View>
            <View style={styles.circularProgress}>
               {/* Simple stylized progress */}
               <View style={styles.progressRing}>
                  <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
               </View>
            </View>
          </View>
        </Card>

        {/* Camera Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Camera giám sát</Text>
          <View style={styles.liveBadge}>
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {CAMERAS.map((cam, idx) => (
          <View key={idx} style={styles.cameraWrapper}>
            <Image source={{ uri: cam.image }} style={styles.cameraImg} />
            <View style={styles.cameraOverlay}>
              <View style={styles.aiTag}>
                <MaterialIcons name="auto-awesome" size={14} color={theme.colors.success} />
                <Text style={styles.aiTagText}>AI: {cam.status}</Text>
              </View>
              <Text style={styles.cameraLabel}>{cam.label}</Text>
            </View>
            <TouchableOpacity style={styles.expandBtn}>
              <MaterialIcons name="fullscreen" size={24} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          </View>
        ))}

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
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  brand: { fontSize: 20, fontWeight: '900', color: theme.colors.primary },
  badge: { backgroundColor: theme.colors.neutral, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.text.secondary },
  bellBtn: { padding: 4 },
  tabContainer: { 
    flexDirection: 'row', padding: theme.spacing.m, gap: theme.spacing.m, 
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border 
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.neutral },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text.secondary },
  tabTextActive: { color: theme.colors.text.inverse },
  scroll: { padding: theme.spacing.m },
  statusCard: { marginBottom: theme.spacing.l, padding: theme.spacing.l },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success },
  statusLabel: { fontSize: 10, fontWeight: 'bold', color: theme.colors.text.secondary, letterSpacing: 1 },
  statusBig: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 4 },
  statusTime: { fontSize: 12, color: theme.colors.text.secondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary },
  sectionLink: { fontSize: 14, color: theme.colors.primary, fontWeight: 'bold' },
  medCard: { padding: theme.spacing.l, marginBottom: theme.spacing.l },
  medProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  medInfo: { flex: 1 },
  medCountText: { fontSize: 14, color: theme.colors.text.secondary },
  medCountBig: { fontSize: 32, fontWeight: 'bold', color: theme.colors.text.primary },
  medSubText: { fontSize: 14, color: theme.colors.text.secondary },
  circularProgress: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, borderColor: theme.colors.neutral, alignItems: 'center', justifyContent: 'center' },
  progressRing: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  progressPercent: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEBEB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.primary },
  cameraWrapper: { height: 200, borderRadius: theme.borderRadius.l, overflow: 'hidden', marginBottom: theme.spacing.m, position: 'relative' },
  cameraImg: { width: '100%', height: '100%' },
  cameraOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.m, backgroundColor: 'rgba(0,0,0,0.3)' },
  aiTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  aiTagText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.success },
  cameraLabel: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.inverse },
  expandBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 8 },
  sosOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  sosOverlayTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginTop: theme.spacing.l,
    textAlign: 'center',
  },
  sosOverlayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: theme.spacing.m,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sosOverlayBtn: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.l,
    marginTop: theme.spacing.xxl,
    ...theme.shadow,
  },
  sosOverlayBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
  },
});
