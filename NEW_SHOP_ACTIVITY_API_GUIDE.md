# New Shop Activity API Guide

## Overview

This document provides complete API documentation for the new shop activity system that properly handles shop IDs, individual shop visit timings, and eliminates the "Unknown Shop" issue.

## Key Changes

1. **No More Shop Creation**: The system no longer creates new shops during activities
2. **Proper Shop ID Handling**: Uses existing shop IDs from distributors
3. **Individual Shop Timings**: Each shop visit has its own start/end time and duration
4. **Clean Data Structure**: Simplified and more reliable data flow

## API Endpoints

### 1. Punch-In (Marketing Activity Start)

**Endpoint**: `POST /api/mobile/marketing-activity/punch-in`

**Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "distributorId": "68be88b53b9d1f3859481059",
  "retailShop": "Main Distributor Shop",
  "distributor": "ABC Distributors",
  "areaName": "Delhi NCR",
  "tripCompanion": {
    "category": "Marketing Staff",
    "name": "John Doe"
  },
  "modeOfTransport": "Bike",
  "selfieImage": "base64_encoded_image_or_url",
  "shopTypes": ["Retailer", "Whole Seller"],
  "shops": [
    {
      "name": "Shop Name 1",
      "type": "Retailer",
      "ownerName": "Owner Name",
      "address": "Shop Address"
    }
  ],
  "brandSupplyEstimates": [
    {
      "name": "Brand Name",
      "variants": [
        {
          "name": "Variant Name",
          "sizes": [
            {
              "name": "100ml",
              "openingStock": 50,
              "proposedMarketRate": 100
            }
          ]
        }
      ]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "68be8d648e010e61a3963a9d",
    "distributorId": "68be88b53b9d1f3859481059",
    "marketingStaffId": "68be89323b9d1f38594810bb",
    "retailShop": "Main Distributor Shop",
    "distributor": "ABC Distributors",
    "areaName": "Delhi NCR",
    "tripCompanion": {
      "category": "Marketing Staff",
      "name": "John Doe"
    },
    "modeOfTransport": "Bike",
    "meetingStartTime": "2025-09-08T08:01:40.628Z",
    "status": "Punched In",
    "shops": [
      {
        "name": "Shop Name 1",
        "type": "Retailer",
        "ownerName": "Owner Name",
        "address": "Shop Address",
        "_id": "68be8d648e010e61a3963a9c"
      }
    ],
    "brandSupplyEstimates": [...],
    "createdAt": "2025-09-08T08:01:40.640Z",
    "updatedAt": "2025-09-08T08:01:40.640Z"
  }
}
```

### 2. Shop Activity Submission

**Endpoint**: `POST /api/mobile/retailer-shop-activity`

**Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "shopId": "68be88cb3b9d1f385948106f",
  "distributorId": "68be88b53b9d1f3859481059",
  "visitStartTime": "2025-09-08T08:02:00.000Z",
  "visitEndTime": "2025-09-08T08:17:00.000Z",
  "salesOrders": [
    {
      "brandName": "Test Brand",
      "variant": "Test Variant",
      "size": "100ml",
      "quantity": 10,
      "rate": 50,
      "isDisplayedInCounter": true
    }
  ],
  "alternateProviders": [
    {
      "for": "Test Brand",
      "brandName": "Competitor Brand",
      "variant": "Competitor Variant",
      "size": "100ml",
      "rate": 45,
      "stockDate": "2025-09-08"
    }
  ],
  "complaint": "Shop needs better delivery timing",
  "marketInsight": "High demand for this product in the area",
  "mobileNumber": "9876543210",
  "visitType": "Scheduled",
  "visitObjective": "Order Collection",
  "visitOutcome": "Successful",
  "status": "Completed"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "68be8d7b8e010e61a3963aab",
    "marketingStaffId": {
      "_id": "68be89323b9d1f38594810bb",
      "name": "Test Marketing Staff",
      "email": "test.staff@example.com",
      "role": "Marketing Staff"
    },
    "marketingActivityId": "68be8d648e010e61a3963a9d",
    "distributorId": {
      "_id": "68be88b53b9d1f3859481059",
      "name": "Test Distributor For Shop Fix",
      "shopName": "Test Shop",
      "contact": "9876543210",
      "address": "Test Address, Delhi"
    },
    "shopId": "68be88cb3b9d1f385948106f",
    "shopName": "Test Retail Shop",
    "shopOwnerName": "Test Owner",
    "shopAddress": "Test Address, Delhi",
    "shopType": "Retailer",
    "visitStartTime": "2025-09-08T08:02:00.000Z",
    "visitEndTime": "2025-09-08T08:17:00.000Z",
    "visitDurationMinutes": 15,
    "salesOrders": [
      {
        "brandName": "Test Brand",
        "variant": "Test Variant",
        "size": "100ml",
        "quantity": 10,
        "rate": 50,
        "isDisplayedInCounter": true,
        "orderType": "Fresh Order",
        "_id": "68be8d7b8e010e61a3963aac"
      }
    ],
    "alternateProviders": [
      {
        "for": "Test Brand",
        "brandName": "Competitor Brand",
        "variant": "Competitor Variant",
        "size": "100ml",
        "rate": 45,
        "stockDate": "2025-09-08",
        "marketShare": "Medium",
        "qualityRating": 3,
        "_id": "68be8d7b8e010e61a3963aad"
      }
    ],
    "complaint": "Shop needs better delivery timing",
    "marketInsight": "High demand for this product in the area",
    "photos": [],
    "voiceNote": "",
    "mobileNumber": "9876543210",
    "visitType": "Scheduled",
    "visitObjective": "Order Collection",
    "visitOutcome": "Successful",
    "status": "Completed",
    "createdAt": "2025-09-08T08:02:03.199Z",
    "updatedAt": "2025-09-08T08:02:03.199Z",
    "shopDetails": {
      "_id": "68be88cb3b9d1f385948106f",
      "name": "Test Retail Shop",
      "ownerName": "Test Owner",
      "address": "Test Address, Delhi",
      "type": "Retailer"
    }
  }
}
```

### 3. Get My Activities (Staff)

**Endpoint**: `GET /api/mobile/retailer-shop-activity/my-activities`

**Query Parameters**:
- `distributorId` (optional): Filter by distributor
- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### 4. Punch-Out (Marketing Activity End)

**Endpoint**: `PATCH /api/mobile/marketing-activity/punch-out`

**Request Body**:
```json
{
  "distributorId": "68be88b53b9d1f3859481059"
}
```

## Important Notes for App Developer

### 1. Shop ID Usage

**CRITICAL**: Always use the shop IDs from the distributor's shop list. Do NOT create new shops.

```javascript
// Get distributor details first
const distributorResponse = await api.get(`/distributors/${distributorId}`);
const distributor = distributorResponse.data.data;

// Use shop IDs from distributor.retailShops or distributor.wholesaleShops
const shopId = distributor.retailShops[0]._id; // Use existing shop ID

// Submit shop activity with this shop ID
const activityData = {
  shopId: shopId, // Use the existing shop ID
  distributorId: distributorId,
  visitStartTime: new Date().toISOString(),
  // ... other data
};
```

### 2. Timing Management

**Individual Shop Timings**: Each shop visit should have its own start and end time:

```javascript
// When staff starts visiting a shop
const visitStartTime = new Date().toISOString();

// When staff finishes visiting a shop
const visitEndTime = new Date().toISOString();

// Calculate duration (done automatically by backend)
const activityData = {
  shopId: shopId,
  distributorId: distributorId,
  visitStartTime: visitStartTime,
  visitEndTime: visitEndTime,
  // ... other data
};
```

### 3. Data Flow

1. **Staff punches in** at distributor → Creates `MarketingStaffActivity`
2. **Staff visits individual shops** → Creates `RetailerShopActivity` for each shop
3. **Staff punches out** → Updates `MarketingStaffActivity` with end time

### 4. Error Handling

```javascript
// Always check for active marketing activity first
try {
  const response = await api.post('/mobile/retailer-shop-activity', activityData);
  if (response.data.success) {
    // Activity saved successfully
    console.log('Shop activity saved:', response.data.data);
  }
} catch (error) {
  if (error.response?.data?.error === 'No active marketing activity found. Please punch in first.') {
    // Redirect to punch-in screen
    alert('Please punch in at the distributor first');
  } else {
    // Handle other errors
    console.error('Error saving shop activity:', error);
  }
}
```

### 5. Required Fields

**For Punch-In**:
- `distributorId` (required)
- `retailShop` (required)
- `distributor` (required)
- `areaName` (required)
- `modeOfTransport` (required)

**For Shop Activity**:
- `shopId` (required) - Must be from distributor's shop list
- `distributorId` (required)
- `visitStartTime` (required)

### 6. Field Validations

```javascript
// Visit types
const visitTypes = ['Scheduled', 'Unscheduled', 'Follow-up', 'Emergency'];

// Visit objectives
const visitObjectives = [
  'Order Collection', 
  'Market Survey', 
  'Complaint Resolution', 
  'Product Introduction', 
  'Relationship Building'
];

// Visit outcomes
const visitOutcomes = [
  'Successful', 
  'Partially Successful', 
  'Unsuccessful', 
  'Rescheduled'
];

// Activity status
const activityStatuses = ['In Progress', 'Completed', 'Cancelled'];
```

### 7. Admin Panel Data Structure

The admin panel now shows:
- **Proper shop names** (no more "Unknown Shop")
- **Individual shop visit durations**
- **Total distributor visit time**
- **Sales orders with proper shop attribution**
- **Complete activity timeline**

## Testing the API

Use the provided test data to verify the implementation:

1. Create a distributor with shops
2. Assign distributor to marketing staff
3. Punch in with marketing staff
4. Submit shop activities using existing shop IDs
5. Punch out
6. Verify data in admin panel

## Migration Notes

If you have existing data with the old system:
- Legacy shop IDs will still work
- The system handles both new Shop documents and legacy distributor shop IDs
- No data loss during migration

## Support

For any issues or questions about the API implementation, please provide:
1. Request/response examples
2. Error messages
3. Expected vs actual behavior
4. Sample data used for testing 