const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  domain: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },

  // ✅ NEW FIELD
  durationSeconds: { type: Number, required: true },

  averageScore: { type: Number, required: true },
  bestScore: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },

  achievements: {
    excellence: { type: Boolean, default: false },
    perfect10: { type: Boolean, default: false },
    speedDemon: { type: Boolean, default: false },
  }
});

module.exports = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
