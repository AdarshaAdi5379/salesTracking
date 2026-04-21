-- Migration Scripts for Existing Databases
-- Run this file only if you have an existing database
-- For new installations, use schema.sql which includes all columns

USE sales_tracking;

-- Add additional_fields to schools table (safe to run multiple times)
-- This will fail if column exists - that's expected and safe to ignore
SET @dbname = DATABASE();
SET @tablename = "schools";
SET @columnname = "additional_fields";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column additional_fields already exists in schools table.';",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " JSON NULL AFTER google_place_id;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add using_competitor to visits table
SET @columnname = "using_competitor";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = "visits")
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column using_competitor already exists in visits table.';",
  "ALTER TABLE visits ADD COLUMN using_competitor BOOLEAN DEFAULT FALSE AFTER notes;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add competitor_name to visits table
SET @columnname = "competitor_name";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = "visits")
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column competitor_name already exists in visits table.';",
  "ALTER TABLE visits ADD COLUMN competitor_name VARCHAR(255) NULL AFTER using_competitor;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update admin password to admin123 (if needed)
-- Password hash for 'admin123'
UPDATE users 
SET password = '$2y$10$i/hk9jlW/7.mtfC/8Uhp0uSecztVgwY2ZPLtG8jhg/ON5XtTXDHhq'
WHERE email = 'admin@example.com' 
AND password != '$2y$10$i/hk9jlW/7.mtfC/8Uhp0uSecztVgwY2ZPLtG8jhg/ON5XtTXDHhq';

SELECT 'Migration completed successfully!' AS status;



