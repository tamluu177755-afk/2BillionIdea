import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { resolveSos } from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';

export const SosAlertScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sosId, elderName = 'Bố (Ông Minh)', locationAddr = '123 Đường Lê Lợi, Quận 1', createdAt } = route.params || {};
  const [timeAgo, setTimeAgo] = useState('0 phút trước');

  useEffect(() => {
    // Vibrate SOS alert
    Vibration.vibrate([0, 500, 200, 500, 200, 500], false);
    
    // Voice Alert
    Speech.speak('Bố đang gọi khẩn cấp', { language: 'vi-VN', rate: 0.9, pitch: 1.1 });

    const updateTime = () => {
      if (createdAt) {
        const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
        setTimeAgo(diff <= 0 ? 'Vừa xảy ra' : `${diff} phút trước`);
      }
    };
    updateTime();
    const t = setInterval(updateTime, 30000);
    return () => { clearInterval(t); Vibration.cancel(); Speech.stop(); };
  }, []);

  const handleCall = () => Linking.openURL('tel:0962664000');

  const handleDismiss = async () => {
    if (sosId) await resolveSos(sosId).catch(() => {});
    navigation.navigate('CaregiverDashboard');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Top Icon */}
        <View style={styles.iconCircle}>
          <MaterialIcons name="podcasts" size={36} color="#B71C1C" style={{ marginTop: -8 }} />
          <MaterialIcons name="location-pin" size={24} color="#B71C1C" style={{ position: 'absolute', top: 28 }} />
        </View>

        {/* Title */}
        <Text style={styles.alertTitle}>CẢNH BÁO KHẨN CẤP:</Text>
        <Text style={styles.alertSubtitle}>{elderName.toUpperCase()} VỪA NHẤN SOS!</Text>

        {/* Location Card inside a darker red container */}
        <View style={styles.cardContainer}>
          <View style={styles.locationHeader}>
            <MaterialIcons name="location-on" size={14} color="#FFF" />
            <Text style={styles.locationAddr}>Vị trí hiện tại: {locationAddr}</Text>
          </View>
          
          <View style={styles.mapWhiteBox}>
            <MaterialIcons name="location-on" size={60} color="#B71C1C" />
            <Text style={styles.mapLabel}>BỐ GỌI KHẨN CẤP TẠI:</Text>
          </View>
        </View>

        {/* Time */}
        <View style={styles.timeRow}>
          <MaterialIcons name="access-time" size={14} color="#FFF" />
          <Text style={styles.timeText}>Vừa xảy ra: {timeAgo}</Text>
        </View>

        {/* Action Buttons Background Box */}
        <View style={styles.actionBox}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
            <MaterialIcons name="call" size={20} color="#FFF" />
            <Text style={styles.callBtnText}>GỌI LẠI NGAY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cameraBtn} onPress={() => navigation.navigate('CaregiverDashboard')} activeOpacity={0.85}>
            <MaterialIcons name="videocam" size={20} color="#FFF" />
            <Text style={styles.cameraBtnText}>XEM CAMERA LIVE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissText}>Bỏ qua cảnh báo (Chỉ khi đã an toàn)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#B71C1C' },
  safe: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  alertTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  alertSubtitle: {
    fontSize: 16, fontWeight: '700', color: '#FFF',
    textAlign: 'center', marginBottom: 30, marginTop: 6, letterSpacing: 0.5
  },
  
  cardContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 24, padding: 12, width: '100%', marginBottom: 15,
  },
  locationHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 8
  },
  locationAddr: { fontSize: 13, fontWeight: '700', color: '#FFF', flex: 1 },
  mapWhiteBox: {
    backgroundColor: '#FFF', borderRadius: 20, height: 200,
    alignItems: 'center', justifyContent: 'center', padding: 20
  },
  mapLabel: { fontSize: 18, fontWeight: '900', color: '#B71C1C', marginTop: 15 },
  
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 25,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  
  actionBox: {
    backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 24, padding: 15, width: '100%',
  },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1b5e20', borderRadius: 25, paddingVertical: 15, marginBottom: 15,
  },
  callBtnText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#e65100', borderRadius: 25, paddingVertical: 15, marginBottom: 15,
  },
  cameraBtnText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  
  dismissBtn: {
    paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 25, alignItems: 'center'
  },
  dismissText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
});
