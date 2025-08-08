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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
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
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Customers table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        address TEXT,
        gstin TEXT,
        boe TEXT,
        new_ton TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Shipments table
    db.run(`CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_type TEXT NOT NULL,
        shipment_subtype TEXT NOT NULL,
        asc TEXT,
        sh TEXT,
        ref TEXT,
        customer_id INTEGER,
        cbm REAL,
        odc TEXT,
        length REAL,
        breadth REAL,
        height REAL,
        packages INTEGER,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )`);

    // Invoices table
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT UNIQUE NOT NULL,
        shipment_id INTEGER,
        invoice_date TEXT,
        place_of_supply TEXT,
        gstin_recipient TEXT,
        state TEXT,
        state_code TEXT,
        total_amount_usd REAL,
        total_amount_inr REAL,
        fx_rate REAL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shipment_id) REFERENCES shipments (id)
    )`);

    // Invoice items table
    db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        description TEXT,
        uom TEXT,
        quantity REAL,
        rate REAL,
        currency TEXT,
        amount REAL,
        fx_rate REAL,
        amount_usd REAL,
        hsn_sac TEXT,
        igst_percent REAL,
        taxable_amount_usd REAL,
        taxable_amount_inr REAL,
        igst_usd REAL,
        igst_inr REAL,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    )`);

    // Insert default user
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (email, password, name) VALUES (?, ?, ?)`, 
        ['admin@123.com', defaultPassword, 'Administrator']);

    // Insert sample customers
    db.run(`INSERT OR IGNORE INTO customers (company_name, contact_person, address, gstin, boe, new_ton) VALUES 
        ('ABC Logistics Ltd', 'John Doe', '123 Business Park, Mumbai', '27AABCU9603R1ZN', 'BOE001', 'TON001'),
        ('XYZ Freight Services', 'Jane Smith', '456 Industrial Area, Delhi', '07AABFX1234M1Z5', 'BOE002', 'TON002'),
        ('Global Shipping Co', 'Mike Johnson', '789 Port Road, Chennai', '33AABGS5678N2Z9', 'BOE003', 'TON003'),
        ('Reliance Industries Ltd', 'Mukesh Ambani', 'Maker Chambers IV, Mumbai', '27AAACR5055K1ZK', 'BOE004', 'TON004'),
        ('Tata Consultancy Services', 'N Chandrasekaran', 'TCS House, Mumbai', '27AABCT3518Q1ZA', 'BOE005', 'TON005'),
        ('Infosys Limited', 'Salil Parekh', 'Electronics City, Bangalore', '29AAACI4741P1ZX', 'BOE006', 'TON006'),
        ('Wipro Limited', 'Thierry Delaporte', 'Doddakannelli, Bangalore', '29AAACW0764N1Z4', 'BOE007', 'TON007')`);

    // Insert sample shipment and invoice for demonstration
    db.run(`INSERT OR IGNORE INTO shipments (shipment_type, shipment_subtype, asc, sh, ref, customer_id, cbm, odc, length, breadth, height, packages, status) VALUES 
        ('Inbound', 'FC to FTWZ BOE', 'ASC001', 'SH001', 'REF001', 1, 10.5, 'Yes', 100, 80, 60, 5, 'completed')`);

    db.run(`INSERT OR IGNORE INTO invoices (invoice_no, shipment_id, invoice_date, place_of_supply, gstin_recipient, state, state_code, total_amount_usd, total_amount_inr, fx_rate, status) VALUES 
        ('GCL/23-24/0034', 1, '01/04/2024', 'Maharashtra', '27AABCU9603R1ZN', 'Maharashtra', '27', 5200.00, 431600.00, 83.00, 'finalized')`);

    db.run(`INSERT OR IGNORE INTO invoice_items (invoice_id, description, uom, quantity, rate, currency, amount, fx_rate, amount_usd, hsn_sac, igst_percent, taxable_amount_usd, taxable_amount_inr, igst_usd, igst_inr) VALUES 
        (1, 'Freight Forwarding Services', 'Shipment', 1, 5200.00, 'USD', 5200.00, 83.00, 5200.00, '996511', 18.00, 5200.00, 431600.00, 936.00, 77688.00)`);
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

// Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
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