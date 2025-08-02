// server/index.js

require('dotenv').config(); // ✅ Load environment variables
console.log("Loaded MONGO_URI:", process.env.MONGO_URI); // ✅ Debug check

const connectDB = require('./config/db');
const app = require('./app'); // Import the configured Express app

// ✅ Start server after MongoDB connection
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  });
