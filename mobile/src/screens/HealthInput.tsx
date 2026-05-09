import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getElderUser, addVitalSign } from '../services/api';

export const HealthInput = () => {
  const [elderId, setElderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [bloodSugar, setBloodSugar] = useState('90');
  const [weight, setWeight] = useState('65');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getElderUser();
        if (data?.elderProfile?.id) {
          setElderId(data.elderProfile.id);
        }
      } catch (error) {
        console.error('Failed to load user profile for vitals');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!elderId) {
      Alert.alert('Lỗi', 'Không tìm thấy hồ sơ người cao tuổi');
      return;
    }
    
    try {
      setSaving(true);
      // Save BP
      if (bloodPressure) await addVitalSign(elderId, 'BLOOD_PRESSURE', bloodPressure);
      // Save Sugar
      if (bloodSugar) await addVitalSign(elderId, 'BLOOD_SUGAR', bloodSugar);
      // Save Weight
      if (weight) await addVitalSign(elderId, 'WEIGHT', weight);
      
      Alert.alert('Thành công', 'Đã lưu chỉ số sức khỏe của bạn!');
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu chỉ số');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
       <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color={theme.colors.primary} />
       </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhập chỉ số sức khỏe</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container}>
          
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Theo dõi sức khỏe</Text>
            <Text style={styles.introSub}>Cập nhật các chỉ số hàng ngày để chúng tôi chăm sóc bạn tốt hơn.</Text>
          </View>

          {/* Blood Pressure Input */}
          <Card style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <MaterialIcons name="bloodtype" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.inputLabel}>Huyết áp (mmHg)</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={bloodPressure}
              onChangeText={setBloodPressure}
              keyboardType="numeric"
              placeholder="VD: 120/80"
              placeholderTextColor={theme.colors.textLight}
            />
          </Card>

          {/* Blood Sugar Input */}
          <Card style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#ffedd5' }]}>
                <MaterialIcons name="monitor-heart" size={28} color="#f97316" />
              </View>
              <Text style={styles.inputLabel}>Đường huyết (mg/dL)</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={bloodSugar}
              onChangeText={setBloodSugar}
              keyboardType="numeric"
              placeholder="VD: 90"
              placeholderTextColor={theme.colors.textLight}
            />
          </Card>

          {/* Weight Input */}
          <Card style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
                <MaterialIcons name="monitor-weight" size={28} color="#22c55e" />
              </View>
              <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="VD: 65"
              placeholderTextColor={theme.colors.textLight}
            />
          </Card>

          <Button 
            title={saving ? "ĐANG LƯU..." : "LƯU CHỈ SỐ"} 
            onPress={handleSave} 
            icon="save" 
            style={styles.saveButton}
            textStyle={{ fontSize: 20 }}
            disabled={saving}
          />

          {/* Fill space at bottom for TabBar height */}
          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    padding: theme.spacing.m,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  container: {
    padding: theme.spacing.m,
  },
  introSection: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.s,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  introSub: {
    fontSize: 16,
    color: theme.colors.textLight,
    lineHeight: 24,
  },
  inputCard: {
    marginBottom: theme.spacing.l,
    padding: theme.spacing.l,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.m,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: theme.spacing.l,
    paddingVertical: theme.spacing.l,
  }
});
