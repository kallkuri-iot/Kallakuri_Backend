const { validationResult } = require('express-validator');
const Shop = require('../models/Shop');
const Distributor = require('../models/Distributor');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @desc    Get shops by distributor
 * @route   GET /api/shops/distributor/:distributorId
 * @access  Private (Admin, Mid-Level Manager, Marketing Staff)
 */
exports.getShopsByDistributor = async (req, res, next) => {
  try {
    const { distributorId } = req.params;
    const { type } = req.query;
    
    // Validate distributor ID
    if (!mongoose.Types.ObjectId.isValid(distributorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid distributor ID format'
      });
    }
    
    // Verify the distributor exists
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) {
      return res.status(404).json({
        success: false,
        error: 'Distributor not found'
      });
    }
    
    // Start with shops from distributor document (source of truth)
    const allShops = [];
    
    // Add retail shops from distributor document
    if (distributor.retailShops && distributor.retailShops.length > 0) {
      distributor.retailShops.forEach(shop => {
        if (!type || type === 'Retailer') {
          allShops.push({
            _id: shop._id,
            name: shop.shopName,
            ownerName: shop.ownerName,
            address: shop.address,
            type: 'Retailer',
            distributorId: distributor._id,
            isLegacy: true,
            isActive: true,
            approvalStatus: 'Approved'
          });
        }
      });
    }
    
    // Add wholesale shops from distributor document
    if (distributor.wholesaleShops && distributor.wholesaleShops.length > 0) {
      distributor.wholesaleShops.forEach(shop => {
        if (!type || type === 'Whole Seller') {
          allShops.push({
            _id: shop._id,
            name: shop.shopName,
            ownerName: shop.ownerName,
            address: shop.address,
            type: 'Whole Seller',
            distributorId: distributor._id,
            isLegacy: true,
            isActive: true,
            approvalStatus: 'Approved'
          });
        }
      });
    }
    
    // Get new shops from Shop collection that are approved and not already in distributor
    const newShops = await Shop.find({ 
      distributorId, 
      isActive: true,
      approvalStatus: 'Approved'
    })
    .populate('createdBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .sort({ createdAt: -1 })
    .lean();
    
    // Add new shops that aren't duplicates
    newShops.forEach(shop => {
      if (!type || type === shop.type) {
        // Check if this shop already exists in distributor's list
        const existsInDistributor = allShops.some(existingShop => 
          existingShop.name === shop.name && 
          existingShop.ownerName === shop.ownerName && 
          existingShop.address === shop.address
        );
        
        // Only add if it doesn't already exist
        if (!existsInDistributor) {
          allShops.push({
            _id: shop._id,
            name: shop.name,
            ownerName: shop.ownerName,
            address: shop.address,
            type: shop.type,
            distributorId: shop.distributorId,
            createdBy: shop.createdBy,
            approvedBy: shop.approvedBy,
            approvalStatus: shop.approvalStatus,
            approvalDate: shop.approvalDate,
            createdAt: shop.createdAt,
            updatedAt: shop.updatedAt,
            isLegacy: false
          });
        }
      }
    });
    
    // Sort by creation date (newest first)
    allShops.sort((a, b) => {
      const dateA = a.createdAt || a._id.getTimestamp();
      const dateB = b.createdAt || b._id.getTimestamp();
      return new Date(dateB) - new Date(dateA);
    });
    
    res.status(200).json({
      success: true,
      count: allShops.length,
      data: allShops
    });
  } catch (error) {
    logger.error(`Error in getShopsByDistributor controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Add a new shop
 * @route   POST /api/mobile/shops
 * @access  Private (Marketing Staff)
 */
exports.addShop = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name,
      ownerName,
      address,
      type,
      distributorId
    } = req.body;

    // Verify the distributor exists
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) {
      return res.status(404).json({
        success: false,
        error: 'Distributor not found'
      });
    }

    // Check if the shop with the same name already exists for this distributor
    const existingShop = await Shop.findOne({ 
      name, 
      distributorId,
      isActive: true
    });
    
    if (existingShop) {
      return res.status(400).json({
        success: false,
        error: 'A shop with this name already exists for this distributor'
      });
    }

    // Set approval status based on the user's role
    const approvalStatus = req.user.role === 'Admin' || req.user.role === 'Mid-Level Manager' ? 'Approved' : 'Pending';
    
    // If admin or manager is creating, auto-approve
    const approvalData = approvalStatus === 'Approved' ? {
      approvedBy: req.user.id,
      approvalDate: new Date()
    } : {};

    // Create the shop in the Shop collection
    const shop = await Shop.create({
      name,
      ownerName,
      address,
      type,
      distributorId,
      createdBy: req.user.id,
      approvalStatus,
      ...approvalData
    });

    // Only add approved shops to the distributor's shops array
    if (approvalStatus === 'Approved') {
      // Also add the shop to the distributor's shops array for backward compatibility,
      // but first check if it doesn't already exist there
      const updateField = type === 'Retailer' ? 'retailShops' : 'wholesaleShops';
      const countField = type === 'Retailer' ? 'retailShopCount' : 'wholesaleShopCount';
      
      // Check if shop with same details already exists in the distributor document
      const shopArray = distributor[updateField] || [];
      const shopExists = shopArray.some(
        s => s.shopName === name && 
             s.ownerName === ownerName && 
             s.address === address
      );
      
      // Only add to distributor document if it doesn't already exist
      if (!shopExists) {
        distributor[updateField].push({
          shopName: name,
          ownerName,
          address
        });
  
        // Update shop count
        distributor[countField] = distributor[updateField].length;
        
        // Save distributor
        await distributor.save();
      }
    }

    // Respond with the newly created shop
    res.status(201).json({
      success: true,
      data: shop,
      message: approvalStatus === 'Pending' ? 
        'Shop added successfully and is pending approval from a manager' : 
        'Shop added successfully'
    });
  } catch (error) {
    logger.error(`Error in addShop controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get shop by ID
 * @route   GET /api/shops/:id
 * @access  Private (Admin, Mid-Level Manager, Marketing Staff)
 */
exports.getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate shop ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID format'
      });
    }
    
    const shop = await Shop.findById(id)
      .populate('distributorId', 'name shopName address contact')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role');
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    logger.error(`Error in getShopById controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update shop
 * @route   PUT /api/shops/:id
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.updateShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, ownerName, address, type, isActive } = req.body;
    
    // Validate shop ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID format'
      });
    }
    
    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    // Update shop fields
    if (name) shop.name = name;
    if (ownerName) shop.ownerName = ownerName;
    if (address) shop.address = address;
    if (type) shop.type = type;
    if (typeof isActive === 'boolean') shop.isActive = isActive;
    
    await shop.save();
    
    res.status(200).json({
      success: true,
      data: shop,
      message: 'Shop updated successfully'
    });
  } catch (error) {
    logger.error(`Error in updateShop controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete shop
 * @route   DELETE /api/shops/:id
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.deleteShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate shop ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID format'
      });
    }
    
    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    // Soft delete by setting isActive to false
    shop.isActive = false;
    await shop.save();
    
    res.status(200).json({
      success: true,
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deleteShop controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get pending shops for approval
 * @route   GET /api/shops/pending
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.getPendingShops = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, distributorId } = req.query;
    
    // Build query
    const query = { approvalStatus: 'Pending' };
    
    // Filter by distributor if provided
    if (distributorId) {
      query.distributorId = distributorId;
    }
    
    // Execute query with pagination
    const pendingShops = await Shop.find(query)
      .populate('distributorId', 'name shopName address')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count for pagination
    const count = await Shop.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count,
      data: pendingShops,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error(`Error in getPendingShops controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Approve or reject a shop
 * @route   PATCH /api/shops/:id/approval
 * @access  Private (Admin, Mid-Level Manager)
 */
exports.updateShopApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus, rejectionReason, notes } = req.body;
    
    // Validate approval status
    if (!['Approved', 'Rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid approval status. Must be either "Approved" or "Rejected"'
      });
    }
    
    // If rejecting, require a reason
    if (approvalStatus === 'Rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required when rejecting a shop'
      });
    }
    
    // Find the shop
    const shop = await Shop.findById(id);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    // Update shop approval status
    shop.approvalStatus = approvalStatus;
    shop.approvedBy = req.user.id;
    shop.approvalDate = new Date();
    
    if (approvalStatus === 'Rejected') {
      shop.rejectionReason = rejectionReason;
    }
    
    if (notes) {
      shop.notes = notes;
    }
    
    await shop.save();
    
    // If approved, add to distributor's shop list
    if (approvalStatus === 'Approved') {
      const distributor = await Distributor.findById(shop.distributorId);
      if (distributor) {
        const updateField = shop.type === 'Retailer' ? 'retailShops' : 'wholesaleShops';
        const countField = shop.type === 'Retailer' ? 'retailShopCount' : 'wholesaleShopCount';
        
        // Check if shop with same details already exists in the distributor document
        const shopArray = distributor[updateField] || [];
        const shopExists = shopArray.some(
          s => s.shopName === shop.name && 
               s.ownerName === shop.ownerName && 
               s.address === shop.address
        );
        
        // Only add to distributor document if it doesn't already exist
        if (!shopExists) {
          distributor[updateField].push({
            shopName: shop.name,
            ownerName: shop.ownerName,
            address: shop.address
          });
          
          // Update shop count
          distributor[countField] = distributor[updateField].length;
          
          // Save distributor
          await distributor.save();
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: shop,
      message: `Shop ${approvalStatus.toLowerCase()} successfully`
    });
  } catch (error) {
    logger.error(`Error in updateShopApproval controller: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get shop approval status
 * @route   GET /api/shops/:id/approval-status
 * @access  Private (Admin, Mid-Level Manager, Marketing Staff)
 */
exports.getShopApprovalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate shop ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID format'
      });
    }
    
    const shop = await Shop.findById(id)
      .populate('approvedBy', 'name email role')
      .select('approvalStatus approvedBy approvalDate rejectionReason notes');
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: shop._id,
        approvalStatus: shop.approvalStatus,
        approvedBy: shop.approvedBy,
        approvalDate: shop.approvalDate,
        rejectionReason: shop.rejectionReason,
        notes: shop.notes
      }
    });
  } catch (error) {
    logger.error(`Error in getShopApprovalStatus controller: ${error.message}`);
    next(error);
  }
};
