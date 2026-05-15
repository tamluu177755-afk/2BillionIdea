# AGENTS.md – AnGia (CareConnect) Codebase Guide

## Project Overview

**CareConnect (An Gia)** is a healthcare tracking app for elderly people (60+) and their caregivers. Key features:
- **Medication reminders & tracking**: Elderly users confirm medication intake; caregivers monitor compliance
- **Vital signs monitoring**: Blood pressure, heart rate, blood sugar, weight tracking
- **SOS emergency alerts**: 3-second emergency response with GPS location, camera feed, and direct contact
- **Real-time synchronization**: Instant updates between elderly and caregiver via Socket.io
- **Caregiver dashboard**: Remote monitoring of health status, location, and activity

See [PRD.md](PRD.md) for full product requirements and [User_Flow.md](User_Flow.md) for interaction flows.

---

## Architecture

### Backend Stack
- **Runtime**: Node.js, TypeScript
- **Server**: Express.js 5, HTTP + Socket.io for real-time events
- **Database**: Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **CORS**: Enabled for mobile/web clients

**Key Endpoints**:
```
GET  /health                            # Server health check
GET  /api/users                         # All users with profiles
GET  /api/elder/:id                     # Elder profile + latest vitals, meds, SOS
GET  /api/medications/:elderProfileId   # Medication list ordered by time
PATCH /api/medications/:id/confirm      # Mark medication as taken (broadcasts via Socket.io)
POST /api/sos                           # Trigger SOS alert (broadcasts via Socket.io)
```

**Real-time Events** (Socket.io):
- `medication_taken`: Notifies caregivers when elderly takes medication
- `sos_alert`: Broadcasts emergency SOS to caregivers immediately

**Data Models** (see `backend/prisma/schema.prisma`):
- `User`: Phone-based identity (role: ELDER | CAREGIVER)
- `ElderProfile`: Health data container, 1:1 with User
- `Medication`: Daily medication schedule with time and status
- `VitalRecord`: Health metrics (BP, HR, blood sugar, weight)
- `SosEvent`: Emergency event with location and status
- `CaregiverRelation`: Links caregiver to elder (supports multiple caregivers per elder)

### Mobile Stack
- **Framework**: React Native 0.81 (Expo 54)
- **Navigation**: React Navigation (bottom tabs + native stack)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: Socket.io client
- **API Service**: `src/services/api.ts`

**Key Screens**:
- `RoleSelectorScreen`: Choose ELDER or CAREGIVER role
- `ElderlyHome`: Main view (greetings, medication summary, SOS button)
- `MedicationReminder`: Detailed medication list with confirm action
- `CaregiverDashboard`: Monitoring view (status, location, camera feed)
- `SosAlertScreen` / `SosSendingScreen`: Emergency flow
- `HealthInput`: Record vital signs
- `ElderlyProfile`: Edit profile details

---

## Quick Start

### Backend
```bash
cd backend
npm install
npm run build      # Compile TypeScript, generate Prisma client
npm run dev        # Development with nodemon
npm start          # Production (requires NODE_ENV=production)
```

**Environment** (create `.env` in `backend/`):
```
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/angia"
# or for SQLite: DATABASE_URL="file:./prisma/dev.db"
```

**Database Setup**:
```bash
npm run build      # Generates Prisma client
npx prisma migrate deploy  # Run migrations
npx prisma db seed        # Seed data (if seed.ts is implemented)
```

### Mobile
```bash
cd mobile
npm install
npm start          # Expo CLI (choose iOS/Android/web)
npm run android    # Launch Android emulator
npm run ios        # Launch iOS simulator
npm run build:web  # Build for web
```

---

## Development Conventions

### TypeScript & Code Style
- **Strict mode**: `tsconfig.json` enforces strict type checking
- **Backend**: Express types via `@types/express`, `@types/cors`, `@types/node`
- **Mobile**: React Native types via `@types/react`, `@expo/*` typed packages
- **No runtime checks**: Rely on TypeScript for safety; avoid runtime validation libraries unless necessary

### Database
- **Migrations first**: All schema changes → Prisma migrations (don't edit schema.prisma directly in production)
- **Timestamps**: `createdAt` (immutable), `updatedAt` (auto-update) on all models
- **Relations**: Use `onDelete: Cascade` to maintain data integrity
- **Indices**: Phone number and IDs are unique; add indices for frequent queries

### API Design
- **Status codes**: 200 OK, 201 Created, 404 Not Found, 500 Server Error
- **Error responses**: `{ error: "Message" }`
- **Real-time first**: Use Socket.io events for urgent updates (SOS, medication taken), not polling
- **Pagination**: Not yet implemented; add `skip`/`take` to `findMany()` when scaling

### Mobile UI
- **Components**: Reusable in `src/components/` (Button, Card patterns)
- **Screens**: Navigation targets in `src/screens/`
- **Navigation**: Bottom-tab navigator (ELDER role) vs stack-based (CAREGIVER role) — see `AppNavigator.tsx`
- **Theme**: Centralized in `src/theme/theme.ts`; use theme colors for consistency
- **State**: Zustand stores for global state (auth, socket connection, user profile)

---

## Common Patterns

### Real-time Updates (Socket.io)
```typescript
// Backend: Broadcast event when action happens
io.emit('medication_taken', { medicationId: med.id, elderProfileId: ... });

// Mobile: Listen in useEffect
socket.on('medication_taken', (data) => { /* update UI */ });
```

### API Calls
```typescript
// Mobile: Use axios from api.ts service
const { data } = await api.get(`/api/elder/${elderId}`);

// Add error handling for network failures
try { ... } catch (e) { console.error('Network error'); }
```

### Database Queries
```typescript
// Backend: Always include related data if needed
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    elderProfile: {
      include: { medications: true, vitals: true }
    }
  }
});
```

---

## Key Architecture Decisions

1. **Socket.io for real-time**: Chosen over polling for low-latency SOS alerts (3-second response target)
2. **Phone-number auth**: Users identified by `phoneNumber` (unique); enables SMS reminders (see `expo-sms`)
3. **Caregiver relations**: Many-to-many (multiple caregivers per elder) for family support
4. **Role-based UI**: Mobile app bifurcates UI (ELDER vs CAREGIVER) rather than separate apps
5. **Timestamp ordering**: Vital records and medications ordered by time for meaningful health tracking

---

## Potential Pitfalls

### Backend
- ⚠️ **Prisma client generation**: Always run `npx prisma generate` after schema changes; missing this breaks the build
- ⚠️ **CORS origin**: Currently set to `'*'`; restrict to specific domains in production
- ⚠️ **Socket.io scalability**: Current broadcast (`io.emit`) sends to all clients; use rooms for targeted messages when scaling
- ⚠️ **No error logging**: Add structured logging (Winston, Pino) before production

### Mobile
- ⚠️ **Network timeout**: Axios default timeout is high; add explicit timeout config for SOS API calls
- ⚠️ **Deep linking**: Not yet implemented; required for direct navigation to SOS or medication alerts
- ⚠️ **Permissions**: Camera, location, SMS require runtime permissions (not yet configured in app.json)
- ⚠️ **Stale data**: Socket.io listeners not cleaned up on screen unmount; use `useEffect` cleanup to avoid memory leaks

---

## Testing & Deployment

- **Testing**: No test suite yet (scripts show placeholder)
  - Recommended: Jest (backend), Testing Library (mobile)
- **Deployment**:
  - Backend: Deploy to Render, Railway, or self-hosted Node.js server
  - Mobile: Use EAS (Expo Application Services) for build + distribution
  - See [MOBILE_DEPLOYMENT_GUIDE.md](MOBILE_DEPLOYMENT_GUIDE.md)

---

## Key Files to Know

- **Backend entry**: `backend/src/index.ts` — Express app setup, Socket.io, all routes
- **Data model**: `backend/prisma/schema.prisma` — Single source of truth for database
- **Mobile entry**: `mobile/src/index.ts` (minimal); actual app in `mobile/App.tsx`
- **Navigation**: `mobile/src/navigation/AppNavigator.tsx` — Tab/stack structure
- **API client**: `mobile/src/services/api.ts` — Axios instance, backend URL
- **Theme**: `mobile/src/theme/theme.ts` — Colors, fonts, spacing

---

## For AI Agents

When working on this codebase:
1. **Read [PRD.md](PRD.md) first** to understand user needs and pain points
2. **Check migrations** before querying: understand what fields exist in the database
3. **Test Socket.io events** in both directions (elderly → backend → caregiver)
4. **Verify TypeScript types**: Invalid model access will break the build
5. **Remember emergency flow**: SOS alerts must complete within 3 seconds; prioritize latency over perfection
6. **Phone numbers are keys**: Many queries filter by `phoneNumber`; ensure it stays unique
