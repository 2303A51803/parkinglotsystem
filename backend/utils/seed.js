require('dotenv').config();
const { sequelize, connectDB } = require('../config/db');
const { User, ParkingSlot } = require('../models'); // triggers association setup
const { ROLES } = require('../config/constants');

const ZONES = ['A', 'B', 'C'];
const SLOTS_PER_ZONE = 6;

const buildSlots = () => {
  const slots = [];
  let row = 0;

  ZONES.forEach((zone, zoneIndex) => {
    for (let i = 1; i <= SLOTS_PER_ZONE; i += 1) {
      const isEv = zone === 'C' && i <= 2; // a couple of EV slots in zone C
      const vehicleTypes = isEv
        ? ['EV', 'CAR']
        : i % 5 === 0
          ? ['BIKE']
          : i % 4 === 0
            ? ['SUV', 'CAR']
            : ['CAR'];

      slots.push({
        slotNumber: `${zone}0${i}`,
        floor: zoneIndex,
        zone,
        vehicleTypes,
        pricePerHour: isEv ? 50 : vehicleTypes.includes('SUV') ? 45 : vehicleTypes.includes('BIKE') ? 20 : 30,
        distanceFromEntrance: (zoneIndex * SLOTS_PER_ZONE + i) * 8,
        hasCharger: isEv,
        chargerStatus: isEv ? 'AVAILABLE' : 'NONE',
        coordinateRow: row,
        coordinateCol: i,
      });
    }
    row += 1;
  });

  return slots;
};

const seed = async () => {
  await connectDB();

  const adminEmail = 'nithinbodas752@gmail.com';
  const adminPassword = '9908328583';
  const existingUser = await User.findOne({ where: { email: adminEmail } });

  if (!existingUser) {
    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: ROLES.ADMIN,
    });
    console.log(`Created admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    existingUser.name = 'System Admin';
    existingUser.password = adminPassword;
    existingUser.role = ROLES.ADMIN;
    await existingUser.save();
    console.log(`Updated existing user to admin: ${adminEmail} / ${adminPassword}`);
  }

  const slotCount = await ParkingSlot.count();
  if (slotCount === 0) {
    const slots = buildSlots();
    await ParkingSlot.bulkCreate(slots);
    console.log(`Inserted ${slots.length} demo parking slots across zones ${ZONES.join(', ')}`);
  } else {
    console.log(`parking_slots table already has ${slotCount} rows, skipping slot seed`);
  }

  await sequelize.close();
  console.log('Seeding complete.');
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
