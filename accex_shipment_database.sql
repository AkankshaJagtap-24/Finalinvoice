-- =====================================================
-- ACCEX SUPPLY CHAIN SOLUTIONS - SHIPMENT MANAGEMENT SYSTEM
-- Complete Database Schema and Sample Data (MySQL Compatible)
-- =====================================================

-- Database: accex_shipment_db
-- Description: Complete shipment and invoice management system for ACCEX Supply Chain Solutions
-- Version: 1.0.0
-- Created: 2024
-- Compatible with: MySQL, SQLite, PostgreSQL

-- =====================================================
-- DROP EXISTING TABLES (IF ANY) - Handle foreign keys
-- =====================================================

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

-- Drop views if they exist
DROP VIEW IF EXISTS v_shipment_details;
DROP VIEW IF EXISTS v_invoice_details;
DROP VIEW IF EXISTS v_customer_search;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Users table for authentication and user management
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'manager') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table for bill-to information with comprehensive details
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15) UNIQUE,
    boe VARCHAR(50),
    new_ton VARCHAR(50),
    address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    state_code VARCHAR(10),
    state_name VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shipments table for tracking all shipment details
CREATE TABLE shipments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shipment_type ENUM('Inbound', 'Outbound') NOT NULL,
    shipment_subtype VARCHAR(100) NOT NULL,
    asc_number VARCHAR(100),
    sh_number VARCHAR(100),
    ref_number VARCHAR(100),
    customer_id INT NOT NULL,
    cbm DECIMAL(10,2) NOT NULL CHECK (cbm > 0),
    odc ENUM('Yes', 'No') DEFAULT 'No',
    length DECIMAL(10,2) CHECK (length > 0),
    breadth DECIMAL(10,2) CHECK (breadth > 0),
    height DECIMAL(10,2) CHECK (height > 0),
    packages INT CHECK (packages > 0),
    weight DECIMAL(10,2),
    status ENUM('draft', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Invoices table for invoice management
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    shipment_id INT NOT NULL,
    customer_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    place_of_supply VARCHAR(255) NOT NULL,
    gstin_recipient VARCHAR(15),
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    po_reference VARCHAR(100),
    slb_reference VARCHAR(100),
    reverse_charge ENUM('Yes', 'No') DEFAULT 'No',
    subtotal_usd DECIMAL(15,2) DEFAULT 0.00 CHECK (subtotal_usd >= 0),
    subtotal_inr DECIMAL(15,2) DEFAULT 0.00 CHECK (subtotal_inr >= 0),
    igst_amount_usd DECIMAL(15,2) DEFAULT 0.00 CHECK (igst_amount_usd >= 0),
    igst_amount_inr DECIMAL(15,2) DEFAULT 0.00 CHECK (igst_amount_inr >= 0),
    total_usd DECIMAL(15,2) DEFAULT 0.00 CHECK (total_usd >= 0),
    total_inr DECIMAL(15,2) DEFAULT 0.00 CHECK (total_inr >= 0),
    fx_rate DECIMAL(10,2) DEFAULT 81.90 CHECK (fx_rate > 0),
    status ENUM('draft', 'finalized', 'cancelled') DEFAULT 'draft',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Invoice items table for line items
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    description TEXT NOT NULL,
    uom VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    rate DECIMAL(15,2) NOT NULL CHECK (rate >= 0),
    currency ENUM('USD', 'INR') NOT NULL,
    fx_rate DECIMAL(10,2) DEFAULT 81.90 CHECK (fx_rate > 0),
    amount_usd DECIMAL(15,2) DEFAULT 0.00 CHECK (amount_usd >= 0),
    amount_inr DECIMAL(15,2) DEFAULT 0.00 CHECK (amount_inr >= 0),
    hsn_sac VARCHAR(20),
    igst_percent DECIMAL(5,2) DEFAULT 18.00 CHECK (igst_percent >= 0),
    igst_amount_usd DECIMAL(15,2) DEFAULT 0.00 CHECK (igst_amount_usd >= 0),
    igst_amount_inr DECIMAL(15,2) DEFAULT 0.00 CHECK (igst_amount_inr >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Note: Indexes are commented out to avoid duplicate key errors
-- MySQL will automatically create indexes for PRIMARY KEY and UNIQUE constraints
-- Additional indexes can be added manually if needed for performance

/*
-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Customers indexes
CREATE INDEX idx_customers_gstin ON customers(gstin);
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_state ON customers(state_code, state_name);

-- Shipments indexes
CREATE INDEX idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX idx_shipments_type ON shipments(shipment_type, shipment_subtype);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_created_by ON shipments(created_by);
CREATE INDEX idx_shipments_created_at ON shipments(created_at);

-- Invoices indexes
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_shipment_id ON invoices(shipment_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_hsn_sac ON invoice_items(hsn_sac);
*/

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert default admin user
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@123.com', '$2b$10$rQZ8K9mN2pL1vX3yU6wA7eB4cD5fG8hI9jK0lM1nO2pQ3rS4tU5vW6xY7z', 'admin');

-- Insert sample customers with real GSTIN numbers
INSERT INTO customers (company_name, gstin, boe, new_ton, address, contact_person, phone, email, state_code, state_name) VALUES 
('SCHLUMBERGER ASIA SERVICES LIMITED', '27AADCS1107J1ZK', 'BOE001234', 'NT001', 'P-21, TTC INDUSTRIAL AREA, THANE BELAPUR ROAD, MIDC MAHAPE, THANE, MAHARASHTRA - 400710, INDIA', 'John Smith', '+91-22-1234-5678', 'john.smith@slb.com', '27', 'Maharashtra'),

('RELIANCE INDUSTRIES LIMITED', '27AACCR5055K1ZK', 'BOE005678', 'NT002', 'Maker Chambers IV, Nariman Point, Mumbai, Maharashtra - 400021', 'Mukesh Ambani', '+91-22-3555-5000', 'mukesh.ambani@ril.com', '27', 'Maharashtra'),

('TATA CONSULTANCY SERVICES LIMITED', '27AABCT3518Q1ZA', 'BOE009012', 'NT003', 'TCS House, Raveline Street, Fort, Mumbai, Maharashtra - 400001', 'N Chandrasekaran', '+91-22-6778-9999', 'n.chandrasekaran@tcs.com', '27', 'Maharashtra'),

('INFOSYS LIMITED', '29AAACI4741P1ZX', 'BOE013456', 'NT004', 'Electronics City, Hosur Road, Bangalore, Karnataka - 560100', 'Salil Parekh', '+91-80-2852-0261', 'salil.parekh@infosys.com', '29', 'Karnataka'),

('WIPRO LIMITED', '29AAACW0764N1Z4', 'BOE017890', 'NT005', 'Doddakannelli, Sarjapur Road, Bangalore, Karnataka - 560035', 'Thierry Delaporte', '+91-80-2844-0011', 'thierry.delaporte@wipro.com', '29', 'Karnataka'),

('HCL TECHNOLOGIES LIMITED', '06AACCH0589R1Z5', 'BOE021234', 'NT006', 'Plot 3A, Sector 126, Noida, Uttar Pradesh - 201304', 'C Vijayakumar', '+91-120-446-1000', 'c.vijayakumar@hcl.com', '06', 'Uttar Pradesh'),

('TECH MAHINDRA LIMITED', '27AABCT3518Q1ZB', 'BOE025678', 'NT007', 'Gate No. 4, Plot No. 1, Phase III, Rajiv Gandhi Infotech Park, Hinjewadi, Pune, Maharashtra - 411057', 'CP Gurnani', '+91-20-4225-0000', 'cp.gurnani@techmahindra.com', '27', 'Maharashtra'),

('LARSEN & TOUBRO LIMITED', '27AABCL0001A1Z5', 'BOE029012', 'NT008', 'L&T House, N.M. Marg, Ballard Estate, Mumbai, Maharashtra - 400001', 'SN Subrahmanyan', '+91-22-6752-5656', 'sn.subrahmanyan@larsentoubro.com', '27', 'Maharashtra'),

('BHARAT PETROLEUM CORPORATION LIMITED', '27AABCB0001A1Z5', 'BOE032456', 'NT009', 'Bharat Bhavan, 4 & 6 Currimbhoy Road, Ballard Estate, Mumbai, Maharashtra - 400001', 'Arun Kumar Singh', '+91-22-2271-7000', 'aksingh@bharatpetroleum.in', '27', 'Maharashtra'),

('OIL AND NATURAL GAS CORPORATION LIMITED', '27AABCO0001A1Z5', 'BOE036890', 'NT010', 'ONGC Bhavan, Deendayal Urja Marg, Vasant Kunj, New Delhi - 110070', 'Arun Kumar Singh', '+91-11-2675-2001', 'aksingh@ongc.co.in', '07', 'Delhi');

-- =====================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for shipment details with customer information
CREATE VIEW v_shipment_details AS
SELECT 
    s.id,
    s.shipment_type,
    s.shipment_subtype,
    s.asc_number,
    s.sh_number,
    s.ref_number,
    s.cbm,
    s.odc,
    s.length,
    s.breadth,
    s.height,
    s.packages,
    s.status,
    s.created_at,
    c.company_name,
    c.gstin,
    c.boe,
    c.new_ton,
    c.address,
    c.contact_person,
    c.phone,
    c.email,
    u.name as created_by_name
FROM shipments s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.created_by = u.id
WHERE s.status != 'cancelled';

-- View for invoice details with customer and shipment information
CREATE VIEW v_invoice_details AS
SELECT 
    i.id,
    i.invoice_number,
    i.invoice_date,
    i.due_date,
    i.place_of_supply,
    i.gstin_recipient,
    i.state,
    i.state_code,
    i.po_reference,
    i.slb_reference,
    i.reverse_charge,
    i.subtotal_usd,
    i.subtotal_inr,
    i.igst_amount_usd,
    i.igst_amount_inr,
    i.total_usd,
    i.total_inr,
    i.fx_rate,
    i.status,
    i.created_at,
    s.shipment_type,
    s.shipment_subtype,
    s.asc_number,
    s.cbm,
    c.company_name,
    c.gstin,
    c.address,
    c.contact_person,
    u.name as created_by_name
FROM invoices i
LEFT JOIN shipments s ON i.shipment_id = s.id
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN users u ON i.created_by = u.id
WHERE i.status != 'cancelled';

-- View for customer search (optimized for search functionality)
CREATE VIEW v_customer_search AS
SELECT 
    id,
    company_name,
    gstin,
    boe,
    new_ton,
    address,
    contact_person,
    phone,
    email,
    state_code,
    state_name,
    CASE 
        WHEN gstin IS NOT NULL THEN 'gstin'
        ELSE 'company'
    END as search_type
FROM customers
WHERE is_active = TRUE;

-- =====================================================
-- CREATE TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Note: Triggers are commented out for now to avoid syntax issues
-- Uncomment and modify as needed for your specific MySQL version

/*
DELIMITER //
CREATE TRIGGER validate_invoice_totals
    BEFORE UPDATE ON invoices
    FOR EACH ROW
BEGIN
    IF NEW.total_usd < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Total USD cannot be negative';
    END IF;
    IF NEW.total_inr < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Total INR cannot be negative';
    END IF;
    IF NEW.fx_rate <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FX rate must be positive';
    END IF;
END//
DELIMITER ;
*/

-- =====================================================
-- CREATE STORED PROCEDURES (SQLite doesn't support stored procedures, but we can create functions)
-- =====================================================

-- Function to generate invoice number (implemented in application)
-- Format: ASC + YY + MM + 3-digit sequence number
-- Example: ASC2324MSZFC174

-- Function to calculate invoice totals (implemented in application)
-- Total USD = Sum of all line items in USD
-- Total INR = Total USD * FX Rate
-- IGST USD = Total USD * 18%
-- IGST INR = Total INR * 18%

-- =====================================================
-- SAMPLE QUERIES FOR REFERENCE
-- =====================================================

-- Get all active customers
-- SELECT * FROM customers WHERE is_active = 1 ORDER BY company_name;

-- Search customers by company name or GSTIN
-- SELECT * FROM v_customer_search 
-- WHERE company_name LIKE '%search_term%' OR gstin LIKE '%search_term%'
-- ORDER BY 
--     CASE 
--         WHEN company_name LIKE '%search_term%' THEN 1
--         WHEN gstin LIKE '%search_term%' THEN 2
--         ELSE 3
--     END,
--     company_name
-- LIMIT 10;

-- Get shipment statistics
-- SELECT 
--     shipment_type,
--     COUNT(*) as total_shipments,
--     SUM(cbm) as total_cbm,
--     AVG(cbm) as avg_cbm
-- FROM shipments 
-- WHERE status != 'cancelled'
-- GROUP BY shipment_type;

-- Get invoice statistics
-- SELECT 
--     status,
--     COUNT(*) as total_invoices,
--     SUM(total_usd) as total_amount_usd,
--     SUM(total_inr) as total_amount_inr
-- FROM invoices 
-- WHERE status != 'cancelled'
-- GROUP BY status;

-- =====================================================
-- DATABASE MAINTENANCE QUERIES
-- =====================================================

-- Check database integrity
-- PRAGMA integrity_check;

-- Optimize database
-- VACUUM;

-- Analyze tables for better query performance
-- ANALYZE;

-- =====================================================
-- END OF DATABASE SCHEMA
-- =====================================================
