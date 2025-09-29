// Simple monthly trend data for brand analytics
const getBrandMonthlyTrend = async (combinedFilter, salesOrderFilters) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthlyData = [];
  
  for (let i = 5; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;
    
    if (month < 0) {
      month += 12;
      year -= 1;
    }
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get order data for this month
    const monthlyOrders = await RetailerShopActivity.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          ...salesOrderFilters
        } 
      },
      { $unwind: { path: '$salesOrders', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: { $ifNull: ['$salesOrders.quantity', 0] } },
          totalValue: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$salesOrders.quantity', 0] }, 
                { $ifNull: ['$salesOrders.rate', 0] }
              ] 
            } 
          }
        }
      }
    ]);
    
    const orderCount = monthlyOrders.length > 0 ? monthlyOrders[0].totalOrders : 0;
    const orderQuantity = monthlyOrders.length > 0 ? monthlyOrders[0].totalQuantity : 0;
    const orderValue = monthlyOrders.length > 0 ? Math.round(monthlyOrders[0].totalValue) : 0;
    
    monthlyData.push({
      month: `${year}-${(month + 1).toString().padStart(2, '0')}`,
      orders: orderCount,
      quantity: orderQuantity,
      value: orderValue
    });
  }
  
  return monthlyData;
};
