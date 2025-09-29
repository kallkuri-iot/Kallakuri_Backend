const express = require('express');
const { check, param } = require('express-validator');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const taskController = require('../controllers/taskController');
const damageClaimController = require('../controllers/damageClaimController');
const staffDistributorAssignmentController = require('../controllers/staffDistributorAssignmentController');
const shopController = require('../controllers/shopController');
const marketingStaffActivityController = require('../controllers/marketingStaffActivityController');
const retailerShopActivityController = require('../controllers/retailerShopActivityController');
const staffActivityController = require('../controllers/staffActivityController');
const productController = require('../controllers/productController');
const distributorShopsSalesOrdersController = require('../controllers/distributorShopsSalesOrdersController');
const distributorController = require('../controllers/distributorController');
const salesInquiryController = require('../controllers/salesInquiryController');

// Public routes (no authentication required)
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes (authentication required)
// Marketing staff activity routes
router.get(
  '/marketing-activity/assigned-distributors',
  protect,
  restrictTo('Marketing Staff'),
  marketingStaffActivityController.getAssignedDistributors
);

router.get(
  '/marketing-activity/my-activities',
  protect,
  restrictTo('Marketing Staff'),
  marketingStaffActivityController.getMyActivities
);

router.post(
  '/marketing-activity/punch-in',
  protect,
  restrictTo('Marketing Staff'),
  [
    check('distributorId', 'Distributor ID is required').isMongoId(),
    check('selfieImage', 'Selfie image is required').notEmpty(),
    check('modeOfTransport', 'Mode of transport is required').notEmpty(),
    check('areaName', 'Area name is required').notEmpty()
  ],
  marketingStaffActivityController.punchIn
);

router.patch(
  '/marketing-activity/punch-out',
  protect,
  restrictTo('Marketing Staff'),
  [
    check('distributorId', 'Distributor ID is required').isMongoId()
  ],
  marketingStaffActivityController.punchOut
);

// Manager route to get all staff activities (with 7-day limit)
router.get(
  '/marketing-activity/all-staff-activities',
  protect,
  restrictTo('Mid-Level Manager', 'Admin', 'Godown Incharge'),
  marketingStaffActivityController.getAllStaffActivities
);

// Retailer shop activity routes
router.post(
  '/retailer-shop-activity',
  protect,
  restrictTo('Marketing Staff'),
  [
    check('shopId', 'Shop ID is required').notEmpty().isMongoId(),
    check('distributorId', 'Distributor ID is required').notEmpty().isMongoId(),
    check('visitStartTime', 'Visit start time is required').isISO8601()
  ],
  retailerShopActivityController.createOrUpdateActivity
);

router.get(
  '/retailer-shop-activity/my-activities',
  protect,
  restrictTo('Marketing Staff'),
  retailerShopActivityController.getMyActivities
);

router.get(
  '/retailer-shop-activity/distributor-shops-sales-orders',
  protect,
  restrictTo('Marketing Staff', 'Mid-Level Manager', 'Admin', 'Godown Incharge'),
  distributorShopsSalesOrdersController.getDistributorShopsSalesOrders
);

// Shop routes
router.post(
  '/shops',
  protect,
  restrictTo('Marketing Staff'),
  [
    check('name', 'Shop name is required').notEmpty(),
    check('ownerName', 'Owner name is required').notEmpty(),
    check('address', 'Address is required').notEmpty(),
    check('type', 'Type must be either Retailer or Whole Seller').isIn(['Retailer', 'Whole Seller']),
    check('distributorId', 'Distributor ID is required').isMongoId()
  ],
  shopController.addShop
);

router.get(
  '/shops/distributor/:distributorId',
  protect,
  restrictTo('Marketing Staff'),
  [
    param('distributorId', 'Distributor ID is required').isMongoId()
  ],
  shopController.getShopsByDistributor
);

// Add new route for shop approval status
router.get(
  '/shops/:id/approval-status',
  protect,
  restrictTo('Marketing Staff'),
  [
    param('id', 'Shop ID is required').isMongoId()
  ],
  shopController.getShopApprovalStatus
);

// Staff activity routes
router.get(
  '/staff-activity/my-activities',
  protect,
  restrictTo('Marketing Staff', 'Godown Incharge'),
  marketingStaffActivityController.getMyActivities
);

// Get assigned tasks
router.get(
  '/tasks/assigned',
  protect,
  restrictTo('Marketing Staff', 'Godown Incharge'),
  taskController.getMyTasks
);

// Get task details
router.get(
  '/tasks/:id',
  protect,
  restrictTo('Marketing Staff', 'Godown Incharge'),
  [
    param('id', 'Task ID is required').isMongoId()
  ],
  taskController.getTask
);

// Damage claim routes
router.post(
  '/damage-claims',
  protect,
  restrictTo('Marketing Staff'),
  [
    check('distributorId', 'Distributor ID is required').isMongoId(),
    check('brand', 'Brand is required').notEmpty(),
    check('variant', 'Variant is required').notEmpty(),
    check('size', 'Size is required').notEmpty(),
    check('quantity', 'Quantity is required').isNumeric(),
    check('damageType', 'Damage type is required').notEmpty(),
    check('images', 'At least one image is required').isArray({ min: 1 })
  ],
  damageClaimController.createDamageClaim
);

router.get(
  '/damage-claims/my-claims',
  protect,
  restrictTo('Marketing Staff'),
  damageClaimController.getUserDamageClaims
);

// Get assigned distributors
router.get(
  '/staff-assignments/assigned-distributors',
  protect,
  restrictTo('Marketing Staff'),
  staffDistributorAssignmentController.getMyAssignedDistributors
);

// Product routes for mobile app
router.get(
  '/products/brands-with-variants',
  protect,
  restrictTo('Marketing Staff'),
  productController.getBrandsWithVariants
);

module.exports = router;
// Distributor routes for mobile app
router.get(
  '/distributors',
  protect,
  restrictTo('Marketing Staff', 'Mid-Level Manager', 'Admin', 'Godown Incharge'),
  distributorController.getDistributors
);

// Sales inquiry routes for mobile app
router.post(
  '/sales-inquiries',
  protect,
  restrictTo('Marketing Staff', 'Mid-Level Manager', 'Admin', 'Godown Incharge'),
  [
    check('distributorId', 'Distributor ID is required').isMongoId(),
    check('products', 'Products array is required').isArray({ min: 1 }),
    check('products.*.brand', 'Brand is required for each product').notEmpty(),
    check('products.*.variant', 'Variant is required for each product').notEmpty(),
    check('products.*.size', 'Size is required for each product').notEmpty(),
    check('products.*.quantity', 'Quantity is required for each product').isNumeric()
  ],
  salesInquiryController.createSalesInquiry
);

router.get(
  '/sales-inquiries/my-inquiries',
  protect,
  restrictTo('Marketing Staff', 'Mid-Level Manager', 'Admin', 'Godown Incharge'),
  salesInquiryController.getUserSalesInquiries
);


// Manager routes for sales inquiries
router.get(
  '/sales-inquiries/all-inquiries',
  protect,
  restrictTo('Mid-Level Manager', 'Admin', 'Godown Incharge'),
  salesInquiryController.getAllSalesInquiriesForManager
);

router.patch(
  '/sales-inquiries/:id/comment',
  protect,
  restrictTo('Mid-Level Manager', 'Admin', 'Godown Incharge'),
  [
    check('comment', 'Comment is required').notEmpty()
  ],
  salesInquiryController.addManagerComment
);

// Manager routes for damage claims
router.get(
  '/damage-claims/mlm/all',
  protect,
  restrictTo('Mid-Level Manager', 'Admin', 'Godown Incharge'),
  damageClaimController.getAllDamageClaimsForManager
);

router.patch(
  '/damage-claims/:id/mlm-comment',
  protect,
  restrictTo('Mid-Level Manager', 'Admin', 'Godown Incharge'),
  [
    check('comment', 'Comment is required').notEmpty()
  ],
  damageClaimController.addMLMComment
);


// Godown Incharge routes for sales inquiries
router.get(
  '/sales-inquiries/godown/all',
  protect,
  restrictTo('Godown Incharge', 'Admin'),
  salesInquiryController.getAllSalesInquiriesForManager
);

router.patch(
  '/sales-inquiries/:id/dispatch',
  protect,
  restrictTo('Godown Incharge', 'Admin'),
  [
    check('dispatchDate', 'Dispatch date is required').isISO8601(),
    check('dispatchDetails', 'Dispatch details are required').notEmpty(),
    check('trackingNumber', 'Tracking number is required').notEmpty()
  ],
  salesInquiryController.dispatchSalesInquiry
);

// Godown Incharge routes for damage claims
router.get(
  '/damage-claims/godown/all',
  protect,
  restrictTo('Godown Incharge', 'Admin'),
  damageClaimController.getGodownAllDamageClaims
);

router.get(
  '/damage-claims/godown/approved',
  protect,
  restrictTo('Godown Incharge', 'Admin'),
  damageClaimController.getGodownApprovedClaims
);

router.get(
  '/damage-claims/godown/:id',
  protect,
  restrictTo('Godown Incharge', 'Admin'),
  damageClaimController.getGodownDamageClaimById
);

router.post(
  '/damage-claims/replacement',
  protect,
  restrictTo('Godown Incharge', 'Admin'),
  [
    check('trackingId', 'Tracking ID is required').notEmpty(),
    check('dispatchDate', 'Dispatch date is required').isISO8601(),
    check('approvedBy', 'Approved by is required').notEmpty(),
    check('channelledTo', 'Channelled to is required').notEmpty(),
    check('referenceNumber', 'Reference number is required').notEmpty()
  ],
  damageClaimController.createReplacement
);

