import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Vibration, Animated, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { resolveSos } from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { webAudioManager } from '../services/audioManager';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const SosAlertScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sosId, elderName = 'Ông Minh', locationAddr = '123 Đường Lê Lợi, Quận 1', createdAt } = route.params || {};
  const [timeAgo, setTimeAgo] = useState('Vừa xảy ra');
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Alarm flash animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ])
    ).start();

    let soundObj: Audio.Sound | null = null;
    let interval: NodeJS.Timeout;

    const playAlertSound = async () => {
      if (Platform.OS === 'web') {
        webAudioManager.playSosAlarm();
      } else {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sos-final.mp3'),
            { isLooping: true, volume: 1.0 }
          );
          soundObj = sound;
          await sound.playAsync();
        } catch (e) {
          console.warn('Error playing native alert sound', e);
        }
      }
    };

    playAlertSound();

    // Forced vibration loop
    interval = setInterval(() => {
      Vibration.vibrate([0, 500, 200, 500]);
    }, 3000);

    return () => {
      clearInterval(interval);
      Vibration.cancel();
      if (Platform.OS === 'web') {
        webAudioManager.stopSosAlarm();
      } else if (soundObj) {
        soundObj.stopAsync().then(() => soundObj?.unloadAsync());
      }
    };
  }, []);

  const handleCall = () => Linking.openURL('tel:0962664000');
  const handleResolve = async () => {
    if (sosId) await resolveSos(sosId).catch(() => {});
    navigation.navigate('CaregiverDashboard');
  };

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primary, '#8B0000']
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.alertHeader}>
          <MaterialIcons name="error" size={60} color={theme.colors.text.inverse} />
          <Text style={styles.alertTitle}>CẢNH BÁO SOS</Text>
          <Text style={styles.alertSubtitle}>{elderName.toUpperCase()} ĐANG CẦN GIÚP ĐỠ!</Text>
        </View>

        <Card style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <MaterialIcons name="location-on" size={24} color={theme.colors.primary} />
            <Text style={styles.locationText}>{locationAddr}</Text>
          </View>
          <View style={styles.mapPlaceholder}>
             <MaterialIcons name="map" size={80} color={theme.colors.neutral} />
             <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>Cách bạn 2.5km</Text>
             </View>
          </View>
        </Card>

        <View style={styles.timeContainer}>
           <MaterialIcons name="access-time" size={20} color={theme.colors.text.inverse} />
           <Text style={styles.timeText}>Xảy ra: {timeAgo}</Text>
        </View>

        <View style={styles.actionContainer}>
          <Button 
            title="GỌI LẠI NGAY" 
            variant="success" 
            size="large" 
            icon="call"
            onPress={handleCall}
            style={styles.actionBtn}
          />
          <Button 
            title="XEM CAMERA LIVE" 
            variant="warning" 
            size="large" 
            icon="videocam"
            onPress={() => navigation.navigate('CaregiverDashboard')}
            style={styles.actionBtn}
          />
          <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
            <Text style={styles.resolveText}>Bỏ qua cảnh báo (Nếu đã an toàn)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, padding: theme.spacing.m, alignItems: 'center' },
  alertHeader: { alignItems: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl },
  alertTitle: { fontSize: 32, fontWeight: '900', color: theme.colors.text.inverse, marginTop: theme.spacing.s },
  alertSubtitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.inverse, opacity: 0.9 },
  mapCard: { width: '100%', padding: theme.spacing.m, borderRadius: theme.borderRadius.l },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.m },
  locationText: { fontSize: 14, fontWeight: 'bold', flex: 1 },
  mapPlaceholder: { 
    height: 180, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m,
    alignItems: 'center', justifyContent: 'center', position: 'relative'
  },
  distanceBadge: { 
    position: 'absolute', bottom: 12, right: 12, backgroundColor: theme.colors.primary,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20
  },
  distanceText: { color: theme.colors.text.inverse, fontSize: 12, fontWeight: 'bold' },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: theme.spacing.l },
  timeText: { fontSize: 16, color: theme.colors.text.inverse, fontWeight: 'bold' },
  actionContainer: { width: '100%', gap: theme.spacing.m },
  actionBtn: { height: 70 },
  resolveBtn: { marginTop: theme.spacing.m, alignItems: 'center', padding: theme.spacing.m },
  resolveText: { color: theme.colors.text.inverse, fontSize: 14, textDecorationLine: 'underline' },
});

