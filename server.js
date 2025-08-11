const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
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
app.use(session({
    secret: 'shipment-invoice-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Database setup
const db = new sqlite3.Database('shipment_invoice.db');

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Customers table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Shipments table
    db.run(`CREATE TABLE IF NOT EXISTS shipments (
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
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Invoices table
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
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
        FOREIGN KEY (shipment_id) REFERENCES shipments(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Invoice items table
    db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
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
    )`);

    // Insert default user
    const hashedPassword = bcrypt.hashSync('admin', 10);
    db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 
        ['Admin User', 'admin@123.com', hashedPassword, 'admin']);

    // Insert sample customers
    const sampleCustomers = [
        ['Acme Corporation', '27AABCU9603R1ZN', 'BOE001234', 'NT001', '123 Business Street, New York, NY 10001, United States', 'John Smith', '+1-555-0123', 'john@acme.com', '27', 'Maharashtra'],
        ['Tech Solutions Ltd', '27AATSL7890K2ZM', 'BOE005678', 'NT002', '456 Tech Avenue, San Francisco, CA 94105, United States', 'Sarah Johnson', '+1-555-0456', 'sarah@techsolutions.com', '27', 'Maharashtra'],
        ['Global Inc', '27AAGIN4567L3ZN', 'BOE009012', 'NT003', '789 Global Plaza, London, EC1A 1BB, United Kingdom', 'Michael Brown', '+44-20-1234-5678', 'michael@globalinc.com', '27', 'Maharashtra'],
        ['ABC Logistics', '27AAABL1234M4ZO', 'BOE013456', 'NT004', '321 Logistics Way, Mumbai, Maharashtra 400001', 'Priya Patel', '+91-22-1234-5678', 'priya@abclogistics.com', '27', 'Maharashtra'],
        ['XYZ Manufacturing', '27AAXYZ5678N5ZP', 'BOE017890', 'NT005', '654 Factory Road, Pune, Maharashtra 411001', 'Rajesh Kumar', '+91-20-1234-5678', 'rajesh@xyzmanufacturing.com', '27', 'Maharashtra']
    ];

    sampleCustomers.forEach(customer => {
        db.run(`INSERT OR IGNORE INTO customers (company_name, gstin, boe, new_ton, address, contact_person, phone, email, state_code, state_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, customer);
    });

    console.log('Default user: admin@123.com / admin');
});

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
        
        // Demo login - check against hardcoded credentials
        if (email === 'admin@123.com' && password === 'admin') {
            req.session.userId = 1;
            req.session.userEmail = email;
            req.session.userName = 'Admin User';
            
            return res.json({ 
                success: true, 
                user: { 
                    id: 1, 
                    email: email, 
                    name: 'Admin User' 
                } 
            });
        }
        
        // If not demo credentials, try database
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            req.session.userId = user.id;
            req.session.userEmail = user.email;
            req.session.userName = user.name;
            
            return res.json({ 
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
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Hash password and create new user
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create user' });
            }
            
            // Auto-login the new user
            req.session.userId = this.lastID;
            req.session.userEmail = email;
            req.session.userName = name;
            
            res.json({ 
                success: true, 
                user: { 
                    id: this.lastID, 
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

// Get customers API
app.get('/api/customers', requireAuth, (req, res) => {
    db.all('SELECT * FROM customers ORDER BY company_name', (err, customers) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(customers);
    });
});

// Enhanced customer search by company name or GSTIN
app.get('/api/customers/search', requireAuth, (req, res) => {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
        return res.json([]);
    }
    
    const searchTerm = `%${query.trim()}%`;
    
    // Search by both company name and GSTIN
    const sql = `
        SELECT * FROM customers 
        WHERE company_name LIKE ? OR gstin LIKE ? 
        ORDER BY 
            CASE 
                WHEN company_name LIKE ? THEN 1
                WHEN gstin LIKE ? THEN 2
                ELSE 3
            END,
            company_name
        LIMIT 10
    `;
    
    db.all(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, customers) => {
        if (err) {
            console.error('Search error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(customers);
    });
});

// Enhanced customer search API
app.get('/api/customers/search', requireAuth, (req, res) => {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
        return res.json([]);
    }
    
    const searchQuery = query.trim();
    const isGSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(searchQuery);
    
    let sql, params;
    
    if (isGSTIN) {
        // Search by GSTIN
        sql = `SELECT * FROM customers WHERE gstin LIKE ? ORDER BY company_name LIMIT 10`;
        params = [`%${searchQuery}%`];
    } else {
        // Search by company name
        sql = `SELECT * FROM customers WHERE company_name LIKE ? OR contact_person LIKE ? ORDER BY company_name LIMIT 10`;
        params = [`%${searchQuery}%`, `%${searchQuery}%`];
    }
    
    db.all(sql, params, (err, customers) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Add search type indicator to each result
        const results = customers.map(customer => ({
            ...customer,
            searchType: isGSTIN ? 'gstin' : 'company'
        }));
        
        res.json(results);
    });
});

// Get customer by ID API
app.get('/api/customers/:id', requireAuth, (req, res) => {
    db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    });
});

// Create shipment API
app.post('/api/shipments', requireAuth, (req, res) => {
    const {
        shipment_type, shipment_subtype, asc, sh, ref, customer_id,
        cbm, odc, length, breadth, height, packages
    } = req.body;

    const sql = `INSERT INTO shipments (
        shipment_type, shipment_subtype, asc, sh, ref, customer_id,
        cbm, odc, length, breadth, height, packages
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
        shipment_type, shipment_subtype, asc, sh, ref, customer_id,
        cbm, odc, length, breadth, height, packages
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Generate draft invoice
        const invoiceNo = `GCL/23-24/${String(this.lastID).padStart(4, '0')}`;
        const invoiceDate = moment().format('DD/MM/YYYY');
        const fxRate = 83.00; // Default FX rate
        
        // Default values for invoice calculations
        const baseAmountUSD = 0;
        const baseAmountINR = 0;
        
        // Create default invoice items based on shipment type
        const invoiceItems = [
            {
                description: 'Outbound Handling',
                uom: 'BOE',
                quantity: 1.00,
                rate: 81.90,
                currency: 'INR',
                amount: 81.90,
                fx_rate: fxRate,
                amount_usd: 81.90 / fxRate,
                hsn_sac: '996729',
                igst_percent: 18.00,
                taxable_amount_usd: 0,
                taxable_amount_inr: 81.90,
                igst_usd: 0,
                igst_inr: 81.90 * 0.18
            },
            {
                description: 'Transportation',
                uom: 'BOE',
                quantity: 1.00,
                rate: 1.00,
                currency: 'USD',
                amount: 1.00,
                fx_rate: fxRate,
                amount_usd: 1.00,
                hsn_sac: '996729',
                igst_percent: 18.00,
                taxable_amount_usd: 1.00,
                taxable_amount_inr: 1.00 * fxRate,
                igst_usd: 1.00 * 0.18,
                igst_inr: 1.00 * fxRate * 0.18
            }
        ];
        
        // Calculate totals based on the formula provided by client
        let totalAmountUSD = 0;
        let totalAmountINR = 0;
        let totalIgstUSD = 0;
        let totalIgstINR = 0;
        
        invoiceItems.forEach(item => {
            // Line Total in INR (if currency is INR)
            if (item.currency === 'INR') {
                totalAmountINR += item.amount;
            } 
            // Line Total in USD (if currency is USD)
            else if (item.currency === 'USD') {
                totalAmountUSD += item.amount;
                // Convert USD to INR using FX Rate
                totalAmountINR += item.amount * item.fx_rate;
            }
            
            // Add IGST amounts
            totalIgstUSD += item.igst_usd;
            totalIgstINR += item.igst_inr;
        });
        
        // Grand Total (Including IGST)
        const grandTotalINR = totalAmountINR + totalIgstINR;
        const grandTotalUSD = totalAmountUSD + totalIgstUSD;
        
        db.run(`INSERT INTO invoices (
            invoice_no, shipment_id, invoice_date, place_of_supply, 
            gstin_recipient, state, state_code, total_amount_usd, 
            total_amount_inr, fx_rate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            invoiceNo, this.lastID, invoiceDate, 'Maharashtra',
            '', 'Maharashtra', '27', grandTotalUSD, grandTotalINR, fxRate, 'draft'
        ], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Invoice creation failed' });
            }
            
            // Create invoice item
            const igstPercent = 18.0;
            const igstUSD = baseAmountUSD * (igstPercent / 100);
            const igstINR = igstUSD * fxRate;
            
            db.run(`INSERT INTO invoice_items (
                invoice_id, description, uom, quantity, rate, currency,
                amount, fx_rate, amount_usd, hsn_sac, igst_percent,
                taxable_amount_usd, taxable_amount_inr, igst_usd, igst_inr
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                this.lastID, 'Freight Forwarding Services', 'Shipment', 1,
                baseAmountUSD, 'USD', baseAmountUSD, fxRate, baseAmountUSD,
                '996511', igstPercent, baseAmountUSD, baseAmountINR, igstUSD, igstINR
            ], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Invoice item creation failed' });
                }
                
                const invoiceId = this.lastID;
                
                // Insert invoice items into the database
                const insertItemStmt = db.prepare(`INSERT INTO invoice_items (
                    invoice_id, description, uom, quantity, rate, currency, 
                    amount, fx_rate, amount_usd, hsn_sac, igst_percent, 
                    taxable_amount_usd, taxable_amount_inr, igst_usd, igst_inr
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                
                invoiceItems.forEach(item => {
                    insertItemStmt.run([
                        invoiceId, item.description, item.uom, item.quantity, item.rate, 
                        item.currency, item.amount, item.fx_rate, item.amount_usd, 
                        item.hsn_sac, item.igst_percent, item.taxable_amount_usd, 
                        item.taxable_amount_inr, item.igst_usd, item.igst_inr
                    ]);
                });
                
                insertItemStmt.finalize();
                
                res.json({ 
                    success: true, 
                    shipmentId: this.lastID,
                    invoiceId: invoiceId,
                    message: 'Shipment created and draft invoice generated'
                });
            });
        });
    });
});

// Get shipments API
app.get('/api/shipments', requireAuth, (req, res) => {
    const sql = `
        SELECT s.*, c.company_name, c.gstin, c.boe, c.new_ton
        FROM shipments s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.created_at DESC
    `;
    
    db.all(sql, (err, shipments) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(shipments);
    });
});

// Get invoices API
app.get('/api/invoices', requireAuth, (req, res) => {
    const sql = `
        SELECT i.*, s.shipment_type, s.shipment_subtype, c.company_name
        FROM invoices i
        LEFT JOIN shipments s ON i.shipment_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY i.created_at DESC
    `;
    
    db.all(sql, (err, invoices) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(invoices);
    });
});

// Get invoice details API
app.get('/api/invoices/:id', requireAuth, (req, res) => {
    const invoiceId = req.params.id;
    
    // Get invoice header
    db.get(`SELECT i.*, s.shipment_type, s.shipment_subtype, c.*
            FROM invoices i
            LEFT JOIN shipments s ON i.shipment_id = s.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE i.id = ?`, [invoiceId], (err, invoice) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        // Get invoice items
        db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId], (err, items) => {
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

// Finalize invoice API
app.post('/api/invoices/:id/finalize', requireAuth, (req, res) => {
    const invoiceId = req.params.id;
    
    db.run('UPDATE invoices SET status = ? WHERE id = ?', ['finalized', invoiceId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        res.json({ success: true, message: 'Invoice finalized successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Default login: admin@123.com / admin123');
});