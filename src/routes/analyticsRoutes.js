const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

/**
 * @route GET /api/analytics/overview
 * @desc Get overview analytics for the dashboard
 * @access Private
 */
router.get('/overview', protect, analyticsController.getOverviewAnalytics);

/**
 * @route GET /api/analytics/damage-claims
 * @desc Get damage claims analytics
 * @access Private
 */
router.get('/damage-claims', protect, analyticsController.getDamageClaimsAnalytics);

/**
 * @route GET /api/analytics/orders
 * @desc Get order analytics
 * @access Private
 */
router.get('/orders', protect, analyticsController.getOrderAnalytics);

/**
 * @route GET /api/analytics/staff-activity
 * @desc Get staff activity analytics
 * @access Private
 */
router.get('/staff-activity', protect, analyticsController.getStaffActivityAnalytics);

/**
 * @route GET /api/analytics/market-inquiry
 * @desc Get market inquiry analytics for retailers/wholesalers under distributors
 * @access Private
 */
router.get('/market-inquiry', protect, analyticsController.getMarketInquiryAnalytics);

/**
 * @route GET /api/analytics/brand-orders
 * @desc Get brand-based order analytics with distributor frequency tracking
 * @access Private
 */
router.get('/brand-orders', protect, analyticsController.getBrandOrderAnalytics);

/**
 * @route GET /api/analytics/inventory-analysis
 * @desc Get inventory analysis based on market inquiries vs actual orders
 * @access Private
 */
router.get('/inventory-analysis', protect, analyticsController.getInventoryAnalysis);

module.exports = router;