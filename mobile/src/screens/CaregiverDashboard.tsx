import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getElderUser, getSocket } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const SCREEN_W = Dimensions.get('window').width;

const CAMERAS = [
  { label: 'Phòng khách', status: 'BÌNH THƯỜNG', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600' },
  { label: 'Phòng ngủ', status: 'BÌNH THƯỜNG', image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600' },
  { label: 'Nhà bếp', status: 'BÌNH THƯỜNG', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
];

export const CaregiverDashboard = () => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Bố');
  const [cameraIndex, setCameraIndex] = useState(0);
  const [statusText, setStatusText] = useState('Đang cập nhật...');
  const [statusTime, setStatusTime] = useState('');

  useEffect(() => {
    loadData();

    // Socket: listen for medication_taken and sos_alert events
    const sock = getSocket();
    sock.on('medication_taken', (data: any) => {
      setStatusText(`Vừa uống thuốc ${data.name} xong`);
      setStatusTime('Vừa cập nhật');
    });
    sock.on('sos_alert', (data: any) => {
      navigation.navigate('SosAlert', { sosId: data.sosId, elderName: 'Bố (Ông Minh)', locationAddr: data.locationAddr, createdAt: data.createdAt });
    });
    return () => { sock.off('medication_taken'); sock.off('sos_alert'); };
  }, []);

  const loadData = async () => {
    try {
      const data = await getElderUser();
      setUserData(data);
      const meds = data?.elderProfile?.medications || [];
      const lastTaken = meds.filter((m: any) => m.status === 'TAKEN').slice(-1)[0];
      if (lastTaken) {
        setStatusText(`Vừa uống ${lastTaken.name} xong`);
        setStatusTime('Cập nhật 2 phút trước');
      } else {
        setStatusText('Đang hoạt động bình thường');
        setStatusTime('Vừa cập nhật');
      }
    } catch (e) {
      setStatusText('Không thể kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="person-pin" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.brand}>An Gia</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={26} color={theme.colors.textMedium} />
        </TouchableOpacity>
      </View>

      {/* Person Tabs */}
      <View style={styles.tabRow}>
        {['Bố (Ông Minh)', 'Mẹ'].map((tab, i) => {
          const key = i === 0 ? 'Bố' : 'Mẹ';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.personTab, activeTab === key && styles.personTabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.personTabText, activeTab === key && styles.personTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>TRẠNG THÁI HIỆN TẠI</Text>
            <View style={styles.onlineDot} />
          </View>
          {loading
            ? <ActivityIndicator color={theme.colors.primary} />
            : <Text style={styles.statusBig}>{statusText}</Text>
          }
          <View style={styles.statusUserRow}>
            <View style={styles.miniAvatar}>
              <MaterialIcons name="person" size={14} color={theme.colors.white} />
            </View>
            <Text style={styles.statusTimeText}>{statusTime}</Text>
          </View>
        </View>

        {/* Camera Carousel */}
        <View style={styles.cameraSection}>
          <View style={styles.cameraCard}>
            <Image
              source={{ uri: CAMERAS[cameraIndex].image }}
              style={styles.cameraImg}
              resizeMode="cover"
            />
            {/* AI Badge */}
            <View style={styles.aiBadge}>
              <View style={styles.aiDot} />
              <Text style={styles.aiText}>AI: {CAMERAS[cameraIndex].status}</Text>
            </View>
            {/* Mic btn */}
            <TouchableOpacity style={styles.micBtn}>
              <MaterialIcons name="mic" size={20} color={theme.colors.textDark} />
            </TouchableOpacity>
            {/* Room label */}
            <View style={styles.roomLabel}>
              <Text style={styles.roomName}>{CAMERAS[cameraIndex].label}</Text>
              <Text style={styles.roomLive}>Trực tiếp</Text>
            </View>
            {/* Fullscreen */}
            <TouchableOpacity style={styles.fullscreenBtn}>
              <MaterialIcons name="fullscreen" size={22} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {CAMERAS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setCameraIndex(i)}>
                <View style={[styles.dot, cameraIndex === i && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#FFE0CC', alignItems: 'center', justifyContent: 'center',
  },
  brand: { fontSize: 18, fontWeight: '900', color: theme.colors.primary },
  bellBtn: { padding: 6 },
  tabRow: { flexDirection: 'row', gap: 10, padding: theme.spacing.m, paddingBottom: 0 },
  personTab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: theme.borderRadius.full,
    backgroundColor: '#F0F0F0',
  },
  personTabActive: { backgroundColor: theme.colors.primary },
  personTabText: { fontSize: 14, fontWeight: '700', color: theme.colors.textMedium },
  personTabTextActive: { color: theme.colors.white },
  scroll: { padding: theme.spacing.m },
  statusCard: {
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.m, marginBottom: theme.spacing.m,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  statusLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMedium, letterSpacing: 1 },
  onlineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50' },
  statusBig: { fontSize: 22, fontWeight: '800', color: theme.colors.textDark, marginBottom: theme.spacing.m },
  statusUserRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.textLight, alignItems: 'center', justifyContent: 'center',
  },
  statusTimeText: { fontSize: 13, color: theme.colors.textMedium },
  cameraSection: { marginBottom: theme.spacing.m },
  cameraCard: {
    borderRadius: theme.borderRadius.xl, overflow: 'hidden', position: 'relative',
    height: 220,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  cameraImg: { width: '100%', height: '100%' },
  aiBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  aiText: { fontSize: 12, color: theme.colors.white, fontWeight: '700' },
  micBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.colors.white, alignItems: 'center', justifyContent: 'center',
  },
  roomLabel: { position: 'absolute', bottom: 12, left: 12 },
  roomName: { fontSize: 16, fontWeight: '800', color: theme.colors.white, textShadowColor: '#00000088', textShadowRadius: 4, textShadowOffset: { width: 1, height: 1 } },
  roomLive: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  fullscreenBtn: {
    position: 'absolute', bottom: 12, right: 12,
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#BDBDBD' },
  dotActive: { backgroundColor: theme.colors.primary, width: 20 },
});
