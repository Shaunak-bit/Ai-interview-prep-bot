// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  console.log("🛡️  authMiddleware invoked"); // ✅ Debug log

  const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    console.warn("❌ No token provided");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.email) {
      console.warn("❌ Token does not contain email");
      return res.status(401).json({ message: "Unauthorized: Email missing in token" });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("❌ JWT Verification Error:", error);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

console.log("✅ Exporting authMiddleware, type:", typeof authMiddleware); // ✅ Additional check

module.exports = authMiddleware;
