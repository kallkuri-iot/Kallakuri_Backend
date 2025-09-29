const RetailerShopActivity = require('../models/RetailerShopActivity');
const MarketingStaffActivity = require('../models/MarketingStaffActivity');
const Distributor = require('../models/Distributor');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Create or update retailer shop activity
 * @route   POST /api/mobile/retailer-shop-activity
 * @access  Private (Marketing Staff)
 */
exports.createOrUpdateActivity = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      shopId,
      distributorId,
      visitStartTime,
      visitEndTime,
      salesOrders,
      alternateProviders,
      complaint,
      marketInsight,
      photos,
      voiceNote,
      mobileNumber,
      visitType,
      visitObjective,
      visitOutcome,
      status
    } = req.body;

    // Validate required fields
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required'
      });
    }

    if (!distributorId) {
      return res.status(400).json({
        success: false,
        error: 'Distributor ID is required'
      });
    }

    // Find the current active marketing activity
    const currentMarketingActivity = await MarketingStaffActivity.findOne({
      marketingStaffId: req.user.id,
      distributorId: distributorId,
      status: 'Punched In',
      meetingEndTime: null
    });

    if (!currentMarketingActivity) {
      return res.status(400).json({
        success: false,
        error: 'No active marketing activity found. Please punch in first.'
      });
    }

    // Find the distributor
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) {
      return res.status(404).json({
        success: false,
        error: 'Distributor not found'
      });
    }

    // Find the shop - First check Shop collection, then legacy shops
    let shop = null;
    let shopDetails = null;

    // Try to find in Shop collection first
    shop = await Shop.findOne({
      _id: shopId,
      distributorId: distributorId,
      isActive: true
    });

    if (shop) {
      shopDetails = {
        _id: shop._id,
        name: shop.name,
        ownerName: shop.ownerName,
        address: shop.address,
        type: shop.type
      };
      logger.info(`Found shop in Shop collection: ${shop.name} with ID: ${shop._id}`);
    } else {
      // Check if it's a legacy shop
      const legacyShop = [...distributor.retailShops, ...distributor.wholesaleShops]
        .find(s => s._id.toString() === shopId);

      if (legacyShop) {
        shopDetails = {
          _id: legacyShop._id,
          name: legacyShop.shopName,
          ownerName: legacyShop.ownerName || 'Unknown Owner',
          address: legacyShop.address || 'Unknown Address',
          type: legacyShop.type || 'Retailer'
        };
        logger.info(`Found legacy shop: ${shopDetails.name} with ID: ${shopDetails._id}`);
      } else {
        return res.status(404).json({
          success: false,
          error: 'Shop not found. Please use a valid shop ID from the distributor.'
        });
      }
    }

    // Calculate visit duration
    let visitDurationMinutes = 0;
    if (visitStartTime && visitEndTime) {
      const startTime = new Date(visitStartTime);
      const endTime = new Date(visitEndTime);
      visitDurationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    }

    // Find existing activity or create new one
    let activity = await RetailerShopActivity.findOne({
      marketingStaffId: req.user.id,
      distributorId: distributorId,
      shopId: shopDetails._id,
      marketingActivityId: currentMarketingActivity._id
    });

    if (activity) {
      // Update existing activity
      activity.visitStartTime = visitStartTime || activity.visitStartTime;
      activity.visitEndTime = visitEndTime || activity.visitEndTime;
      activity.visitDurationMinutes = visitDurationMinutes || activity.visitDurationMinutes;
      activity.salesOrders = salesOrders || activity.salesOrders;
      activity.alternateProviders = alternateProviders || activity.alternateProviders;
      activity.complaint = complaint !== undefined ? complaint : activity.complaint;
      activity.marketInsight = marketInsight !== undefined ? marketInsight : activity.marketInsight;
      activity.photos = photos || activity.photos;
      activity.voiceNote = voiceNote || activity.voiceNote;
      activity.mobileNumber = mobileNumber || activity.mobileNumber;
      activity.visitType = visitType || activity.visitType;
      activity.visitObjective = visitObjective || activity.visitObjective;
      activity.visitOutcome = visitOutcome || activity.visitOutcome;
      activity.status = status || activity.status;
      activity.updatedAt = new Date();

      logger.info(`Updated shop activity for shop: ${shopDetails.name}`);
    } else {
      // Create new activity
      activity = new RetailerShopActivity({
        marketingStaffId: req.user.id,
        marketingActivityId: currentMarketingActivity._id,
        distributorId: distributorId,
        shopId: shopDetails._id,
        shopName: shopDetails.name,
        shopOwnerName: shopDetails.ownerName,
        shopAddress: shopDetails.address,
        shopType: shopDetails.type,
        visitStartTime: visitStartTime || new Date(),
        visitEndTime: visitEndTime,
        visitDurationMinutes: visitDurationMinutes,
        salesOrders: salesOrders || [],
        alternateProviders: alternateProviders || [],
        complaint: complaint || '',
        marketInsight: marketInsight || '',
        photos: photos || [],
        voiceNote: voiceNote || '',
        mobileNumber: mobileNumber || '',
        visitType: visitType || 'Scheduled',
        visitObjective: visitObjective || 'Order Collection',
        visitOutcome: visitOutcome || 'Successful',
        status: status || 'Completed'
      });

      logger.info(`Created new shop activity for shop: ${shopDetails.name}`);
    }

    // Handle voice note upload if present
    if (req.body.voiceNoteBase64) {
      const voiceNoteDir = path.join(__dirname, '../../uploads/voice-notes');
      if (!fs.existsSync(voiceNoteDir)) {
        fs.mkdirSync(voiceNoteDir, { recursive: true });
      }

      const voiceNoteFile = `voice_${activity._id}_${Date.now()}.wav`;
      const voiceNotePath = path.join(voiceNoteDir, voiceNoteFile);

      fs.writeFileSync(voiceNotePath, Buffer.from(req.body.voiceNoteBase64, 'base64'));
      activity.voiceNote = `/uploads/voice-notes/${voiceNoteFile}`;
    }

    await activity.save();

    // Populate the response
    const populatedActivity = await RetailerShopActivity.findById(activity._id)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .lean();

    // Add shop details to response
    populatedActivity.shopDetails = shopDetails;

    res.status(200).json({
      success: true,
      data: populatedActivity
    });

  } catch (error) {
    logger.error(`Error in createOrUpdateActivity controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get shop activities for a marketing staff
 * @route   GET /api/mobile/retailer-shop-activity/my-activities
 * @access  Private (Marketing Staff)
 */
exports.getMyActivities = async (req, res, next) => {
  try {
    const { distributorId, date, status, page = 1, limit = 20 } = req.query;

    let query = { marketingStaffId: req.user.id };

    if (distributorId) {
      query.distributorId = distributorId;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    if (status) {
      query.status = status;
    }

    const activities = await RetailerShopActivity.find(query)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalCount = await RetailerShopActivity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activities.length,
      totalCount,
      data: activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        pageSize: parseInt(limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error(`Error in getMyActivities controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all shop activities (Admin)
 * @route   GET /api/retailer-shop-activity
 * @access  Private (Admin)
 */
exports.getAllActivities = async (req, res, next) => {
  try {
    const { distributorId, staffId, date, status, page = 1, limit = 20 } = req.query;

    let query = {};

    if (distributorId) {
      query.distributorId = distributorId;
    }

    if (staffId) {
      query.marketingStaffId = staffId;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    if (status) {
      query.status = status;
    }

    const activities = await RetailerShopActivity.find(query)
      .populate('marketingStaffId', 'name email role')
      .populate('distributorId', 'name shopName address contact')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalCount = await RetailerShopActivity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activities.length,
      totalCount,
      data: activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        pageSize: parseInt(limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error(`Error in getAllActivities controller: ${error.message}`);
    next(error);
  }
};

module.exports = exports;
