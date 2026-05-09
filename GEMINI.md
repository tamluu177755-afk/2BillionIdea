# GEMINI.md - An Gia (CareConnect) Project Context

## Project Overview
**An Gia** (also referred to as **CareConnect** in PRD) is a healthcare application designed for the elderly and their caregivers. It focuses on medication reminders, vital sign tracking (blood pressure, heart rate, etc.), and emergency SOS alerts with real-time notifications.

The project is structured as a monorepo-style directory containing two main components:
- `backend/`: A Node.js/Express API with Socket.IO and Prisma.
- `mobile/`: A React Native application built with Expo.

## Tech Stack
### Mobile (`/mobile`)
- **Framework:** React Native via [Expo](https://expo.dev/) (SDK 54)
- **Language:** TypeScript
- **Navigation:** React Navigation (Native Stack, Bottom Tabs)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Real-time:** Socket.IO Client
- **Styling:** Custom theme located in `src/theme/theme.ts`

### Backend (`/backend`)
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript (`ts-node` for execution)
- **Database:** SQLite (for development) via [Prisma ORM](https://www.prisma.io/)
- **Real-time:** Socket.IO
- **Environment:** Managed via `.env`

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- Expo Go app on mobile or an emulator for mobile development.

### Setup & Execution
1.  **Backend:**
    ```bash
    cd backend
    npm install
    npx prisma migrate dev --name init
    # To start normally:
    npx ts-node src/index.ts
    ```
2.  **Mobile:**
    ```bash
    cd mobile
    npm install
    npx expo start
    ```

### Utility Scripts (Root Directory)
- `start-backend.js`: Starts the backend in the background and logs to `backend-out.log`.
- `start-expo.js`: Starts Expo with `--tunnel` in the background and logs to `expo-out.log`.
- `get-ip.js`: Likely used to find local IP for device connectivity.
- `kill-port.ps1`: PowerShell script to free up ports (useful for backend/expo restarts).

## Architecture & Conventions

### Database Schema (`backend/prisma/schema.prisma`)
- **User:** Stores core identity and roles (`ELDER` or `CAREGIVER`).
- **ElderProfile:** Extended profile for elderly users, linked to vitals, medications, and SOS events.
- **VitalRecord:** Tracks blood pressure, heart rate, etc.
- **Medication:** Daily medication schedule and intake status.
- **SosEvent:** Tracks emergency alerts and their resolution status.

### Real-time Communication
The system uses Socket.IO for immediate notifications:
- `sos_alert`: Sent to caregivers when an elderly user triggers SOS.
- `medication_taken`: Sent to caregivers when a medication is confirmed.
- `vital_updated`: Optional update for real-time health monitoring.

### Mobile Navigation (`mobile/src/navigation/AppNavigator.tsx`)
- Starts with `RoleSelector` to branch into either the Elderly or Caregiver experience.
- Elderly flow: `ElderlyHome` -> `MedReminder` / `ElderProfile` / `SosSending`.
- Caregiver flow: `CaregiverDashboard` -> `SosAlert` (high priority overlay).

### Coding Standards
- **TypeScript:** Use strict typing where possible.
- **Components:** Functional components with Hooks.
- **API Calls:** Handled via services (likely in `mobile/src/services/api.ts`).
- **Styles:** Use the centralized `theme.ts` for consistency.

## Key Files
- `PRD.md`: Detailed product requirements and roadmap.
- `User_Flow.md`: Visual/Logical walkthrough of user interactions.
- `backend/prisma/schema.prisma`: The "source of truth" for the data model.
- `backend/src/index.ts`: API entry point and socket event definitions.
- `mobile/App.tsx`: Mobile entry point.
