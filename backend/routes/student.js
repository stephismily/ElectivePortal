const express = require('express');
const router = express.Router();
const { selectElectives, getMyElectives } = require('../controllers/studentController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('student'));

router.post('/select-electives', selectElectives);
router.get('/my-electives', getMyElectives);

module.exports = router;
