import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting seeding process...');

  // Path to your JSON file
  const filePath = path.join(__dirname, 'pincode.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  // Iterate through States
  for (const stateName in data) {
    console.log(`📍 Processing State: ${stateName}`);

    // Create State
    const state = await prisma.state.upsert({
      where: { name: stateName },
      update: {},
      create: { name: stateName },
    });

    // Iterate through Cities in that State
    for (const cityName in data[stateName]) {
      const pincodesArray = data[stateName][cityName];

      // Create City
      const city = await prisma.city.upsert({
        where: {
          name_stateId: {
            name: cityName,
            stateId: state.id,
          },
        },
        update: {},
        create: {
          name: cityName,
          stateId: state.id,
        },
      });

      // Prepare Pincodes for bulk insert
      const pincodeData = pincodesArray.map((code: number | string) => ({
        code: code.toString(),
        cityId: city.id,
      }));

      // Create Pincodes (using createMany for speed)
      await prisma.pincode.createMany({
        data: pincodeData,
        skipDuplicates: true,
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });