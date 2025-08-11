-- ACCEX Supply Chain Solutions Database Schema
-- Shipment and Invoice Management System

-- Users table for authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers table for bill-to information
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    gstin TEXT UNIQUE,
    boe TEXT,
    new_ton TEXT,
    address TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    state_code TEXT,
    state_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shipments table
CREATE TABLE shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_type TEXT NOT NULL,
    shipment_subtype TEXT NOT NULL,
    asc_number TEXT,
    sh_number TEXT,
    ref_number TEXT,
    customer_id INTEGER NOT NULL,
    cbm REAL NOT NULL,
    odc TEXT DEFAULT 'No',
    length REAL,
    breadth REAL,
    height REAL,
    packages INTEGER,
    status TEXT DEFAULT 'draft',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Invoices table
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    shipment_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    place_of_supply TEXT NOT NULL,
    gstin_recipient TEXT,
    state TEXT NOT NULL,
    state_code TEXT NOT NULL,
    subtotal_usd REAL DEFAULT 0,
    subtotal_inr REAL DEFAULT 0,
    igst_amount_usd REAL DEFAULT 0,
    igst_amount_inr REAL DEFAULT 0,
    total_usd REAL DEFAULT 0,
    total_inr REAL DEFAULT 0,
    fx_rate REAL DEFAULT 83.5,
    status TEXT DEFAULT 'draft',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Invoice items table
CREATE TABLE invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    uom TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    currency TEXT NOT NULL,
    fx_rate REAL DEFAULT 83.5,
    amount_usd REAL DEFAULT 0,
    amount_inr REAL DEFAULT 0,
    hsn_sac TEXT,
    igst_percent REAL DEFAULT 18,
    igst_amount_usd REAL DEFAULT 0,
    igst_amount_inr REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Sample data insertion
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@123.com', '$2b$10$rQZ8K9mN2pL1vX3yU6wA7eB4cD5fG8hI9jK0lM1nO2pQ3rS4tU5vW6xY7z', 'admin');

INSERT INTO customers (company_name, gstin, boe, new_ton, address, contact_person, phone, email, state_code, state_name) VALUES 
('Acme Corporation', '27AABCU9603R1ZN', 'BOE001234', 'NT001', '123 Business Street, New York, NY 10001, United States', 'John Smith', '+1-555-0123', 'john@acme.com', '27', 'Maharashtra'),
('Tech Solutions Ltd', '27AATSL7890K2ZM', 'BOE005678', 'NT002', '456 Tech Avenue, San Francisco, CA 94105, United States', 'Sarah Johnson', '+1-555-0456', 'sarah@techsolutions.com', '27', 'Maharashtra'),
('Global Inc', '27AAGIN4567L3ZN', 'BOE009012', 'NT003', '789 Global Plaza, London, EC1A 1BB, United Kingdom', 'Michael Brown', '+44-20-1234-5678', 'michael@globalinc.com', '27', 'Maharashtra'),
('ABC Logistics', '27AAABL1234M4ZO', 'BOE013456', 'NT004', '321 Logistics Way, Mumbai, Maharashtra 400001', 'Priya Patel', '+91-22-1234-5678', 'priya@abclogistics.com', '27', 'Maharashtra'),
('XYZ Manufacturing', '27AAXYZ5678N5ZP', 'BOE017890', 'NT005', '654 Factory Road, Pune, Maharashtra 411001', 'Rajesh Kumar', '+91-20-1234-5678', 'rajesh@xyzmanufacturing.com', '27', 'Maharashtra');

-- Create indexes for better performance
CREATE INDEX idx_customers_gstin ON customers(gstin);
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
