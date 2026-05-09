import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

// ── Base URL ─────────────────────────────────────────────────────────
// Use environment variable for Vercel deployment, fallback to local IP for dev
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.30.81:3000';


export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Socket ────────────────────────────────────────────────────────────
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(BASE_URL, { transports: ['websocket'], reconnection: true });
  }
  return socket;
};

// ── Elder & Users ─────────────────────────────────────────────────────
export const getAllUsers = async () => {
  const r = await api.get('/api/users');
  return r.data;
};

export const getElderUser = async () => {
  const users = await getAllUsers();
  const elder = users.find((u: any) => u.role === 'ELDER');
  if (elder) {
    const r = await api.get(`/api/elder/${elder.id}`);
    return r.data;
  }
  return null;
};

// ── Medications ───────────────────────────────────────────────────────
export const getTodayMedications = async (elderProfileId: string) => {
  const r = await api.get(`/api/medications/${elderProfileId}`);
  return r.data;
};

export const confirmMedication = async (medicationId: string) => {
  const r = await api.patch(`/api/medications/${medicationId}/confirm`);
  return r.data;
};

// ── SOS ───────────────────────────────────────────────────────────────
export const triggerSos = async (elderProfileId: string, locationAddr?: string) => {
  const r = await api.post('/api/sos', { elderProfileId, locationAddr });
  return r.data;
};

export const cancelSos = async (sosId: string) => {
  const r = await api.patch(`/api/sos/${sosId}/cancel`);
  return r.data;
};

export const resolveSos = async (sosId: string) => {
  const r = await api.patch(`/api/sos/${sosId}/resolve`);
  return r.data;
};

export const getActiveSos = async () => {
  const r = await api.get('/api/sos/active');
  return r.data;
};

// ── Vitals ────────────────────────────────────────────────────────────
export const addVitalSign = async (elderProfileId: string, type: string, value: string) => {
  const r = await api.post('/api/vitals', { elderProfileId, type, value });
  return r.data;
};
