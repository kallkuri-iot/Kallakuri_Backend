    // Process and validate shops
    let processedShops = [];
    if (shops && Array.isArray(shops)) {
      for (const shopData of shops) {
        try {
          // First check if shop already exists by name and distributor
          let existingShop = await Shop.findOne({
            name: shopData.name,
            distributorId: distributorId,
            isActive: true
          });

          if (!existingShop) {
            // Also check legacy shops in distributor to avoid duplicates
            const legacyShop = [...distributor.retailShops, ...distributor.wholesaleShops]
              .find(s => s.shopName === shopData.name);
            
            if (legacyShop) {
              // Use the legacy shop instead of creating a new one
              existingShop = await Shop.findOne({
                _id: legacyShop._id,
                distributorId: distributorId,
                isActive: true
              });
              
              if (!existingShop) {
                // Create shop document from legacy data
                existingShop = await Shop.create({
                  name: legacyShop.shopName,
                  ownerName: legacyShop.ownerName || 'Unknown Owner',
                  address: legacyShop.address || 'Unknown Address',
                  type: legacyShop.type || 'Retailer',
                  distributorId: distributorId,
                  createdBy: req.user.id,
                  approvalStatus: 'Approved',
                  approvedBy: req.user.id,
                  approvalDate: new Date(),
                  isActive: true
                });
                logger.info(`Created shop from legacy data: ${existingShop.name} with ID: ${existingShop._id}`);
              } else {
                logger.info(`Using existing shop from legacy: ${existingShop.name} with ID: ${existingShop._id}`);
              }
            } else {
              // Create new shop document only if no legacy shop exists
              existingShop = await Shop.create({
                name: shopData.name,
                ownerName: shopData.ownerName || 'Unknown Owner',
                address: shopData.address || 'Unknown Address',
                type: shopData.type || 'Retailer',
                distributorId: distributorId,
                createdBy: req.user.id,
                approvalStatus: 'Approved',
                approvedBy: req.user.id,
                approvalDate: new Date(),
                isActive: true
              });
              logger.info(`Created new shop: ${existingShop.name} with ID: ${existingShop._id}`);
            }
          } else {
            logger.info(`Using existing shop: ${existingShop.name} with ID: ${existingShop._id}`);
          }
