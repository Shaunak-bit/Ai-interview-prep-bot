const express = require('express');
const router = express.Router();
const { updateProgress, getProgressByEmail } = require('../controllers/progressController');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ Make sure this path is correct

// ✅ Fixed: this now matches the frontend fetch(".../progress/update")
router.post('/update', authMiddleware, updateProgress);

// Get progress by user email
router.get('/:email', getProgressByEmail);

module.exports = router;
