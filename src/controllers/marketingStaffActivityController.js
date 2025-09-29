const { validationResult } = require('express-validator');
const MarketingStaffActivity = require('../models/MarketingStaffActivity');
const RetailerShopActivity = require('../models/RetailerShopActivity');
const User = require('../models/User');
const Distributor = require('../models/Distributor');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const StaffDistributorAssignment = require('../models/StaffDistributorAssignment');
const Shop = require('../models/Shop'); // Added missing import for Shop

/**
 * @desc    Create a marketing staff activity with punch-in
 * @route   POST /api/mobile/marketing-activity/punch-in
 * @access  Private (Marketing Staff)
 */
exports.punchIn = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      distributorId,
      retailShop,
      distributor,
      areaName,
      tripCompanion,
      modeOfTransport,
      selfieImage,
      shopTypes,
      shops,
      brandSupplyEstimates
    } = req.body;

    // Check if already punched in
    const existingActivity = await MarketingStaffActivity.findOne({
      marketingStaffId: req.user.id,
      status: 'Punched In',
      meetingEndTime: null
    });

    if (existingActivity) {
      return res.status(400).json({
        success: false,
        error: 'You are already punched in. Please punch out first.'
      });
    }

    // Validate distributor exists
    const distributorExists = await Distributor.findById(distributorId);
    if (!distributorExists) {
      return res.status(404).json({
        success: false,
        error: 'Distributor not found'
      });
    }

    // Process shops array - create temporary IDs for planned shops
    const processedShops = shops.map(shop => ({
      _id: new mongoose.Types.ObjectId(),
      id: new mongoose.Types.ObjectId(),
      name: shop.name || 'Unknown Shop',
      ownerName: shop.ownerName || 'Unknown Owner',
      address: shop.address || 'Unknown Address',
      type: shop.type || 'Retailer',
      isTemporary: true // Mark as temporary since these are planned shops
    }));

    // Clean brandSupplyEstimates data - remove empty _id fields and let Mongoose auto-generate them
    const cleanedBrandSupplyEstimates = brandSupplyEstimates.map(estimate => ({
      name: estimate.name,
      variants: estimate.variants.map(variant => ({
        name: variant.name,
        sizes: variant.sizes.map(size => ({
          name: size.name,
          openingStock: parseInt(size.openingStock) || 0,
          proposedMarketRate: parseFloat(size.proposedMarketRate) || 0
        }))
      }))
    }));

    // Create marketing staff activity
    const marketingActivity = new MarketingStaffActivity({
      marketingStaffId: req.user.id,
      distributorId,
      retailShop,
      distributor,
      areaName,
      tripCompanion,
      modeOfTransport,
      selfieImage,
      shops: processedShops,
      brandSupplyEstimates: cleanedBrandSupplyEstimates,
      meetingStartTime: new Date(),
      status: 'Punched In'
    });

    await marketingActivity.save();

    // Populate the response
    await marketingActivity.populate([
      { path: 'marketingStaffId', select: 'name email role' },
      { path: 'distributorId', select: 'name shopName address contact' }
    ]);

    res.status(201).json({
      success: true,
      data: marketingActivity
    });

  } catch (error) {
    logger.error(`Error in punchIn: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update marketing staff activity with punch-out
 * @route   PATCH /api/mobile/marketing-activity/punch-out
 * @access  Private (Marketing Staff)
 */
exports.punchOut = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { voiceNotes } = req.body;

    // Find the active marketing activity
    const marketingActivity = await MarketingStaffActivity.findOne({
      marketingStaffId: req.user.id,
      status: 'Punched In',
      meetingEndTime: null
    });

    if (!marketingActivity) {
      return res.status(404).json({
        success: false,
        error: 'No active marketing activity found. Please punch in first.'
      });
    }

    // Update the activity with punch-out details
    marketingActivity.meetingEndTime = new Date();
    marketingActivity.status = 'Punched Out';
    marketingActivity.voiceNotes = voiceNotes || [];

    // Calculate duration
    const startTime = new Date(marketingActivity.meetingStartTime);
    const endTime = new Date(marketingActivity.meetingEndTime);
    marketingActivity.durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    // Get all retailer shop activities for this marketing activity
    const retailerActivities = await RetailerShopActivity.find({
      marketingActivityId: marketingActivity._id
    });

    // Calculate totals
    let totalSalesOrders = 0;
    let totalSalesValue = 0;
    const salesOrders = [];

    retailerActivities.forEach(activity => {
      if (activity.salesOrders && activity.salesOrders.length > 0) {
        totalSalesOrders += activity.salesOrders.length;
        activity.salesOrders.forEach(order => {
          const orderValue = (order.quantity || 0) * (order.rate || 0);
          totalSalesValue += orderValue;
          salesOrders.push({
            ...order,
            shopName: activity.shopName,
            shopId: activity.shopId,
            totalValue: orderValue
          });
        });
      }
    });

    // Update marketing activity with aggregated data
    marketingActivity.salesOrders = salesOrders;
    marketingActivity.totalSalesOrders = totalSalesOrders;
    marketingActivity.totalSalesValue = totalSalesValue;
    marketingActivity.totalShopsVisited = retailerActivities.length;

    await marketingActivity.save();

    // Populate the response
    await marketingActivity.populate([
      { path: 'marketingStaffId', select: 'name email role' },
      { path: 'distributorId', select: 'name shopName address contact' }
    ]);

    res.status(200).json({
      success: true,
      data: marketingActivity
    });

  } catch (error) {
    logger.error(`Error in punchOut: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get marketing activity by ID
 * @route   GET /api/marketing-activity/:id
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.getMarketingActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const marketingActivity = await MarketingStaffActivity.findById(id)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .lean();

    if (!marketingActivity) {
      return res.status(404).json({
        success: false,
        error: 'Marketing activity not found'
      });
    }

    // Get retailer shop activities for this marketing activity
    const retailerShopActivities = await RetailerShopActivity.find({
      marketingActivityId: id
    }).lean();

    // Calculate totals
    let totalShopsVisited = 0;
    let totalSalesOrders = 0;
    let totalSalesValue = 0;

    retailerShopActivities.forEach(activity => {
      totalShopsVisited++;
      if (activity.salesOrders && activity.salesOrders.length > 0) {
        totalSalesOrders += activity.salesOrders.length;
        activity.salesOrders.forEach(order => {
          totalSalesValue += (order.quantity || 0) * (order.rate || 0);
        });
      }
    });

    // Add calculated fields
    marketingActivity.retailerShopActivities = retailerShopActivities;
    marketingActivity.totalShopsVisited = totalShopsVisited;
    marketingActivity.totalSalesOrders = totalSalesOrders;
    marketingActivity.totalSalesValue = totalSalesValue;

    res.status(200).json({
      success: true,
      data: marketingActivity
    });

  } catch (error) {
    logger.error(`Error in getMarketingActivity: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get my activities (for staff)
 * @route   GET /api/mobile/marketing-activity/my-activities
 * @access  Private (Marketing Staff)
 */
exports.getMyActivities = async (req, res, next) => {
  try {
    const { distributorId, date, status, page = 1, limit = 20 } = req.query;
    
    // Build query - always filter by the current staff ID
    let query = { marketingStaffId: req.user.id };
    
    // If distributorId is provided, filter by it
    if (distributorId) {
      try {
        const validDistributorId = new mongoose.Types.ObjectId(distributorId);
        query.distributorId = validDistributorId;
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Invalid distributorId format: ${distributorId}`
        });
      }
    }
    
    // Filter by date if provided
    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Get activities with time limit applied (only show activities within 7 days for staff)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query.createdAt = { ...query.createdAt, $gte: sevenDaysAgo };
    
    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const totalCount = await MarketingStaffActivity.countDocuments(query);
    
    // Get activities with pagination
    const activities = await MarketingStaffActivity.find(query)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Enhanced activities with detailed shop visit data
    const enhancedActivities = await Promise.all(activities.map(async (activity) => {
      const activityObj = { ...activity };
      
      // Get retailer shop activities for this marketing activity
      const retailerShopActivities = await RetailerShopActivity.find({
        marketingActivityId: activity._id
      }).lean();
      
      // Convert retailer shop activities to shop visits format
      const shopVisits = retailerShopActivities.map(shopActivity => ({
        shopId: shopActivity.shopId,
        shopName: shopActivity.shopName || 'Unknown Shop',
        shopOwner: shopActivity.shopOwnerName || 'N/A',
        shopAddress: shopActivity.shopAddress || 'N/A',
        shopType: shopActivity.shopType || 'N/A',
        shopContact: shopActivity.mobileNumber || 'N/A',
        visitTime: shopActivity.visitStartTime || shopActivity.createdAt,
        visitEndTime: shopActivity.visitEndTime,
        visitDurationMinutes: shopActivity.visitDurationMinutes || 0,
        status: shopActivity.status || 'N/A',
        mobileNumber: shopActivity.mobileNumber || 'N/A',
        
        // Sales Orders
        salesOrders: shopActivity.salesOrders?.map(order => ({
          brandName: order.brandName || 'Unknown Brand',
          variant: order.variant || 'N/A',
          size: order.size || 'N/A',
          quantity: order.quantity || 0,
          rate: order.rate || 0,
          totalValue: (order.quantity || 0) * (order.rate || 0),
          isDisplayedInCounter: order.isDisplayedInCounter || false,
          orderType: order.orderType || 'Fresh Order'
        })) || [],
        
        // Alternate Providers
        alternateProviders: shopActivity.alternateProviders?.map(provider => ({
          brandName: provider.brandName || 'N/A',
          providerName: provider.providerName || 'N/A',
          rate: provider.rate || 0
        })) || [],
        
        // Market Inquiries
        marketInquiries: shopActivity.marketInquiries?.map(inquiry => ({
          brandName: inquiry.brandName || 'N/A',
          variant: inquiry.variant || 'N/A',
          size: inquiry.size || 'N/A',
          quantity: inquiry.quantity || 0,
          reason: inquiry.reason || 'N/A'
        })) || [],
        
        // Other data
        complaint: shopActivity.complaint || '',
        complaintCategory: shopActivity.complaintCategory || '',
        complaintSeverity: shopActivity.complaintSeverity || 'Medium',
        marketInsight: shopActivity.marketInsight || '',
        competitorActivity: shopActivity.competitorActivity || '',
        salesPotential: shopActivity.salesPotential || 'Medium',
        voiceNote: shopActivity.voiceNote || '',
        photos: shopActivity.photos || []
      }));
      
      // Add shop visits to the activity
      activityObj.shopVisits = shopVisits;
      activityObj.shopVisitsCount = shopVisits.length;
      
      // Calculate totals
      let totalShopsVisited = 0;
      let totalSalesOrders = 0;
      let totalSalesValue = 0;
      
      shopVisits.forEach(shopVisit => {
        totalShopsVisited++;
        if (shopVisit.salesOrders && shopVisit.salesOrders.length > 0) {
          totalSalesOrders += shopVisit.salesOrders.length;
          shopVisit.salesOrders.forEach(order => {
            totalSalesValue += order.totalValue || 0;
          });
        }
      });
      
      activityObj.totalShopsVisited = totalShopsVisited;
      activityObj.totalSalesOrders = totalSalesOrders;
      activityObj.totalSalesValue = totalSalesValue;
      
      return activityObj;
    }));
    
    res.status(200).json({
      success: true,
      count: enhancedActivities.length,
      totalCount,
      data: enhancedActivities,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        pageSize: limitNum,
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error(`Error in getMyActivities controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all staff activities (for managers)
 * @route   GET /api/mobile/marketing-activity/all-staff-activities
 * @access  Private (Mid-Level Manager, Admin)
 */
exports.getAllStaffActivities = async (req, res, next) => {
  try {
    const { distributorId, staffId, date, status, page = 1, limit = 20 } = req.query;
    
    // Check if user has manager or admin role
    if (req.user.role !== 'Mid-Level Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only managers and admins can view all staff activities'
      });
    }
    
    // Build query
    let query = {};
    
    // Filter by distributorId if provided
    if (distributorId) {
      try {
        const validDistributorId = new mongoose.Types.ObjectId(distributorId);
        query.distributorId = validDistributorId;
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Invalid distributorId format: ${distributorId}`
        });
      }
    }
    
    // Filter by staffId if provided
    if (staffId) {
      try {
        const validStaffId = new mongoose.Types.ObjectId(staffId);
        query.marketingStaffId = validStaffId;
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Invalid staffId format: ${staffId}`
        });
      }
    }
    
    // Filter by date if provided
    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Get activities with time limit applied (only show activities within 7 days for managers)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query.createdAt = { ...query.createdAt, $gte: sevenDaysAgo };
    
    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const totalCount = await MarketingStaffActivity.countDocuments(query);
    
    // Get activities with pagination
    const activities = await MarketingStaffActivity.find(query)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Enhanced activities with detailed shop visit data
    const enhancedActivities = await Promise.all(activities.map(async (activity) => {
      const activityObj = { ...activity };
      
      // Get retailer shop activities for this marketing activity
      const retailerShopActivities = await RetailerShopActivity.find({
        marketingActivityId: activity._id
      }).lean();
      
      // Convert retailer shop activities to shop visits format
      const shopVisits = retailerShopActivities.map(shopActivity => ({
        shopId: shopActivity.shopId,
        shopName: shopActivity.shopName || 'Unknown Shop',
        shopOwner: shopActivity.shopOwnerName || 'N/A',
        shopAddress: shopActivity.shopAddress || 'N/A',
        shopType: shopActivity.shopType || 'N/A',
        shopContact: shopActivity.mobileNumber || 'N/A',
        visitTime: shopActivity.visitStartTime || shopActivity.createdAt,
        visitEndTime: shopActivity.visitEndTime,
        visitDurationMinutes: shopActivity.visitDurationMinutes || 0,
        status: shopActivity.status || 'N/A',
        mobileNumber: shopActivity.mobileNumber || 'N/A',
        
        // Sales Orders
        salesOrders: shopActivity.salesOrders?.map(order => ({
          brandName: order.brandName || 'Unknown Brand',
          variant: order.variant || 'N/A',
          size: order.size || 'N/A',
          quantity: order.quantity || 0,
          rate: order.rate || 0,
          totalValue: (order.quantity || 0) * (order.rate || 0),
          isDisplayedInCounter: order.isDisplayedInCounter || false,
          orderType: order.orderType || 'Fresh Order'
        })) || [],
        
        // Alternate Providers
        alternateProviders: shopActivity.alternateProviders?.map(provider => ({
          brandName: provider.brandName || 'N/A',
          providerName: provider.providerName || 'N/A',
          rate: provider.rate || 0
        })) || [],
        
        // Market Inquiries
        marketInquiries: shopActivity.marketInquiries?.map(inquiry => ({
          brandName: inquiry.brandName || 'N/A',
          variant: inquiry.variant || 'N/A',
          size: inquiry.size || 'N/A',
          quantity: inquiry.quantity || 0,
          reason: inquiry.reason || 'N/A'
        })) || [],
        
        // Other data
        complaint: shopActivity.complaint || '',
        complaintCategory: shopActivity.complaintCategory || '',
        complaintSeverity: shopActivity.complaintSeverity || 'Medium',
        marketInsight: shopActivity.marketInsight || '',
        competitorActivity: shopActivity.competitorActivity || '',
        salesPotential: shopActivity.salesPotential || 'Medium',
        voiceNote: shopActivity.voiceNote || '',
        photos: shopActivity.photos || []
      }));
      
      // Add shop visits to the activity
      activityObj.shopVisits = shopVisits;
      activityObj.shopVisitsCount = shopVisits.length;
      
      // Calculate totals
      let totalShopsVisited = 0;
      let totalSalesOrders = 0;
      let totalSalesValue = 0;
      
      shopVisits.forEach(shopVisit => {
        totalShopsVisited++;
        if (shopVisit.salesOrders && shopVisit.salesOrders.length > 0) {
          totalSalesOrders += shopVisit.salesOrders.length;
          shopVisit.salesOrders.forEach(order => {
            totalSalesValue += order.totalValue || 0;
          });
        }
      });
      
      activityObj.totalShopsVisited = totalShopsVisited;
      activityObj.totalSalesOrders = totalSalesOrders;
      activityObj.totalSalesValue = totalSalesValue;
      
      return activityObj;
    }));
    
    res.status(200).json({
      success: true,
      count: enhancedActivities.length,
      totalCount,
      data: enhancedActivities,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        pageSize: limitNum,
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error(`Error in getAllStaffActivities controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all marketing activities (for admin panel)
 * @route   GET /api/marketing-activity
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.getAllActivities = async (req, res, next) => {
  try {
    const { 
      staffId, 
      distributorId, 
      fromDate, 
      toDate, 
      status, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by staffId if provided
    if (staffId) {
      try {
        const validStaffId = new mongoose.Types.ObjectId(staffId);
        query.marketingStaffId = validStaffId;
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Invalid staffId format: ${staffId}`
        });
      }
    }
    
    // Filter by distributorId if provided
    if (distributorId) {
      try {
        const validDistributorId = new mongoose.Types.ObjectId(distributorId);
        query.distributorId = validDistributorId;
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Invalid distributorId format: ${distributorId}`
        });
      }
    }
    
    // Filter by date range if provided
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const totalCount = await MarketingStaffActivity.countDocuments(query);
    
    // Get activities with pagination
    const activities = await MarketingStaffActivity.find(query)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Enhanced activities with retailer shop activities
    const enhancedActivities = await Promise.all(activities.map(async (activity) => {
      const activityObj = { ...activity };
      
      // Get retailer shop activities for this marketing activity
      const retailerShopActivities = await RetailerShopActivity.find({
        marketingActivityId: activity._id
      }).lean();
      
      // Add retailer shop activities to the response
      activityObj.retailerShopActivities = retailerShopActivities;
      
      // Calculate totals
      let totalShopsVisited = 0;
      let totalSalesOrders = 0;
      let totalSalesValue = 0;
      
      retailerShopActivities.forEach(shopActivity => {
        totalShopsVisited++;
        if (shopActivity.salesOrders && shopActivity.salesOrders.length > 0) {
          totalSalesOrders += shopActivity.salesOrders.length;
          shopActivity.salesOrders.forEach(order => {
            totalSalesValue += (order.quantity || 0) * (order.rate || 0);
          });
        }
      });
      
      activityObj.totalShopsVisited = totalShopsVisited;
      activityObj.totalSalesOrders = totalSalesOrders;
      activityObj.totalSalesValue = totalSalesValue;
      
      return activityObj;
    }));
    
    res.status(200).json({
      success: true,
      count: enhancedActivities.length,
      totalCount,
      data: enhancedActivities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    logger.error(`Error in getAllActivities controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete marketing activity
 * @route   DELETE /api/marketing-activity/:id
 * @access  Private (Admin)
 */
exports.deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const activity = await MarketingStaffActivity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Marketing activity not found'
      });
    }
    
    // Delete associated retailer shop activities
    await RetailerShopActivity.deleteMany({
      marketingActivityId: id
    });
    
    // Delete the marketing activity
    await MarketingStaffActivity.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Marketing activity deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deleteActivity: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get assigned distributors for a staff member
 * @route   GET /api/mobile/marketing-activity/assigned-distributors
 * @access  Private (Marketing Staff)
 */
exports.getAssignedDistributors = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    
    // Get staff distributor assignments
    const assignments = await StaffDistributorAssignment.find({
      staffId: staffId,
      isActive: true
    }).populate('distributorIds', 'name shopName address contact');
    
    // Flatten the distributorIds array and create the response
    const distributors = [];
    assignments.forEach(assignment => {
      if (assignment.distributorIds && assignment.distributorIds.length > 0) {
        assignment.distributorIds.forEach(distributor => {
          distributors.push({
            _id: distributor._id,
            name: distributor.name,
            shopName: distributor.shopName,
            address: distributor.address,
            contact: distributor.contact,
            assignmentId: assignment._id,
            assignedDate: assignment.assignedAt
          });
        });
      }
    });
    
    res.status(200).json({
      success: true,
      data: distributors
    });
  } catch (error) {
    logger.error(`Error in getAssignedDistributors: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get activities by distributor ID
 * @route   GET /api/marketing-activity/distributor/:distributorId
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.getActivitiesByDistributorId = async (req, res, next) => {
  try {
    const { distributorId } = req.params;
    
    // Validate distributor ID
    if (!mongoose.Types.ObjectId.isValid(distributorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid distributor ID format'
      });
    }
    
    // Get activities for the distributor
    const activities = await MarketingStaffActivity.find({
      distributorId: distributorId
    })
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .sort({ createdAt: -1 })
      .lean();
    
    // Enhanced activities with retailer shop activities
    const enhancedActivities = await Promise.all(activities.map(async (activity) => {
      const activityObj = { ...activity };
      
      // Get retailer shop activities for this marketing activity
      const retailerShopActivities = await RetailerShopActivity.find({
        marketingActivityId: activity._id
      }).lean();
      
      // Add retailer shop activities to the response
      activityObj.retailerShopActivities = retailerShopActivities;
      
      // Calculate totals
      let totalShopsVisited = 0;
      let totalSalesOrders = 0;
      let totalSalesValue = 0;
      
      retailerShopActivities.forEach(shopActivity => {
        totalShopsVisited++;
        if (shopActivity.salesOrders && shopActivity.salesOrders.length > 0) {
          totalSalesOrders += shopActivity.salesOrders.length;
          shopActivity.salesOrders.forEach(order => {
            totalSalesValue += (order.quantity || 0) * (order.rate || 0);
          });
        }
      });
      
      activityObj.totalShopsVisited = totalShopsVisited;
      activityObj.totalSalesOrders = totalSalesOrders;
      activityObj.totalSalesValue = totalSalesValue;
      
      return activityObj;
    }));
    
    res.status(200).json({
      success: true,
      count: enhancedActivities.length,
      data: enhancedActivities
    });
  } catch (error) {
    logger.error(`Error in getActivitiesByDistributorId: ${error.message}`);
    next(error);
  }
};
