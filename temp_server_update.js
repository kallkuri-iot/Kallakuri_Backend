// Add this after connectDB() call
const createDefaultAdmin = require('./scripts/createDefaultAdmin');

// Connect to MongoDB
connectDB();

// Create default admin if none exists
createDefaultAdmin().catch(err => {
  logger.error('Failed to create default admin:', err);
});
