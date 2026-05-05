-- Sales Tracking System Database Schema

CREATE DATABASE IF NOT EXISTS sales_tracking;
USE sales_tracking;

-- Users Table (Admin and Salesperson)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'salesperson') NOT NULL DEFAULT 'salesperson',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Areas Table
CREATE TABLE IF NOT EXISTS areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    state VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Schools/Colleges Table
CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('school', 'college') NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    google_place_id VARCHAR(255),
    additional_fields JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    INDEX idx_area (area_id),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sales Routes Table
CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salesperson_id INT NOT NULL,
    area_id INT NOT NULL,
    date DATE NOT NULL,
    name VARCHAR(255),
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    total_distance DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salesperson_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    INDEX idx_salesperson (salesperson_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Route Items (Schools in a route with order)
CREATE TABLE IF NOT EXISTS route_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    school_id INT NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY unique_route_school (route_id, school_id),
    INDEX idx_route_order (route_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Visits Table
CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_item_id INT NOT NULL,
    status ENUM('visited', 'not_visited', 'follow_up', 'meeting_scheduled', 'invalid_location') DEFAULT 'not_visited',
    notes TEXT,
    using_competitor BOOLEAN DEFAULT FALSE,
    competitor_name VARCHAR(255) NULL,
    deal_closed BOOLEAN DEFAULT FALSE,
    deal_value DECIMAL(12, 2) NULL,
    deal_issues TEXT NULL,
    photo_url VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    visited_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_item_id) REFERENCES route_items(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_visited_at (visited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- GPS Tracking Logs
CREATE TABLE IF NOT EXISTS gps_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    INDEX idx_route_timestamp (route_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@example.com', '$2y$10$i/hk9jlW/7.mtfC/8Uhp0uSecztVgwY2ZPLtG8jhg/ON5XtTXDHhq', 'admin');

-- Insert sample areas
INSERT INTO areas (name, city, state) VALUES 
('Chandra Layout', 'Bangalore', 'Karnataka'),
('Rajajinagar', 'Bangalore', 'Karnataka'),
('Malleshwaram', 'Bangalore', 'Karnataka');

-- ============================================
-- MIGRATION SCRIPTS FOR EXISTING DATABASES
-- ============================================
-- Run these only if you have an existing database
-- For new installations, the columns are already included above
-- Note: These will fail if columns already exist - that's expected and safe to ignore

-- Add additional_fields to schools table (if not exists)
-- Run: ALTER TABLE schools ADD COLUMN additional_fields JSON NULL AFTER google_place_id;

-- Add competitor fields to visits table (if not exists)
-- Run: ALTER TABLE visits ADD COLUMN using_competitor BOOLEAN DEFAULT FALSE AFTER notes;
-- Run: ALTER TABLE visits ADD COLUMN competitor_name VARCHAR(255) NULL AFTER using_competitor;
-- Add deal closed fields to visits table (if not exists)
-- Run: ALTER TABLE visits ADD COLUMN deal_closed BOOLEAN DEFAULT FALSE AFTER competitor_name;
-- Run: ALTER TABLE visits ADD COLUMN deal_value DECIMAL(12, 2) NULL AFTER deal_closed;
-- Run: ALTER TABLE visits ADD COLUMN deal_issues TEXT NULL AFTER deal_value;

-- Update admin password to admin123 (if needed)
-- Password hash for 'admin123'
-- Run: UPDATE users SET password = '$2y$10$i/hk9jlW/7.mtfC/8Uhp0uSecztVgwY2ZPLtG8jhg/ON5XtTXDHhq' WHERE email = 'admin@example.com';
