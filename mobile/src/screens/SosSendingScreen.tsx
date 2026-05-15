import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert, Easing, Linking, ActivityIndicator, Vibration, Platform
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
import { webAudioManager } from '../services/audioManager';

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
          soundRef.current = sound;
          await sound.playAsync();
        } catch (e) {
          console.log('Error playing alarm', e);
        }
      }
    };

    playAlarm();

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
      
      if (Platform.OS === 'web') {
        webAudioManager.stopSosAlarm();
      } else if (soundRef.current) {
        soundRef.current.stopAsync().then(() => soundRef.current?.unloadAsync());
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
    
    if (Platform.OS === 'web') {
      webAudioManager.stopSosAlarm();
    } else if (soundRef.current) {
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
    
    if (Platform.OS === 'web') {
      webAudioManager.stopSosAlarm();
    } else if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    
    Vibration.cancel();
    navigation.navigate('ElderlyHome');
  };

  return (
    <SafeAreaView style={[styles.safe, isSent && styles.safeSent]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, isSent && styles.titleSent]}>
            {isSent ? 'ĐANG GỌI CỨU TRỢ\nKHẨN CẤP' : 'CHUẨN BỊ GỬI\nYÊU CẦU SOS'}
          </Text>
        </View>

        {/* SOS Circle */}
        <View style={styles.sosWrapper}>
          <Animated.View style={[styles.sosRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={[styles.sosCircle, isSent && styles.sosCircleSent]}>
            {isSent ? (
              <MaterialIcons name="emergency-share" size={60} color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.infoContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
               <MaterialIcons name="person" size={40} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.callBadge}>
              <MaterialIcons name="call" size={18} color={theme.colors.text.inverse} />
            </View>
          </View>
          <Text style={styles.contactName}>Tuấn - Con trai</Text>
          <Text style={styles.statusText}>
            {isSent ? 'Vị trí của ông đã được chia sẻ.\nCon đang đến với ông.' : 'Hệ thống đang chuẩn bị kết nối...'}
          </Text>
        </View>

        {/* Action area — always below all text */}
        <View style={styles.actionArea}>
          {!isSent ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>HỦY (Nếu nhấn nhầm)</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.sentBadge}>
                <ActivityIndicator color={theme.colors.text.inverse} size="large" />
                <Text style={styles.sentBadgeText}>Đang giữ kết nối...</Text>
              </View>

              <TouchableOpacity style={styles.homeBtn} onPress={handleReturnHome}>
                <Text style={styles.homeBtnText}>QUAY LẠI TRANG CHỦ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF0F0' },
  safeSent: { backgroundColor: theme.colors.primary },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  header: { marginTop: theme.spacing.l, marginBottom: theme.spacing.s },
  title: {
    fontSize: theme.typography.elder.title, fontWeight: '900',
    color: theme.colors.primary, textAlign: 'center', lineHeight: 34
  },
  titleSent: { color: theme.colors.text.inverse },
  sosWrapper: {
    width: 200, height: 200, alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.l
  },
  sosRing: {
    position: 'absolute', width: '100%', height: '100%', borderRadius: 100,
    backgroundColor: 'rgba(227, 45, 45, 0.15)'
  },
  sosCircle: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center', elevation: 8,
    borderWidth: 8, borderColor: theme.colors.primary,
  },
  sosCircleSent: { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface },
  countdownText: { fontSize: 64, fontWeight: '900', color: theme.colors.primary },

  // Contact info — no flex:1, chiều cao tự nhiên
  infoContainer: { alignItems: 'center', marginBottom: theme.spacing.m },
  avatarContainer: { position: 'relative', marginBottom: theme.spacing.s },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.neutral,
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: theme.colors.surface
  },
  callBadge: {
    position: 'absolute', bottom: 0, right: -5,
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.success,
    alignItems: 'center', justifyContent: 'center'
  },
  contactName: {
    fontSize: theme.typography.elder.header, fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: theme.typography.elder.body, color: theme.colors.text.secondary,
    textAlign: 'center', lineHeight: 24
  },

  // Action area — luôn nằm dưới cùng, không chồng chéo
  actionArea: { width: '100%', alignItems: 'center', gap: theme.spacing.m },
  cancelBtn: {
    backgroundColor: theme.colors.neutral, paddingVertical: 20, paddingHorizontal: 40,
    borderRadius: theme.borderRadius.l,
  },
  cancelText: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.text.primary },
  sentBadge: { alignItems: 'center', gap: 10 },
  sentBadgeText: { fontSize: theme.typography.elder.body, color: theme.colors.text.inverse, fontWeight: 'bold' },
  homeBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 18,
    borderRadius: theme.borderRadius.l, borderWidth: 2, borderColor: theme.colors.surface,
    alignItems: 'center',
  },
  homeBtnText: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.text.inverse },
});

