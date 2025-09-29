const mongoose = require('mongoose');

const SizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Size name is required'],
    trim: true
  },
  openingStock: {
    type: Number,
    default: 0
  },
  proposedMarketRate: {
    type: Number,
    default: 0
  }
}, { _id: true });

const VariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Variant name is required'],
    trim: true
  },
  sizes: [SizeSchema]
}, { _id: true });

const BrandSupplyEstimateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  variants: [VariantSchema]
}, { _id: true });

const SalesOrderSchema = new mongoose.Schema({
  brandName: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  variant: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  rate: {
    type: Number,
    default: 0
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  isDisplayedInCounter: {
    type: Boolean,
    default: false
  },
  orderType: {
    type: String,
    default: 'Fresh Order'
  }
}, { _id: true });

const MarketingStaffActivitySchema = new mongoose.Schema(
  {
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor',
      required: [true, 'Distributor ID is required'],
      index: true
    },
    marketingStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marketing staff ID is required'],
      index: true
    },
    retailShop: {
      type: String,
      required: [true, 'Retail shop name is required'],
      trim: true
    },
    distributor: {
      type: String,
      required: [true, 'Distributor name is required'],
      trim: true
    },
    areaName: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true
    },
    tripCompanion: {
      category: {
        type: String,
        enum: ['Distributor Staff', 'Marketing Staff', 'Other'],
        required: [true, 'Trip companion category is required']
      },
      name: {
        type: String,
        required: [true, 'Trip companion name is required'],
        trim: true
      }
    },
    modeOfTransport: {
      type: String,
      required: [true, 'Mode of transport is required'],
      trim: true
    },
    meetingStartTime: {
      type: Date,
      default: Date.now
    },
    meetingEndTime: {
      type: Date
    },
    initialSupplyEstimate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplyEstimate'
    },
    proposedMarketRate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketRate'
    },
    brandSupplyEstimates: [BrandSupplyEstimateSchema],
    salesOrders: [SalesOrderSchema],
    selfieImage: {
      type: String,
      required: [true, 'Selfie image is required']
    },
    shopTypes: {
      type: [{
        type: String,
        enum: ['Retailer', 'Whole Seller']
      }],
      required: [true, 'At least one shop type is required']
    },
    shops: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      ownerName: {
        type: String,
        trim: true
      },
      address: {
        type: String,
        trim: true
      },
      type: {
        type: String,
        enum: ['Retailer', 'Whole Seller'],
        required: true
      },
      distributorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor'
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      }
    }],
    status: {
      type: String,
      enum: ['Punched In', 'Punched Out'],
      default: 'Punched In',
      index: true
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    voiceNotes: [{
      url: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        default: 0
      },
      createdAt: {
        type: Date,
        default: Date.now
    }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field to determine if this activity is visible to the staff
MarketingStaffActivitySchema.virtual('isVisibleToStaff').get(function() {
  // Check if the activity is less than 48 hours old
  const now = new Date();
  const activityTime = this.createdAt || now;
  const hoursDiff = (now - activityTime) / (1000 * 60 * 60);
  
  return hoursDiff <= 48;
});

// Add compound indexes for common queries
MarketingStaffActivitySchema.index({ marketingStaffId: 1, createdAt: -1 });
MarketingStaffActivitySchema.index({ distributorId: 1, createdAt: -1 });
MarketingStaffActivitySchema.index({ marketingStaffId: 1, distributorId: 1 });
MarketingStaffActivitySchema.index({ marketingStaffId: 1, status: 1, meetingEndTime: 1 });
MarketingStaffActivitySchema.index({ createdAt: 1 }); // For date range queries

const MarketingStaffActivity = mongoose.model('MarketingStaffActivity', MarketingStaffActivitySchema);

module.exports = MarketingStaffActivity;