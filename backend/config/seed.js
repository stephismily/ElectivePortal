require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

// Admin model inline for seed script
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  name: { type: String, default: 'Admin' }
});

const Admin = mongoose.model('Admin', adminSchema);

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    const admin = new Admin({
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin'
    });

    await admin.save();
    console.log(`Admin seeded successfully: ${process.env.ADMIN_EMAIL}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
