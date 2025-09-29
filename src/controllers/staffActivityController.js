const { validationResult } = require('express-validator');
const StaffActivity = require('../models/StaffActivity');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generateExcel } = require('../utils/excelGenerator');
const Distributor = require('../models/Distributor');
const Shop = require('../models/Shop');
const MarketingStaffActivity = require('../models/MarketingStaffActivity');
const RetailerShopActivity = require('../models/RetailerShopActivity'); // Added import
const mongoose = require('mongoose');

/**
 * @desc    Create a staff activity record
 * @route   POST /api/staff-activity
 * @access  Private (Marketing Staff)
 */
exports.createStaffActivity = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { activityType, details, status, relatedId, onModel } = req.body;

    // Create staff activity
    const staffActivity = await StaffActivity.create({
      staffId: req.user.id,
      activityType,
      details,
      status,
      relatedId,
      onModel
    });

    res.status(201).json({
      success: true,
      data: staffActivity
    });
  } catch (error) {
    logger.error(`Error in createStaffActivity controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get staff activities by staff member and date
 * @route   GET /api/staff-activity
 * @access  Private (Mid-Level Manager)
 */
exports.getStaffActivities = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { staffId, staffType, fromDate, toDate, status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (staffId) {
      query.staffId = staffId;
    }
    
    if (staffType) {
      query.staffType = staffType;
    }
    
    if (fromDate || toDate) {
      query.createdAt = {};
      
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDate;
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    if (status) {
      query.status = status;
    }
    
    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const totalCount = await StaffActivity.countDocuments(query);
    
    // Get activities with pagination
    const activities = await StaffActivity.find(query)
      .populate('staffId', 'name email role')
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
      data: activities,
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
    logger.error(`Error in getStaffActivities controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Download staff activities as Excel
 * @route   GET /api/staff-activity/download
 * @access  Private (Mid-Level Manager)
 */
exports.downloadStaffActivities = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { staffId, date } = req.query;
    
    // Validate staff ID
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Parse date
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Get activities
    const activities = await StaffActivity.find({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: 1 });

    // Format data for Excel
    const formattedData = activities.map(activity => {
      return {
        Date: new Date(activity.date).toLocaleDateString(),
        Time: new Date(activity.date).toLocaleTimeString(),
        'Staff Name': staff.name,
        'Activity Type': activity.activityType,
        Details: activity.details,
        Status: activity.status
      };
    });

    // Generate Excel file
    const wb = generateExcel({
      filename: `Staff_Activity_${staff.name}_${date}`,
      sheetName: 'Staff Activity',
      headers: ['Date', 'Time', 'Staff Name', 'Activity Type', 'Details', 'Status'],
      data: formattedData
    });

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Staff_Activity_${staff.name}_${date}.xlsx"`);

    // Send Excel file
    wb.write('Staff_Activity.xlsx', res);
  } catch (error) {
    logger.error(`Error in downloadStaffActivities controller: ${error.message}`);
    next(error);
  }
}; 

/**
 * @desc    Get all staff activities with filtering
 * @route   GET /api/staff-activity
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.getAllActivities = async (req, res, next) => {
  try {
    const { startDate, endDate, staffId, distributorId } = req.query;
    const query = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Add staff filter if provided
    if (staffId) query.marketingStaffId = staffId;

    // Add distributor filter if provided
    if (distributorId) query.distributorId = distributorId;

    // Get all marketing activities with populated references
    const activities = await MarketingStaffActivity.find(query)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address')
      .sort({ createdAt: -1 })
      .lean();

    // Enhance activities with shop details and sales data
    const enhancedActivities = await Promise.all(activities.map(async (activity) => {
      // Add shop details to each shop in the activity
      if (activity.shops && Array.isArray(activity.shops)) {
        activity.shopsVisitedCount = activity.shops.length;
        
        // Process shops to ensure they have proper data
        activity.shops = await Promise.all(activity.shops.map(async (shop) => {
          if (shop.shopId) {
            // Try to get the actual shop document
            const shopDoc = await Shop.findById(shop.shopId).select('name ownerName address type').lean();
            if (shopDoc) {
              return {
                ...shop,
                name: shopDoc.name,
                ownerName: shopDoc.ownerName,
                address: shopDoc.address,
                type: shopDoc.type
              };
            }
          }
          return shop;
        }));
      }

      // Fetch retailer shop activities for this marketing activity to get sales orders
      try {
        const startTime = activity.meetingStartTime || activity.createdAt;
        const endTime = activity.meetingEndTime || new Date();
        
        const retailerActivities = await RetailerShopActivity.find({
          marketingStaffId: activity.marketingStaffId._id || activity.marketingStaffId,
          distributorId: activity.distributorId._id || activity.distributorId,
          createdAt: {
            $gte: new Date(startTime),
            $lte: new Date(endTime)
          }
        }).populate('shopId', 'name ownerName address type');

        // Add retailer shop activities with sales orders
        activity.retailerShopActivities = retailerActivities.map(shopActivity => {
          const shop = shopActivity.shopId;
          
          return {
            shopId: shop?._id,
            shopName: shop?.name || 'Shop Not Found',
            shopOwner: shop?.ownerName || 'Unknown Owner',
            shopAddress: shop?.address || 'Address Not Available',
            shopType: shop?.type || 'Unknown Type',
            salesOrders: shopActivity.salesOrders || [],
            complaint: shopActivity.complaint || '',
            marketInsight: shopActivity.marketInsight || '',
            visitObjective: shopActivity.visitObjective || '',
            visitOutcome: shopActivity.visitOutcome || '',
            status: shopActivity.status || '',
            punchInTime: shopActivity.punchInTime || '',
            punchOutTime: shopActivity.punchOutTime || '',
            photos: shopActivity.photos || [],
            voiceNote: shopActivity.voiceNote || '',
            alternateProviders: shopActivity.alternateProviders || []
          };
        });

        // Calculate totals from retailer activities
        let totalSalesOrders = 0;
        let totalSalesValue = 0;
        let totalShopsVisited = retailerActivities.length;

        retailerActivities.forEach(shopActivity => {
          if (shopActivity.salesOrders && Array.isArray(shopActivity.salesOrders)) {
            totalSalesOrders += shopActivity.salesOrders.length;
            shopActivity.salesOrders.forEach(order => {
              if (order.quantity && order.rate) {
                totalSalesValue += order.quantity * order.rate;
              }
            });
          }
        });

        // Update activity with calculated totals
        activity.totalSalesOrders = totalSalesOrders;
        activity.totalSalesValue = totalSalesValue;
        activity.totalShopsVisited = totalShopsVisited;
        activity.shopsVisitedCount = activity.shops ? activity.shops.length : 0;
      } catch (error) {
        logger.error(`Error processing retailer activities for marketing activity ${activity._id}: ${error.message}`);
        activity.retailerShopActivities = [];
        activity.totalSalesOrders = 0;
        activity.totalSalesValue = 0;
        activity.totalShopsVisited = 0;
      }

      return activity;
    }));

    res.json({
      success: true,
      data: enhancedActivities
    });
  } catch (error) {
    logger.error(`Error in getAllActivities controller: ${error.message}`);
    next(error);
  }
}; 