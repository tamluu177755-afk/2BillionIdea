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
    // Keep this query lightweight and resilient; mobile only needs role + id here.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    res.json(users);
  } catch (e) {
    console.error('GET /api/users error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Get default elder profile (fallback for mobile bootstrap) ──────
app.get('/api/elder/default', async (_req, res) => {
  try {
    const elder = await prisma.user.findFirst({
      where: { role: 'ELDER' },
      include: {
        elderProfile: {
          include: {
            vitals: { orderBy: { recordedAt: 'desc' }, take: 5 },
            medications: { orderBy: { time: 'asc' } },
            sosEvents: { where: { status: 'ACTIVE' } }
          }
        }
      }
    });
    if (!elder) return res.status(404).json({ error: 'Elder not found' });
    res.json(elder);
  } catch (e) {
    console.error('GET /api/elder/default error:', e);
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
    console.error('GET /api/elder/:id error:', e);
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

// ─── Add medication for elder profile ───────────────────────────────
app.post('/api/medications', async (req, res) => {
  try {
    const { elderProfileId, name, dosage, time, period, imageUrl } = req.body;
    if (!elderProfileId || !name || !time) return res.status(400).json({ error: 'Missing required fields' });

    // default date to today (YYYY-MM-DD)
    const date = new Date().toISOString().slice(0, 10);

    const med = await prisma.medication.create({
      data: {
        elderProfileId,
        name,
        dosage: dosage || '',
        time,
        period: period || 'MORNING',
        imageUrl: imageUrl || null,
        taken: false,
        status: 'PENDING',
        date
      }
    });

    // Broadcast new medication to caregivers so UIs update
    io.emit('medication_added', { medicationId: med.id, elderProfileId: med.elderProfileId, name: med.name, time: med.time });

    res.status(201).json(med);
  } catch (e) {
    console.error('Add medication error', e);
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

// ─── Un-confirm medication (mark as not taken) ─────────────────────
app.patch('/api/medications/:id/unconfirm', async (req, res) => {
  try {
    const med = await prisma.medication.update({
      where: { id: req.params.id },
      data: { status: 'PENDING', taken: false }
    });
    // Broadcast to caregiver
    io.emit('medication_unconfirmed', { medicationId: med.id, elderProfileId: med.elderProfileId, name: med.name });
    res.json(med);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Delete medication ─────────────────────────────────────────────
app.delete('/api/medications/:id', async (req, res) => {
  try {
    const med = await prisma.medication.delete({
      where: { id: req.params.id }
    });
    // Broadcast to caregiver
    io.emit('medication_deleted', { medicationId: med.id, elderProfileId: med.elderProfileId, name: med.name });
    res.json(med);
  } catch (e) {
    console.error('Delete medication error', e);
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
  
  socket.on('video_frame', (data) => {
    // Broadcast the frame to all other connected clients (like the mobile app)
    socket.broadcast.emit('video_frame', data);
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`An Gia API + Socket.IO running on http://0.0.0.0:${PORT}`);
});
