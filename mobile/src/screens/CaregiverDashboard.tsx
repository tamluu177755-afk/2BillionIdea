import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, Animated, Easing, Platform, Alert
} from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { useAppStore } from '../store/useAppStore';
import { webAudioManager } from '../services/audioManager';

const CAMERAS = [
  { label: 'Phòng khách', status: 'Bình thường', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600' },
  { label: 'Phòng ngủ', status: 'Phát hiện di chuyển', image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600' },
];

export const CaregiverDashboard = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Bố');
  const [statusText, setStatusText] = useState('Đang hoạt động bình thường');
  const [sosAlertData, setSosAlertData] = useState<any>(null);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const frameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const isWeb = Platform.OS === 'web';
  // Track if user has interacted with page (for iOS audio unlock)
  const audioUnlockedRef = useRef(false);

  const {
    elderUser,
    isLoading,
    initSocket,
    loadElderUser,
    setupSocketListeners,
    removeSocketListeners,
    activeSos
  } = useAppStore();

  // Hàm unlock audio iOS - gọi trong mọi user gesture
  const unlockAudioIfNeeded = useCallback(async () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    if (isWeb) {
      await webAudioManager.unlock();
    } else {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {}
    }
  }, [isWeb]);

  useEffect(() => {
    const playAlarm = async () => {
      if (isWeb) {
        // Web (iOS Safari): dùng Web Audio API
        await webAudioManager.playSosAlarm();
      } else {
        // Native iOS/Android: dùng expo-av
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3' },
            { isLooping: true, volume: 1.0 }
          );
          soundRef.current = sound;
          await sound.playAsync();
        } catch (e) {
          console.log('Error playing alarm', e);
        }
      }
    };

    const stopAlarm = async () => {
      if (isWeb) {
        webAudioManager.stopSosAlarm();
      } else {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }
    };

    if (sosAlertData) {
      playAlarm();
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 500, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0, duration: 500, easing: Easing.linear, useNativeDriver: false }),
        ])
      ).start();
    } else {
      stopAlarm();
      flashAnim.setValue(0);
    }

    return () => {
      stopAlarm();
    };
  }, [sosAlertData, isWeb]);

  const handleStopAlarmAndNavigate = async (screen: string, params?: any) => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {}
    }
    setSosAlertData(null);
    navigation.navigate(screen, params);
  };

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

        socket.off('video_frame');
        socket.on('video_frame', (data: any) => {
          if (data && data.frame) {
            setLiveFrame(data.frame);
            if (frameTimeoutRef.current) {
              clearTimeout(frameTimeoutRef.current);
            }
            frameTimeoutRef.current = setTimeout(() => {
              setLiveFrame(null);
            }, 3000);
          }
        });
      }

      return () => {
        removeSocketListeners();
        if (frameTimeoutRef.current) {
          clearTimeout(frameTimeoutRef.current);
        }
      };
    }, [activeTab, initSocket, loadElderUser, setupSocketListeners, removeSocketListeners, navigation])
  );

  // Unlock audio trên iOS web khi trang load xong - yêu cầu user interaction
  // Dùng một invisible overlay để capture interaction đầu tiên
  const handleFirstInteraction = useCallback(() => {
    unlockAudioIfNeeded();
  }, [unlockAudioIfNeeded]);

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
    <SafeAreaView
      style={styles.safe}
      // Capture touch để unlock iOS audio ngay lần đầu user chạm vào màn hình
      onTouchStart={handleFirstInteraction}
    >
      {sosAlertData && (
        <Animated.View style={[styles.sosOverlay, { backgroundColor }]}>
          <MaterialIcons name="report-problem" size={100} color="white" />
          <Text style={styles.sosOverlayTitle}>CẢNH BÁO NGUY CẤP!</Text>
          <Text style={styles.sosOverlayName}>{sosAlertData.elderName} CẦN GIÚP ĐỠ!</Text>
          <Text style={styles.sosOverlaySub}>{sosAlertData.elderName} CẦN GIÚP ĐỠ! {sosAlertData.elderName} CẦN GIÚP ĐỠ!</Text>
          
          <TouchableOpacity 
            style={styles.sosOverlayBtn}
            onPress={() => {
              handleStopAlarmAndNavigate('SosAlert', { 
                sosId: sosAlertData.sosId, 
                elderName: sosAlertData.elderName, 
                locationAddr: sosAlertData.locationAddr, 
                createdAt: sosAlertData.createdAt 
              });
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
          {/* Nút KÍCH HOẠT: cực kỳ quan trọng cho iOS Safari - phải tap 1 lần để unlock audio */}
          <TouchableOpacity 
            style={[
              styles.badge,
              { backgroundColor: audioUnlockedRef.current ? theme.colors.success : theme.colors.primary }
            ]}
            onPress={async () => {
              await unlockAudioIfNeeded();
              if (isWeb) {
                // Preload âm thanh ngay sau khi unlock
                await webAudioManager.unlock();
                Alert.alert(
                  '🔊 Âm thanh đã sẵn sàng',
                  'Hệ thống cảnh báo SOS đã được kích hoạt. Bạn sẽ nghe thấy tiếng còi khi có SOS.'
                );
              } else {
                Alert.alert('✅ Thông báo', 'Hệ thống âm thanh khẩn cấp đã sẵn sàng.');
              }
            }}
          >
            <Text style={[styles.badgeText, { color: 'white' }]}>🔔 KÍCH HOẠT ÂM THANH</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => loadElderUser()}>
          <Ionicons name="refresh-circle" size={32} color={theme.colors.primary} />
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
               <View style={[styles.progressRing, { borderColor: theme.colors.success, borderWidth: 8 }]}>
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

        {CAMERAS.map((cam, idx) => {
          const isLiveCam = idx === 0 && liveFrame;
          const imageUri = isLiveCam ? `data:image/jpeg;base64,${liveFrame}` : cam.image;
          
          return (
            <View key={idx} style={styles.cameraWrapper}>
              <Image source={{ uri: imageUri }} style={styles.cameraImg} />
              <View style={styles.cameraOverlay}>
                <View style={styles.aiTag}>
                  <MaterialIcons name={isLiveCam ? "auto-awesome" : "videocam-off"} size={14} color={isLiveCam ? theme.colors.success : theme.colors.error} />
                  <Text style={[styles.aiTagText, !isLiveCam && { color: theme.colors.error }]}>
                    {isLiveCam ? "AI: " + cam.status : "Chưa kết nối AI Camera"}
                  </Text>
                </View>
                <Text style={styles.cameraLabel}>{cam.label}</Text>
              </View>
              <TouchableOpacity 
                style={styles.expandBtn}
                onPress={() => handleStopAlarmAndNavigate('PlaceholderScreen')}
              >
                <MaterialIcons name="fullscreen" size={24} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MaterialIcons name="dashboard" size={28} color={theme.colors.primary} />
          <Text style={styles.navTextActive}>Tổng quan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('CaregiverProfile')}
        >
          <MaterialIcons name="person-outline" size={28} color={theme.colors.text.secondary} />
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
  circularProgress: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  progressRing: { width: '100%', height: '100%', borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderColor: theme.colors.neutral, borderWidth: 8 },
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
  sosOverlaySub: {
    fontSize: 16,
    color: 'white',
    marginTop: theme.spacing.s,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
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
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', flex: 1 },
  navText: {
    fontSize: 12, fontWeight: 'bold',
    color: theme.colors.text.secondary, marginTop: 4,
  },
  navTextActive: {
    fontSize: 12, fontWeight: 'bold',
    color: theme.colors.primary, marginTop: 4,
  },
});
