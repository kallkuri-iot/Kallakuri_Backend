const express = require('express');
const router = express.Router();
const retailerShopActivityController = require('../controllers/retailerShopActivityController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { check, param } = require('express-validator');

/**
 * @swagger
 * /api/retailer-shop-activity:
 *   post:
 *     summary: Create or update retailer shop activity
 *     tags: [Retailer Shop Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shopId
 *               - distributorId
 *               - visitStartTime
 *             properties:
 *               shopId:
 *                 type: string
 *                 description: ID of the shop being visited
 *               distributorId:
 *                 type: string
 *                 description: ID of the distributor
 *               visitStartTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the shop visit started
 *               visitEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the shop visit ended
 *               salesOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     brandName:
 *                       type: string
 *                     variant:
 *                       type: string
 *                     size:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     rate:
 *                       type: number
 *               alternateProviders:
 *                 type: array
 *                 items:
 *                   type: object
 *               complaint:
 *                 type: string
 *               marketInsight:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               visitType:
 *                 type: string
 *                 enum: [Scheduled, Unscheduled, Follow-up, Emergency]
 *               visitObjective:
 *                 type: string
 *                 enum: [Order Collection, Market Survey, Complaint Resolution, Product Introduction, Relationship Building]
 *               visitOutcome:
 *                 type: string
 *                 enum: [Successful, Partially Successful, Unsuccessful, Rescheduled]
 *               status:
 *                 type: string
 *                 enum: [In Progress, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Activity created/updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  protect,
  restrictTo('Marketing Staff'),
  [
    check('shopId', 'Shop ID is required').notEmpty().isMongoId(),
    check('distributorId', 'Distributor ID is required').notEmpty().isMongoId(),
    check('visitStartTime', 'Visit start time is required').isISO8601()
  ],
  retailerShopActivityController.createOrUpdateActivity
);

/**
 * @swagger
 * /api/retailer-shop-activity:
 *   get:
 *     summary: Get all shop activities (Admin)
 *     tags: [Retailer Shop Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: distributorId
 *         schema:
 *           type: string
 *         description: Filter by distributor ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of shop activities
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  protect,
  restrictTo('Admin', 'Mid-Level Manager'),
  retailerShopActivityController.getAllActivities
);

module.exports = router;