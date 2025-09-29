const mongoose = require('mongoose');

const StaffDistributorAssignmentSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marketing staff ID is required'],
      index: true
    },
    distributorIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor'
    }],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide the ID of the user who made the assignment']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure each staff member has only one active assignment document
StaffDistributorAssignmentSchema.index({ staffId: 1, isActive: 1 }, { unique: true });

// Add index for faster queries on distributorIds
StaffDistributorAssignmentSchema.index({ distributorIds: 1 });

const StaffDistributorAssignment = mongoose.model('StaffDistributorAssignment', StaffDistributorAssignmentSchema);

module.exports = StaffDistributorAssignment; 