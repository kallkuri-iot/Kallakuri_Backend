const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('../utils/logger');

// Default admin credentials
const DEFAULT_ADMIN = {
  name: 'Super Admin',
  email: 'admin@kallakuri.com',
  password: 'Admin@123',
  role: 'Admin',
  isActive: true,
  permissions: ['all']
};

async function createDefaultAdmin() {
  try {
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    
    if (existingAdmin) {
      logger.info('Admin already exists in the database');
      return;
    }

    // Create new admin with plain password (will be hashed by pre-save hook)
    const admin = new User({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password, // Plain password - will be hashed by pre-save hook
      role: DEFAULT_ADMIN.role,
      isActive: DEFAULT_ADMIN.isActive,
      permissions: DEFAULT_ADMIN.permissions
    });

    await admin.save();
    
    logger.info(`Default admin created successfully with email: ${DEFAULT_ADMIN.email}`);

  } catch (error) {
    logger.error(`Error creating default admin: ${error.message}`);
    throw error;
  }
}

module.exports = createDefaultAdmin;
