import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { confirmMedication, unconfirmMedication, deleteMedication, addMedication, getElderUser } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';

export const MedicationReminder = () => {
  const navigation = useNavigation<any>();
  const [loadingMedId, setLoadingMedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDosage, setNewDosage] = useState('1 viên');
  const [newPeriod, setNewPeriod] = useState<'MORNING' | 'NOON' | 'EVENING'>('MORNING');
  const [adding, setAdding] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medToDelete, setMedToDelete] = useState<any>(null);
  
  const {
    elderUser,
    isLoading,
    loadElderUser,
    setupSocketListeners,
    removeSocketListeners,
    initSocket
  } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      initSocket();
      loadElderUser();
      setupSocketListeners();

      return () => {
        removeSocketListeners();
      };
    }, [initSocket, loadElderUser, setupSocketListeners, removeSocketListeners])
  );

  const handleConfirm = async (med: any) => {
    setLoadingMedId(med.id);
    try {
      await confirmMedication(med.id);
      await loadElderUser();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xác nhận uống thuốc.');
    } finally {
      setLoadingMedId(null);
    }
  };

  const handleUnconfirm = async (med: any) => {
    setLoadingMedId(med.id);
    try {
      await unconfirmMedication(med.id);
      await loadElderUser();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể hủy xác nhận uống thuốc.');
    } finally {
      setLoadingMedId(null);
    }
  };

  const handleDelete = (med: any) => {
    setMedToDelete(med);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!medToDelete) return;
    setLoadingMedId(medToDelete.id);
    try {
      await deleteMedication(medToDelete.id);
      await loadElderUser();
      setShowDeleteModal(false);
      setMedToDelete(null);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xóa thuốc.');
    } finally {
      setLoadingMedId(null);
    }
  };

  const handleAddMedication = async () => {
    setSubmitMessage('');
    setSubmitError('');

    if (!newName.trim() || !newTime.trim()) {
      setSubmitError('Vui lòng nhập tên thuốc và giờ uống.');
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newTime.trim())) {
      setSubmitError('Giờ uống phải đúng định dạng HH:MM (ví dụ 08:30).');
      return;
    }

    let elderProfileId = elderUser?.elderProfile?.id;
    if (!elderProfileId) {
      try {
        const freshUser = await getElderUser();
        elderProfileId = freshUser?.elderProfile?.id;
      } catch (e) {
        // handled below
      }
    }

    if (!elderProfileId) {
      setSubmitError('Không tìm thấy hồ sơ người dùng. Vui lòng tải lại màn hình.');
      return;
    }

    setAdding(true);
    try {
      await addMedication({
        elderProfileId,
        name: newName.trim(),
        time: newTime.trim(),
        dosage: newDosage.trim() || '1 viên',
        period: newPeriod,
      });
      await loadElderUser();
      setSubmitMessage('Đã thêm lịch uống thuốc thành công.');
      setNewName('');
      setNewTime('08:00');
      setNewDosage('1 viên');
      setNewPeriod('MORNING');
      setTimeout(() => {
        setShowAddModal(false);
        setSubmitMessage('');
        setSubmitError('');
      }, 500);
    } catch (e) {
      setSubmitError('Không thể thêm lịch uống thuốc. Kiểm tra backend hoặc mạng rồi thử lại.');
    } finally {
      setAdding(false);
    }
  };

  const meds = elderUser?.elderProfile?.medications || [];
  const takenCount = meds.filter(m => m.status === 'TAKEN').length;
  const progress = meds.length > 0 ? (takenCount / meds.length) * 100 : 0;

  const PERIODS = [
    { key: 'MORNING', label: 'BUỔI SÁNG', icon: 'wb-sunny' },
    { key: 'NOON', label: 'BUỔI TRƯA', icon: 'wb-cloudy' },
    { key: 'EVENING', label: 'BUỔI TỐI', icon: 'nights-stay' },
  ];

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
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={32} color={theme.colors.text.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Lịch thuốc</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <MaterialIcons name="add" size={28} color={theme.colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Giant Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Đã uống {takenCount}/{medications.length} liều</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {PERIODS.map(period => {
          const items = medications.filter(m => m.period === period.key);
          if (items.length === 0) return null;

          return (
            <View key={period.key} style={styles.periodSection}>
              <View style={styles.periodHeader}>
                <MaterialIcons name={period.icon as any} size={32} color={theme.colors.warning} />
                <Text style={styles.periodTitle}>{period.label}</Text>
              </View>

              {items.map(med => (
                <Card 
                  key={med.id} 
                  variant={med.status === 'TAKEN' ? 'success' : 'warning'} 
                  style={[styles.medCard, med.status === 'TAKEN' && styles.medTaken]}
                >
                  <View style={styles.medRow}>
                    <View style={styles.medIconBg}>
                      <MaterialIcons 
                        name="medication" 
                        size={40} 
                        color={med.status === 'TAKEN' ? theme.colors.success : theme.colors.warning} 
                      />
                    </View>
                    <View style={styles.medInfo}>
                      <Text style={styles.medTime}>{med.time}</Text>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDosage}>{med.dosage}</Text>
                    </View>
                    <View style={styles.medActions}>
                      <TouchableOpacity 
                        onPress={() => handleDelete(med)}
                        style={styles.deleteBtn}
                      >
                        <MaterialIcons name="delete-outline" size={28} color={theme.colors.error} />
                      </TouchableOpacity>
                      {med.status === 'TAKEN' && (
                        <MaterialIcons name="check-circle" size={40} color={theme.colors.success} />
                      )}
                    </View>
                  </View>
                  
                  {med.status === 'TAKEN' ? (
                    <Button 
                      title={loadingMedId === med.id ? "Đang xử lý..." : "HỦY XÁC NHẬN"} 
                      variant="outline" 
                      size="large"
                      onPress={() => handleUnconfirm(med)}
                      disabled={loadingMedId === med.id}
                      style={styles.confirmBtn}
                    />
                  ) : (
                    <Button 
                      title={loadingMedId === med.id ? "Đang xử lý..." : "XÁC NHẬN ĐÃ UỐNG"} 
                      variant="success" 
                      size="large"
                      onPress={() => handleConfirm(med)}
                      disabled={loadingMedId === med.id}
                      style={styles.confirmBtn}
                    />
                  )}
                </Card>
              ))}
            </View>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <Text style={styles.modalTitle}>Thêm lịch uống thuốc</Text>

              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Tên thuốc"
                style={styles.input}
              />
              <TextInput
                value={newTime}
                onChangeText={setNewTime}
                placeholder="Giờ uống (HH:MM)"
                style={styles.input}
              />
              <TextInput
                value={newDosage}
                onChangeText={setNewDosage}
                placeholder="Liều lượng"
                style={styles.input}
              />

              <Text style={styles.periodLabel}>Buổi uống</Text>
              <View style={styles.periodChips}>
                <TouchableOpacity
                  style={[styles.periodChip, newPeriod === 'MORNING' && styles.periodChipActive]}
                  onPress={() => setNewPeriod('MORNING')}
                >
                  <Text style={[styles.periodChipText, newPeriod === 'MORNING' && styles.periodChipTextActive]}>Sáng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodChip, newPeriod === 'NOON' && styles.periodChipActive]}
                  onPress={() => setNewPeriod('NOON')}
                >
                  <Text style={[styles.periodChipText, newPeriod === 'NOON' && styles.periodChipTextActive]}>Trưa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodChip, newPeriod === 'EVENING' && styles.periodChipActive]}
                  onPress={() => setNewPeriod('EVENING')}
                >
                  <Text style={[styles.periodChipText, newPeriod === 'EVENING' && styles.periodChipTextActive]}>Tối</Text>
                </TouchableOpacity>
              </View>

              {!!submitError && <Text style={styles.submitError}>{submitError}</Text>}
              {!!submitMessage && <Text style={styles.submitMessage}>{submitMessage}</Text>}

              <View style={styles.modalActions}>
                <Button
                  title={adding ? 'Đang thêm...' : 'Thêm'}
                  variant="success"
                  onPress={handleAddMedication}
                  disabled={adding}
                  style={styles.modalActionBtn}
                />
                <Button
                  title="Hủy"
                  variant="outline"
                  onPress={() => {
                    setShowAddModal(false);
                    setSubmitMessage('');
                    setSubmitError('');
                  }}
                  style={styles.modalActionBtn}
                />
              </View>
            </Card>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <View style={styles.deleteIconContainer}>
                <MaterialIcons name="delete-forever" size={60} color={theme.colors.error} />
              </View>
              <Text style={styles.modalTitle}>Xóa thuốc?</Text>
              <Text style={styles.deleteConfirmText}>
                Bạn có chắc chắn muốn xóa thuốc <Text style={{ fontWeight: 'bold' }}>{medToDelete?.name}</Text> khỏi lịch không?
              </Text>

              <View style={styles.modalActions}>
                <Button
                  title={loadingMedId === medToDelete?.id ? 'Đang xóa...' : 'Xóa ngay'}
                  variant="primary"
                  onPress={confirmDelete}
                  disabled={loadingMedId === medToDelete?.id}
                  style={[styles.modalActionBtn, { backgroundColor: theme.colors.error }]}
                />
                <Button
                  title="Hủy"
                  variant="outline"
                  onPress={() => {
                    setShowDeleteModal(false);
                    setMedToDelete(null);
                  }}
                  style={styles.modalActionBtn}
                />
              </View>
            </Card>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: theme.spacing.m, backgroundColor: theme.colors.surface,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: theme.typography.elder.body, fontWeight: 'bold' },
  title: { fontSize: theme.typography.elder.header, fontWeight: 'bold' },
  scroll: { padding: theme.spacing.m },
  progressContainer: { 
    backgroundColor: theme.colors.surface, padding: theme.spacing.l, 
    borderRadius: theme.borderRadius.l, marginBottom: theme.spacing.xl,
    ...theme.shadow,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.m },
  progressLabel: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.primary },
  progressPercent: { fontSize: theme.typography.elder.body, fontWeight: 'bold', color: theme.colors.success },
  progressBg: { height: 24, backgroundColor: theme.colors.neutral, borderRadius: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 12 },
  periodSection: { marginBottom: theme.spacing.xl },
  periodHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginBottom: theme.spacing.m },
  periodTitle: { fontSize: theme.typography.elder.header, fontWeight: 'bold', color: theme.colors.text.primary },
  medCard: { marginBottom: theme.spacing.m, padding: theme.spacing.m },
  medTaken: { opacity: 0.7 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  medIconBg: { 
    width: 70, height: 70, borderRadius: 12, backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center' 
  },
  medInfo: { flex: 1 },
  medTime: { fontSize: theme.typography.elder.caption, fontWeight: 'bold', color: theme.colors.warning },
  medName: { fontSize: theme.typography.elder.header, fontWeight: 'bold', color: theme.colors.text.primary },
  medDosage: { fontSize: theme.typography.elder.body, color: theme.colors.text.secondary },
  medActions: { alignItems: 'center', gap: theme.spacing.s },
  deleteBtn: { padding: 4 },
  confirmBtn: { marginTop: theme.spacing.m },
  modalSafe: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: theme.spacing.m,
  },
  modalCard: { padding: theme.spacing.l },
  modalTitle: {
    fontSize: theme.typography.elder.header,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 12,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
    fontSize: theme.typography.elder.body,
  },
  periodLabel: {
    fontSize: theme.typography.caregiver.body,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
  },
  periodChips: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  periodChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.neutral,
  },
  periodChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodChipText: {
    fontSize: theme.typography.caregiver.body,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  periodChipTextActive: {
    color: theme.colors.text.inverse,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.s,
  },
  submitError: {
    color: theme.colors.primary,
    fontSize: theme.typography.caregiver.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.s,
  },
  submitMessage: {
    color: theme.colors.success,
    fontSize: theme.typography.caregiver.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.s,
  },
  modalActionBtn: {
    flex: 1,
  },
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  deleteConfirmText: {
    fontSize: theme.typography.elder.body,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
});
