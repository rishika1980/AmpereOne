require('dotenv').config();
const mongoose = require('mongoose');
const Builder = require('../models/Builder');
const Society = require('../models/Society');
const Block = require('../models/Block');
const Floor = require('../models/Floor');
const Flat = require('../models/Flat');
const CommonArea = require('../models/CommonArea');
const Device = require('../models/Device');
const Reading = require('../models/Reading');
const User = require('../models/User');

const NAMES = [
  'Rajesh Kumar','Priya Sharma','Amit Singh','Sunita Devi','Vikram Patel',
  'Kavita Joshi','Rohit Gupta','Anita Yadav','Suresh Nair','Meena Iyer',
  'Deepak Verma','Pooja Agarwal','Ravi Shastri','Sonal Mehta','Arun Tiwari',
  'Geeta Pandey','Manoj Saxena','Rekha Mishra','Vijay Bhat','Usha Pillai',
  'Nikhil Jain','Swati Chandra','Praveen Rao','Lata Kulkarni','Dinesh Shah',
  'Asha Desai','Hemant Patil','Nisha Bhatt','Sanjay Dubey','Radha Shetty',
  'Kiran Bansal','Manju Tripathi','Alok Sharma','Sunita Gupta','Pawan Mehta',
  'Ritu Singh','Gaurav Joshi','Pooja Verma','Sachin Yadav','Manisha Patel',
  'Rajeev Shukla','Kaveri Reddy','Santosh Nair','Priya Iyer','Mohan Das',
  'Laxmi Bai','Sunil Kumar','Rani Devi','Harish Tiwari','Seema Agarwal',
  'Vinod Pandey','Gita Mishra','Ramesh Bhat','Saroj Shetty','Anil Bansal',
  'Meera Tripathi','Rajiv Sharma','Kamla Gupta','Ashok Mehta','Bindu Singh',
  'Kamal Joshi','Sandhya Verma','Pranav Yadav','Shilpa Patel','Vivek Shukla',
  'Neha Reddy','Yogesh Nair','Padma Iyer','Girish Das','Savita Bai',
  'Umesh Kumar','Leela Devi','Amar Tiwari','Puja Agarwal','Bharat Pandey',
  'Sarla Mishra','Devendra Bhat','Shanta Shetty','Kishore Bansal','Geeta Tripathi',
  'Narendra Sharma','Kamini Gupta','Suresh Mehta','Vandana Singh','Raghav Joshi',
  'Anjali Verma','Pramod Yadav','Rekha Patel','Dilip Shukla','Radha Reddy',
  'Hemant Nair','Sunanda Iyer','Chandra Das','Saraswati Bai','Vinayak Kumar',
  'Durga Devi','Harish Tiwari2','Shushma Agarwal','Brijesh Pandey','Kalyani Mishra'
];

const getKwForHour = (hour, multiplier) => {
  let base;
  if (hour < 5) base = 0.2 + Math.random() * 0.3;
  else if (hour < 7) base = 0.5 + Math.random() * 0.4;
  else if (hour < 10) base = 2.0 + Math.random() * 2.0;
  else if (hour < 17) base = 0.8 + Math.random() * 0.8;
  else if (hour < 22) base = 2.5 + Math.random() * 2.0;
  else base = 0.5 + Math.random() * 0.4;
  return parseFloat((base * multiplier).toFixed(2));
};

const getKwCommon = (hour, category) => {
  const base = {
    'Vertical Transport': hour >= 7 && hour <= 22 ? 2.5 + Math.random() * 2 : 0.5,
    'Water Systems': (hour >= 5 && hour <= 9) || (hour >= 18 && hour <= 22) ? 4 + Math.random() * 3 : 1,
    'Lighting': hour >= 18 || hour <= 6 ? 3 + Math.random() * 2 : 0.3,
    'Recreational': hour >= 6 && hour <= 22 ? 1.5 + Math.random() : 0.1
  };
  return parseFloat((base[category] || 1).toFixed(2));
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // Clear all
  await Promise.all([Builder,Society,Block,Floor,Flat,CommonArea,Device,Reading,User].map(M => M.deleteMany({})));
  console.log('🗑  Cleared existing data');

  // 1. Builder
  const builder = await Builder.create({ name: 'Skyline Developers Pvt. Ltd.', email: 'builder@ampereone.io' });
  console.log('✅ Builder created');

  // 2. Two societies
  const societies = await Society.create([
    { builderId: builder._id, name: 'Green Valley Apartments', address: 'Sector 14, Vaishali Nagar', city: 'Jaipur', totalBlocks: 3 },
    { builderId: builder._id, name: 'Sunrise Heights', address: 'Malviya Nagar', city: 'Jaipur', totalBlocks: 3 }
  ]);
  console.log('✅ 2 Societies created');

  // 3. Blocks, Floors, Flats for each society
  const allFlats = [];
  let nameIdx = 0;

  for (const society of societies) {
    const blockNames = ['Block A', 'Block B', 'Block C'];
    for (const bName of blockNames) {
      const block = await Block.create({ societyId: society._id, name: bName });

      for (let f = 1; f <= 4; f++) {
        const floor = await Floor.create({ blockId: block._id, societyId: society._id, floorNumber: f });

        for (let u = 1; u <= 4; u++) {
          const flatNumber = `${bName.split(' ')[1]}-${f}0${u}`;
          const bhk = ['1BHK','2BHK','2BHK','3BHK'][u-1];
          const multiplier = parseFloat((0.6 + Math.random() * 0.9).toFixed(2));
          const flat = await Flat.create({
            floorId: floor._id,
            blockId: block._id,
            societyId: society._id,
            flatNumber,
            bhkType: bhk,
            status: 'occupied',
            occupantName: NAMES[nameIdx % NAMES.length],
            baseMultiplier: multiplier
          });
          allFlats.push({ flat, block, floor, society });
          nameIdx++;
        }
      }
    }

    // Common areas
    const commonAreaDefs = [
      { name: 'Lift 1', category: 'Vertical Transport', floorOrLocation: 'All Floors' },
      { name: 'Lift 2', category: 'Vertical Transport', floorOrLocation: 'All Floors' },
      { name: 'Water Pump 1', category: 'Water Systems', floorOrLocation: 'Ground' },
      { name: 'Water Pump 2', category: 'Water Systems', floorOrLocation: 'Terrace' },
      { name: 'Common Lighting', category: 'Lighting', floorOrLocation: 'All Floors' },
      { name: 'Gym', category: 'Recreational', floorOrLocation: 'Ground Floor' }
    ];
    for (const ca of commonAreaDefs) {
      await CommonArea.create({ ...ca, societyId: society._id });
    }
  }
  console.log(`✅ ${allFlats.length} Flats + Common Areas created`);

  // 4. Devices for all flats
  const allDevices = [];
  for (const { flat, block, society } of allFlats) {
    const blockLetter = block.name.split(' ')[1];
    const serial = `MTR-${blockLetter}${flat.flatNumber.split('-')[1]}-${flat.flatNumber.split('-')[2]}-${Math.floor(Math.random()*900)+100}`;
    const device = await Device.create({
      deviceSerial: serial,
      deviceType: 'Flat Meter',
      mappedFlatId: flat._id,
      societyId: society._id,
      status: 'Live',
      registeredAt: new Date(),
      lastSeenAt: new Date()
    });
    allDevices.push({ device, flat });
  }
  console.log(`✅ ${allDevices.length} Devices registered`);

  // 5. Historical readings (30 days)
  console.log('⏳ Generating 30 days of readings...');
  const DAYS = 30;
  let totalReadings = 0;
  const batch = [];

  for (const { device, flat } of allDevices) {
    for (let day = DAYS; day >= 1; day--) {
      let kwhAcc = 0;
      for (let hour = 0; hour < 24; hour++) {
        const ts = new Date();
        ts.setDate(ts.getDate() - day);
        ts.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        const kw = getKwForHour(hour, flat.baseMultiplier);
        kwhAcc += kw;
        batch.push({
          deviceId: device._id,
          flatId: flat._id,
          societyId: flat.societyId,
          timestamp: ts,
          kw: parseFloat(kw.toFixed(2)),
          kwhToday: parseFloat(kwhAcc.toFixed(2)),
          hourOfDay: hour,
          dayOfWeek: ts.getDay()
        });
        totalReadings++;
        if (batch.length >= 1000) {
          await Reading.insertMany(batch.splice(0, 1000));
          process.stdout.write(`\r  Inserted ${totalReadings} readings...`);
        }
      }
    }
  }
  if (batch.length > 0) await Reading.insertMany(batch);
  console.log(`\n✅ ${totalReadings} readings inserted`);

  // 6. Users
  const society1 = societies[0];
  const firstFlat = allFlats[0].flat;
  const secondFlat = allFlats[1].flat;

  await User.create([
    { name: 'Suresh Nair', email: 'builder@ampereone.io', password: 'Builder@123', role: 'builder_admin', builderId: builder._id },
    { name: 'Ramesh Kumar', email: 'admin@ampereone.io', password: 'Admin@123', role: 'society_admin', societyId: society1._id },
    { name: 'Priya Sharma', email: 'resident@ampereone.io', password: 'Resident@123', role: 'flat_owner', flatId: firstFlat._id, societyId: society1._id },
    { name: 'Amit Singh', email: 'resident2@ampereone.io', password: 'Resident@123', role: 'flat_owner', flatId: secondFlat._id, societyId: society1._id }
  ]);
  console.log('✅ Users created');

  console.log('\n🎉 Seed Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Builder:  builder@ampereone.io  / Builder@123');
  console.log('Admin:    admin@ampereone.io    / Admin@123');
  console.log('Resident: resident@ampereone.io / Resident@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
