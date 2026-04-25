const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { ADMIN } = require('./constants');

async function ensureAdminUser() {
  const existing = await User.findOne({ email: ADMIN.EMAIL });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'admin123',
    10
  );
  const admin = await User.create({
    email: ADMIN.EMAIL,
    passwordHash,
    name: ADMIN.NAME,
    role: 'admin'
  });

  console.log(`Admin user created: ${ADMIN.EMAIL}`);
  return admin;
}

async function migrateCreatedBy(adminUserId) {
  const problemResult = await mongoose.connection.collection('problems').updateMany(
    { createdBy: 'admin' },
    { $set: { createdBy: adminUserId } }
  );

  const collectionResult = await mongoose.connection.collection('collections').updateMany(
    { createdBy: 'admin' },
    { $set: { createdBy: adminUserId } }
  );

  if (problemResult.modifiedCount > 0 || collectionResult.modifiedCount > 0) {
    console.log(`Migrated createdBy: ${problemResult.modifiedCount} problems, ${collectionResult.modifiedCount} collections`);
  }
}

module.exports = { ensureAdminUser, migrateCreatedBy };