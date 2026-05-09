/*
  Warnings:

  - You are about to drop the column `resolved` on the `SosEvent` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Medication` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `SosEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SosEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elderProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "locationLat" REAL,
    "locationLng" REAL,
    "locationAddr" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SosEvent_elderProfileId_fkey" FOREIGN KEY ("elderProfileId") REFERENCES "ElderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SosEvent" ("createdAt", "elderProfileId", "id", "locationLat", "locationLng") SELECT "createdAt", "elderProfileId", "id", "locationLat", "locationLng" FROM "SosEvent";
DROP TABLE "SosEvent";
ALTER TABLE "new_SosEvent" RENAME TO "SosEvent";
CREATE TABLE "new_Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elderProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'MORNING',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "imageUrl" TEXT,
    "taken" BOOLEAN NOT NULL DEFAULT false,
    "date" TEXT NOT NULL,
    CONSTRAINT "Medication_elderProfileId_fkey" FOREIGN KEY ("elderProfileId") REFERENCES "ElderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Medication" ("dosage", "elderProfileId", "id", "name", "taken", "time") SELECT "dosage", "elderProfileId", "id", "name", "taken", "time" FROM "Medication";
DROP TABLE "Medication";
ALTER TABLE "new_Medication" RENAME TO "Medication";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
