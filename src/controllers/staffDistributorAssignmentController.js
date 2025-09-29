const { validationResult } = require('express-validator');
const StaffDistributorAssignment = require('../models/StaffDistributorAssignment');
const User = require('../models/User');
const Distributor = require('../models/Distributor');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @desc    Assign distributors to marketing staff
 * @route   POST /api/staff-assignments
 * @access  Private (Admin, Sub Admin)
 */
exports.assignDistributorsToStaff = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { staffId, distributorIds } = req.body;

    // Validate staff exists and is a marketing staff
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    if (staff.role !== 'Marketing Staff') {
      return res.status(400).json({
        success: false,
        error: 'Only marketing staff can be assigned distributors'
      });
    }

    // Validate all distributors exist
    if (distributorIds && distributorIds.length > 0) {
      const distributorCount = await Distributor.countDocuments({
        _id: { $in: distributorIds }
      });

      if (distributorCount !== distributorIds.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more distributors do not exist'
        });
      }
    }

    // Check if staff already has an assignment
    let assignment = await StaffDistributorAssignment.findOne({
      staffId,
      isActive: true
    });

    if (assignment) {
      // Update existing assignment
      assignment.distributorIds = distributorIds;
      assignment.lastUpdatedAt = Date.now();
      assignment.lastUpdatedBy = req.user.id;
      
      await assignment.save();
    } else {
      // Create new assignment
      assignment = await StaffDistributorAssignment.create({
        staffId,
        distributorIds,
        assignedBy: req.user.id,
        lastUpdatedBy: req.user.id
      });
    }

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    logger.error(`Error in assignDistributorsToStaff controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all staff assignments
 * @route   GET /api/staff-assignments
 * @access  Private (Admin, Sub Admin)
 */
exports.getAllStaffAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, staffId, active } = req.query;
    
    // Build query
    const query = {};
    
    if (staffId) {
      query.staffId = staffId;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const totalCount = await StaffDistributorAssignment.countDocuments(query);
    
    // Get assignments with pagination
    const assignments = await StaffDistributorAssignment.find(query)
      .populate('staffId', 'name email')
      .populate('distributorIds', 'name shopName')
      .populate('assignedBy', 'name')
      .populate('lastUpdatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Prepare pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      count: totalCount,
      data: assignments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems: totalCount,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    logger.error(`Error in getAllStaffAssignments controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get assignment for a specific staff
 * @route   GET /api/staff-assignments/:staffId
 * @access  Private (Admin, Sub Admin, Marketing Staff - own assignments only)
 */
exports.getStaffAssignment = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    
    // For marketing staff, only allow viewing own assignments
    if (req.user.role === 'Marketing Staff' && staffId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this assignment'
      });
    }

    const assignment = await StaffDistributorAssignment.findOne({
      staffId,
      isActive: true
    })
    .populate('staffId', 'name email')
    .populate('distributorIds', 'name shopName address contact')
    .populate('assignedBy', 'name')
    .populate('lastUpdatedBy', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'No active assignment found for this staff'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    logger.error(`Error in getStaffAssignment controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Remove distributors from staff assignment
 * @route   PATCH /api/staff-assignments/:staffId/remove-distributors
 * @access  Private (Admin, Sub Admin)
 */
exports.removeDistributorsFromStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { distributorIds } = req.body;

    if (!distributorIds || !Array.isArray(distributorIds) || distributorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide distributor IDs to remove'
      });
    }

    const assignment = await StaffDistributorAssignment.findOne({
      staffId,
      isActive: true
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'No active assignment found for this staff'
      });
    }

    // Remove the specified distributors
    assignment.distributorIds = assignment.distributorIds.filter(
      id => !distributorIds.includes(id.toString())
    );
    
    assignment.lastUpdatedAt = Date.now();
    assignment.lastUpdatedBy = req.user.id;
    
    await assignment.save();

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    logger.error(`Error in removeDistributorsFromStaff controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get my assigned distributors (for marketing staff)
 * @route   GET /api/mobile/my-assigned-distributors
 * @access  Private (Marketing Staff)
 */
exports.getMyAssignedDistributors = async (req, res, next) => {
  try {
    const assignment = await StaffDistributorAssignment.findOne({
      staffId: req.user.id,
      isActive: true
    })
    .populate({
      path: 'distributorIds',
      select: 'name shopName address contact retailShops wholesaleShops'
    });

    if (!assignment) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: assignment.distributorIds
    });
  } catch (error) {
    logger.error(`Error in getMyAssignedDistributors controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete a staff assignment
 * @route   DELETE /api/staff-assignments/:id
 * @access  Private (Admin, Sub Admin)
 */
exports.deleteStaffAssignment = async (req, res, next) => {
  try {
    const assignment = await StaffDistributorAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Soft delete by marking as inactive
    assignment.isActive = false;
    assignment.lastUpdatedAt = Date.now();
    assignment.lastUpdatedBy = req.user.id;
    
    await assignment.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Error in deleteStaffAssignment controller: ${error.message}`);
    next(error);
  }
}; 