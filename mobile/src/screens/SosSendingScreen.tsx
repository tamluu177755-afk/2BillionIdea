import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Alert, Easing, Linking, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { cancelSos } from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';


export const SosSendingScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sosId, elderName } = route.params || {};
  const [countdown, setCountdown] = useState(0); // Bỏ thời gian đờ chờ, kích hoạt ngay lập tức
  const [actionTriggered, setActionTriggered] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (countdown === 0 && !actionTriggered) {
      triggerEmergencyActions();
      setActionTriggered(true);
    }
  }, [countdown]);

  const triggerEmergencyActions = async () => {
    // 1. GỌI ĐIỆN NGAY cho Nhung (ưu tiên số 1) - không cần xác nhận
    Linking.openURL('tel:0962664000').catch(() => {});
    
    // 2. Gửi SMS đồng loạt cho cả 2 người (nội dung soạn sẵn, gửi tự động)
    setTimeout(() => {
      Linking.openURL('sms:0962664000,0369414698?body=SOS! Bố đang cần hỗ trợ gấp!').catch(() => {});
    }, 2000);
  };

  const handleCancel = async () => {
    if (countdown <= 0) {
      Alert.alert('Hết thời gian hủy', 'Đã chuyển thông báo SOS cho người thân!');
      return;
    }
    try {
      if (sosId) await cancelSos(sosId);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể hủy SOS.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.brand}>An Gia v2.0</Text>
          <Text style={styles.versionLabel}>SOS Ưu tiên: Nhung</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>ĐANG GỬI{'\n'}CẢNH BÁO SOS</Text>
      <View style={styles.signalRow}>
        <View style={styles.dot} />
        <Text style={styles.signalText}>
          {countdown > 0 ? 'Tín hiệu đang được truyền đi...' : 'Đã kết nối trực tiếp!'}
        </Text>
      </View>

      {/* Pulsing SOS Circle */}
      <View style={styles.sosWrapper}>
        <Animated.View style={[styles.sosRing, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.sosBig}>
          <Text style={styles.sosBigText}>SOS</Text>
        </View>
      </View>

      {/* Calling Card */}
      <View style={styles.callingCard}>
        <View style={styles.callerIconWrap}>
          <View style={styles.callerIcon}>
            <MaterialIcons name="person" size={28} color={theme.colors.white} />
          </View>
          <View style={styles.callBadge}>
            <MaterialIcons name="call" size={14} color={theme.colors.white} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callingLabel}>Ưu tiên liên hệ:</Text>
          <Text style={styles.callerName}>Nhung</Text>
          <Text style={styles.callerRelation}>Con gái - 0962664000</Text>
        </View>
      </View>

      {/* Messaging Card */}
      <View style={[styles.callingCard, { borderLeftColor: theme.colors.orange, marginTop: -10 }]}>
        <View style={styles.callerIconWrap}>
          <View style={styles.callerIcon}>
            <MaterialIcons name="message" size={24} color={theme.colors.white} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callingLabel}>Đồng thời gửi SMS tới:</Text>
          <Text style={styles.callerName}>Anh Quang</Text>
          <Text style={styles.callerRelation}>Con trai - 0369414698</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <MaterialIcons name="location-on" size={20} color={theme.colors.orange} />
        <Text style={styles.locationText}>Vị trí của bác đang được chia sẻ</Text>
      </View>

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.textMedium, fontWeight: '600' }}>Hệ thống đang kết nối tự động...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: theme.spacing.m, marginBottom: theme.spacing.s,
  },
  brand: {
    fontSize: 20, fontWeight: '800', color: theme.colors.primary,
  },
  versionLabel: {
    fontSize: 12, fontWeight: '700', color: theme.colors.green,
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  title: {
    fontSize: 34, fontWeight: '900', color: theme.colors.primary,
    textAlign: 'center', lineHeight: 40, marginBottom: 8,
  },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.l },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  signalText: { fontSize: 14, color: theme.colors.textMedium, fontStyle: 'italic' },
  sosWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.l },
  sosRing: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(211,47,47,0.18)',
  },
  sosBig: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 14,
  },
  sosBigText: { fontSize: 48, fontWeight: '900', color: theme.colors.white },
  callingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.m,
    width: '100%', marginBottom: theme.spacing.m,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3,
    borderLeftWidth: 5, borderLeftColor: theme.colors.green,
  },
  callerIconWrap: { position: 'relative' },
  callerIcon: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#1a3a4a',
    alignItems: 'center', justifyContent: 'center',
  },
  callBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: theme.colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  callingLabel: { fontSize: 12, color: theme.colors.textLight, marginBottom: 1 },
  callerName: { fontSize: 22, fontWeight: '800', color: theme.colors.textDark },
  callerRelation: { fontSize: 14, color: theme.colors.green, fontWeight: '700' },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.xl,
  },
  locationText: { fontSize: 14, color: theme.colors.textMedium, textAlign: 'center' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E0E0E0', borderRadius: theme.borderRadius.xl,
    paddingVertical: 14, paddingHorizontal: 28, marginBottom: 6,
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelText: { fontSize: 16, fontWeight: '700', color: theme.colors.textDark },
  cancelHint: { fontSize: 12, color: theme.colors.textLight },
});
