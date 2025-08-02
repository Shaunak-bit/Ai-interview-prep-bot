const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "https://cdn.example.com/default-avatar.png", // ✅ default fallback
    },
    bio: {
      type: String,
      default: "",
    },
    preferredDomains: {
      type: [String],
      enum: [
        "React",
        "Node.js",
        "Python",
        "Java",
        "Data Science",
        "Web Development",
        "HR & Behavioral",
      ],
      default: [],
    },
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
