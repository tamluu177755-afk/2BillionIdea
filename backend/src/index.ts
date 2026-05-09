import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Health ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'An Gia API is running' });
});

// ─── Get all users ───────────────────────────────────────────────────
app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { elderProfile: true } });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Get elder full profile ───────────────────────────────────────────
app.get('/api/elder/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        elderProfile: {
          include: {
            vitals: { orderBy: { recordedAt: 'desc' }, take: 5 },
            medications: {
              orderBy: { time: 'asc' }
            },
            sosEvents: { where: { status: 'ACTIVE' } }
          }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Get today's medications for elder profile ────────────────────────
app.get('/api/medications/:elderProfileId', async (req, res) => {
  try {
    const meds = await prisma.medication.findMany({
      where: { elderProfileId: req.params.elderProfileId },
      orderBy: { time: 'asc' }
    });
    res.json(meds);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Confirm medication taken ─────────────────────────────────────────
app.patch('/api/medications/:id/confirm', async (req, res) => {
  try {
    const med = await prisma.medication.update({
      where: { id: req.params.id },
      data: { status: 'TAKEN', taken: true }
    });
    // Broadcast to caregiver
    io.emit('medication_taken', { medicationId: med.id, elderProfileId: med.elderProfileId, name: med.name, time: new Date().toISOString() });
    res.json(med);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Trigger SOS ─────────────────────────────────────────────────────
app.post('/api/sos', async (req, res) => {
  try {
    const { elderProfileId, locationLat, locationLng, locationAddr } = req.body;
    const sos = await prisma.sosEvent.create({
      data: { elderProfileId, locationLat, locationLng, locationAddr, status: 'ACTIVE' }
    });
    // Broadcast SOS to all caregivers immediately
    io.emit('sos_alert', { sosId: sos.id, elderProfileId, locationAddr, createdAt: sos.createdAt });
    res.status(201).json(sos);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Cancel SOS ──────────────────────────────────────────────────────
app.patch('/api/sos/:id/cancel', async (req, res) => {
  try {
    const sos = await prisma.sosEvent.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    io.emit('sos_cancelled', { sosId: sos.id });
    res.json(sos);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Resolve SOS (caregiver confirms safe) ───────────────────────────
app.patch('/api/sos/:id/resolve', async (req, res) => {
  try {
    const sos = await prisma.sosEvent.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED' }
    });
    io.emit('sos_resolved', { sosId: sos.id });
    res.json(sos);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Get active SOS ──────────────────────────────────────────────────
app.get('/api/sos/active', async (_req, res) => {
  try {
    const sos = await prisma.sosEvent.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { elderProfile: { include: { user: true } } }
    });
    res.json(sos);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Add vital sign ──────────────────────────────────────────────────
app.post('/api/vitals', async (req, res) => {
  try {
    const { elderProfileId, type, value } = req.body;
    const vital = await prisma.vitalRecord.create({
      data: { elderProfileId, type, value }
    });
    // Optional: emit to caregiver
    io.emit('vital_updated', { elderProfileId, type, value, recordedAt: vital.recordedAt });
    res.status(201).json(vital);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Socket.IO ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`An Gia API + Socket.IO running on http://0.0.0.0:${PORT}`);
});
