-- Idempotent fixes for production schema drift (MySQL)

-- Ensure IssueConfig table exists
CREATE TABLE IF NOT EXISTS `IssueConfig` (
  `id` VARCHAR(191) NOT NULL,
  `issueReasons` JSON NOT NULL,
  `deferredReasons` JSON NOT NULL,
  `issueFlags` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add Address.composting if missing
SET @db := DATABASE();
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'Address'
    AND COLUMN_NAME = 'composting'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `Address` ADD COLUMN `composting` VARCHAR(191) NULL;',
  'SELECT "Address.composting exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add RouteAddress.issueReportedAt if missing
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'RouteAddress'
    AND COLUMN_NAME = 'issueReportedAt'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `RouteAddress` ADD COLUMN `issueReportedAt` DATETIME(3) NULL;',
  'SELECT "RouteAddress.issueReportedAt exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add RouteAddress.issueReportedById if missing
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'RouteAddress'
    AND COLUMN_NAME = 'issueReportedById'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `RouteAddress` ADD COLUMN `issueReportedById` VARCHAR(191) NULL;',
  'SELECT "RouteAddress.issueReportedById exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add RouteAddress.issueArchivedAt if missing
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'RouteAddress'
    AND COLUMN_NAME = 'issueArchivedAt'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `RouteAddress` ADD COLUMN `issueArchivedAt` DATETIME(3) NULL;',
  'SELECT "RouteAddress.issueArchivedAt exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure RouteAddress.issuePhoto uses LONGTEXT (supports bigger payloads)
SET @current_type := (
  SELECT DATA_TYPE
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'RouteAddress'
    AND COLUMN_NAME = 'issuePhoto'
  LIMIT 1
);
SET @sql := IF(@current_type IS NOT NULL AND @current_type <> 'longtext',
  'ALTER TABLE `RouteAddress` MODIFY `issuePhoto` LONGTEXT NULL;',
  'SELECT "RouteAddress.issuePhoto already LONGTEXT or missing";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
