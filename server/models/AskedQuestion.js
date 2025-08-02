// server/models/AskedQuestion.js
const mongoose = require("mongoose");

const askedQuestionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AskedQuestion", askedQuestionSchema);
