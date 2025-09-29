# Staff-Distributor Assignment System

## Overview

This system replaces the previous task-based workflow with a direct assignment system where marketing staff are assigned to specific distributors by administrators. Once assigned, staff can perform activities with these distributors without requiring task creation.

## Key Features

1. **Direct Distributor Assignment**: Admins can directly assign distributors to marketing staff
2. **Simplified Activity Flow**: Marketing staff can punch in/out with their assigned distributors
3. **48-Hour Activity Visibility**: Staff can only view their activities from the past 48 hours
4. **Activity Tracking**: All activities are tracked and visible in the staff activity section

## API Endpoints

### Admin Panel Endpoints

#### Staff Distributor Assignments

- `GET /api/staff-assignments` - Get all staff-distributor assignments
- `GET /api/staff-assignments/:staffId` - Get assignments for a specific staff member
- `POST /api/staff-assignments` - Create or update staff-distributor assignments
- `PATCH /api/staff-assignments/:staffId/remove-distributors` - Remove distributors from a staff member
- `DELETE /api/staff-assignments/:id` - Delete an assignment

### Mobile App Endpoints

#### Marketing Staff Activity

- `GET /api/mobile/marketing-activity/assigned-distributors` - Get distributors assigned to the logged-in staff
- `GET /api/mobile/marketing-activity/my-activities` - Get activities for the logged-in staff (limited to 48 hours)
- `POST /api/mobile/marketing-activity/punch-in` - Punch in for a distributor visit
- `PATCH /api/mobile/marketing-activity/punch-out` - Punch out from a distributor visit

## Data Models

### StaffDistributorAssignment

```javascript
{
  staffId: ObjectId,          // Reference to User model
  distributorIds: [ObjectId], // Array of references to Distributor model
  assignedBy: ObjectId,       // Reference to User model (admin who made the assignment)
  assignedAt: Date,           // When the assignment was created
  lastUpdatedAt: Date,        // When the assignment was last updated
  lastUpdatedBy: ObjectId,    // Reference to User model (who last updated)
  isActive: Boolean           // Whether the assignment is active
}
```

### MarketingStaffActivity

```javascript
{
  distributorId: ObjectId,    // Reference to Distributor model
  marketingStaffId: ObjectId, // Reference to User model
  retailShop: String,         // Name of the retail shop
  distributor: String,        // Name of the distributor
  areaName: String,           // Area name
  tripCompanion: {            // Trip companion details
    category: String,         // 'Distributor Staff', 'Marketing Staff', or 'Other'
    name: String              // Name of the companion
  },
  modeOfTransport: String,    // Mode of transport
  meetingStartTime: Date,     // When the meeting started (punch-in time)
  meetingEndTime: Date,       // When the meeting ended (punch-out time)
  selfieImage: String,        // Path to selfie image
  shopTypes: [String],        // Types of shops visited
  shops: [{                   // Details of shops visited
    name: String,             // Shop name
    ownerName: String,        // Owner name
    address: String,          // Shop address
    type: String,             // Shop type
    distributorId: ObjectId   // Reference to Distributor model
  }],
  status: String,             // 'Punched In' or 'Punched Out'
  durationMinutes: Number,    // Duration of the activity in minutes
  brandSupplyEstimates: [...], // Brand supply estimates
  salesOrders: [...]          // Sales orders
}
```

## Usage Flow

1. **Admin assigns distributors to staff**:
   - Admin navigates to Staff Assignments page
   - Selects a marketing staff member
   - Assigns one or more distributors to the staff
   - Saves the assignment

2. **Marketing staff performs activities**:
   - Staff logs into the mobile app
   - Views their assigned distributors
   - Selects a distributor to visit
   - Punches in when starting the visit
   - Records activities during the visit
   - Punches out when the visit is complete

3. **Admin monitors activities**:
   - Admin can view all staff activities in the admin panel
   - Activities are organized by staff member and distributor
   - Admin can filter and search activities as needed

## Testing

Two test scripts are provided to verify functionality:

1. `test-staff-distributor-assignment.js` - Tests the assignment functionality
2. `test-marketing-staff-activity.js` - Tests the activity tracking functionality

Run these scripts with:

```bash
node src/scripts/test-staff-distributor-assignment.js
node src/scripts/test-marketing-staff-activity.js
``` 