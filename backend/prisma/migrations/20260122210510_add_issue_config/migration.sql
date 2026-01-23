-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `wasteTypes` JSON NOT NULL,
    `declaredContainers` JSON NULL,
    `composting` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Address_city_idx`(`city`),
    INDEX `Address_street_idx`(`street`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Route` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `totalAddresses` INTEGER NOT NULL DEFAULT 0,
    `collectedAddresses` INTEGER NOT NULL DEFAULT 0,
    `publicationStatus` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `assignedDriverId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RouteAddress` (
    `id` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,
    `addressId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `waste` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `isCollected` BOOLEAN NOT NULL DEFAULT false,
    `issueReason` VARCHAR(191) NULL,
    `issueFlags` JSON NULL,
    `issueNote` VARCHAR(191) NULL,
    `issuePhoto` VARCHAR(191) NULL,
    `reportToAdmin` BOOLEAN NOT NULL DEFAULT false,

    INDEX `RouteAddress_routeId_idx`(`routeId`),
    INDEX `RouteAddress_addressId_idx`(`addressId`),
    UNIQUE INDEX `RouteAddress_routeId_addressId_key`(`routeId`, `addressId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `permissions` JSON NOT NULL,
    `pinHash` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLogin` DATETIME(3) NULL,

    UNIQUE INDEX `User_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IssueConfig` (
    `id` VARCHAR(191) NOT NULL,
    `issueReasons` JSON NOT NULL,
    `deferredReasons` JSON NOT NULL,
    `issueFlags` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RouteAddress` ADD CONSTRAINT `RouteAddress_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `Route`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RouteAddress` ADD CONSTRAINT `RouteAddress_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
