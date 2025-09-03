const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '/')));
// Session configuration
app.use(session({
    secret: 'accex-shipment-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ASA#60kjk_@',
  database: 'accex_shipment_db',
  multipleStatements: true
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Check if basic tables exist, if not create them
  checkAndCreateTables();
});

// Function to check and create basic tables if they don't exist
function checkAndCreateTables() {
    // Check if users table exists
    db.query("SHOW TABLES LIKE 'users'", (err, results) => {
        if (err) {
            console.error('Error checking tables:', err);
            return;
        }
        
        if (results.length === 0) {
            // Tables don't exist, create them
            console.log('Creating basic tables...');
            createBasicTables();
        } else {
            // Tables exist, check if admin user exists
            console.log('Tables already exist, checking admin user...');
            checkAdminUser();
        }
    });
}

// Function to create basic tables
function createBasicTables() {
    const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS users (
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
        
        CREATE TABLE IF NOT EXISTS customers (
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
        
        CREATE TABLE IF NOT EXISTS shipments (
            id INT PRIMARY KEY AUTO_INCREMENT,
            direction ENUM('Inbound', 'Outbound') NOT NULL DEFAULT 'Inbound',
            parent_category VARCHAR(100) NOT NULL DEFAULT 'A) Customs Clearance',
            child_category VARCHAR(100) NOT NULL DEFAULT 'New Fixed Asset (FA)',
            boe_number VARCHAR(50) UNIQUE,
            equipment_type ENUM('TEU20', 'FEU40', 'LCL_SEA', 'LCL_AIR', 'ROAD', 'DOCUMENT') NOT NULL DEFAULT 'TEU20',
            unit_type ENUM('PER_TEU', 'PER_TEU_BOE', 'PER_FEU', 'PER_FEU_BOE', 'PER_VEHICLE', 'PER_VEHICLE_BOE', 'PER_DOCUMENT') NOT NULL DEFAULT 'PER_TEU',
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
            cargo_type ENUM('Fixed assets', 'Chemicals', 'Spares') NOT NULL,
            haz_selection ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
            old_new_selection ENUM('Old', 'New') NOT NULL DEFAULT 'New',
            status ENUM('draft', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
            notes TEXT,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
        );
        
        CREATE TABLE IF NOT EXISTS invoices (
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
        
        CREATE TABLE IF NOT EXISTS invoice_items (
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
        
        CREATE TABLE IF NOT EXISTS billing_master (
            id INT PRIMARY KEY AUTO_INCREMENT,
            direction ENUM('Inbound', 'Outbound') NOT NULL,
            parent_category VARCHAR(100) NOT NULL,
            child_category VARCHAR(100) NOT NULL,
            equipment_type ENUM('TEU20', 'FEU40', 'LCL_SEA', 'LCL_AIR', 'ROAD', 'DOCUMENT') NOT NULL,
            unit_type ENUM('PER_TEU', 'PER_TEU_BOE', 'PER_FEU', 'PER_FEU_BOE', 'PER_VEHICLE', 'PER_VEHICLE_BOE', 'PER_DOCUMENT') NOT NULL,
            currency ENUM('INR', 'USD') NOT NULL,
            price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_billing_line (direction, parent_category, child_category, equipment_type, unit_type, currency)
        );
        
        CREATE TABLE IF NOT EXISTS billing_combinations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            master_id INT NOT NULL,
            customer_id INT NOT NULL,
            price_override DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            is_custom TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (master_id) REFERENCES billing_master(id) ON DELETE RESTRICT,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
            UNIQUE KEY unique_combination (master_id, customer_id, is_custom)
        );
        
        CREATE TABLE IF NOT EXISTS draft_invoices (
            id INT PRIMARY KEY AUTO_INCREMENT,
            shipment_id INT NOT NULL,
            customer_id INT NOT NULL,
            subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            status ENUM('draft', 'pending') NOT NULL DEFAULT 'draft',
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
            UNIQUE KEY unique_active_draft (shipment_id, status)
        );
        
        CREATE TABLE IF NOT EXISTS draft_invoice_items (
            id INT PRIMARY KEY AUTO_INCREMENT,
            draft_invoice_id INT NOT NULL,
            description TEXT NOT NULL,
            uom VARCHAR(50) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            currency ENUM('USD', 'INR') NOT NULL,
            fx_rate DECIMAL(10,2) NOT NULL DEFAULT 81.90,
            amount_usd DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            amount_inr DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            hsn_sac VARCHAR(20),
            igst_percent DECIMAL(5,2) NOT NULL DEFAULT 18.00,
            igst_amount_usd DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            igst_amount_inr DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            billing_master_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (draft_invoice_id) REFERENCES draft_invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (billing_master_id) REFERENCES billing_master(id) ON DELETE SET NULL
        );
    `;
    
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    
    let completed = 0;
    statements.forEach(statement => {
        if (statement.trim()) {
            db.query(statement, (err) => {
                if (err) {
                    console.error('Error creating table:', err.message);
                } else {
                    completed++;
                    if (completed === statements.length) {
                        console.log('Basic tables created successfully');
                        ensureMigrationsAndProcedures(() => {
                            insertSLBBillingData(() => {
                                insertSampleData();
                            });
                        });
                    }
                }
            });
        }
    });
}

// Function to check if admin user exists
function checkAdminUser() {
    db.query("SELECT * FROM users WHERE email = 'admin@123.com'", (err, results) => {
        if (err) {
            console.error('Error checking admin user:', err);
            return;
        }
        
        if (results.length === 0) {
            console.log('Admin user not found, creating...');
            insertSampleData();
        } else {
            console.log('Admin user already exists');
            console.log('Default user: admin@123.com / admin');
        }
    });
}

// Run simple migrations and create stored procedures for upsert behavior
function ensureMigrationsAndProcedures(done) {
    const alterSql = `
        ALTER TABLE users 
            MODIFY name VARCHAR(255) NOT NULL,
            MODIFY email VARCHAR(255) NOT NULL,
            MODIFY password VARCHAR(255) NOT NULL;
        ALTER TABLE customers 
            MODIFY company_name VARCHAR(255) NOT NULL;
        ALTER TABLE shipments 
            MODIFY shipment_type ENUM('Inbound','Outbound') NOT NULL,
            MODIFY shipment_subtype VARCHAR(100) NOT NULL,
            MODIFY customer_id INT NOT NULL,
            MODIFY cbm DECIMAL(10,2) NOT NULL,
            MODIFY created_by INT NOT NULL;
        ALTER TABLE invoices 
            MODIFY invoice_number VARCHAR(50) NOT NULL,
            MODIFY shipment_id INT NOT NULL,
            MODIFY customer_id INT NOT NULL,
            MODIFY invoice_date DATE NOT NULL,
            MODIFY due_date DATE NOT NULL,
            MODIFY place_of_supply VARCHAR(255) NOT NULL,
            MODIFY state VARCHAR(100) NOT NULL,
            MODIFY state_code VARCHAR(10) NOT NULL,
            MODIFY created_by INT NOT NULL;
        ALTER TABLE invoice_items 
            MODIFY description TEXT NOT NULL,
            MODIFY uom VARCHAR(50) NOT NULL,
            MODIFY quantity DECIMAL(10,2) NOT NULL,
            MODIFY rate DECIMAL(15,2) NOT NULL,
            MODIFY currency ENUM('USD','INR') NOT NULL;`;

    const procs = [
        `DROP PROCEDURE IF EXISTS sp_upsert_customer;`,
        `CREATE PROCEDURE sp_upsert_customer(
            IN p_id INT,
            IN p_company_name VARCHAR(255), IN p_gstin VARCHAR(15), IN p_boe VARCHAR(50), IN p_new_ton VARCHAR(50),
            IN p_address TEXT, IN p_contact_person VARCHAR(255), IN p_phone VARCHAR(20), IN p_email VARCHAR(255),
            IN p_state_code VARCHAR(10), IN p_state_name VARCHAR(100)
        )
        BEGIN
            IF p_id IS NOT NULL AND EXISTS(SELECT 1 FROM customers WHERE id = p_id) THEN
                UPDATE customers SET company_name=p_company_name, gstin=p_gstin, boe=p_boe, new_ton=p_new_ton,
                    address=p_address, contact_person=p_contact_person, phone=p_phone, email=p_email,
                    state_code=p_state_code, state_name=p_state_name, updated_at=CURRENT_TIMESTAMP
                WHERE id=p_id;
                SELECT p_id AS id;
            ELSE
                INSERT INTO customers (company_name, gstin, boe, new_ton, address, contact_person, phone, email, state_code, state_name)
                VALUES (p_company_name, p_gstin, p_boe, p_new_ton, p_address, p_contact_person, p_phone, p_email, p_state_code, p_state_name);
                SELECT LAST_INSERT_ID() AS id;
            END IF;
        END` ,
        `DROP PROCEDURE IF EXISTS sp_upsert_shipment;` ,
        `CREATE PROCEDURE sp_upsert_shipment(
            IN p_id INT,
            IN p_shipment_type ENUM('Inbound','Outbound'), IN p_shipment_subtype VARCHAR(100),
            IN p_asc_number VARCHAR(100), IN p_sh_number VARCHAR(100), IN p_ref_number VARCHAR(100),
            IN p_customer_id INT, IN p_cbm DECIMAL(10,2), IN p_odc ENUM('Yes','No'),
            IN p_cargo_type ENUM('Fixed assets','Chemicals','Spares'), IN p_haz_selection ENUM('Yes','No'), IN p_old_new_selection ENUM('Old','New'),
            IN p_length DECIMAL(10,2), IN p_breadth DECIMAL(10,2), IN p_height DECIMAL(10,2), IN p_packages INT,
            IN p_created_by INT
        )
        BEGIN
            IF p_id IS NOT NULL AND EXISTS(SELECT 1 FROM shipments WHERE id = p_id) THEN
                UPDATE shipments SET shipment_type=p_shipment_type, shipment_subtype=p_shipment_subtype,
                    asc_number=p_asc_number, sh_number=p_sh_number, ref_number=p_ref_number,
                    customer_id=p_customer_id, cbm=p_cbm, odc=p_odc, cargo_type=p_cargo_type, haz_selection=p_haz_selection, old_new_selection=p_old_new_selection,
                    length=p_length, breadth=p_breadth, height=p_height, packages=p_packages, updated_at=CURRENT_TIMESTAMP
                WHERE id=p_id;
                SELECT p_id AS id;
            ELSE
                INSERT INTO shipments (shipment_type, shipment_subtype, asc_number, sh_number, ref_number, customer_id, cbm, odc, cargo_type, haz_selection, old_new_selection, length, breadth, height, packages, created_by)
                VALUES (p_shipment_type, p_shipment_subtype, p_asc_number, p_sh_number, p_ref_number, p_customer_id, p_cbm, p_odc, p_cargo_type, p_haz_selection, p_old_new_selection, p_length, p_breadth, p_height, p_packages, p_created_by);
                SELECT LAST_INSERT_ID() AS id;
            END IF;
        END` ,
        `DROP PROCEDURE IF EXISTS sp_upsert_invoice;` ,
        `CREATE PROCEDURE sp_upsert_invoice(
            IN p_id INT,
            IN p_invoice_number VARCHAR(50), IN p_shipment_id INT, IN p_customer_id INT,
            IN p_invoice_date DATE, IN p_due_date DATE,
            IN p_place_of_supply VARCHAR(255), IN p_gstin_recipient VARCHAR(15), IN p_state VARCHAR(100), IN p_state_code VARCHAR(10),
            IN p_po_reference VARCHAR(100), IN p_slb_reference VARCHAR(100), IN p_reverse_charge ENUM('Yes','No'),
            IN p_subtotal_usd DECIMAL(15,2), IN p_subtotal_inr DECIMAL(15,2), IN p_igst_amount_usd DECIMAL(15,2), IN p_igst_amount_inr DECIMAL(15,2),
            IN p_total_usd DECIMAL(15,2), IN p_total_inr DECIMAL(15,2), IN p_fx_rate DECIMAL(10,2), IN p_status ENUM('draft','finalized','cancelled'), IN p_created_by INT
        )
        BEGIN
            IF p_id IS NOT NULL AND EXISTS(SELECT 1 FROM invoices WHERE id = p_id) THEN
                UPDATE invoices SET invoice_number=p_invoice_number, shipment_id=p_shipment_id, customer_id=p_customer_id,
                    invoice_date=p_invoice_date, due_date=p_due_date, place_of_supply=p_place_of_supply, gstin_recipient=p_gstin_recipient,
                    state=p_state, state_code=p_state_code, po_reference=p_po_reference, slb_reference=p_slb_reference, reverse_charge=p_reverse_charge,
                    subtotal_usd=p_subtotal_usd, subtotal_inr=p_subtotal_inr, igst_amount_usd=p_igst_amount_usd, igst_amount_inr=p_igst_amount_inr,
                    total_usd=p_total_usd, total_inr=p_total_inr, fx_rate=p_fx_rate, status=p_status, updated_at=CURRENT_TIMESTAMP
                WHERE id=p_id;
                SELECT p_id AS id;
            ELSE
                INSERT INTO invoices (
                    invoice_number, shipment_id, customer_id, invoice_date, due_date, place_of_supply, gstin_recipient, state, state_code,
                    po_reference, slb_reference, reverse_charge, subtotal_usd, subtotal_inr, igst_amount_usd, igst_amount_inr,
                    total_usd, total_inr, fx_rate, status, created_by)
                VALUES (
                    p_invoice_number, p_shipment_id, p_customer_id, p_invoice_date, p_due_date, p_place_of_supply, p_gstin_recipient, p_state, p_state_code,
                    p_po_reference, p_slb_reference, p_reverse_charge, p_subtotal_usd, p_subtotal_inr, p_igst_amount_usd, p_igst_amount_inr,
                    p_total_usd, p_total_inr, p_fx_rate, p_status, p_created_by);
                SELECT LAST_INSERT_ID AS id;
            END IF;
        END` ,
        `DROP PROCEDURE IF EXISTS sp_upsert_invoice_item;` ,
        `CREATE PROCEDURE sp_upsert_invoice_item(
            IN p_id INT,
            IN p_invoice_id INT, IN p_description TEXT, IN p_uom VARCHAR(50), IN p_quantity DECIMAL(10,2), IN p_rate DECIMAL(15,2),
            IN p_currency ENUM('USD','INR'), IN p_fx_rate DECIMAL(10,2), IN p_amount_usd DECIMAL(15,2), IN p_amount_inr DECIMAL(15,2),
            IN p_hsn_sac VARCHAR(20), IN p_igst_percent DECIMAL(5,2), IN p_igst_amount_usd DECIMAL(15,2), IN p_igst_amount_inr DECIMAL(15,2)
        )
        BEGIN
            IF p_id IS NOT NULL AND EXISTS(SELECT 1 FROM invoice_items WHERE id = p_id) THEN
                UPDATE invoice_items SET invoice_id=p_invoice_id, description=p_description, uom=p_uom, quantity=p_quantity, rate=p_rate,
                    currency=p_currency, fx_rate=p_fx_rate, amount_usd=p_amount_usd, amount_inr=p_amount_inr, hsn_sac=p_hsn_sac,
                    igst_percent=p_igst_percent, igst_amount_usd=p_igst_amount_usd, igst_amount_inr=p_igst_amount_inr
                WHERE id=p_id;
                SELECT p_id AS id;
            ELSE
                INSERT INTO invoice_items (
                    invoice_id, description, uom, quantity, rate, currency, fx_rate, amount_usd, amount_inr, hsn_sac, igst_percent, igst_amount_usd, igst_amount_inr)
                VALUES (
                    p_invoice_id, p_description, p_uom, p_quantity, p_rate, p_currency, p_fx_rate, p_amount_usd, p_amount_inr, p_hsn_sac, p_igst_percent, p_igst_amount_usd, p_igst_amount_inr);
                SELECT LAST_INSERT_ID() AS id;
            END IF;
        END`
    ];

    // Execute ALTERs first
    db.query(alterSql, (err) => {
        if (err) {
            console.error('Migration error:', err.message);
        } else {
            console.log('Migrations applied');
        }

        // Create procedures sequentially to avoid delimiter issues
        const execNext = (idx) => {
            if (idx >= procs.length) {
                if (typeof done === 'function') done();
                return;
            }
            db.query(procs[idx], (perr) => {
                if (perr && !(`${perr.code}`.includes('ER_SP_ALREADY_EXISTS'))) {
                    console.error('Procedure error:', perr.message);
                }
                execNext(idx + 1);
            });
        };
        execNext(0);
    });
}

// Function to insert SLB billing master data
function insertSLBBillingData(done) {
    console.log('Inserting SLB billing master data...');
    
    const slbData = [
        // INBOUND SECTION
        // A) Customs Clearance
        ['Inbound', 'A) Customs Clearance', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 1500.00],
        ['Inbound', 'A) Customs Clearance', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU_BOE', 'INR', 1800.00],
        ['Inbound', 'A) Customs Clearance', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 2500.00],
        ['Inbound', 'A) Customs Clearance', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU_BOE', 'INR', 2800.00],
        ['Inbound', 'A) Customs Clearance', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 800.00],
        ['Inbound', 'A) Customs Clearance', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 1200.00],
        ['Inbound', 'A) Customs Clearance', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 600.00],

        ['Inbound', 'A) Customs Clearance', 'Machinery & Spares (M&S)', 'TEU20', 'PER_TEU', 'INR', 1200.00],
        ['Inbound', 'A) Customs Clearance', 'Machinery & Spares (M&S)', 'FEU40', 'PER_FEU', 'INR', 2000.00],
        ['Inbound', 'A) Customs Clearance', 'Machinery & Spares (M&S)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 700.00],

        ['Inbound', 'A) Customs Clearance', 'Chemicals (DG/Non-DG)', 'TEU20', 'PER_TEU', 'INR', 1800.00],
        ['Inbound', 'A) Customs Clearance', 'Chemicals (DG/Non-DG)', 'FEU40', 'PER_FEU', 'INR', 3000.00],
        ['Inbound', 'A) Customs Clearance', 'Chemicals (DG/Non-DG)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 1000.00],

        ['Inbound', 'A) Customs Clearance', 'Old & Used', 'TEU20', 'PER_TEU', 'INR', 1000.00],
        ['Inbound', 'A) Customs Clearance', 'Old & Used', 'FEU40', 'PER_FEU', 'INR', 1800.00],
        ['Inbound', 'A) Customs Clearance', 'Old & Used', 'LCL_SEA', 'PER_VEHICLE', 'INR', 500.00],

        // B) CE Certification
        ['Inbound', 'B) CE Certification', 'Document', 'DOCUMENT', 'PER_DOCUMENT', 'INR', 500.00],

        // C) Inbound Transportation
        ['Inbound', 'C) Inbound Transportation', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 800.00],
        ['Inbound', 'C) Inbound Transportation', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 1200.00],
        ['Inbound', 'C) Inbound Transportation', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 400.00],
        ['Inbound', 'C) Inbound Transportation', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 600.00],
        ['Inbound', 'C) Inbound Transportation', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 300.00],

        // D) Handling
        ['Inbound', 'D) Handling', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 600.00],
        ['Inbound', 'D) Handling', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 900.00],
        ['Inbound', 'D) Handling', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 300.00],
        ['Inbound', 'D) Handling', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 450.00],
        ['Inbound', 'D) Handling', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 200.00],

        // E) Documentation
        ['Inbound', 'E) Documentation', 'Document', 'DOCUMENT', 'PER_DOCUMENT', 'INR', 300.00],

        // F) Container Scanning
        ['Inbound', 'F) Container Scanning', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 400.00],
        ['Inbound', 'F) Container Scanning', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 600.00],
        ['Inbound', 'F) Container Scanning', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 200.00],
        ['Inbound', 'F) Container Scanning', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 300.00],
        ['Inbound', 'F) Container Scanning', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 150.00],

        // OUTBOUND SECTION
        // G) Customs Clearance
        ['Outbound', 'G) Customs Clearance', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 1400.00],
        ['Outbound', 'G) Customs Clearance', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 2300.00],
        ['Outbound', 'G) Customs Clearance', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 750.00],
        ['Outbound', 'G) Customs Clearance', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 1100.00],
        ['Outbound', 'G) Customs Clearance', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 550.00],

        // H) CE Certification
        ['Outbound', 'H) CE Certification', 'Document', 'DOCUMENT', 'PER_DOCUMENT', 'INR', 500.00],

        // I) Handling
        ['Outbound', 'I) Handling', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 550.00],
        ['Outbound', 'I) Handling', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 850.00],
        ['Outbound', 'I) Handling', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 280.00],
        ['Outbound', 'I) Handling', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 420.00],
        ['Outbound', 'I) Handling', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 180.00],

        // J) Documentation
        ['Outbound', 'J) Documentation', 'Document', 'DOCUMENT', 'PER_DOCUMENT', 'INR', 300.00],

        // K) Transportation
        ['Outbound', 'K) Transportation', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 750.00],
        ['Outbound', 'K) Transportation', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 1100.00],
        ['Outbound', 'K) Transportation', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 350.00],
        ['Outbound', 'K) Transportation', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 550.00],
        ['Outbound', 'K) Transportation', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 250.00],

        // L) Storage
        ['Outbound', 'L) Storage', 'New Fixed Asset (FA)', 'TEU20', 'PER_TEU', 'INR', 400.00],
        ['Outbound', 'L) Storage', 'New Fixed Asset (FA)', 'FEU40', 'PER_FEU', 'INR', 600.00],
        ['Outbound', 'L) Storage', 'New Fixed Asset (FA)', 'LCL_SEA', 'PER_VEHICLE', 'INR', 200.00],
        ['Outbound', 'L) Storage', 'New Fixed Asset (FA)', 'LCL_AIR', 'PER_VEHICLE', 'INR', 300.00],
        ['Outbound', 'L) Storage', 'New Fixed Asset (FA)', 'ROAD', 'PER_VEHICLE', 'INR', 150.00]
    ];

    let inserted = 0;
    slbData.forEach((row, index) => {
        db.query(`INSERT IGNORE INTO billing_master (direction, parent_category, child_category, equipment_type, unit_type, currency, price) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            row, (err) => {
                if (err && !err.message.includes('Duplicate entry')) {
                    console.error('Error inserting SLB data:', err);
                } else {
                    inserted++;
                }
                
                if (inserted === slbData.length) {
                    console.log('SLB billing master data inserted successfully');
                    if (typeof done === 'function') done();
                }
            });
    });
}

// Function to insert sample data
function insertSampleData() {
    const hashedPassword = bcrypt.hashSync('admin', 10);
    
    // Insert admin user
    db.query(`INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 
        ['Admin User', 'admin@123.com', hashedPassword, 'admin'], (err) => {
            if (err) {
                console.error('Error inserting admin user:', err);
            } else {
                console.log('Admin user created successfully');
            }
        });
    
    // Insert additional sample users
    const sampleUsers = [
        ['Manager User', 'manager@accex.com', bcrypt.hashSync('manager123', 10), 'manager'],
        ['User One', 'user1@accex.com', bcrypt.hashSync('user123', 10), 'user'],
        ['User Two', 'user2@accex.com', bcrypt.hashSync('user123', 10), 'user']
    ];
    
    sampleUsers.forEach(user => {
        db.query(`INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 
            user, (err) => {
                if (err && !err.message.includes('Duplicate entry')) {
                    console.error('Error inserting user:', err);
                } else {
                    console.log(`User ${user[0]} created successfully`);
                }
            });
        });
    
    // Insert sample customers
    const sampleCustomers = [
        ['SCHLUMBERGER ASIA SERVICES LIMITED', '27AADCS1107J1ZK', 'BOE001234', 'NT001', 'P-21, TTC INDUSTRIAL AREA, THANE BELAPUR ROAD, MIDC MAHAPE, THANE, MAHARASHTRA - 400710, INDIA', 'John Smith', '+91-22-1234-5678', 'john.smith@slb.com', '27', 'Maharashtra'],
        ['RELIANCE INDUSTRIES LIMITED', '27AACCR5055K1ZK', 'BOE005678', 'NT002', 'Maker Chambers IV, Nariman Point, Mumbai, Maharashtra - 400021', 'Mukesh Ambani', '+91-22-3555-5000', 'mukesh.ambani@ril.com', '27', 'Maharashtra'],
        ['TATA CONSULTANCY SERVICES LIMITED', '27AABCT3518Q1ZA', 'BOE009012', 'NT003', 'TCS House, Raveline Street, Fort, Mumbai, Maharashtra - 400001', 'N Chandrasekaran', '+91-22-6778-9999', 'n.chandrasekaran@tcs.com', '27', 'Maharashtra']
    ];
    
    sampleCustomers.forEach(customer => {
        db.query(`INSERT IGNORE INTO customers (company_name, gstin, boe, new_ton, address, contact_person, phone, email, state_code, state_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            customer, (err) => {
                if (err && !err.message.includes('Duplicate entry')) {
                    console.error('Error inserting customer:', err);
                }
            });
    });
    
    // Insert a default sample invoice after customers are created
    setTimeout(() => {
        insertDefaultInvoice();
    }, 2000); // Increased delay to ensure customers are created first
    
    console.log('Sample data inserted successfully');
    console.log('Available users for login:');
    console.log('- admin@123.com / admin (Admin User)');
    console.log('- manager@accex.com / manager123 (Manager User)');
    console.log('- user1@accex.com / user123 (User One)');
    console.log('- user2@accex.com / user123 (User Two)');
}

// Function to insert default invoice
function insertDefaultInvoice() {
    console.log('Starting default invoice creation...');
    
    // First, get a customer ID
    db.query('SELECT id FROM customers LIMIT 1', (err, customers) => {
        if (err) {
            console.error('Error getting customers for default invoice:', err);
            return;
        }
        
        if (customers.length === 0) {
            console.error('No customers found for default invoice');
            return;
        }
        
        const customerId = customers[0].id;
        console.log('Using customer ID for default invoice:', customerId);
        
        // Check if default invoice already exists
        db.query('SELECT id FROM invoices WHERE invoice_number = ?', ['ACCEX/23-24/0001'], (err, existingInvoices) => {
            if (err) {
                console.error('Error checking existing invoice:', err);
                return;
            }
            
            if (existingInvoices.length > 0) {
                console.log('Default invoice already exists');
                return;
            }
            
            // Insert default shipment
            const shipmentData = {
                shipment_type: 'Inbound',
                shipment_subtype: 'FC to FTWZ BOE',
                asc_number: 'ASC001',
                sh_number: 'SH001',
                ref_number: 'REF001',
                customer_id: customerId,
                cbm: 150.50,
                odc: 'No',
                cargo_type: 'Fixed assets',
                haz_selection: 'No',
                old_new_selection: 'New',
                length: 10.5,
                breadth: 8.2,
                height: 6.8,
                packages: 25
            };
            
            console.log('Inserting default shipment...');
            db.query(`INSERT INTO shipments (shipment_type, shipment_subtype, asc_number, sh_number, ref_number, customer_id, cbm, odc, cargo_type, haz_selection, old_new_selection, length, breadth, height, packages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [shipmentData.shipment_type, shipmentData.shipment_subtype, shipmentData.asc_number, shipmentData.sh_number, shipmentData.ref_number, shipmentData.customer_id, shipmentData.cbm, shipmentData.odc, shipmentData.cargo_type, shipmentData.haz_selection, shipmentData.old_new_selection, shipmentData.length, shipmentData.breadth, shipmentData.height, shipmentData.packages],
                (err, result) => {
                    if (err) {
                        console.error('Error inserting default shipment:', err);
                        return;
                    }
                    
                    const shipmentId = result.insertId;
                    console.log('Default shipment created with ID:', shipmentId);
                    
                    // Insert default invoice
                    const invoiceData = {
                        invoice_number: 'ACCEX/23-24/0001',
                        invoice_date: new Date().toISOString().split('T')[0],
                        shipment_id: shipmentId,
                        customer_id: customerId,
                        subtotal_usd: 5200.00,
                        subtotal_inr: 431600.00,
                        fx_rate: 83.00,
                        igst_percentage: 18.00,
                        igst_amount_usd: 936.00,
                        igst_amount_inr: 77688.00,
                        total_amount_usd: 6136.00,
                        total_amount_inr: 509288.00,
                        status: 'finalized',
                        place_of_supply: 'Maharashtra',
                        recipient_gstin: '27AACCR5055K1ZK',
                        state: 'Maharashtra',
                        state_code: '27'
                    };
                    
                    console.log('Inserting default invoice...');
                    db.query(`INSERT INTO invoices (
                            invoice_number, shipment_id, customer_id, invoice_date, due_date,
                            place_of_supply, gstin_recipient, state, state_code,
                            po_reference, slb_reference, reverse_charge,
                            subtotal_usd, subtotal_inr, igst_amount_usd, igst_amount_inr,
                            total_usd, total_inr, fx_rate, status, created_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            invoiceData.invoice_number, shipmentId, customerId, invoiceData.invoice_date, invoiceData.invoice_date,
                            invoiceData.place_of_supply, invoiceData.recipient_gstin, invoiceData.state, invoiceData.state_code,
                            'Contract', 'S-202919/REW', 'No',
                            invoiceData.subtotal_usd, invoiceData.subtotal_inr, invoiceData.igst_amount_usd, invoiceData.igst_amount_inr,
                            invoiceData.total_amount_usd, invoiceData.total_amount_inr, invoiceData.fx_rate, invoiceData.status, 1
                        ],
                        (err, result) => {
                            if (err) {
                                console.error('Error inserting default invoice:', err);
                                return;
                            }
                            
                            const invoiceId = result.insertId;
                            console.log('Default invoice created with ID:', invoiceId);
                            
                            // Insert default invoice items
                            const invoiceItems = [
                                ['Logistics Services - FC to FTWZ BOE', 'Service', 1, 5200.00, 'USD', 83.00, 431600.00, '998313', 18.00, 936.00, 77688.00]
                            ];
                            
                            console.log('Inserting default invoice items...');
                            invoiceItems.forEach(item => {
                                const amountInr = item[6];
                                db.query(`INSERT INTO invoice_items (
                                            invoice_id, description, uom, quantity, rate, currency,
                                            fx_rate, amount_usd, amount_inr, hsn_sac, igst_percent, igst_amount_usd, igst_amount_inr
                                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [invoiceId, item[0], item[1], item[2], item[3], item[4], item[5], item[6] / item[5], amountInr, item[7], item[8], item[9], item[10]],
                                    (err) => {
                                        if (err) {
                                            console.error('Error inserting invoice item:', err);
                                        } else {
                                            console.log('Default invoice item created successfully');
                                        }
                                    });
                            });
                            
                            console.log('Default invoice creation completed successfully');
                        });
                });
        });
    });
}

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Demo Login API (works without database for demo)
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Check database for user credentials
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = results[0];
            
            // Check password
            if (!bcrypt.compareSync(password, user.password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Set session
            req.session.userId = user.id;
            req.session.userEmail = user.email;
            req.session.userName = user.name;
            
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    email: user.email, 
                    name: user.name 
                } 
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Sign Up API
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Hash password and create new user
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to create user' });
            }
            
            // Auto-login the new user
            req.session.userId = result.insertId;
            req.session.userEmail = email;
            req.session.userName = name;
            
            res.json({ 
                success: true, 
                user: { 
                    id: result.insertId, 
                    email: email, 
                    name: name 
                },
                message: 'Account created successfully'
            });
        });
    });
});

// Auth status API
app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            authenticated: true, 
            user: { 
                id: req.session.userId, 
                email: req.session.userEmail, 
                name: req.session.userName 
            } 
        });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Logout API
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get all customers API
app.get('/api/customers', (req, res) => {
    db.query('SELECT * FROM customers WHERE is_active = TRUE ORDER BY company_name', (err, customers) => {
        if (err) {
            console.error('Error fetching customers:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(customers);
    });
});

// Enhanced customer search by company name or GSTIN
app.get('/api/customers/search', (req, res) => {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
        return res.json([]);
    }
    
    const searchTerm = `%${query.trim()}%`;
    
    // Search by both company name and GSTIN
    const sql = `
        SELECT * FROM customers
        WHERE (company_name LIKE ? OR gstin LIKE ?) AND is_active = TRUE
        ORDER BY
            CASE
                WHEN company_name LIKE ? THEN 1
                WHEN gstin LIKE ? THEN 2
                ELSE 3
            END,
            company_name
        LIMIT 10
    `;
    
    db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, customers) => {
        if (err) {
            console.error('Error searching customers:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`Found ${customers.length} customers for search term: ${query}`);
        res.json(customers);
    });
});

// Add new customer API
app.post('/api/customers', requireAuth, (req, res) => {
    const {
        company_name, gstin, boe, new_ton, address, contact_person,
        phone, email, state_code, state_name
    } = req.body;

    // Validation
    const errors = [];
    if (!company_name || company_name.trim().length < 2) {
        errors.push('Company name is required and must be at least 2 characters');
    }
    
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        errors.push('Invalid GSTIN format');
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
    }
    
    if (phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone)) {
        errors.push('Invalid phone number format');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
    }

    const sql = `INSERT INTO customers (
        company_name, gstin, boe, new_ton, address, contact_person,
        phone, email, state_code, state_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
        company_name.trim(), gstin, boe, new_ton, address, contact_person,
        phone, email, state_code, state_name
    ], function(err, result) {
        if (err) {
            if (err.message.includes('Duplicate entry')) {
                return res.status(400).json({ error: 'GSTIN already exists' });
            }
            console.error('Customer creation error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ 
            success: true, 
            customerId: result.insertId,
            message: 'Customer added successfully' 
        });
    });
});

// Update customer API
app.put('/api/customers/:id', requireAuth, (req, res) => {
    const customerId = req.params.id;
    const {
        company_name, gstin, boe, new_ton, address, contact_person,
        phone, email, state_code, state_name
    } = req.body;

    // Validation
    const errors = [];
    if (!company_name || company_name.trim().length < 2) {
        errors.push('Company name is required and must be at least 2 characters');
    }
    
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        errors.push('Invalid GSTIN format');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
    }

    const sql = `UPDATE customers SET 
        company_name = ?, gstin = ?, boe = ?, new_ton = ?, address = ?,
        contact_person = ?, phone = ?, email = ?, state_code = ?, state_name = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;

    db.query(sql, [
        company_name.trim(), gstin, boe, new_ton, address, contact_person,
        phone, email, state_code, state_name, customerId
    ], (err, result) => {
        if (err) {
            console.error('Customer update error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Customer updated successfully' 
        });
    });
});

// Delete customer API (soft delete)
app.delete('/api/customers/:id', requireAuth, (req, res) => {
    const customerId = req.params.id;
    
    // Check if customer has associated shipments
    db.query('SELECT COUNT(*) as count FROM shipments WHERE customer_id = ?', [customerId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete customer with existing shipments. Use soft delete instead.' 
            });
        }
        
        // Soft delete by setting is_active to 0
        db.query('UPDATE customers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [customerId], (err) => {
                if (err) {
                    console.error('Error deleting customer:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ success: true, message: 'Customer deleted successfully' });
            });
    });
});

// Enhanced customer search API
app.get('/api/customers/search', (req, res) => {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
        return res.json([]);
    }
    
    const searchQuery = query.trim();
    const isGSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(searchQuery);
    
    let sql, params;
    
    if (isGSTIN) {
        sql = `SELECT * FROM customers WHERE gstin = ? AND is_active = TRUE LIMIT 10`;
        params = [searchQuery];
    } else {
        sql = `SELECT * FROM customers WHERE company_name LIKE ? AND is_active = TRUE ORDER BY company_name LIMIT 10`;
        params = [`%${searchQuery}%`];
    }
    
    db.query(sql, params, (err, customers) => {
        if (err) {
            console.error('Search error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`Found ${customers.length} customers for search term: ${query}`);
        res.json(customers);
    });
});

// Get customer by ID API
app.get('/api/customers/:id', requireAuth, (req, res) => {
    db.query('SELECT * FROM customers WHERE id = ? AND is_active = TRUE', [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching customer:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(results[0]);
    });
});

// Create shipment API
app.post('/api/shipments', (req, res) => {
    const {
        direction, parent_category, child_category, boe_number, equipment_type, unit_type,
        shipment_type, shipment_subtype, asc_number, sh_number, ref_number, customer_id,
        cbm, odc, cargo_type, haz_selection, old_new_selection, length, breadth, height, packages
    } = req.body;

    // Validate required fields
    if (!shipment_type || !shipment_subtype || !customer_id || !cbm || !cargo_type || !haz_selection || !old_new_selection) {
        return res.status(400).json({ error: 'Shipment type, subtype, customer, CBM, cargo type, HAZ selection, and old/new selection are required' });
    }

    // Validate CBM is positive
    if (cbm <= 0) {
        return res.status(400).json({ error: 'CBM must be greater than 0' });
    }

    // Handle empty values for decimal columns
    const lengthValue = length && length.trim() !== '' ? parseFloat(length) : null;
    const breadthValue = breadth && breadth.trim() !== '' ? parseFloat(breadth) : null;
    const heightValue = height && height.trim() !== '' ? parseFloat(height) : null;
    const packagesValue = packages && packages.trim() !== '' ? parseInt(packages) : null;

    const sql = `INSERT INTO shipments (
        direction, parent_category, child_category, boe_number, equipment_type, unit_type,
        shipment_type, shipment_subtype, asc_number, sh_number, ref_number, customer_id,
        cbm, odc, cargo_type, haz_selection, old_new_selection, length, breadth, height, packages, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
        direction || 'Inbound', parent_category || 'A) Customs Clearance', child_category || 'New Fixed Asset (FA)', 
        boe_number, equipment_type || 'TEU20', unit_type || 'PER_TEU',
        shipment_type, shipment_subtype, asc_number, sh_number, ref_number, customer_id,
        cbm, odc, cargo_type, haz_selection, old_new_selection, lengthValue, breadthValue, heightValue, packagesValue, req.session.userId || 1
    ], function(err, result) {
        if (err) {
            console.error('Shipment creation error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        const shipmentId = result.insertId;
        console.log('Shipment created with ID:', shipmentId);
        
        // Generate draft invoice with ACCEX format
        const invoiceNo = `ACCEX/23-24/${String(shipmentId).padStart(4, '0')}`;
        const invoiceDate = moment().format('YYYY-MM-DD');
        const fxRate = 83.00; // Default FX rate
        
        // Calculate base amounts based on CBM
        const baseAmountUSD = cbm * 34.67; // $34.67 per CBM (5200/150)
        const baseAmountINR = baseAmountUSD * fxRate;
        const igstAmountUSD = baseAmountUSD * 0.18;
        const igstAmountINR = baseAmountINR * 0.18;
        const totalAmountUSD = baseAmountUSD + igstAmountUSD;
        const totalAmountINR = baseAmountINR + igstAmountINR;
        
        // Create invoice with new schema
        const invoiceSql = `INSERT INTO invoices (
            invoice_number, shipment_id, customer_id, invoice_date, due_date,
            place_of_supply, gstin_recipient, state, state_code, 
            po_reference, slb_reference, reverse_charge,
            subtotal_usd, subtotal_inr, igst_amount_usd, igst_amount_inr,
            total_usd, total_inr, fx_rate, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(invoiceSql, [
            invoiceNo, shipmentId, customer_id, invoiceDate, invoiceDate,
            'Maharashtra', '', 'Maharashtra', '27',
            'Contract', 'S-202919/REW', 'No',
            baseAmountUSD, baseAmountINR, igstAmountUSD, igstAmountINR,
            totalAmountUSD, totalAmountINR, fxRate, 'draft', req.session.userId || 1
        ], function(err, result) {
            if (err) {
                console.error('Invoice creation error:', err);
                return res.status(500).json({ error: 'Invoice creation failed' });
            }
            
            const invoiceId = result.insertId;
            console.log('Invoice created with ID:', invoiceId);
            
            // Create invoice items based on shipment type
            const invoiceItems = [];
            
            if (shipment_type === 'Inbound') {
                invoiceItems.push({
                    description: `Logistics Services - ${shipment_subtype}`,
                    uom: 'Service',
                    quantity: 1.00,
                    rate: baseAmountUSD,
                    currency: 'USD',
                    hsn_sac: '998313'
                });
            } else {
                invoiceItems.push({
                    description: `Outbound Services - ${shipment_subtype}`,
                    uom: 'Service',
                    quantity: 1.00,
                    rate: baseAmountUSD,
                    currency: 'USD',
                    hsn_sac: '998313'
                });
            }
            
            // Insert invoice items
            let itemsInserted = 0;
            invoiceItems.forEach((item, index) => {
                const amountUSD = item.quantity * item.rate;
                const amountINR = amountUSD * fxRate;
                const igstUSD = amountUSD * 0.18;
                const igstINR = amountINR * 0.18;
                
                const itemSql = `INSERT INTO invoice_items (
                    invoice_id, description, uom, quantity, rate, currency,
                    fx_rate, amount_usd, amount_inr, hsn_sac, igst_percent, igst_amount_usd, igst_amount_inr
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
                db.query(itemSql, [
                    invoiceId, item.description, item.uom, item.quantity, item.rate, item.currency,
                    fxRate, amountUSD, amountINR, item.hsn_sac, 18.00, igstUSD, igstINR
                ], function(err, result) {
                    if (err) {
                        console.error('Invoice item creation error:', err);
                    } else {
                        itemsInserted++;
                        console.log('Invoice item created:', itemsInserted);
                    }
                    
                    // If all items are inserted, send response
                    if (itemsInserted === invoiceItems.length) {
                        res.json({ 
                            success: true, 
                            message: 'Shipment created and draft invoice generated successfully!',
                            shipmentId: shipmentId,
                            invoice: {
                                id: invoiceId,
                                invoice_number: invoiceNo
                            }
                        });
                    }
                });
            });
            
            // If no items to insert, send response immediately
            if (invoiceItems.length === 0) {
                res.json({ 
                    success: true, 
                    message: 'Shipment created and draft invoice generated successfully!',
                    shipmentId: shipmentId,
                    invoice: {
                        id: invoiceId,
                        invoice_number: invoiceNo
                    }
                });
            }
        });
    });
});

// Get shipments API
app.get('/api/shipments', (req, res) => {
    db.query(`
        SELECT s.*, c.company_name, c.gstin 
        FROM shipments s 
        LEFT JOIN customers c ON s.customer_id = c.id 
        ORDER BY s.created_at DESC
    `, (err, shipments) => {
        if (err) {
            console.error('Error fetching shipments:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(shipments);
    });
});

// Get invoices API
app.get('/api/invoices', (req, res) => {
    db.query(`
        SELECT i.*, c.company_name, c.gstin, s.shipment_type, s.shipment_subtype, u.name as created_by_name
        FROM invoices i 
        LEFT JOIN shipments s ON i.shipment_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON i.created_by = u.id
        ORDER BY i.created_at DESC
    `, (err, invoices) => {
        if (err) {
            console.error('Error fetching invoices:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(invoices);
    });
});

// Get invoice details API
app.get('/api/invoices/:id', (req, res) => {
    const invoiceId = req.params.id;
    
    // Get invoice header
    db.query(`SELECT i.*, s.shipment_type, s.shipment_subtype, c.*, u.name as created_by_name
            FROM invoices i
            LEFT JOIN shipments s ON i.shipment_id = s.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON i.created_by = u.id
            WHERE i.id = ?`, [invoiceId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        const invoice = results[0];
        
        // Get invoice items
        db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId], (err, items) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
                invoice: invoice,
                items: items
            });
        });
    });
});

// Update invoice status
app.put('/api/invoices/:id/status', (req, res) => {
    const invoiceId = req.params.id;
    const { status } = req.body;
    
    if (!status || !['draft', 'finalized', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be draft, finalized, or cancelled' });
    }
    
    const sql = `UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.query(sql, [status, invoiceId], (err, result) => {
        if (err) {
            console.error('Error updating invoice status:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        res.json({
            success: true,
            message: `Invoice status updated to ${status}`,
            invoice: {
                id: invoiceId,
                status: status
            }
        });
    });
});

// Finalize invoice (existing function with improved error handling)
app.post('/api/invoices/:id/finalize', (req, res) => {
    const invoiceId = req.params.id;
    
    db.query('UPDATE invoices SET status = ? WHERE id = ?', ['finalized', invoiceId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        res.json({ success: true, message: 'Invoice finalized successfully' });
    });
});

// Get invoice status
app.get('/api/invoices/:id/status', (req, res) => {
    const invoiceId = req.params.id;
    
    const sql = `SELECT status, invoice_number, created_at, updated_at FROM invoices WHERE id = ?`;
    
    db.query(sql, [invoiceId], (err, results) => {
        if (err) {
            console.error('Error fetching invoice status:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        res.json({
            success: true,
            invoice: results[0]
        });
    });
});

// Get SLB billing master data API
app.get('/api/billing-master', (req, res) => {
    const { direction, parent_category, child_category, equipment_type, unit_type, currency } = req.query;
    
    let sql = 'SELECT * FROM billing_master WHERE 1=1';
    let params = [];
    
    if (direction) {
        sql += ' AND direction = ?';
        params.push(direction);
    }
    if (parent_category) {
        sql += ' AND parent_category = ?';
        params.push(parent_category);
    }
    if (child_category) {
        sql += ' AND child_category = ?';
        params.push(child_category);
    }
    if (equipment_type) {
        sql += ' AND equipment_type = ?';
        params.push(equipment_type);
    }
    if (unit_type) {
        sql += ' AND unit_type = ?';
        params.push(unit_type);
    }
    if (currency) {
        sql += ' AND currency = ?';
        params.push(currency);
    }
    
    sql += ' ORDER BY direction, parent_category, child_category, equipment_type, unit_type, currency';
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching billing master:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get SLB hierarchy options API
app.get('/api/slb-options', (req, res) => {
    const { level } = req.query;
    
    let sql, params = [];
    
    switch(level) {
        case 'directions':
            sql = 'SELECT DISTINCT direction FROM billing_master ORDER BY direction';
            break;
        case 'parent_categories':
            sql = 'SELECT DISTINCT parent_category FROM billing_master WHERE direction = ? ORDER BY parent_category';
            params = [req.query.direction];
            break;
        case 'child_categories':
            sql = 'SELECT DISTINCT child_category FROM billing_master WHERE direction = ? AND parent_category = ? ORDER BY child_category';
            params = [req.query.direction, req.query.parent_category];
            break;
        case 'equipment_types':
            sql = 'SELECT DISTINCT equipment_type FROM billing_master WHERE direction = ? AND parent_category = ? AND child_category = ? ORDER BY equipment_type';
            params = [req.query.direction, req.query.parent_category, req.query.child_category];
            break;
        case 'unit_types':
            sql = 'SELECT DISTINCT unit_type FROM billing_master WHERE direction = ? AND parent_category = ? AND child_category = ? AND equipment_type = ? ORDER BY unit_type';
            params = [req.query.direction, req.query.parent_category, req.query.child_category, req.query.equipment_type];
            break;
        case 'currencies':
            sql = 'SELECT DISTINCT currency FROM billing_master WHERE direction = ? AND parent_category = ? AND child_category = ? AND equipment_type = ? AND unit_type = ? ORDER BY currency';
            params = [req.query.direction, req.query.parent_category, req.query.child_category, req.query.equipment_type, req.query.unit_type];
            break;
        default:
            return res.status(400).json({ error: 'Invalid level parameter' });
    }
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching SLB options:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get effective price API
app.get('/api/effective-price', (req, res) => {
    const { customer_id, direction, parent_category, child_category, equipment_type, unit_type, currency } = req.query;
    
    if (!customer_id || !direction || !parent_category || !child_category || !equipment_type || !unit_type || !currency) {
        return res.status(400).json({ error: 'All parameters are required' });
    }
    
    // First check for customer custom override
    const customOverrideSql = `
        SELECT bc.price_override 
        FROM billing_combinations bc
        JOIN billing_master bm ON bc.master_id = bm.id
        WHERE bc.customer_id = ? AND bc.is_custom = 1
        AND bm.direction = ? AND bm.parent_category = ? AND bm.child_category = ?
        AND bm.equipment_type = ? AND bm.unit_type = ? AND bm.currency = ?
    `;
    
    db.query(customOverrideSql, [customer_id, direction, parent_category, child_category, equipment_type, unit_type, currency], (err, customResults) => {
        if (err) {
            console.error('Error fetching custom override:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (customResults.length > 0) {
            return res.json({ 
                price: customResults[0].price_override, 
                source: 'custom_override' 
            });
        }
        
        // Check for predefined combination
        const predefinedSql = `
            SELECT bc.price_override 
            FROM billing_combinations bc
            JOIN billing_master bm ON bc.master_id = bm.id
            WHERE bc.customer_id = ? AND bc.is_custom = 0
            AND bm.direction = ? AND bm.parent_category = ? AND bm.child_category = ?
            AND bm.equipment_type = ? AND bm.unit_type = ? AND bm.currency = ?
        `;
        
        db.query(predefinedSql, [customer_id, direction, parent_category, child_category, equipment_type, unit_type, currency], (err, predefinedResults) => {
            if (err) {
                console.error('Error fetching predefined combination:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (predefinedResults.length > 0) {
                return res.json({ 
                    price: predefinedResults[0].price_override, 
                    source: 'predefined_combination' 
                });
            }
            
            // Fall back to master price
            const masterSql = `
                SELECT price FROM billing_master 
                WHERE direction = ? AND parent_category = ? AND child_category = ?
                AND equipment_type = ? AND unit_type = ? AND currency = ?
            `;
            
            db.query(masterSql, [direction, parent_category, child_category, equipment_type, unit_type, currency], (err, masterResults) => {
                if (err) {
                    console.error('Error fetching master price:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (masterResults.length > 0) {
                    return res.json({ 
                        price: masterResults[0].price, 
                        source: 'master_price' 
                    });
                } else {
                    return res.status(404).json({ error: 'No pricing found for this combination' });
                }
            });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available users for login:');
    console.log('- admin@123.com / admin (Admin User)');
    console.log('- manager@accex.com / manager123 (Manager User)');
    console.log('- user1@accex.com / user123 (User One)');
    console.log('- user2@accex.com / user123 (User Two)');
});