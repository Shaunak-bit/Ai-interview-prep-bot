const express = require('express');
const router = express.Router();
const { signup, signin } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ Should be a function

// Signup route
router.post('/signup', signup);

// Signin route
router.post('/signin', signin);

module.exports = router;
