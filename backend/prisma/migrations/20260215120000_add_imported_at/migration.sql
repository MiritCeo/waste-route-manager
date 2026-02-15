-- Add importedAt for tracking last import timestamp
ALTER TABLE Address ADD COLUMN importedAt DATETIME NULL;
