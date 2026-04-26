const express = require('express');
const router = express.Router();
const {
  resetPassword,
  getElectives,
  getStudentsByElective,
  exportElectiveToExcel,
  getStudentElectives,
  exportStudentElectivesToExcel,
  searchStudent,
} = require('../controllers/facultyController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('faculty'));

router.post('/reset-password', resetPassword);
router.get('/electives', getElectives);
router.get('/students-by-elective', getStudentsByElective);
router.get('/export-elective', exportElectiveToExcel);
router.get('/student-electives', getStudentElectives);
router.get('/export-student-electives', exportStudentElectivesToExcel);
router.get('/search-student', searchStudent);

module.exports = router;
