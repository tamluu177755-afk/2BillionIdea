import { create } from 'zustand';
import { getElderUser, confirmMedication } from '../services/api';

interface HealthState {
  userData: any;
  medications: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  markMedAsTaken: (medId: string) => Promise<void>;
  setUserData: (data: any) => void;
}

export const useStore = create<HealthState>((set, get) => ({
  userData: null,
  medications: [],
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await getElderUser();
      set({ 
        userData: data, 
        medications: data?.elderProfile?.medications || [],
        loading: false 
      });
    } catch (err) {
      console.error('Fetch error:', err);
      // Fallback data for testing if API fails
      if (!get().userData) {
        set({
          userData: { name: 'Ông Minh' },
          medications: [
            { id: '1', name: 'Thuốc Huyết Áp', time: '08:00', dosage: '1 viên', period: 'MORNING', status: 'TAKEN' },
            { id: '2', name: 'Thuốc Tiểu Đường', time: '12:00', dosage: '1 viên', period: 'NOON', status: 'PENDING' },
            { id: '3', name: 'Thuốc Bổ Não', time: '20:00', dosage: '1 viên', period: 'EVENING', status: 'PENDING' }
          ],
          loading: false
        });
      } else {
        set({ loading: false });
      }
    }
  },

  markMedAsTaken: async (medId: string) => {
    // Optimistic update
    const currentMeds = get().medications;
    const updatedMeds = currentMeds.map(m => m.id === medId ? { ...m, status: 'TAKEN' } : m);
    set({ medications: updatedMeds });

    try {
      await confirmMedication(medId);
      // Optionally re-fetch to be sure
      // await get().fetchData();
    } catch (err) {
      console.error('Confirm error:', err);
      // Rollback if failed
      set({ medications: currentMeds });
    }
  },

  setUserData: (data) => set({ userData: data }),
}));
