const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const logger = require('../utils/logger');

const createNewAdmin = async () => {
  try {
    console.log('🚀 Creating a new admin user...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database successfully');

    // Check existing admins
    const existingAdmins = await User.find({ role: 'Admin' });
    console.log(`\n📊 Current admin count: ${existingAdmins.length}`);
    
    if (existingAdmins.length > 0) {
      console.log('👥 Existing admins:');
      existingAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.name})`);
      });
    }

    // Create new admin with unique email
    const newAdminData = {
      name: 'New System Administrator',
      email: 'admin@kallakuri.com',
      password: 'Admin@2024#',
      role: 'Admin',
      active: true,
      isSubAdmin: false,
      permissions: ['dashboard', 'staff', 'marketing', 'orders', 'damage', 'tasks', 'distributors', 'godown', 'sales', 'reports']
    };

    // Check if this email already exists
    const emailExists = await User.findOne({ email: newAdminData.email });
    if (emailExists) {
      // Generate unique email
      const timestamp = Date.now();
      newAdminData.email = `admin${timestamp}@kallakuri.com`;
      newAdminData.name = `Admin User ${timestamp}`;
    }

    const newAdmin = await User.create(newAdminData);

    console.log('\n🎉 New admin user created successfully!');
    console.log('═'.repeat(60));
    console.log('📧 Email:', newAdmin.email);
    console.log('🔐 Password:', 'Admin@2024#');
    console.log('👤 Name:', newAdmin.name);
    console.log('🔰 Role:', newAdmin.role);
    console.log('🆔 User ID:', newAdmin._id);
    console.log('📅 Created:', new Date().toLocaleString());
    console.log('✅ Active:', newAdmin.active);
    console.log('🔑 Permissions:', newAdmin.permissions.join(', '));
    console.log('═'.repeat(60));
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   • Please change this password after first login!');
    console.log('   • Save these credentials in a secure location');
    console.log('   • This admin has full system access');
    
    logger.info('New admin user created successfully', {
      email: newAdmin.email,
      name: newAdmin.name,
      role: newAdmin.role,
      id: newAdmin._id
    });
    
  } catch (error) {
    console.error('\n❌ Error creating new admin:');
    console.error('Error details:', error.message);
    
    if (error.code === 11000) {
      console.error('📧 Email already exists! Please try again with a different email.');
    }
    
    logger.error(`Error creating new admin: ${error.message}`, { error: error.stack });
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
    process.exit();
  }
};

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Closing database connection...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the function
console.log('🚀 Starting new admin creation process...');
createNewAdmin(); 