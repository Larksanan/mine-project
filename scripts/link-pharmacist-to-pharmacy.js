/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const PHARMACIST_EMAIL = 'gwu-hict-2021-43@gwu.ac.lk';
const PHARMACY_NAME = 'Dragon Pharmacy';
const LICENSE_NUMBER = 'LIC-0001';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not found in .env.local');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection;

  const user = await db
    .collection('users')
    .findOne({ email: PHARMACIST_EMAIL });
  if (!user) {
    throw new Error(`No user found with email: ${PHARMACIST_EMAIL}`);
  }
  console.log(
    'Found user:',
    user._id.toString(),
    user.name || user.email,
    '| role:',
    user.role
  );

  const pharmacy = await db
    .collection('pharmacies')
    .findOne({ name: PHARMACY_NAME });
  if (!pharmacy) {
    throw new Error(`No pharmacy found with name: ${PHARMACY_NAME}`);
  }
  console.log('Found pharmacy:', pharmacy._id.toString(), pharmacy.name);

  const existing = (pharmacy.pharmacists || []).find(
    p => p.userId?.toString() === user._id.toString()
  );
  if (existing) {
    console.log(
      'This user is already in the pharmacists array. Nothing to do.'
    );
    await mongoose.disconnect();
    return;
  }

  const result = await db.collection('pharmacies').updateOne(
    { _id: pharmacy._id },
    {
      $push: {
        pharmacists: {
          userId: user._id,
          name: user.name || user.email,
          licenseNumber: LICENSE_NUMBER,
        },
      },
    }
  );

  console.log(
    'Update result:',
    result.modifiedCount === 1 ? 'SUCCESS — pharmacist linked' : 'FAILED',
    result
  );

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
