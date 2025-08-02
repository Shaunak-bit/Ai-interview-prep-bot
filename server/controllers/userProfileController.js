const Progress = require("../models/progress");
const UserProfile = require("../models/UserProfile");

// ✅ Save interview progress with feedback
const updateProgress = async (req, res) => {
  try {
    const { email } = req.user;
    const {
      domain,
      score,
      totalQuestions,
      durationSeconds,
      feedback,
    } = req.body;

    const newProgress = new Progress({
      email,
      domain,
      score,
      totalQuestions,
      durationSeconds,
      feedback,
      timestamp: new Date(),
    });

    await newProgress.save();
    res.status(201).json({ message: "Progress saved", data: newProgress });
  } catch (error) {
    console.error("❌ Error saving progress:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all progress for a specific user
const getProgressByEmail = async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const progress = await Progress.find({ email }).sort({ timestamp: -1 });
    res.status(200).json(progress);
  } catch (error) {
    console.error("❌ Error fetching progress:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Profile
const getProfile = async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const profile = await UserProfile.findOne({ email });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("❌ Error fetching profile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Create Profile
const createProfile = async (req, res) => {
  try {
    const { email, name, avatar, bio, preferredDomains } = req.body;

    const existing = await UserProfile.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const newProfile = new UserProfile({
      email,
      name,
      avatar: avatar || "https://cdn.example.com/default-avatar.png",
      bio,
      preferredDomains: preferredDomains || [],
    });

    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (error) {
    console.error("❌ Error creating profile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Profile (Cloudinary-based avatar)
const updateProfile = async (req, res) => {
  try {
    console.log("Received updateProfile request");
    console.log("req.file:", req.file);

    const email = decodeURIComponent(req.params.email);
    const { name, bio } = req.body;

    let preferredDomains = [];
    if (req.body.preferredDomains) {
      try {
        preferredDomains = JSON.parse(req.body.preferredDomains);
      } catch (err) {
        console.warn("⚠️ Could not parse preferredDomains:", err.message);
      }
    }

    let avatar;
    if (req.file) {
      avatar = req.file.path; // ✅ Cloudinary URL
      console.log("✅ Avatar uploaded to Cloudinary:", avatar);
    }

    const updateData = {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(preferredDomains.length > 0 && { preferredDomains }),
      ...(avatar && { avatar }),
    };

    console.log("Update data to save:", updateData);

    const updated = await UserProfile.findOneAndUpdate(
      { email },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating profile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  updateProgress,
  getProgressByEmail,
  getProfile,
  createProfile,
  updateProfile,
};
