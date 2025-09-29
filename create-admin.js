#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/config');
const logger = require('./src/utils/logger');

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
    console.log('🚀 Starting admin creation process...');
    
    // Connect to MongoDB using the correct config property
    const mongoUri = config.mongoURI || process.env.MONGO_URI;
    console.log('🔗 MongoDB URI:', mongoUri ? 'Found' : 'Not found');
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in configuration');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin already exists in the database');
      console.log('📧 Existing admin email:', existingAdmin.email);
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
    
    console.log('🎉 Default admin created successfully!');
    console.log('📧 Email:', DEFAULT_ADMIN.email);
    console.log('🔑 Password:', DEFAULT_ADMIN.password);
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the script
createDefaultAdmin()
  .then(() => {
    console.log('✅ Admin creation process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Admin creation failed:', error);
    process.exit(1);
  });
