/**
 * Test script for staff-distributor assignments
 * 
 * This script tests the following:
 * 1. Assigning distributors to marketing staff
 * 2. Getting assigned distributors for a staff member
 * 3. Removing distributors from a staff member
 * 
 * Run with: node src/scripts/test-staff-distributor-assignment.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');
const User = require('../models/User');
const Distributor = require('../models/Distributor');
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
const testAssignDistributorsToStaff = async () => {
  try {
    console.log('\n=== Testing Distributor Assignment ===');
    
    // Find a marketing staff user
    const marketingStaff = await User.findOne({ role: 'Marketing Staff' });
    if (!marketingStaff) {
      console.error('No marketing staff found in the database');
      return;
    }
    console.log(`Found marketing staff: ${marketingStaff.name} (${marketingStaff._id})`);
    
    // Find some distributors
    const distributors = await Distributor.find().limit(3);
    if (distributors.length === 0) {
      console.error('No distributors found in the database');
      return;
    }
    console.log(`Found ${distributors.length} distributors for testing`);
    
    // Find an admin user
    const admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      console.error('No admin user found in the database');
      return;
    }
    
    // Create or update assignment
    const distributorIds = distributors.map(d => d._id);
    const existingAssignment = await StaffDistributorAssignment.findOne({
      staffId: marketingStaff._id,
      isActive: true
    });
    
    let assignment;
    if (existingAssignment) {
      console.log('Updating existing assignment');
      existingAssignment.distributorIds = distributorIds;
      existingAssignment.lastUpdatedAt = Date.now();
      existingAssignment.lastUpdatedBy = admin._id;
      assignment = await existingAssignment.save();
    } else {
      console.log('Creating new assignment');
      assignment = await StaffDistributorAssignment.create({
        staffId: marketingStaff._id,
        distributorIds,
        assignedBy: admin._id,
        lastUpdatedBy: admin._id
      });
    }
    
    console.log('Assignment created/updated successfully:');
    console.log(JSON.stringify(assignment, null, 2));
    
    return assignment;
  } catch (error) {
    console.error('Error in testAssignDistributorsToStaff:', error);
  }
};

const testGetAssignedDistributors = async (staffId) => {
  try {
    console.log('\n=== Testing Get Assigned Distributors ===');
    
    if (!staffId) {
      const marketingStaff = await User.findOne({ role: 'Marketing Staff' });
      staffId = marketingStaff._id;
    }
    
    const assignment = await StaffDistributorAssignment.findOne({
      staffId,
      isActive: true
    }).populate('distributorIds', 'name shopName address');
    
    if (!assignment) {
      console.log('No active assignment found for this staff');
      return [];
    }
    
    console.log(`Found ${assignment.distributorIds.length} assigned distributors:`);
    assignment.distributorIds.forEach((dist, index) => {
      console.log(`${index + 1}. ${dist.name} (${dist._id})`);
    });
    
    return assignment.distributorIds;
  } catch (error) {
    console.error('Error in testGetAssignedDistributors:', error);
  }
};

const testRemoveDistributorFromStaff = async (staffId, distributorIdToRemove) => {
  try {
    console.log('\n=== Testing Remove Distributor from Staff ===');
    
    if (!staffId) {
      const marketingStaff = await User.findOne({ role: 'Marketing Staff' });
      staffId = marketingStaff._id;
    }
    
    const assignment = await StaffDistributorAssignment.findOne({
      staffId,
      isActive: true
    });
    
    if (!assignment) {
      console.log('No active assignment found for this staff');
      return;
    }
    
    if (!distributorIdToRemove) {
      // If no specific distributor ID is provided, remove the first one
      if (assignment.distributorIds.length > 0) {
        distributorIdToRemove = assignment.distributorIds[0];
      } else {
        console.log('No distributors to remove');
        return;
      }
    }
    
    console.log(`Removing distributor ${distributorIdToRemove} from staff ${staffId}`);
    
    // Remove the distributor
    assignment.distributorIds = assignment.distributorIds.filter(
      id => id.toString() !== distributorIdToRemove.toString()
    );
    
    assignment.lastUpdatedAt = Date.now();
    
    // Find an admin user for the lastUpdatedBy field
    const admin = await User.findOne({ role: 'Admin' });
    if (admin) {
      assignment.lastUpdatedBy = admin._id;
    }
    
    await assignment.save();
    
    console.log('Distributor removed successfully');
    console.log('Updated assignment:', JSON.stringify(assignment, null, 2));
    
    return assignment;
  } catch (error) {
    console.error('Error in testRemoveDistributorFromStaff:', error);
  }
};

// Run tests
const runTests = async () => {
  try {
    // Test assigning distributors
    const assignment = await testAssignDistributorsToStaff();
    
    // Test getting assigned distributors
    const assignedDistributors = await testGetAssignedDistributors(assignment?.staffId);
    
    // Test removing a distributor (if there are any assigned)
    if (assignedDistributors && assignedDistributors.length > 0) {
      const distributorToRemove = assignedDistributors[0]._id;
      await testRemoveDistributorFromStaff(assignment.staffId, distributorToRemove);
      
      // Verify removal
      console.log('\n=== Verifying Removal ===');
      await testGetAssignedDistributors(assignment.staffId);
    }
    
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