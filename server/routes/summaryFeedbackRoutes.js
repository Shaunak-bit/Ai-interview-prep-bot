const express = require('express');
const router = express.Router();
const { generateSummaryFeedback } = require('../controllers/summaryFeedbackController');

router.post('/summary_feedback', generateSummaryFeedback);

module.exports = router;
