const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");

const ELECTIVE_NAMES = [
  "Human Computer Interaction",
  "Computer Networks",
  "DevOps",
  "Data Mining",
  "Smart Computing using Python",
  "Entrepreneurship",
  "Principles of Management",
];

const STUDENT_ELECTIVE_FIELDS = "name rollNumber electives electivesSubmitted";

const formatStudentElectiveRow = (student, index) => ({
  "S.No": index + 1,
  "Roll Number": student.rollNumber,
  Name: student.name,
  "Elective II": student.electives?.electiveII || "",
  "Elective III": student.electives?.electiveIII || "",
  "Elective IV": student.electives?.electiveIV || "",
  "Elective V": student.electives?.electiveV || "",
});

// POST /faculty/reset-password
const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Both password fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await Faculty.findByIdAndUpdate(req.user._id, {
      password: hashedPassword,
      isFirstLogin: false,
    });

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during password reset." });
  }
};

// GET /faculty/electives - Get all electives with student counts
const getElectives = async (req, res) => {
  try {
    const electives = [];

    for (const elective of ELECTIVE_NAMES) {
      const count = await Student.countDocuments({
        electivesSubmitted: true,
        $or: [
          { "electives.electiveII": elective },
          { "electives.electiveIII": elective },
          { "electives.electiveIV": elective },
          { "electives.electiveV": elective },
        ],
      });

      electives.push({ name: elective, studentCount: count });
    }

    res.status(200).json({ success: true, electives });
  } catch (error) {
    console.error("Get electives error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /faculty/students-by-elective?name=<elective>
const getStudentsByElective = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Elective name is required." });
    }

    if (!ELECTIVE_NAMES.includes(name)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid elective name." });
    }

    const students = await Student.find({
      electivesSubmitted: true,
      $or: [
        { "electives.electiveII": name },
        { "electives.electiveIII": name },
        { "electives.electiveIV": name },
        { "electives.electiveV": name },
      ],
    })
      .select("name rollNumber")
      .sort({ rollNumber: 1 });

    res.status(200).json({ success: true, elective: name, students });
  } catch (error) {
    console.error("Get students by elective error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /faculty/export-elective?name=<elective>
const exportElectiveToExcel = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || !ELECTIVE_NAMES.includes(name)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid elective name is required." });
    }

    const students = await Student.find({
      electivesSubmitted: true,
      $or: [
        { "electives.electiveII": name },
        { "electives.electiveIII": name },
        { "electives.electiveIV": name },
        { "electives.electiveV": name },
      ],
    })
      .select("name rollNumber")
      .sort({ rollNumber: 1 });

    const data = students.map((s, i) => ({
      "S.No": i + 1,
      Name: s.name,
      "Roll Number": s.rollNumber,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Column widths
    worksheet["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 15 }];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = `${name.replace(/\s+/g, "_")}_students.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buffer);
  } catch (error) {
    console.error("Export error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during export." });
  }
};

// GET /faculty/student-electives
const getStudentElectives = async (req, res) => {
  try {
    const students = await Student.find({ electivesSubmitted: true })
      .select(STUDENT_ELECTIVE_FIELDS)
      .sort({ rollNumber: 1 });

    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Get student electives error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /faculty/export-student-electives
const exportStudentElectivesToExcel = async (req, res) => {
  try {
    const students = await Student.find({ electivesSubmitted: true })
      .select(STUDENT_ELECTIVE_FIELDS)
      .sort({ rollNumber: 1 });

    const data = students.map(formatStudentElectiveRow);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Electives");

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="student_elective_list.xlsx"',
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buffer);
  } catch (error) {
    console.error("Export student electives error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during export." });
  }
};

// GET /faculty/search-student?query=<roll or name>
const searchStudent = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

    const q = query.trim().toUpperCase();

    const students = await Student.find({
      $or: [
        { rollNumber: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
      .select(STUDENT_ELECTIVE_FIELDS)
      .sort({ rollNumber: 1 });

    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Search student error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during search." });
  }
};

module.exports = {
  resetPassword,
  getElectives,
  getStudentsByElective,
  exportElectiveToExcel,
  getStudentElectives,
  exportStudentElectivesToExcel,
  searchStudent,
};
