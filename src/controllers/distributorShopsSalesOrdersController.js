const RetailerShopActivity = require('../models/RetailerShopActivity');

/**
 * Get all shops for a distributor, each with their sales orders (clean logic)
 * @route GET /api/mobile/retailer-shop-activity/distributor-shops-sales-orders
 * @query distributorId (required), startDate (optional), endDate (optional)
 */
exports.getDistributorShopsSalesOrders = async (req, res) => {
  try {
    const { distributorId, startDate, endDate } = req.query;
    if (!distributorId) {
      return res.status(400).json({ success: false, error: 'distributorId is required' });
    }

    // Build query
    const query = { distributorId };
    // Filter by logged-in marketing staff
    if (req.user && req.user.id) {
      query.marketingStaffId = req.user.id;
    } else {
      return res.status(401).json({ success: false, error: 'Unauthorized: No staff user found' });
    }
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(-8640000000000000);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      query.createdAt = { $gte: start, $lte: end };
    }

    console.log('Query for distributor shops:', query);

    // Find all activities for this distributor and staff
    const activities = await RetailerShopActivity.find(query)
      .populate({
        path: 'shopId',
        select: 'name ownerName address type',
        options: { strictPopulate: false }
      })
      .lean();

    console.log(`Found ${activities.length} activities for distributor ${distributorId}`);

    // Group by shopId
    const shopMap = {};
    for (const activity of activities) {
      console.log('Processing activity:', {
        activityId: activity._id,
        shopId: activity.shopId,
        shopData: activity.shopId
      });

      if (!activity.shopId) {
        console.warn('Activity has no shopId:', activity._id);
        continue;
      }

      const shopKey = activity.shopId._id ? activity.shopId._id.toString() : activity.shopId.toString();
      
      if (!shopMap[shopKey]) {
        shopMap[shopKey] = {
          shopId: shopKey,
          // Handle both populated and non-populated shopId
          shopName: activity.shopId.name || 
                   (typeof activity.shopId === 'object' ? activity.shopId.name : null) || 
                   `Shop ${shopKey.slice(-6)}`, // Fallback name
          shopOwner: activity.shopId.ownerName || 
                    (typeof activity.shopId === 'object' ? activity.shopId.ownerName : null) || 
                    'Unknown Owner',
          shopAddress: activity.shopId.address || 
                      (typeof activity.shopId === 'object' ? activity.shopId.address : null) || 
                      'Address not available',
          shopType: activity.shopId.type || 
                   (typeof activity.shopId === 'object' ? activity.shopId.type : null) || 
                   'Retailer',
          salesOrders: []
        };
      }
      
      // Add all sales orders for this activity
      if (Array.isArray(activity.salesOrders) && activity.salesOrders.length > 0) {
        console.log(`Adding ${activity.salesOrders.length} sales orders for shop ${shopKey}`);
        shopMap[shopKey].salesOrders.push(...activity.salesOrders);
      }
    }

    const data = Object.values(shopMap);
    console.log(`Returning ${data.length} shops with sales orders`);
    
    // Log sample data for debugging
    if (data.length > 0) {
      console.log('Sample shop data:', {
        shopName: data[0].shopName,
        shopOwner: data[0].shopOwner,
        salesOrdersCount: data[0].salesOrders.length
      });
    }

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Error in getDistributorShopsSalesOrders:', error);
    return res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
};
