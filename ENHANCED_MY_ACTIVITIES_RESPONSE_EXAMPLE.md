# Enhanced My Activities API Response Example

## API Endpoint
`GET /mobile/marketing-activity/my-activities`

## Enhanced Response Structure

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
      "brandSupplyEstimates": [
        {
          "name": "Surya Teja",
          "variants": [
            {
              "name": "Pouch",
              "sizes": [
                {
                  "name": "1000ml",
                  "openingStock": 4,
                  "proposedMarketRate": 54
                }
              ]
            }
          ]
        }
      ],
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
            },
            {
              "brandName": "Surya Teja",
              "variant": "Bottle",
              "size": "1000 ML",
              "quantity": 20,
              "rate": 35,
              "totalValue": 700,
              "isDisplayedInCounter": false,
              "orderType": "Reorder"
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
          "totalSalesOrders": 2,
          "totalSalesValue": 2230,
          "totalAlternateProviders": 1
        },
        {
          "shopId": "682727a8b71636b4e694bdf2",
          "shopName": "MauryaGroup",
          "shopOwner": "Mr. Maurya",
          "shopAddress": "456 Second Street, Moti Nagar",
          "shopType": "Retailer",
          "shopContact": "+919876543211",
          "visitTime": "2025-08-26T11:15:00.000Z",
          "status": "Completed",
          "mobileNumber": "0987654322",
          
          "salesOrders": [
            {
              "brandName": "Surya Teja",
              "variant": "Pouch",
              "size": "1000 ML",
              "quantity": 15,
              "rate": 30,
              "totalValue": 450,
              "isDisplayedInCounter": true,
              "orderType": "Fresh Order"
            }
          ],
          
          "alternateProviders": [],
          
          "complaint": "",
          "marketInsight": "Customer is happy with current product quality",
          "voiceNote": "",
          "voiceNoteBase64": "",
          
          "totalSalesOrders": 1,
          "totalSalesValue": 450,
          "totalAlternateProviders": 0
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
            "variant": "Bottle",
            "size": "1000 ML",
            "totalQuantity": 20,
            "totalValue": 700
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
    },
    {
      "_id": "68ad8e54daf020ba188a5b5f",
      "marketingStaffId": {
        "_id": "68a824fb509d7ba8e656887d",
        "name": "Anamika",
        "email": "ak@gmail.com"
      },
      "distributorId": {
        "_id": "68271f50e82cd9672f9a328f",
        "name": "NAMAN JHA",
        "shopName": "JHAGROUPAND",
        "contact": "9898767654",
        "address": "Moti nagar, Delhi"
      },
      "meetingStartTime": "2025-08-26T10:37:08.866Z",
      "meetingEndTime": "2025-08-26T10:47:09.844Z",
      "status": "Punched Out",
      "durationMinutes": 10,
      "selfieImage": "/uploads/selfies/placeholder.jpg",
      "tripCompanion": {
        "category": "Marketing Staff",
        "name": "ANnand"
      },
      "modeOfTransport": "Car",
      "areaName": "Moti nagar, Delhi",
      "brandSupplyEstimates": [
        {
          "name": "Surya Teja",
          "variants": [
            {
              "name": "Pouch",
              "sizes": [
                {
                  "name": "1000ml",
                  "openingStock": 76,
                  "proposedMarketRate": 87
                }
              ]
            }
          ]
        }
      ],
      "createdAt": "2025-08-26T10:37:08.875Z",
      "updatedAt": "2025-08-26T10:47:09.848Z",
      "isVisibleToStaff": true,
      "shopsVisitedCount": 13,
      
      "detailedShopVisits": [
        {
          "shopId": "682727a8b71636b4e694bdf3",
          "shopName": "vfdfv",
          "shopOwner": "Owner Name",
          "shopAddress": "Shop Address",
          "shopType": "Retailer",
          "shopContact": "+919876543212",
          "visitTime": "2025-08-26T10:40:00.000Z",
          "status": "Completed",
          "mobileNumber": "0987654323",
          
          "salesOrders": [
            {
              "brandName": "Surya Teja",
              "variant": "Pouch",
              "size": "1000 ML",
              "quantity": 25,
              "rate": 40,
              "totalValue": 1000,
              "isDisplayedInCounter": true,
              "orderType": "Fresh Order"
            }
          ],
          
          "alternateProviders": [],
          
          "complaint": "",
          "marketInsight": "",
          "voiceNote": "",
          "voiceNoteBase64": "",
          
          "totalSalesOrders": 1,
          "totalSalesValue": 1000,
          "totalAlternateProviders": 0
        }
        // ... more shop visits
      ],
      
      "summary": {
        "totalShopsVisited": 13,
        "totalSalesOrders": 5,
        "totalSalesValue": 3500,
        "totalAlternateProviders": 2,
        "productSummary": [
          {
            "brandName": "Surya Teja",
            "variant": "Pouch",
            "size": "1000 ML",
            "totalQuantity": 85,
            "totalValue": 3400
          },
          {
            "brandName": "Surya Chandra",
            "variant": "Bottle",
            "size": "500 ML",
            "totalQuantity": 10,
            "totalValue": 100
          }
        ],
        "hasComplaints": false,
        "hasMarketInsights": true,
        "hasVoiceNotes": false
      }
    }
  ]
}
```

## Key Features of Enhanced Response:

### 1. **Detailed Shop Visits** (`detailedShopVisits`)
- Complete shop information (name, owner, address, contact)
- All sales orders with product details
- Alternate providers information
- Complaints and market insights
- Voice notes (if any)
- Shop-level totals

### 2. **Summary** (`summary`)
- Total shops visited
- Total sales orders across all shops
- Total sales value
- Total alternate providers
- Product summary (aggregated by brand-variant-size)
- Flags for complaints, market insights, and voice notes

### 3. **Product Summary**
- Aggregated product data across all shops
- Total quantities and values for each product
- Organized by brand, variant, and size

### 4. **48-Hour Filter**
- Only shows activities from the last 48 hours for staff
- Admins can see all activities regardless of age

## Benefits:

1. **Complete Visibility**: Staff can see all their shop visit details
2. **Product Tracking**: Detailed product information for each visit
3. **Organized Data**: Well-structured response for easy app integration
4. **Summary Information**: Quick overview of each distributor visit
5. **Consistent with Admin**: Same detailed data available to admins

## Mobile App Integration:

The mobile app can now display:
- List of distributor visits
- For each visit: shop details, products taken, sales orders
- Summary statistics for each visit
- Product-wise aggregation across all shops
- Complaints and market insights 