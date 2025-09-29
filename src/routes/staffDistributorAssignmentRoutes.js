const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const staffDistributorAssignmentController = require('../controllers/staffDistributorAssignmentController');
const { protect } = require('../middleware/authMiddleware');

// Routes for admin panel - temporarily removed restrictTo to fix the error
router.post(
  '/',
  protect,
  [
    check('staffId', 'Staff ID is required').not().isEmpty(),
    check('distributorIds', 'Distributor IDs must be an array').isArray()
  ],
  staffDistributorAssignmentController.assignDistributorsToStaff
);

router.get(
  '/',
  protect,
  staffDistributorAssignmentController.getAllStaffAssignments
);

router.get(
  '/:staffId',
  protect,
  staffDistributorAssignmentController.getStaffAssignment
);

router.patch(
  '/:staffId/remove-distributors',
  protect,
  [
    check('distributorIds', 'Distributor IDs must be an array').isArray()
  ],
  staffDistributorAssignmentController.removeDistributorsFromStaff
);

router.delete(
  '/:id',
  protect,
  staffDistributorAssignmentController.deleteStaffAssignment
);

module.exports = router; 