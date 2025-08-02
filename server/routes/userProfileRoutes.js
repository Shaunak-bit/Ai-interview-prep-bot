const express = require("express");
const router = express.Router();

const {
  getProfile,
  createProfile,
  updateProfile
} = require("../controllers/userProfileController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // ✅ Cloudinary multer setup

// ✅ Route definitions
router.get("/:email", authMiddleware, getProfile);
router.post("/", createProfile);
router.put("/:email", authMiddleware, upload.single("avatar"), updateProfile);

module.exports = router;
