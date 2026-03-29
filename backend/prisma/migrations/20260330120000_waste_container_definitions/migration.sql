-- CreateTable
CREATE TABLE `WasteContainerDefinition` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '🗑️',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `WasteContainerDefinition_active_idx` ON `WasteContainerDefinition`(`active`);

-- CreateIndex
CREATE INDEX `WasteContainerDefinition_sortOrder_idx` ON `WasteContainerDefinition`(`sortOrder`);
