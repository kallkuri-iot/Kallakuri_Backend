/**
 * Test script for marketing staff activity
 * 
 * This script tests the following:
 * 1. Punching in for a distributor
 * 2. Getting current activities
 * 3. Punching out
 * 
 * Run with: node src/scripts/test-marketing-staff-activity.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');
const User = require('../models/User');
const Distributor = require('../models/Distributor');
const MarketingStaffActivity = require('../models/MarketingStaffActivity');
const StaffDistributorAssignment = require('../models/StaffDistributorAssignment');

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Test functions
const testPunchIn = async () => {
  try {
    console.log('\n=== Testing Punch In ===');
    
    // Find a marketing staff user
    const marketingStaff = await User.findOne({ role: 'Marketing Staff' });
    if (!marketingStaff) {
      console.error('No marketing staff found in the database');
      return;
    }
    console.log(`Found marketing staff: ${marketingStaff.name} (${marketingStaff._id})`);
    
    // Find assigned distributors for this staff
    const assignment = await StaffDistributorAssignment.findOne({
      staffId: marketingStaff._id,
      isActive: true
    }).populate('distributorIds', 'name shopName address');
    
    if (!assignment || !assignment.distributorIds.length) {
      console.error('No distributors assigned to this staff');
      return;
    }
    
    const distributor = assignment.distributorIds[0];
    console.log(`Using distributor: ${distributor.name} (${distributor._id})`);
    
    // Check if there's already an active punch-in
    const existingActivity = await MarketingStaffActivity.findOne({
      marketingStaffId: marketingStaff._id,
      distributorId: distributor._id,
      status: 'Punched In',
      meetingEndTime: null
    });
    
    if (existingActivity) {
      console.log('Already punched in for this distributor. Punching out first...');
      existingActivity.status = 'Punched Out';
      existingActivity.meetingEndTime = new Date();
      await existingActivity.save();
    }
    
    // Create a new activity (punch-in)
    const activity = await MarketingStaffActivity.create({
      distributorId: distributor._id,
      marketingStaffId: marketingStaff._id,
      retailShop: 'Test Retail Shop',
      distributor: distributor.name,
      areaName: 'Test Area',
      tripCompanion: {
        category: 'Marketing Staff',
        name: 'Test Companion'
      },
      modeOfTransport: 'Car',
      meetingStartTime: new Date(),
      selfieImage: '/test/selfie.jpg',
      shopTypes: ['Retailer'],
      shops: [{
        name: 'Test Shop',
        ownerName: 'Test Owner',
        address: 'Test Address',
        type: 'Retailer',
        distributorId: distributor._id
      }],
      status: 'Punched In'
    });
    
    console.log('Punch-in created successfully:');
    console.log(JSON.stringify(activity, null, 2));
    
    return activity;
  } catch (error) {
    console.error('Error in testPunchIn:', error);
  }
};

const testGetActivities = async (staffId) => {
  try {
    console.log('\n=== Testing Get Activities ===');
    
    if (!staffId) {
      const marketingStaff = await User.findOne({ role: 'Marketing Staff' });
      staffId = marketingStaff._id;
    }
    
    // Get all activities for this staff
    const activities = await MarketingStaffActivity.find({
      marketingStaffId: staffId
    })
    .populate('distributorId', 'name shopName')
    .sort({ createdAt: -1 })
    .limit(5);
    
    console.log(`Found ${activities.length} recent activities:`);
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.distributor} - Status: ${activity.status} - Created: ${activity.createdAt}`);
    });
    
    return activities;
  } catch (error) {
    console.error('Error in testGetActivities:', error);
  }
};

const testPunchOut = async (activityId) => {
  try {
    console.log('\n=== Testing Punch Out ===');
    
    if (!activityId) {
      // Find the most recent punched-in activity
      const activity = await MarketingStaffActivity.findOne({
        status: 'Punched In',
        meetingEndTime: null
      }).sort({ createdAt: -1 });
      
      if (!activity) {
        console.error('No active punch-in found');
        return;
      }
      
      activityId = activity._id;
    }
    
    const activity = await MarketingStaffActivity.findById(activityId);
    if (!activity) {
      console.error('Activity not found');
      return;
    }
    
    console.log(`Punching out from activity: ${activity._id}`);
    
    // Update with punch out time
    activity.meetingEndTime = new Date();
    activity.status = 'Punched Out';
    
    // Calculate duration
    const durationMs = new Date(activity.meetingEndTime) - new Date(activity.meetingStartTime);
    activity.durationMinutes = Math.floor(durationMs / 60000);
    
    await activity.save();
    
    console.log('Punched out successfully:');
    console.log(`Duration: ${activity.durationMinutes} minutes`);
    
    return activity;
  } catch (error) {
    console.error('Error in testPunchOut:', error);
  }
};

// Run tests
const runTests = async () => {
  try {
    // Test punch-in
    const activity = await testPunchIn();
    
    if (!activity) {
      console.error('Punch-in test failed, cannot continue');
      return;
    }
    
    // Test getting activities
    await testGetActivities(activity.marketingStaffId);
    
    // Test punch-out
    await testPunchOut(activity._id);
    
    // Verify activities after punch-out
    console.log('\n=== Verifying Activities After Punch Out ===');
    await testGetActivities(activity.marketingStaffId);
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

// Run the tests
runTests(); 