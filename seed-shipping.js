require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const res = await db.collection('products').updateMany(
    { shipping_charges: { $nin: [0, null] } },
    { $set: { shipping_charges: null } }
  );
  
  const res2 = await db.collection('products').updateMany(
    { shipping_charges: { $exists: false } },
    { $set: { shipping_charges: null } }
  );
  
  console.log('Updated to null (was not 0 or null):', res.modifiedCount);
  console.log('Added null where missing:', res2.modifiedCount);
  
  process.exit(0);
}

run();
