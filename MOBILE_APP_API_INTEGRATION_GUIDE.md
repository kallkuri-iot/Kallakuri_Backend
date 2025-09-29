# Mobile App API Integration Guide

## Overview
This guide provides all the necessary API endpoints and details for integrating the mobile app with the marketing staff activity system.

## Base URL
```
http://your-server-ip:3000/api
```

## Authentication
All API calls require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Staff Login
**Endpoint:** `POST /mobile/login`

**Request Body:**
```json
{
  "email": "staff@example.com",
  "password": "password123",
  "role": "Marketing Staff"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "68a824fb509d7ba8e656887d",
    "name": "John Doe",
    "email": "staff@example.com",
    "role": "Marketing Staff"
  }
}
```

---

## 2. Get Assigned Distributors
**Endpoint:** `GET /mobile/marketing-activity/assigned-distributors`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68271f50e82cd9672f9a328f",
      "name": "ABC Distributors",
      "shopName": "ABC Shop",
      "address": "123 Main Street",
      "contact": "+1234567890",
      "retailShops": [...],
      "wholesaleShops": [...]
    }
  ]
}
```

---

## 3. Punch In
**Endpoint:** `POST /mobile/marketing-activity/punch-in`

**Request Body:**
```json
{
  "distributorId": "68271f50e82cd9672f9a328f",
  "retailShop": "Shop Name",
  "distributor": "Distributor Name",
  "areaName": "Area Name",
  "tripCompanion": {
    "category": "Distributor Staff",
    "name": "Companion Name"
  },
  "modeOfTransport": "Car",
  "selfieImage": "base64_encoded_image_or_file_path",
  "shopTypes": ["Retailer", "Wholesaler"],
  "shops": [],
  "brandSupplyEstimates": [
    {
      "_id": "brand_id",
      "name": "Brand Name",
      "variants": [
        {
          "name": "Variant Name",
          "size": "1000 ML",
          "estimatedQuantity": 50
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68a9acaf14b3eb03ed0ea2b4",
    "marketingStaffId": "68a824fb509d7ba8e656887d",
    "distributorId": "68271f50e82cd9672f9a328f",
    "meetingStartTime": "2025-08-23T18:05:28.000Z",
    "status": "Punched In",
    "selfieImage": "path/to/selfie.jpg"
  }
}
```

---

## 4. Punch Out
**Endpoint:** `PATCH /mobile/marketing-activity/punch-out`

**Request Body:**
```json
{
  "distributorId": "68271f50e82cd9672f9a328f",
  "meetingEndTime": "2025-08-23T18:06:08.000Z",
  "summary": "Meeting summary",
  "nextSteps": "Next steps"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68a9acaf14b3eb03ed0ea2b4",
    "meetingEndTime": "2025-08-23T18:06:08.000Z",
    "status": "Punched Out",
    "durationMinutes": 40
  }
}
```

---

## 5. Get My Activities (48-Hour Limit)
**Endpoint:** `GET /mobile/marketing-activity/my-activities`

**Query Parameters:**
- `distributorId` (optional): Filter by specific distributor
- `date` (optional): Filter by specific date (YYYY-MM-DD)
- `status` (optional): Filter by status ("Punched In", "Punched Out")

**Example:** `GET /mobile/marketing-activity/my-activities?distributorId=68271f50e82cd9672f9a328f&date=2025-08-23`

**Enhanced Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "68ad9642daf020ba188a6b92",
      "marketingStaffId": {
        "_id": "68a824fb509d7ba8e656887d",
        "name": "Anamika",
        "email": "ak@gmail.com"
      },
      "distributorId": {
        "_id": "68244e1335d35dadb35468bc",
        "name": "Naman",
        "shopName": "JhaGroup",
        "contact": "0000000000",
        "address": "Moti nagar, Moti nagar"
      },
      "meetingStartTime": "2025-08-26T11:10:58.982Z",
      "meetingEndTime": "2025-08-26T11:20:58.982Z",
      "status": "Punched Out",
      "durationMinutes": 10,
      "selfieImage": "/uploads/selfies/placeholder.jpg",
      "tripCompanion": {
        "category": "Distributor Staff",
        "name": "Naman"
      },
      "modeOfTransport": "Bike",
      "areaName": "Moti nagar, Moti nagar",
      "brandSupplyEstimates": [...],
      "createdAt": "2025-08-26T11:10:58.992Z",
      "updatedAt": "2025-08-26T11:20:58.992Z",
      "isVisibleToStaff": true,
      "shopsVisitedCount": 2,
      
      // NEW: Detailed Shop Visits
      "detailedShopVisits": [
        {
          "shopId": "682727a8b71636b4e694bdf1",
          "shopName": "JhaDukaan",
          "shopOwner": "Mr. Jha",
          "shopAddress": "123 Main Street, Moti Nagar",
          "shopType": "Retailer",
          "shopContact": "+919876543210",
          "visitTime": "2025-08-26T11:12:00.000Z",
          "status": "Completed",
          "mobileNumber": "0987654321",
          
          // Sales Orders for this shop
          "salesOrders": [
            {
              "brandName": "Surya Chandra",
              "variant": "Pouch",
              "size": "2000 ML",
              "quantity": 34,
              "rate": 45,
              "totalValue": 1530,
              "isDisplayedInCounter": true,
              "orderType": "Fresh Order"
            }
          ],
          
          // Alternate Providers for this shop
          "alternateProviders": [
            {
              "for": "Surya Chandra 2000 ML",
              "brandName": "Competitor Brand",
              "variant": "Pouch",
              "size": "2000 ML",
              "rate": 42,
              "stockDate": "5"
            }
          ],
          
          // Additional Information
          "complaint": "Customer complained about late delivery last week",
          "marketInsight": "Competition is offering better rates for 2000 ML pouches",
          "voiceNote": "",
          "voiceNoteBase64": "",
          
          // Shop Totals
          "totalSalesOrders": 1,
          "totalSalesValue": 1530,
          "totalAlternateProviders": 1
        }
      ],
      
      // NEW: Summary for this distributor visit
      "summary": {
        "totalShopsVisited": 2,
        "totalSalesOrders": 3,
        "totalSalesValue": 2680,
        "totalAlternateProviders": 1,
        "productSummary": [
          {
            "brandName": "Surya Chandra",
            "variant": "Pouch",
            "size": "2000 ML",
            "totalQuantity": 34,
            "totalValue": 1530
          },
          {
            "brandName": "Surya Teja",
            "variant": "Pouch",
            "size": "1000 ML",
            "totalQuantity": 15,
            "totalValue": 450
          }
        ],
        "hasComplaints": true,
        "hasMarketInsights": true,
        "hasVoiceNotes": false
      }
    }
  ]
}
```

**Important:** 
- Activities older than 48 hours are automatically filtered out for staff users
- Each distributor visit now includes detailed shop visit information
- Product summary shows aggregated data across all shops for that distributor visit
- Complete sales orders, complaints, and market insights are included

---

## 6. Create Retailer Shop Activity
**Endpoint:** `POST /mobile/retailer-shop-activity`

**Request Body:**
```json
{
  "taskId": "68271f50e82cd9672f9a328f",
  "shopId": "682727a8b71636b4e694bdf1",
  "distributorId": "68271f50e82cd9672f9a328f",
  "isPunchedIn": true,
  "punchInTime": "6:05:28 PM",
  "punchOutTime": "6:06:08 PM",
  "salesOrders": [
    {
      "brandName": "Surya Chandra",
      "variant": "Pouch",
      "size": "2000 ML",
      "quantity": 34,
      "isDisplayedInCounter": true
    }
  ],
  "alternateProviders": [
    {
      "for": "Product Name",
      "brandName": "Competitor Brand",
      "variant": "Variant",
      "size": "Size",
      "rate": 345,
      "stockDate": "5"
    }
  ],
  "complaint": "Customer complaint details",
  "marketInsight": "Market insight details",
  "voiceNote": "",
  "voiceNoteBase64": "",
  "mobileNumber": "0987654321",
  "status": "In Progress"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "activity_id",
    "shopId": "682727a8b71636b4e694bdf1",
    "distributorId": "68271f50e82cd9672f9a328f",
    "salesOrders": [...],
    "status": "In Progress"
  }
}
```

---

## 7. Get Shops by Distributor
**Endpoint:** `GET /mobile/shops/distributor/{distributorId}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "682727a8b71636b4e694bdf1",
      "name": "Shop Name",
      "ownerName": "Owner Name",
      "address": "Shop Address",
      "type": "Retailer",
      "contact": "+1234567890"
    }
  ]
}
```

---

## 8. Get Products/Brands
**Endpoint:** `GET /mobile/products/brands-with-variants`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "brand_id",
      "name": "Brand Name",
      "variants": [
        {
          "_id": "variant_id",
          "name": "Variant Name",
          "sizes": ["1000 ML", "2000 ML"]
        }
      ]
    }
  ]
}
```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Important Notes for App Developer

### 1. 48-Hour Activity Visibility
- Staff can only see their activities for up to 48 hours
- After 48 hours, activities are automatically hidden from staff view
- Admins can still see all activities regardless of age

### 2. Activity Flow
1. Staff logs in
2. Staff gets assigned distributors
3. Staff punches in at a distributor
4. Staff visits shops within that distributor
5. Staff creates retailer shop activities for each shop visit
6. Staff punches out from the distributor

### 3. Image Handling
- Selfie images can be sent as base64 strings or file paths
- Ensure proper image compression before sending

### 4. Date/Time Format
- All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Time zones should be handled appropriately

### 5. Validation
- Always validate required fields before sending requests
- Handle network errors gracefully
- Implement proper loading states

### 6. Token Management
- Store the JWT token securely
- Refresh token when needed
- Handle token expiration gracefully

---

## Testing Endpoints

You can test these endpoints using Postman or any API testing tool. Make sure to:

1. First call the login endpoint to get a token
2. Use the token in the Authorization header for all subsequent requests
3. Test the complete flow: login → get distributors → punch in → create shop activities → punch out → view activities

---

## Support

If you encounter any issues or need clarification, please refer to the server logs or contact the backend team. 