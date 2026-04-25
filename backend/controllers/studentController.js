const Student = require("../models/Student");

const CATEGORY_1 = [
  "Human Computer Interaction",
  "Computer Networks",
  "DevOps",
];
const CATEGORY_2 = ["Data Mining", "Smart Computing using Python"];
const ELECTIVE_V_OPTIONS = ["Entrepreneurship", "Principles of Management"];
const ALL_CAT_OPTIONS = [...CATEGORY_1, ...CATEGORY_2];

// POST /student/select-electives
const selectElectives = async (req, res) => {
  try {
    const { electiveII, electiveIII, electiveIV, electiveV } = req.body;

    // All fields required
    if (!electiveII || !electiveIII || !electiveIV || !electiveV) {
      return res
        .status(400)
        .json({ success: false, message: "All 4 electives must be selected." });
    }

    // Validate elective V
    if (!ELECTIVE_V_OPTIONS.includes(electiveV)) {
      return res.status(400).json({
        success: false,
        message: `Elective V must be one of: ${ELECTIVE_V_OPTIONS.join(", ")}.`,
      });
    }

    // Validate II, III, IV are from combined categories
    const selectedCatSubjects = [electiveII, electiveIII, electiveIV];

    for (const subj of selectedCatSubjects) {
      if (!ALL_CAT_OPTIONS.includes(subj)) {
        return res.status(400).json({
          success: false,
          message: `"${subj}" is not a valid elective option.`,
        });
      }
    }

    // Check no duplicates among II, III, IV
    const unique = new Set(selectedCatSubjects);
    if (unique.size !== 3) {
      return res.status(400).json({
        success: false,
        message: "Electives II, III, IV must all be different subjects.",
      });
    }

    // Count from each category
    const cat1Count = selectedCatSubjects.filter((s) =>
      CATEGORY_1.includes(s),
    ).length;
    const cat2Count = selectedCatSubjects.filter((s) =>
      CATEGORY_2.includes(s),
    ).length;

    // Must be exactly 3 from combined (already satisfied by picking exactly 3 different ones)
    // At least 2 must be from Category 1
    if (cat1Count < 2) {
      return res.status(400).json({
        success: false,
        message:
          "At least 2 subjects must be from Category 1 (Human Computer Interaction, Computer Networks, DevOps).",
      });
    }

    // If 3 from Category 1, Category 2 must be 0
    if (cat1Count === 3 && cat2Count !== 0) {
      return res.status(400).json({
        success: false,
        message:
          "If 3 subjects are from Category 1, no subject from Category 2 can be selected.",
      });
    }

    // If 2 from Category 1, exactly 1 from Category 2
    if (cat1Count === 2 && cat2Count !== 1) {
      return res.status(400).json({
        success: false,
        message:
          "If 2 subjects are from Category 1, exactly 1 from Category 2 must be selected.",
      });
    }

    // Update student
    const student = await Student.findByIdAndUpdate(
      req.user._id,
      {
        electives: { electiveII, electiveIII, electiveIV, electiveV },
        electivesSubmitted: true,
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    res.status(200).json({
      success: true,
      message: "Electives submitted successfully.",
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        electives: student.electives,
        electivesSubmitted: student.electivesSubmitted,
      },
    });
  } catch (error) {
    console.error("Select electives error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during elective submission.",
    });
  }
};

// GET /student/my-electives
const getMyElectives = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select(
      "name rollNumber electives electivesSubmitted",
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }
    res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Get electives error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { selectElectives, getMyElectives };
