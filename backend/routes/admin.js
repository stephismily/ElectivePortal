const express = require('express');
const router = express.Router();
const { addFaculty, getAllFaculty, deleteFaculty } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.post('/add-faculty', addFaculty);
router.get('/faculty', getAllFaculty);
router.delete('/faculty/:id', deleteFaculty);

module.exports = router;
