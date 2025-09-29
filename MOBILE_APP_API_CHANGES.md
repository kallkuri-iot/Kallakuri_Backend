# Mobile App API Changes - Task-Based Activity Tracking

## 🚨 CRITICAL CHANGES REQUIRED

All mobile app endpoints now require **Task ID** for proper activity tracking. This ensures that all activities (distributor visits and shop activities) are properly grouped and tracked by task.

---

## 📋 Required Changes Summary

### 1. **Marketing Staff Activity - Punch In** ✅ UPDATED
### 2. **Marketing Staff Activity - Punch Out** ✅ UPDATED  
### 3. **Retailer Shop Activity - Create/Update** ✅ UPDATED
### 4. **Marketing Staff Activity - Get My Activities** ✅ UPDATED

---

## 🔄 API Endpoint Changes

### 1. **Punch In API** (CRITICAL UPDATE REQUIRED)

**Endpoint:** `POST /api/mobile/marketing-activity/punch-in`

**❌ OLD REQUEST:**
```json
{
  "retailShop": "JHAGROUPAND",
  "distributor": "NAMAN JHA", 
  "areaName": "Moti nagar, Delhi",
  "tripCompanion": {
    "category": "Distributor Staff",
    "name": "Anand"
  },
  "modeOfTransport": "car",
  "selfieImage": "base64_string_here",
  "shopTypes": ["Retailer"],
  "shops": [...],
  "brandSupplyEstimates": [...]
}
```

**✅ NEW REQUEST (REQUIRED):**
```json
{
  "taskId": "60d21b4667d0d8992e610c90",  // ⚠️ REQUIRED - Add this field
  "retailShop": "JHAGROUPAND",
  "distributor": "NAMAN JHA", 
  "areaName": "Moti nagar, Delhi",
  "tripCompanion": {
    "category": "Distributor Staff",
    "name": "Anand"
  },
  "modeOfTransport": "car",
  "selfieImage": "base64_string_here",
  "shopTypes": ["Retailer"],
  "shops": [...],
  "brandSupplyEstimates": [...]
}
```

### 2. **Punch Out API** (CRITICAL UPDATE REQUIRED)

**Endpoint:** `PATCH /api/mobile/marketing-activity/punch-out` ⚠️ **URL CHANGED**

**❌ OLD REQUEST:**
```
URL: PATCH /api/mobile/marketing-activity/{activityId}/punch-out
Body: {
  "distributorId": "distributor_id_here"
}
```

**✅ NEW REQUEST (REQUIRED):**
```
URL: PATCH /api/mobile/marketing-activity/punch-out  // ⚠️ URL CHANGED - No activity ID in URL
Body: {
  "taskId": "60d21b4667d0d8992e610c90",     // ⚠️ REQUIRED - Add this field
  "distributorId": "distributor_id_here"      // ⚠️ STILL REQUIRED
}
```

### 3. **Shop Activity API** (CRITICAL UPDATE REQUIRED)

**Endpoint:** `POST /api/mobile/retailer-shop-activity`

**❌ OLD REQUEST:**
```json
{
  "shopId": "shop_id_here",
  "distributorId": "distributor_id_here",
  "salesOrders": [...],
  "marketInquiries": [...],
  "alternateProviders": [...],
  "complaint": "complaint_text",
  "marketInsight": "insights_text",
  // ... other fields
}
```

**✅ NEW REQUEST (REQUIRED):**
```json
{
  "taskId": "60d21b4667d0d8992e610c90",    // ⚠️ REQUIRED - Add this field
  "shopId": "shop_id_here",
  "distributorId": "distributor_id_here",
  "salesOrders": [...],
  "marketInquiries": [...],
  "alternateProviders": [...],
  "complaint": "complaint_text",
  "marketInsight": "insights_text",
  // ... other fields
}
```

### 4. **Get My Activities API** (Optional Enhancement)

**Endpoint:** `GET /api/mobile/marketing-activity/my-activities`

**New Query Parameter Available:**
```
GET /api/mobile/marketing-activity/my-activities?taskId=60d21b4667d0d8992e610c90
```

This allows filtering activities by specific task ID.

---

## 🎯 Implementation Guidelines

### **Task ID Source**
- Task ID should come from the **Task Management system** 
- Each task assigned to a marketing staff member has a unique `_id`
- Use this `_id` as the `taskId` in all activity APIs

### **Mobile App Flow**
1. **Staff receives task** → Get `taskId` from task assignment
2. **Staff punches in** → Send `taskId` with punch-in request
3. **Staff visits shops** → Send same `taskId` with all shop activity requests
4. **Staff punches out** → Send same `taskId` with punch-out request

### **Data Consistency**
- ✅ All activities under same task will be properly grouped
- ✅ Admin panel will show comprehensive task-based activity view
- ✅ No more data mixing between different task instances

---

## 🚨 Error Handling

### **Missing Task ID Errors**
```json
{
  "success": false,
  "error": "Task ID is required for punch-in"
}
```

```json
{
  "success": false,
  "error": "Task ID is required for shop activity tracking"
}
```

### **Already Punched In Error**
```json
{
  "success": false,
  "error": "You are already punched in for this task. Please punch out first."
}
```

### **Task Not Found Error**
```json
{
  "success": false,
  "error": "No active punch-in found for this task"
}
```

---

## 🧪 Testing Scenarios

### **Test Case 1: Complete Task Flow**
1. Create a task for marketing staff
2. Staff punches in with `taskId`
3. Staff visits multiple shops with same `taskId`
4. Staff punches out with same `taskId`
5. Verify admin panel shows all activities grouped under the task

### **Test Case 2: Multiple Tasks**
1. Staff has Task A and Task B
2. Staff punches in for Task A
3. Staff tries to punch in for Task B → Should get error
4. Staff must punch out from Task A first
5. Then can punch in for Task B

### **Test Case 3: Validation**
1. Try punch-in without `taskId` → Should get validation error
2. Try shop activity without `taskId` → Should get validation error
3. Try punch-out without `taskId` → Should get validation error

---

## 📊 Enhanced Data Structures

### **Market Inquiries** (Enhanced)
```json
{
  "brandName": "KGF",
  "variant": "Pouch", 
  "size": "100 ML",
  "inquiryType": "Product Availability",           // NEW
  "frequencyOfInquiry": "Weekly",                  // NEW
  "customerDemand": "High",                        // NEW
  "expectedQuantity": 50,                          // NEW
  "inquiryDetails": "Customer wants bulk order"    // NEW
}
```

### **Sales Orders** (Enhanced)
```json
{
  "brandName": "KGF",
  "variant": "Pouch",
  "size": "100 ML", 
  "quantity": 10,
  "rate": 3453,                    // NEW
  "totalValue": 34530,             // NEW
  "isDisplayedInCounter": true,
  "orderType": "Fresh Order"       // NEW
}
```

### **Alternate Providers** (Enhanced)
```json
{
  "for": "KGF",
  "brandName": "Competitor Brand",
  "variant": "Pouch",
  "size": "100 ML",
  "rate": 3400,
  "stockDate": "12/1/2023",
  "providerName": "ABC Supplier",     // NEW
  "providerContact": "9876543210",    // NEW
  "marketShare": "High",              // NEW
  "qualityRating": 4                  // NEW (1-5 scale)
}
```

---

## ✅ Deployment Checklist

- [ ] Update punch-in API to require `taskId`
- [ ] Update punch-out API URL and require `taskId`
- [ ] Update shop activity API to require `taskId`
- [ ] Test complete task flow end-to-end
- [ ] Test error scenarios
- [ ] Test with multiple concurrent tasks
- [ ] Verify admin panel shows grouped data correctly
- [ ] Update mobile app UI to handle task selection
- [ ] Update error message handling

---

## 🆘 Support & Questions

For any questions or clarifications about these changes, please contact the backend development team. All changes are **mandatory** for proper system functionality. 