const { validationResult } = require('express-validator');
const MarketingStaffActivity = require('../models/MarketingStaffActivity');
const RetailerShopActivity = require('../models/RetailerShopActivity');
const User = require('../models/User');
const Distributor = require('../models/Distributor');
const Shop = require('../models/Shop');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @desc    Get all staff activities for managers
 * @route   GET /api/mobile/manager/all-staff-activities
 * @access  Private (Mid-Level Manager, Admin)
 */
exports.getAllStaffActivities = async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      staffId, 
      distributorId, 
      status,
      page = 1, 
      limit = 50 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (staffId) filter.marketingStaffId = staffId;
    if (distributorId) filter.distributorId = distributorId;
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get marketing staff activities with populated data
    const activities = await MarketingStaffActivity.find(filter)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName contact address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await MarketingStaffActivity.countDocuments(filter);

    // Process activities to include shop details
    const processedActivities = await Promise.all(activities.map(async (activity) => {
      const activityObj = activity.toObject();
      
      // Get retailer shop activities for this marketing activity
      const shopActivities = await RetailerShopActivity.find({
        marketingStaffId: activity.marketingStaffId,
        distributorId: activity.distributorId,
        createdAt: { $gte: activity.meetingStartTime }
      }).populate('shopId', 'name type ownerName address');

      // Process retailer shop activities to ensure proper shop data
      activityObj.retailerShopActivities = shopActivities.map(shopActivity => {
        if (shopActivity.shopId && shopActivity.shopId.name) {
          return {
            ...shopActivity.toObject(),
            shopName: shopActivity.shopId.name,
            shopType: shopActivity.shopId.type
          };
        } else {
          return {
            ...shopActivity.toObject(),
            shopName: 'Unknown Shop',
            shopType: 'Unknown'
          };
        }
      });

      // Process shops array to ensure proper data
      if (activityObj.shops && activityObj.shops.length > 0) {
        activityObj.shops = activityObj.shops.map(shop => ({
          ...shop,
          name: shop.name || 'Unknown Shop',
          type: shop.type || 'Unknown'
        }));
      }

      return activityObj;
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: processedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error(`Error in getAllStaffActivities: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * @desc    Get staff activity summary for managers
 * @route   GET /api/mobile/manager/staff-activity-summary
 * @access  Private (Mid-Level Manager, Admin)
 */
exports.getStaffActivitySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get summary statistics
    const [
      totalActivities,
      activeStaff,
      totalDistributors,
      totalShops,
      totalSalesOrders,
      totalSalesValue
    ] = await Promise.all([
      MarketingStaffActivity.countDocuments(dateFilter),
      MarketingStaffActivity.distinct('marketingStaffId', dateFilter),
      MarketingStaffActivity.distinct('distributorId', dateFilter),
      MarketingStaffActivity.aggregate([
        { $match: dateFilter },
        { $unwind: '$shops' },
        { $group: { _id: '$shops.shopId' } },
        { $count: 'total' }
      ]),
      MarketingStaffActivity.aggregate([
        { $match: dateFilter },
        { $unwind: '$salesOrders' },
        { $group: { _id: null, total: { $sum: '$salesOrders.quantity' } } }
      ]),
      MarketingStaffActivity.aggregate([
        { $match: dateFilter },
        { $unwind: '$salesOrders' },
        { $group: { _id: null, total: { $sum: { $multiply: ['$salesOrders.quantity', '$salesOrders.rate'] } } } }
      ])
    ]);

    // Get staff performance data
    const staffPerformance = await MarketingStaffActivity.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$marketingStaffId',
          totalActivities: { $sum: 1 },
          totalShopsVisited: { $sum: '$shopsVisitedCount' },
          totalSalesOrders: { $sum: { $size: '$salesOrders' } },
          totalSalesValue: { $sum: { $multiply: ['$salesOrders.quantity', '$salesOrders.rate'] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $project: {
          staffId: '$_id',
          staffName: '$staff.name',
          staffEmail: '$staff.email',
          totalActivities: 1,
          totalShopsVisited: 1,
          totalSalesOrders: 1,
          totalSalesValue: 1
        }
      },
      { $sort: { totalActivities: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalActivities,
          activeStaff: activeStaff.length,
          totalDistributors: totalDistributors.length,
          totalShops: totalShops[0]?.total || 0,
          totalSalesOrders: totalSalesOrders[0]?.total || 0,
          totalSalesValue: totalSalesValue[0]?.total || 0
        },
        staffPerformance
      }
    });

  } catch (error) {
    logger.error(`Error in getStaffActivitySummary: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * @desc    Get individual staff activity details
 * @route   GET /api/mobile/manager/staff/:staffId/activities
 * @access  Private (Mid-Level Manager, Admin)
 */
exports.getStaffActivities = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = { marketingStaffId: staffId };
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get activities
    const activities = await MarketingStaffActivity.find(filter)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName contact address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await MarketingStaffActivity.countDocuments(filter);

    // Process activities
    const processedActivities = await Promise.all(activities.map(async (activity) => {
      const activityObj = activity.toObject();
      
      // Get retailer shop activities for this marketing activity
      const shopActivities = await RetailerShopActivity.find({
        marketingStaffId: activity.marketingStaffId,
        distributorId: activity.distributorId,
        createdAt: { $gte: activity.meetingStartTime }
      }).populate('shopId', 'name type ownerName address');

      // Process retailer shop activities
      activityObj.retailerShopActivities = shopActivities.map(shopActivity => {
        if (shopActivity.shopId && shopActivity.shopId.name) {
          return {
            ...shopActivity.toObject(),
            shopName: shopActivity.shopId.name,
            shopType: shopActivity.shopId.type
          };
        } else {
          return {
            ...shopActivity.toObject(),
            shopName: 'Unknown Shop',
            shopType: 'Unknown'
          };
        }
      });

      return activityObj;
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: processedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error(`Error in getStaffActivities: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
