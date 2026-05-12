import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding An Gia production demo data...');
  const today = new Date().toISOString().split('T')[0];

  // Clean existing data to ensure a fresh start for demo
  await prisma.caregiverRelation.deleteMany({});
  await prisma.medication.deleteMany({});
  await prisma.vitalRecord.deleteMany({});
  await prisma.sosEvent.deleteMany({});
  await prisma.elderProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Elder User
  const elderUser = await prisma.user.create({
    data: {
      phoneNumber: '0901234567',
      name: 'Ông Minh',
      role: 'ELDER',
      elderProfile: {
        create: {
          age: 72, 
          gender: 'Nam', 
          height: 165, 
          weight: 68,
          conditions: '["Cao huyết áp", "Tiểu đường tuýp 2"]',
          vitals: {
            create: [
              { type: 'BLOOD_PRESSURE', value: '120/80' },
              { type: 'HEART_RATE', value: '75' },
            ]
          },
          medications: {
            create: [
              { 
                name: 'Omega-3 (Dầu cá)', 
                dosage: '1 viên', 
                time: '07:30', 
                period: 'MORNING', 
                status: 'PENDING', 
                taken: false, 
                date: today 
              },
              { 
                name: 'Men tiêu hóa', 
                dosage: '1 gói', 
                time: '12:00', 
                period: 'NOON', 
                status: 'PENDING', 
                taken: false, 
                date: today 
              },
              { 
                name: 'Calcium (Canxi)', 
                dosage: '1 viên', 
                time: '19:30', 
                period: 'EVENING', 
                status: 'PENDING', 
                taken: false, 
                date: today 
              },
              { 
                name: 'Huyết áp', 
                dosage: '1 viên', 
                time: '08:00', 
                period: 'MORNING', 
                status: 'TAKEN', 
                taken: true, 
                date: today 
              },
            ]
          }
        }
      }
    },
    include: { elderProfile: true }
  });

  // 2. Create Caregiver User
  const caregiverUser = await prisma.user.create({
    data: {
      phoneNumber: '0987654321',
      name: 'Anh Tuấn',
      role: 'CAREGIVER'
    }
  });

  // 3. Link them
  if (elderUser.elderProfile) {
    await prisma.caregiverRelation.create({
      data: { 
        elderId: elderUser.id, 
        caregiverId: caregiverUser.id, 
        relation: 'Con trai' 
      }
    });
  }

  console.log('✅ Seeded successfully.');
  console.log('Elder Login: 0901234567 (Ông Minh)');
  console.log('Caregiver Login: 0987654321 (Anh Tuấn)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
