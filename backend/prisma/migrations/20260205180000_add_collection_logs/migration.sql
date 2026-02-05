CREATE TABLE `CollectionLog` (
  `id` VARCHAR(191) NOT NULL,
  `addressId` VARCHAR(191) NOT NULL,
  `routeId` VARCHAR(191) NOT NULL,
  `collectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `routeDate` DATETIME(3) NULL,
  `waste` JSON NOT NULL,
  `collectedById` VARCHAR(191) NULL,

  INDEX `CollectionLog_addressId_idx`(`addressId`),
  INDEX `CollectionLog_routeId_idx`(`routeId`),
  INDEX `CollectionLog_collectedAt_idx`(`collectedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `CollectionLog_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CollectionLog_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `Route`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CollectionLog_collectedById_fkey` FOREIGN KEY (`collectedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
);
