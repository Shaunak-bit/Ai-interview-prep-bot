const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const progressRoutes = require('./routes/progressRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const summaryFeedbackRoutes = require('./routes/summaryFeedbackRoutes');
const publicUserRoutes = require('./routes/publicUserRoutes'); // ✅ NEW LINE

const app = express();

// ✅ CORS setup
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ Serve static files from /uploads (avatar images, etc.)
const uploadsPath = path.join(__dirname, 'uploads');
console.log("📂 Serving uploads from:", uploadsPath); // Debug this
app.use('/uploads', express.static(uploadsPath));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/profile", userProfileRoutes);
app.use("/api", summaryFeedbackRoutes);
app.use("/api/public-user", publicUserRoutes); // ✅ NEW ROUTE for public user profile search

// ✅ Root test route
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

// ✅ Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

module.exports = app;
