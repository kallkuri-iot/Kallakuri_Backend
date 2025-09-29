# 🏪 **SHOP APPROVAL FLOW - COMPLETE API GUIDE**

## ✅ **SYSTEM STATUS: FULLY WORKING**

The shop approval system is **100% functional** with the following features:
- ✅ Marketing staff can create shops (Retailer/Whole Seller)
- ✅ Shops are created with "Pending" status
- ✅ Admin/Manager can approve or reject shops
- ✅ Approved shops are added to distributor's shop list
- ✅ Rejected shops include rejection reason
- ✅ All APIs are tested and working

---

## 📱 **MOBILE APP ENDPOINTS (For Marketing Staff)**

### 1. **Add New Shop**
**Endpoint:** `POST /api/mobile/shops`
**Authentication:** Required (Marketing Staff)
**Description:** Create a new shop that will be pending approval

**Request Body:**
```json
{
  "name": "Shop Name",
  "ownerName": "Owner Name", 
  "address": "Shop Address",
  "type": "Retailer", // or "Whole Seller"
  "distributorId": "68beaae48c7436c02ba48f10"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68becc0ef635497bdc29c6d3",
    "name": "Shop Name",
    "ownerName": "Owner Name",
    "address": "Shop Address", 
    "type": "Retailer",
    "distributorId": "68beaae48c7436c02ba48f10",
    "createdBy": "68bae306dc970ba7636b23ce",
    "isActive": true,
    "approvalStatus": "Pending",
    "createdAt": "2025-09-08T12:29:02.773Z",
    "updatedAt": "2025-09-08T12:29:02.773Z"
  },
  "message": "Shop added successfully and is pending approval from a manager"
}
```

### 2. **Get Shops by Distributor**
**Endpoint:** `GET /api/mobile/shops/distributor/{distributorId}`
**Authentication:** Required (Marketing Staff)
**Description:** Get all shops for a specific distributor

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "68becc0ef635497bdc29c6d3",
      "name": "Test Retail Shop by Staff",
      "ownerName": "Test Owner",
      "address": "Test Address, Delhi",
      "type": "Retailer",
      "distributorId": "68beaae48c7436c02ba48f10",
      "approvalStatus": "Approved", // or "Pending" or "Rejected"
      "createdAt": "2025-09-08T12:29:02.773Z",
      "updatedAt": "2025-09-08T13:10:05.431Z",
      "approvedBy": "68bae278d77af10e427303d6",
      "approvalDate": "2025-09-08T13:10:05.429Z",
      "notes": "Shop looks good, approved for retail operations"
    }
  ]
}
```

---

## 🖥️ **ADMIN PANEL ENDPOINTS (For Admin/Manager)**

### 1. **Get Pending Shops**
**Endpoint:** `GET /api/shops/pending`
**Authentication:** Required (Admin, Mid-Level Manager)
**Description:** Get all shops pending approval

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `distributorId` (optional): Filter by distributor

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "68bed5d796251b2ac95b327b",
      "name": "Final Test Shop",
      "ownerName": "Final Owner",
      "address": "Final Address, Chennai",
      "type": "Retailer",
      "distributorId": {
        "_id": "68beaae48c7436c02ba48f10",
        "name": "Jay ganesh ji",
        "shopName": "Jay ganesh",
        "address": "Delhi, Moti nagar"
      },
      "createdBy": {
        "_id": "68bae306dc970ba7636b23ce",
        "name": "Anand",
        "email": "anand@test.com",
        "role": "Marketing Staff"
      },
      "approvalStatus": "Pending",
      "isActive": true,
      "createdAt": "2025-09-08T13:10:47.531Z",
      "updatedAt": "2025-09-08T13:10:47.531Z"
    }
  ],
  "pagination": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "itemsPerPage": 10
  }
}
```

### 2. **Approve Shop**
**Endpoint:** `PATCH /api/shops/{shopId}/approval`
**Authentication:** Required (Admin, Mid-Level Manager)
**Description:** Approve a pending shop

**Request Body:**
```json
{
  "approvalStatus": "Approved",
  "notes": "Shop looks good, approved for retail operations"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68becc0ef635497bdc29c6d3",
    "name": "Test Retail Shop by Staff",
    "ownerName": "Test Owner",
    "address": "Test Address, Delhi",
    "type": "Retailer",
    "distributorId": "68beaae48c7436c02ba48f10",
    "createdBy": "68bae306dc970ba7636b23ce",
    "isActive": true,
    "approvalStatus": "Approved",
    "approvedBy": "68bae278d77af10e427303d6",
    "approvalDate": "2025-09-08T13:10:05.429Z",
    "notes": "Shop looks good, approved for retail operations",
    "createdAt": "2025-09-08T12:29:02.773Z",
    "updatedAt": "2025-09-08T13:10:05.431Z"
  },
  "message": "Shop approved successfully"
}
```

### 3. **Reject Shop**
**Endpoint:** `PATCH /api/shops/{shopId}/approval`
**Authentication:** Required (Admin, Mid-Level Manager)
**Description:** Reject a pending shop

**Request Body:**
```json
{
  "approvalStatus": "Rejected",
  "rejectionReason": "Duplicate shop entry - similar shop already exists in this area",
  "notes": "Please verify the shop details and resubmit if needed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68becec1f635497bdc29c82d",
    "name": "Test Wholesale Shop by Staff",
    "ownerName": "Wholesale Owner",
    "address": "Wholesale Address, Mumbai",
    "type": "Whole Seller",
    "distributorId": "68beaae48c7436c02ba48f10",
    "createdBy": "68bae306dc970ba7636b23ce",
    "isActive": true,
    "approvalStatus": "Rejected",
    "approvedBy": "68bae278d77af10e427303d6",
    "approvalDate": "2025-09-08T13:10:15.410Z",
    "rejectionReason": "Duplicate shop entry - similar shop already exists in this area",
    "notes": "Please verify the shop details and resubmit if needed",
    "createdAt": "2025-09-08T12:40:33.258Z",
    "updatedAt": "2025-09-08T13:10:15.411Z"
  },
  "message": "Shop rejected successfully"
}
```

### 4. **Get Shop Approval Status**
**Endpoint:** `GET /api/shops/{shopId}/approval-status`
**Authentication:** Required (Admin, Mid-Level Manager, Marketing Staff)
**Description:** Get the approval status of a specific shop

**Response:**
```json
{
  "success": true,
  "data": {
    "approvalStatus": "Approved", // or "Pending" or "Rejected"
    "approvedBy": {
      "_id": "68bae278d77af10e427303d6",
      "name": "Super Admin",
      "email": "admin@kallakuri.com",
      "role": "Admin"
    },
    "approvalDate": "2025-09-08T13:10:05.429Z",
    "notes": "Shop looks good, approved for retail operations"
  }
}
```

---

## 🔄 **COMPLETE WORKFLOW**

### **Step 1: Marketing Staff Creates Shop**
```bash
POST /api/mobile/shops
Authorization: Bearer {marketing_staff_token}
Content-Type: application/json

{
  "name": "New Shop",
  "ownerName": "Shop Owner",
  "address": "Shop Address",
  "type": "Retailer",
  "distributorId": "distributor_id"
}
```

### **Step 2: Admin Reviews Pending Shops**
```bash
GET /api/shops/pending
Authorization: Bearer {admin_token}
```

### **Step 3: Admin Approves/Rejects Shop**
```bash
# Approve
PATCH /api/shops/{shop_id}/approval
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "approvalStatus": "Approved",
  "notes": "Approval notes"
}

# Reject
PATCH /api/shops/{shop_id}/approval
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "approvalStatus": "Rejected",
  "rejectionReason": "Reason for rejection",
  "notes": "Additional notes"
}
```

### **Step 4: Marketing Staff Checks Shop Status**
```bash
GET /api/mobile/shops/distributor/{distributor_id}
Authorization: Bearer {marketing_staff_token}
```

---

## 🎯 **KEY FEATURES**

### **Shop Types**
- ✅ **Retailer**: Regular retail shops
- ✅ **Whole Seller**: Wholesale shops

### **Approval Status**
- ✅ **Pending**: Awaiting admin approval
- ✅ **Approved**: Approved and added to distributor
- ✅ **Rejected**: Rejected with reason

### **Admin Panel Integration**
- ✅ **PendingShops.js**: Complete UI for shop approval
- ✅ **Filter by distributor**: Filter pending shops
- ✅ **Approve/Reject actions**: One-click approval/rejection
- ✅ **Notes and reasons**: Add approval notes and rejection reasons

### **Mobile App Integration**
- ✅ **Shop creation**: Marketing staff can create shops
- ✅ **Status tracking**: Check approval status
- ✅ **Shop listing**: View all shops for distributor

---

## 🚀 **READY FOR PRODUCTION**

The shop approval system is **100% ready** for production use:

1. **Backend APIs**: All endpoints tested and working
2. **Admin Panel**: Complete UI for shop management
3. **Mobile Integration**: Ready for app integration
4. **Data Flow**: Complete workflow from creation to approval
5. **Error Handling**: Proper validation and error responses

**Your app developer can now integrate this complete shop approval flow!** 🎉
