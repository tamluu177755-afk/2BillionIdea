import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Alert, Easing, Linking, ActivityIndicator, Vibration
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { cancelSos, triggerSos } from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';

export const SosSendingScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { elderName } = route.params || {};
  const [sosId, setSosId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isSent, setIsSent] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const speechIntervalRef = useRef<any>(null);

  const { elderUser } = useAppStore();

  useEffect(() => {
    // Play urgent siren sound
    const playAlarm = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3' }, // Siren
          { isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
        await sound.playAsync();
      } catch (e) {
        console.log('Error playing alarm', e);
      }
    };

    const startSpeechAlert = () => {
      const message = `${elderUser?.name || 'Ông'} cần được hỗ trợ.`;
      const speak = () => {
        Speech.speak(message, { language: 'vi-VN', rate: 0.9, pitch: 1.0 });
      };
      speak();
      speechIntervalRef.current = setInterval(speak, 5000);
    };

    playAlarm();
    startSpeechAlert();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // 3-second countdown
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          triggerEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
      Speech.stop();
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const triggerEmergency = async () => {
    setIsSent(true);
    Vibration.vibrate([0, 500, 200, 500], true);
    
    // 1. Send SOS signal to backend/caregiver AFTER countdown
    try {
      if (elderUser?.elderProfile?.id) {
        const sos = await triggerSos(elderUser.elderProfile.id, 'Vị trí hiện tại của ông');
        setSosId(sos.id);
      }
    } catch (e) {
      console.log('SOS API error', e);
    }

    // 2. Call primary contact
    Linking.openURL('tel:0962664000').catch(() => {});
  };

  const handleCancel = async () => {
    if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    Speech.stop();
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    Vibration.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      if (sosId && !isSent) await cancelSos(sosId);
      navigation.goBack();
    } catch (e) {
      navigation.goBack();
    }
  };

  const handleReturnHome = async () => {
    if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    Speech.stop();
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    Vibration.cancel();
    navigation.navigate('ElderlyHome');
  };

  return (
    <SafeAreaView style={[styles.safe, isSent && styles.safeSent]}>
      <View style={styles.header}>
        <Text style={[styles.title, isSent && styles.titleSent]}>
          {isSent ? 'ĐANG GỌI CỨU TRỢ\nKHẨN CẤP' : 'CHUẨN BỊ GỬI\nYÊU CẦU SOS'}
        </Text>
      </View>

      <View style={styles.sosWrapper}>
        <Animated.View style={[styles.sosRing, { transform: [{ scale: pulseAnim }] }]} />
        <View style={[styles.sosCircle, isSent && styles.sosCircleSent]}>
          {isSent ? (
            <MaterialIcons name="emergency-share" size={80} color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.countdownText}>{countdown}</Text>
          )}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
             <MaterialIcons name="person" size={50} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.callBadge}>
            <MaterialIcons name="call" size={24} color={theme.colors.text.inverse} />
          </View>
        </View>
        <Text style={styles.contactName}>Nhung - Con gái</Text>
        <Text style={styles.statusText}>
          {isSent ? 'Vị trí của ông đã được chia sẻ.\nCon đang đến với ông.' : 'Hệ thống đang chuẩn bị kết nối...'}
        </Text>
      </View>

      {!isSent ? (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>HỦY (Nếu nhấn nhầm)</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.sentContainer}>
          <View style={styles.sentBadge}>
            <ActivityIndicator color={theme.colors.text.inverse} size="large" />
            <Text style={styles.sentBadgeText}>Đang giữ kết nối...</Text>
          </View>
          
          <TouchableOpacity style={styles.homeBtn} onPress={handleReturnHome}>
            <Text style={styles.homeBtnText}>QUAY LẠI TRANG CHỦ</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF0F0', alignItems: 'center', padding: theme.spacing.m },
  safeSent: { backgroundColor: theme.colors.primary },
  header: { marginTop: theme.spacing.xxl, marginBottom: theme.spacing.xxl },
  title: { 
    fontSize: theme.typography.elder.title, fontWeight: '900', 
    color: theme.colors.primary, textAlign: 'center', lineHeight: 40 
  },
  titleSent: { color: theme.colors.text.inverse },
  sosWrapper: { 
    width: 240, height: 240, alignItems: 'center', justifyContent: 'center', 
    marginBottom: theme.spacing.xxl 
  },
  sosRing: { 
    position: 'absolute', width: '100%', height: '100%', borderRadius: 120, 
    backgroundColor: 'rgba(227, 45, 45, 0.15)' 
  },
  sosCircle: { 
    width: 180, height: 180, borderRadius: 90, backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center', elevation: 10,
    borderWidth: 10, borderColor: theme.colors.primary,
  },
  sosCircleSent: { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface },
  countdownText: { fontSize: 80, fontWeight: '900', color: theme.colors.primary },
  infoContainer: { alignItems: 'center', flex: 1 },
  avatarContainer: { position: 'relative', marginBottom: theme.spacing.m },
  avatar: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.neutral,
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: theme.colors.surface
  },
  callBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.success,
    alignItems: 'center', justifyContent: 'center'
  },
  contactName: { fontSize: theme.typography.elder.header, fontWeight: 'bold', marginBottom: theme.spacing.s },
  statusText: { 
    fontSize: theme.typography.elder.body, color: theme.colors.text.secondary, 
    textAlign: 'center', lineHeight: 30 
  },
  cancelBtn: { 
    backgroundColor: theme.colors.neutral, paddingVertical: 20, paddingHorizontal: 40, 
    borderRadius: theme.borderRadius.l, marginBottom: theme.spacing.xl 
  },
  cancelText: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.text.primary },
  sentContainer: { width: '100%', alignItems: 'center', marginBottom: theme.spacing.xl },
  sentBadge: { alignItems: 'center', gap: 10, marginBottom: theme.spacing.xl },
  sentBadgeText: { fontSize: theme.typography.elder.body, color: theme.colors.text.inverse, fontWeight: 'bold' },
  homeBtn: { 
    backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 18, paddingHorizontal: 40, 
    borderRadius: theme.borderRadius.l, borderWidth: 2, borderColor: theme.colors.surface
  },
  homeBtnText: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.text.inverse },
});
