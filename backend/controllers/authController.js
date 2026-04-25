const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /auth/register - Student registration only
const register = async (req, res) => {
  try {
    let { rollNumber, name, email, password, confirmPassword } = req.body;

    // Validation
    if (!rollNumber || !name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    rollNumber = rollNumber.toUpperCase().trim();
    name = name.toUpperCase().trim();
    email = email.toLowerCase().trim();

    // Email domain check
    if (!email.endsWith('@psgtech.ac.in')) {
      return res.status(400).json({ success: false, message: 'Only @psgtech.ac.in emails are allowed.' });
    }

    // Roll number format: 2 digits + 2 letters + 3 digits
    const rollRegex = /^\d{2}[A-Z]{2}\d{3}$/;
    if (!rollRegex.test(rollNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roll number format. Expected: 25MX125 (2 digits + 2 letters + 3 digits).',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check duplicates
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) {
      return res.status(409).json({ success: false, message: 'Roll number already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await Student.create({
      rollNumber,
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(student._id, 'student');

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        role: 'student',
        electivesSubmitted: student.electivesSubmitted,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ success: false, message: `${field} already in use.` });
    }
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// POST /auth/login - All roles
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const emailLower = email.toLowerCase().trim();

    // Try Admin first
    let user = await Admin.findOne({ email: emailLower });
    let role = 'admin';

    if (!user) {
      user = await Faculty.findOne({ email: emailLower });
      role = 'faculty';
    }

    if (!user) {
      user = await Student.findOne({ email: emailLower });
      role = 'student';
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id, role);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role,
    };

    if (role === 'faculty') {
      userData.isFirstLogin = user.isFirstLogin;
    }

    if (role === 'student') {
      userData.rollNumber = user.rollNumber;
      userData.electivesSubmitted = user.electivesSubmitted;
      userData.electives = user.electives;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// GET /auth/me - Get current user
const getMe = async (req, res) => {
  try {
    const userData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.userRole,
    };

    if (req.userRole === 'faculty') {
      userData.isFirstLogin = req.user.isFirstLogin;
    }

    if (req.userRole === 'student') {
      userData.rollNumber = req.user.rollNumber;
      userData.electivesSubmitted = req.user.electivesSubmitted;
      userData.electives = req.user.electives;
    }

    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
