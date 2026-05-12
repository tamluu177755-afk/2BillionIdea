import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getSocket, getElderUser, getAllUsers } from '../services/api';

interface User {
  id: string;
  phoneNumber: string;
  name: string;
  role: 'ELDER' | 'CAREGIVER';
  elderProfile?: {
    id: string;
    age?: number;
    gender?: string;
    medications: Medication[];
    vitals: any[];
    sosEvents: SosEvent[];
  };
}

interface Medication {
  id: string;
  name: string;
  time: string;
  dosage: string;
  period: 'MORNING' | 'NOON' | 'EVENING';
  status: 'PENDING' | 'TAKEN' | 'SKIPPED';
  taken: boolean;
}

interface SosEvent {
  id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'RESOLVED';
  locationAddr?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: string;
}

interface AppState {
  socket: Socket | null;
  elderUser: User | null;
  currentUser: User | null;
  allUsers: User[];
  activeSos: SosEvent | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initSocket: () => void;
  closeSocket: () => void;
  loadElderUser: () => Promise<void>;
  loadAllUsers: () => Promise<void>;
  setupSocketListeners: () => void;
  removeSocketListeners: () => void;
  updateMedication: (med: Medication) => void;
  setActiveSos: (sos: SosEvent | null) => void;
  resetError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  socket: null,
  elderUser: null,
  currentUser: null,
  allUsers: [],
  activeSos: null,
  isLoading: false,
  error: null,

  initSocket: () => {
    const socket = getSocket();
    set({ socket });
  },

  closeSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  loadElderUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await getElderUser();
      set({ elderUser: user });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load elder user' });
      console.error('Load elder user error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadAllUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await getAllUsers();
      set({ allUsers: users });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load users' });
      console.error('Load users error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setupSocketListeners: () => {
    const socket = get().socket;
    if (!socket) return;

    // Medication taken event
    socket.off('medication_taken');
    socket.on('medication_taken', (data: any) => {
      const state = get();
      if (state.elderUser?.elderProfile?.id === data.elderProfileId) {
        set({
          elderUser: {
            ...state.elderUser,
            elderProfile: {
              ...state.elderUser.elderProfile!,
              medications: state.elderUser.elderProfile!.medications.map(m =>
                m.id === data.medicationId ? { ...m, status: 'TAKEN', taken: true } : m
              )
            }
          }
        });
      }
    });

    // SOS alert event
    socket.off('sos_alert');
    socket.on('sos_alert', (data: any) => {
      set({
        activeSos: {
          id: data.sosId,
          elderProfileId: data.elderProfileId,
          locationAddr: data.locationAddr,
          status: 'ACTIVE',
          createdAt: data.createdAt
        }
      });
    });

    // SOS resolved event
    socket.off('sos_resolved');
    socket.on('sos_resolved', (data: any) => {
      set({ activeSos: null });
    });

    // SOS cancelled event
    socket.off('sos_cancelled');
    socket.on('sos_cancelled', (data: any) => {
      set({ activeSos: null });
    });

    // Vital updated
    socket.off('vital_updated');
    socket.on('vital_updated', (data: any) => {
      const state = get();
      if (state.elderUser?.elderProfile?.id === data.elderProfileId) {
        // Refresh elder user to get updated vitals
        get().loadElderUser();
      }
    });

    // Medication added -> refresh list
    socket.off('medication_added');
    socket.on('medication_added', (data: any) => {
      const state = get();
      if (state.elderUser?.elderProfile?.id === data.elderProfileId) {
        get().loadElderUser();
      }
    });

    // Medication deleted -> refresh list
    socket.off('medication_deleted');
    socket.on('medication_deleted', (data: any) => {
      const state = get();
      if (state.elderUser?.elderProfile?.id === data.elderProfileId) {
        get().loadElderUser();
      }
    });

    // Medication unconfirmed -> refresh list
    socket.off('medication_unconfirmed');
    socket.on('medication_unconfirmed', (data: any) => {
      const state = get();
      if (state.elderUser?.elderProfile?.id === data.elderProfileId) {
        get().loadElderUser();
      }
    });
  },

  removeSocketListeners: () => {
    const socket = get().socket;
    if (!socket) return;
    socket.off('medication_taken');
    socket.off('sos_alert');
    socket.off('sos_resolved');
    socket.off('sos_cancelled');
    socket.off('vital_updated');
    socket.off('medication_added');
    socket.off('medication_deleted');
    socket.off('medication_unconfirmed');
  },

  updateMedication: (med: Medication) => {
    const state = get();
    if (state.elderUser?.elderProfile) {
      set({
        elderUser: {
          ...state.elderUser,
          elderProfile: {
            ...state.elderProfile!,
            medications: state.elderUser.elderProfile.medications.map(m =>
              m.id === med.id ? med : m
            )
          }
        }
      });
    }
  },

  setActiveSos: (sos: SosEvent | null) => {
    set({ activeSos: sos });
  },

  resetError: () => {
    set({ error: null });
  }
}));
