const bcrypt = require('bcryptjs');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

// POST /admin/add-faculty
const addFaculty = async (req, res) => {
  try {
    const { title, name, email } = req.body;

    if (!title || !name || !email) {
      return res.status(400).json({ success: false, message: 'Title, name, and email are required.' });
    }

    const allowedTitles = ['Mr', 'Ms', 'Dr'];
    if (!allowedTitles.includes(title)) {
      return res.status(400).json({ success: false, message: 'Title must be Mr, Ms, or Dr.' });
    }

    const emailLower = email.toLowerCase().trim();

    if (!emailLower.endsWith('@psgtech.ac.in')) {
      return res.status(400).json({ success: false, message: 'Faculty email must be @psgtech.ac.in.' });
    }

    const existing = await Faculty.findOne({ email: emailLower });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Faculty with this email already exists.' });
    }

    // Default password = part before '@'
    const defaultPassword = emailLower.split('@')[0];
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const fullName = `${title} ${name.trim()}`;

    const faculty = await Faculty.create({
      name: fullName,
      email: emailLower,
      password: hashedPassword,
      role: 'faculty',
      isFirstLogin: true,
    });

    res.status(201).json({
      success: true,
      message: `Faculty '${fullName}' added successfully. Default password: ${defaultPassword}`,
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        isFirstLogin: faculty.isFirstLogin,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Faculty email already in use.' });
    }
    console.error('Add faculty error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding faculty.' });
  }
};

// GET /admin/faculty - List all faculty
const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, faculty });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /admin/faculty/:id
const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }
    res.status(200).json({ success: true, message: 'Faculty deleted successfully.' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { addFaculty, getAllFaculty, deleteFaculty };
