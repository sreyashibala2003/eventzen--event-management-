-- EventZen Auth Service Database Setup
-- Run this script to create the required database
-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS eventzen_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Switch to the database
USE eventzen_auth;
-- Show tables (should be empty initially, tables will be created by Hibernate)
SHOW TABLES;
-- Grant privileges (optional, adjust as needed)
-- GRANT ALL PRIVILEGES ON eventzen_auth.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;
SELECT 'Database setup complete!' as result;