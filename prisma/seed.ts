import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data for Eid 2026...');

  const mosque = await prisma.mosque.create({
    data: {
      name: 'Baitul Mukarram National Mosque',
      nameBn: 'বায়েতুল মুকাররম জাতীয় মসজিদ',
      lat: 23.7308,
      lng: 90.4172,
      photoUrl: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=400',
      submittedBy: null,  // ✅ Changed from 'seed-user-001' to null
      prayerTimes: {
        create: [
          {
            jamaatTime: '07:30',
            year: 2026,
            voteCount: 5,
            isSelected: true,
            submittedBy: null,  // ✅ Also null here
          },
          {
            jamaatTime: '08:00',
            year: 2026,
            voteCount: 2,
            isSelected: false,
            submittedBy: null,
          },
          {
            jamaatTime: '08:30',
            year: 2026,
            voteCount: 0,
            isSelected: false,
            submittedBy: null,
          },
        ],
      },
    },
  });

  console.log('✅ Created mosque:', mosque.name);
  console.log('🕌 Added 3 Eid prayer times: 07:30, 08:00, 08:30');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
