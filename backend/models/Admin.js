const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    name: {
      type: String,
      default: 'Admin',
    },
    role: {
      type: String,
      default: 'admin',
      immutable: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
