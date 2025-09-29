const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const logger = require('../utils/logger');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const adminUtility = async () => {
  try {
    console.log('🔧 Admin Utility Tool');
    console.log('═'.repeat(50));
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database successfully\n');

    // Find all admin users
    const admins = await User.find({ role: 'Admin' });
    
    if (admins.length === 0) {
      console.log('❌ No admin users found in the database!');
      
      const createNew = await question('Would you like to create a default admin? (y/n): ');
      if (createNew.toLowerCase() === 'y' || createNew.toLowerCase() === 'yes') {
        await createDefaultAdmin();
      }
      return;
    }

    console.log(`👥 Found ${admins.length} admin user(s):`);
    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. 📧 Email: ${admin.email}`);
      console.log(`   👤 Name: ${admin.name}`);
      console.log(`   🔰 Role: ${admin.role}`);
      console.log(`   📅 Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log(`   ✅ Active: ${admin.active}`);
    });

    console.log('\n' + '═'.repeat(50));
    console.log('Available actions:');
    console.log('1. Reset admin password');
    console.log('2. Create new admin');
    console.log('3. Exit');
    
    const choice = await question('\nEnter your choice (1-3): ');
    
    switch (choice) {
      case '1':
        await resetAdminPassword(admins);
        break;
      case '2':
        await createDefaultAdmin();
        break;
      case '3':
        console.log('👋 Goodbye!');
        break;
      default:
        console.log('❌ Invalid choice');
    }
    
  } catch (error) {
    console.error('\n❌ Error in admin utility:', error.message);
    logger.error(`Admin utility error: ${error.message}`, { error: error.stack });
  } finally {
    rl.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
    process.exit();
  }
};

const resetAdminPassword = async (admins) => {
  try {
    if (admins.length === 1) {
      const admin = admins[0];
      console.log(`\n🔐 Resetting password for: ${admin.email}`);
    } else {
      console.log('\nSelect admin to reset password:');
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
      });
      
      const selection = await question('Enter admin number: ');
      const adminIndex = parseInt(selection) - 1;
      
      if (adminIndex < 0 || adminIndex >= admins.length) {
        console.log('❌ Invalid selection');
        return;
      }
    }
    
    const newPassword = 'Admin@2024#';
    const adminToUpdate = admins[0]; // Using first admin for simplicity
    
    adminToUpdate.password = newPassword;
    await adminToUpdate.save();
    
    console.log('\n🎉 Password reset successfully!');
    console.log('═'.repeat(50));
    console.log('📧 Email:', adminToUpdate.email);
    console.log('🔐 New Password:', newPassword);
    console.log('═'.repeat(50));
    console.log('\n⚠️  IMPORTANT: Please change this password after login!');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  }
};

const createDefaultAdmin = async () => {
  try {
    console.log('\n🚀 Creating new admin user...');
    
    const email = await question('Enter admin email (default: admin@kallakuri.com): ');
    const name = await question('Enter admin name (default: System Administrator): ');
    
    const adminData = {
      name: name || 'System Administrator',
      email: email || 'admin@kallakuri.com',
      password: 'Admin@2024#',
      role: 'Admin',
      active: true,
      isSubAdmin: false,
      permissions: ['dashboard', 'staff', 'marketing', 'orders', 'damage', 'tasks', 'distributors', 'godown', 'sales', 'reports']
    };

    const newAdmin = await User.create(adminData);
    
    console.log('\n🎉 New admin user created successfully!');
    console.log('═'.repeat(50));
    console.log('📧 Email:', newAdmin.email);
    console.log('🔐 Password:', 'Admin@2024#');
    console.log('👤 Name:', newAdmin.name);
    console.log('🔰 Role:', newAdmin.role);
    console.log('📅 Created:', new Date().toLocaleString());
    console.log('═'.repeat(50));
    console.log('\n⚠️  IMPORTANT: Please change this password after first login!');
    
  } catch (error) {
    if (error.code === 11000) {
      console.error('❌ Email already exists! Please choose a different email.');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  }
};

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Closing connections...');
  rl.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the utility
console.log('🚀 Starting Admin Utility...\n');
adminUtility(); 