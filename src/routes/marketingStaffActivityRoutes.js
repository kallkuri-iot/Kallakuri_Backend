const express = require('express');
const { check } = require('express-validator');
const marketingStaffActivityController = require('../controllers/marketingStaffActivityController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();
const mobileRouter = express.Router();

// Routes for admin panel
router.get('/', protect, marketingStaffActivityController.getAllActivities);
router.get('/:id', protect, marketingStaffActivityController.getMarketingActivity);

/**
 * @swagger
 * /api/marketing-activity/{id}:
 *   delete:
 *     summary: Delete marketing staff activity
 *     description: Delete a specific marketing staff activity (Admin only)
 *     tags: [Marketing Staff Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the activity to delete
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       400:
 *         description: Invalid activity ID format
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Activity not found
 */
router.delete(
  '/:id',
  protect,
  restrictTo('Admin'),
  marketingStaffActivityController.deleteActivity
);

/**
 * @swagger
 * /api/marketing-activity/distributor/{distributorId}:
 *   get:
 *     summary: Get marketing staff activities by distributor ID
 *     description: Get all activities for a specific distributor with optional filters
 *     tags: [Marketing Staff Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: distributorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the distributor
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Punched In, Punched Out]
 *         description: Filter by activity status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of activities for the distributor
 *       400:
 *         description: Invalid distributor ID format
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/distributor/:distributorId',
  protect,
  marketingStaffActivityController.getActivitiesByDistributorId
);

// Mobile app routes - temporarily removed restrictTo to fix the error
// TEMPORARY: Made validation more lenient during transition period
mobileRouter.post(
  '/punch-in',
  protect,
  [
    // Make distributorId optional during transition period
    // check('distributorId', 'Distributor ID is required').not().isEmpty(),
    // Make these fields optional during transition
    // check('retailShop', 'Retail shop name is required').not().isEmpty(),
    // check('distributor', 'Distributor name is required').not().isEmpty(),
    // check('areaName', 'Area name is required').not().isEmpty(),
    check('tripCompanion', 'Trip companion information is required').isObject(),
    check('tripCompanion.category', 'Trip companion category is required').isIn(['Distributor Staff', 'Marketing Staff', 'Other']),
    check('tripCompanion.name', 'Trip companion name is required').not().isEmpty(),
    check('modeOfTransport', 'Mode of transport is required').not().isEmpty(),
    check('selfieImage', 'Selfie image is required').not().isEmpty(),
    check('shopTypes', 'At least one shop type is required').isArray({ min: 1 })
  ],
  marketingStaffActivityController.punchIn
);

mobileRouter.patch(
  '/punch-out',
  protect,
  [
    // Make distributorId optional during transition period
    // check('distributorId', 'Distributor ID is required').not().isEmpty()
  ],
  marketingStaffActivityController.punchOut
);

/**
 * @swagger
 * /api/mobile/marketing-activity/my-activities:
 *   get:
 *     summary: Get marketing staff activities
 *     description: Get activities for the logged-in marketing staff with optional filtering
 *     tags: [Mobile App]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: distributorId
 *         schema:
 *           type: string
 *         description: Filter activities by distributor ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Punched In, Punched Out]
 *         description: Filter by activity status
 *     responses:
 *       200:
 *         description: List of activities
 *       400:
 *         description: Invalid distributorId format
 *       401:
 *         description: Not authenticated
 */
mobileRouter.get(
  '/my-activities',
  protect,
  marketingStaffActivityController.getMyActivities
);

mobileRouter.get(
  '/assigned-distributors',
  protect,
  marketingStaffActivityController.getAssignedDistributors
);

module.exports = {
  router,
  mobileRouter
};