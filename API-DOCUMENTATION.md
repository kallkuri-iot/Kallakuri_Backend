# API Documentation

## Shop Management

### Get Pending Shops

**Endpoint:** `GET /api/shops/pending`

**Description:** Get a list of shops pending approval.

**Authentication Required:** Yes (Admin, Mid-Level Manager)

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `distributorId` (optional): Filter by distributor ID

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Shop Name",
      "ownerName": "Owner Name",
      "address": "Shop Address",
      "type": "Retailer",
      "distributorId": {
        "_id": "60d21b1c67d0d8992e610c83",
        "name": "Distributor Name",
        "shopName": "Distributor Shop",
        "address": "Distributor Address"
      },
      "createdBy": {
        "_id": "60d21b1c67d0d8992e610c83",
        "name": "Marketing Staff Name",
        "email": "staff@example.com",
        "role": "Marketing Staff"
      },
      "approvalStatus": "Pending",
      "isActive": true,
      "createdAt": "2023-06-18T12:00:00.000Z",
      "updatedAt": "2023-06-18T12:00:00.000Z"
    },
    // ... more shops
  ],
  "pagination": {
    "totalItems": 5,
    "totalPages": 1,
    "currentPage": 1,
    "itemsPerPage": 10
  }
}
```

### Update Shop Approval Status

**Endpoint:** `PATCH /api/shops/:id/approval`

**Description:** Approve or reject a shop.

**Authentication Required:** Yes (Admin, Mid-Level Manager)

**Request Body:**
```json
{
  "approvalStatus": "Approved", // or "Rejected"
  "rejectionReason": "Reason for rejection", // Required if status is "Rejected"
  "notes": "Additional notes" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Shop Name",
    "ownerName": "Owner Name",
    "address": "Shop Address",
    "type": "Retailer",
    "distributorId": "60d21b1c67d0d8992e610c83",
    "createdBy": "60d21b1c67d0d8992e610c83",
    "approvalStatus": "Approved", // or "Rejected"
    "approvedBy": "60d21b1c67d0d8992e610c83",
    "approvalDate": "2023-06-19T10:30:00.000Z",
    "rejectionReason": "Reason for rejection", // Only present if rejected
    "notes": "Additional notes",
    "isActive": true,
    "createdAt": "2023-06-18T12:00:00.000Z",
    "updatedAt": "2023-06-19T10:30:00.000Z"
  },
  "message": "Shop approved successfully" // or "Shop rejected successfully"
}
```

### Get Shop Approval Status

**Endpoint:** `GET /api/shops/:id/approval-status`

**Description:** Get the approval status of a shop.

**Authentication Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "approvalStatus": "Pending", // or "Approved" or "Rejected"
    "approvedBy": {
      "_id": "60d21b1c67d0d8992e610c83",
      "name": "Manager Name",
      "email": "manager@example.com",
      "role": "Mid-Level Manager"
    },
    "approvalDate": "2023-06-19T10:30:00.000Z",
    "rejectionReason": "Duplicate shop entry", // Only present if rejected
    "notes": "Additional notes about the decision" // Optional
  }
}
```

## Mobile App Shop Management

### Add a New Shop (Mobile)

**Endpoint:** `POST /api/mobile/shops`

**Description:** Allows marketing staff to add a new shop (retailer or wholesaler) to the system. The shop will be pending approval from a manager.

**Authentication Required:** Yes (Marketing Staff)

**Request Body:**
```json
{
  "name": "Shop Name",
  "ownerName": "Owner Name",
  "address": "Shop Address",
  "type": "Retailer", // or "Whole Seller"
  "distributorId": "60d21b1c67d0d8992e610c83"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Shop Name",
    "ownerName": "Owner Name",
    "address": "Shop Address",
    "type": "Retailer",
    "distributorId": "60d21b1c67d0d8992e610c83",
    "createdBy": "60d21b1c67d0d8992e610c83",
    "approvalStatus": "Pending",
    "isActive": true,
    "createdAt": "2023-06-18T12:00:00.000Z",
    "updatedAt": "2023-06-18T12:00:00.000Z"
  },
  "message": "Shop added successfully and is pending approval from a manager"
}
```

**Notes:**
- When a marketing staff adds a shop, it will be in a "Pending" approval status.
- The shop will only be visible to the marketing staff who created it until it's approved.
- Once approved by a manager, the shop will be available to all staff assigned to that distributor.

### Get Shop Approval Status (Mobile)

**Endpoint:** `GET /api/mobile/shops/:id/approval-status`

**Description:** Get the approval status of a shop.

**Authentication Required:** Yes (Marketing Staff)

**Response:**
```json
{
  "success": true,
  "data": {
    "approvalStatus": "Pending", // or "Approved" or "Rejected"
    "approvedBy": {
      "_id": "60d21b1c67d0d8992e610c83",
      "name": "Manager Name",
      "email": "manager@example.com",
      "role": "Mid-Level Manager"
    },
    "approvalDate": "2023-06-19T10:30:00.000Z",
    "rejectionReason": "Duplicate shop entry", // Only present if rejected
    "notes": "Additional notes about the decision" // Optional
  }
}
```

**Notes:**
- Marketing staff should check the approval status before attempting to use a shop in activities.
- If a shop is rejected, the marketing staff can create a new shop with corrected information. 