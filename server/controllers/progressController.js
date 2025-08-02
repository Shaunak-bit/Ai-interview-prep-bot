const Progress = require('../models/progress');

// 🔄 Save interview progress and compute achievements
const updateProgress = async (req, res) => {
  const { domain, score, totalQuestions, durationSeconds } = req.body; // ✅ updated
  const userEmail = req.user.email;

  console.log("🧠 Saving progress for:", userEmail);

  try {
    // 🏆 Session-based achievements
    const achievements = {
      excellence: score >= 8,
      perfect10: score === totalQuestions,
      speedDemon: durationSeconds && durationSeconds < 1800, // ✅ 30 minutes
    };

    const newProgress = new Progress({
      userEmail,
      domain,
      score,
      totalQuestions,
      averageScore: score,
      bestScore: score,
      durationSeconds, // ✅ replaced durationMinutes
      timestamp: new Date(),
      achievements,
    });

    await newProgress.save();

    console.log("✅ Progress saved:", newProgress);
    res.status(201).json({ message: 'Progress saved successfully', progress: newProgress });
  } catch (error) {
    console.error('❌ Error saving progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📊 Fetch all progress sessions and merge session + dashboard achievements
const getProgressByEmail = async (req, res) => {
  const userEmail = req.params.email;

  try {
    const sessions = await Progress.find({ userEmail }).sort({ timestamp: -1 });

    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const domainsPracticed = new Set(sessions.map((s) => s.domain));
    const averageScore = totalSessions > 0
      ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions
      : 0;

    // 🧠 Dashboard Achievements
    const dashboardAchievements = {
      firstSteps: totalSessions >= 1,
      gettingStarted: totalQuestions >= 10,
      dedicated: totalSessions >= 5,
      versatile: domainsPracticed.size >= 3,
      consistent: averageScore >= 7,
    };

    // 🏅 Session-based Achievements (merged)
    const sessionAchievements = {};
    sessions.forEach((s) => {
      if (s.achievements) {
        if (s.achievements.excellence) sessionAchievements.excellence = true;
        if (s.achievements.perfect10) sessionAchievements.perfect10 = true;
        if (s.achievements.speedDemon) sessionAchievements.speedDemon = true;
      }
    });

    const allAchievements = { ...sessionAchievements, ...dashboardAchievements };

    res.status(200).json({
      sessions,
      achievements: allAchievements,
    });
  } catch (error) {
    console.error('❌ Error fetching progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { updateProgress, getProgressByEmail };
