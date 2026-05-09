import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding An Gia data...');
  const today = new Date().toISOString().split('T')[0];

  const elderUser = await prisma.user.create({
    data: {
      phoneNumber: '0901234567',
      name: 'Ông Minh',
      role: 'ELDER',
      elderProfile: {
        create: {
          age: 72, gender: 'Nam', height: 165, weight: 68,
          conditions: '["Cao huyết áp", "Tiểu đường tuýp 2"]',
          vitals: {
            create: [
              { type: 'BLOOD_PRESSURE', value: '120/80' },
              { type: 'HEART_RATE', value: '75' },
            ]
          },
          medications: {
            create: [
              { name: 'Huyết áp', dosage: '2 viên', time: '08:00', period: 'MORNING', status: 'TAKEN', taken: true, date: today, imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80' },
              { name: 'Tim mạch', dosage: '2 viên', time: '09:00', period: 'MORNING', status: 'PENDING', taken: false, date: today, imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=80' },
              { name: 'Tiểu đường', dosage: '1 viên', time: '12:30', period: 'NOON', status: 'PENDING', taken: false, date: today, imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=80' },
              { name: 'Mỡ máu', dosage: '1 viên', time: '20:00', period: 'EVENING', status: 'PENDING', taken: false, date: today, imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=80' },
              { name: 'Vitamin D', dosage: '1 viên', time: '20:30', period: 'EVENING', status: 'PENDING', taken: false, date: today },
            ]
          }
        }
      }
    },
    include: { elderProfile: true }
  });

  await prisma.user.create({
    data: {
      phoneNumber: '0987654321',
      name: 'Anh Tuấn',
      role: 'CAREGIVER'
    }
  });

  if (elderUser.elderProfile) {
    await prisma.caregiverRelation.create({
      data: { elderId: elderUser.id, caregiverId: (await prisma.user.findFirst({ where: { role: 'CAREGIVER' } }))!.id, relation: 'Con trai' }
    });
  }
  console.log('✅ Seeded successfully. Elder:', elderUser.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
