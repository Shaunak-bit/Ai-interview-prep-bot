const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const Progress = require('../models/Progress');

// @route   GET /api/public-user/:username
// @desc    Get public profile + stats of a user by username
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log("🔍 Looking for user with username:", username);

    // ✅ 1. Find user by username (case-insensitive)
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });

    if (!user) {
      console.log("❌ No user found.");
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ 2. Get all progress entries
    const sessions = await Progress.find({ userEmail: user.email });

    // ✅ 3. Aggregate stats
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
    const bestScore = sessions.reduce((max, s) => Math.max(max, s.score), 0);
    const averageScore = totalSessions > 0 ? parseFloat((totalScore / totalSessions).toFixed(1)) : 0;

    // ✅ 4. Top domain calculation
    const domainCounts = {};
    sessions.forEach(s => {
      domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
    });

    const topDomain = Object.entries(domainCounts).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0];

    // ✅ 5. Return public profile data
    res.json({
      username: user.username,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl || null,
      stats: {
        totalSessions,
        totalQuestions,
        averageScore,
        bestScore,
        topDomain,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching public profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
