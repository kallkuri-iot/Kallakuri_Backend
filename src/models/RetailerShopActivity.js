const mongoose = require('mongoose');

const SalesOrderSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  variant: {
    type: String,
    required: [true, 'Variant is required'],
    trim: true
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  rate: {
    type: Number,
    default: 0,
    min: 0
  },
  isDisplayedInCounter: {
    type: Boolean,
    default: false
  },
  orderType: {
    type: String,
    enum: ['Fresh Order', 'Repeat Order', 'Emergency Order'],
    default: 'Fresh Order'
  }
}, { _id: true });

const AlternateProviderSchema = new mongoose.Schema({
  for: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  brandName: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  variant: {
    type: String,
    required: [true, 'Variant is required'],
    trim: true
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    trim: true
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: 0
  },
  stockDate: {
    type: String,
    required: [true, 'Stock date is required'],
    trim: true
  },
  marketShare: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { _id: true });

const RetailerShopActivitySchema = new mongoose.Schema({
    marketingStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    required: [true, 'Marketing staff is required']
  },
  marketingActivityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingStaffActivity',
    required: [true, 'Marketing activity is required']
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor',
    required: [true, 'Distributor is required']
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Shop ID is required']
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true
    },
  shopOwnerName: {
    type: String,
    required: [true, 'Shop owner name is required'],
    trim: true
  },
  shopAddress: {
    type: String,
    required: [true, 'Shop address is required'],
    trim: true
  },
  shopType: {
    type: String,
    enum: ['Retailer', 'Whole Seller'],
    default: 'Retailer'
  },
  visitStartTime: {
      type: Date,
    required: [true, 'Visit start time is required']
    },
  visitEndTime: {
      type: Date
    },
  visitDurationMinutes: {
    type: Number,
    default: 0,
      min: 0
    },
  salesOrders: [SalesOrderSchema],
    alternateProviders: [AlternateProviderSchema],
    complaint: {
      type: String,
    trim: true,
    default: ''
    },
    marketInsight: {
      type: String,
    trim: true,
    default: ''
    },
    photos: [{
      type: String,
      trim: true
    }],
  voiceNote: {
    type: String,
    trim: true,
    default: ''
  },
    mobileNumber: {
      type: String,
    trim: true,
    default: ''
    },
    visitType: {
      type: String,
      enum: ['Scheduled', 'Unscheduled', 'Follow-up', 'Emergency'],
      default: 'Scheduled'
    },
    visitObjective: {
      type: String,
    enum: ['Order Collection', 'Market Survey', 'Complaint Resolution', 'Product Introduction', 'Relationship Building'],
      default: 'Order Collection'
    },
    visitOutcome: {
      type: String,
    enum: ['Successful', 'Partially Successful', 'Unsuccessful', 'Rescheduled'],
      default: 'Successful'
    },
    status: {
      type: String,
    enum: ['In Progress', 'Completed', 'Cancelled'],
    default: 'Completed'
    }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total sales value
RetailerShopActivitySchema.virtual('totalSalesValue').get(function() {
  if (!this.salesOrders || this.salesOrders.length === 0) return 0;
  return this.salesOrders.reduce((total, order) => {
    return total + (order.quantity * order.rate);
  }, 0);
});

// Virtual for total sales orders count
RetailerShopActivitySchema.virtual('totalSalesOrders').get(function() {
  return this.salesOrders ? this.salesOrders.length : 0;
});

// Indexes for better performance
RetailerShopActivitySchema.index({ marketingStaffId: 1, createdAt: -1 });
RetailerShopActivitySchema.index({ distributorId: 1, createdAt: -1 });
RetailerShopActivitySchema.index({ shopId: 1, createdAt: -1 });
RetailerShopActivitySchema.index({ marketingActivityId: 1 });
RetailerShopActivitySchema.index({ status: 1 });
RetailerShopActivitySchema.index({ visitStartTime: 1 });

module.exports = mongoose.model('RetailerShopActivity', RetailerShopActivitySchema);
