# MySQL Workbench Setup Guide for ACCEX Shipment Database

## 🎯 **Overview**
This guide will help you set up MySQL Workbench to work with the ACCEX Shipment Management System database.

## 📋 **Prerequisites**

### 1. **Install MySQL Server**
- Download MySQL Server from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
- Install with default settings
- Remember your root password

### 2. **Install MySQL Workbench**
- Download MySQL Workbench from [MySQL Downloads](https://dev.mysql.com/downloads/workbench/)
- Install and launch MySQL Workbench

## 🚀 **Step-by-Step Setup**

### **Step 1: Create MySQL Connection**

1. **Open MySQL Workbench**
2. **Click the "+" icon** next to "MySQL Connections"
3. **Configure Connection:**
   ```
   Connection Name: ACCEX Shipment DB
   Hostname: localhost
   Port: 3306
   Username: root (or your MySQL username)
   Password: [Your MySQL password]
   ```
4. **Click "Test Connection"** to verify
5. **Click "OK"** to save

### **Step 2: Connect to MySQL Server**

1. **Double-click** on your new connection
2. **Enter your password** if prompted
3. **You should see the MySQL Workbench interface**

### **Step 3: Create Database**

1. **In the Query Editor**, type:
   ```sql
   CREATE DATABASE accex_shipment_db;
   USE accex_shipment_db;
   ```
2. **Click the lightning bolt icon** (Execute) or press `Ctrl+Shift+Enter`
3. **Verify** the database is created in the SCHEMAS panel

### **Step 4: Import SQL File**

#### **Method 1: Using Data Import (Recommended)**

1. **Go to Server menu** → **Data Import**
2. **Select "Import from Self-Contained File"**
3. **Browse and select** `accex_shipment_database.sql` ⭐ **Single SQL file for all databases**
4. **Select "Default Target Schema"**: `accex_shipment_db`
5. **Click "Start Import"**
6. **Wait for completion** and click "Close"

#### **Method 2: Using Query Editor**

1. **Open the SQL file** `accex_shipment_database.sql` in a text editor ⭐ **Single SQL file for all databases**
2. **Copy all content**
3. **In MySQL Workbench**, paste into Query Editor
4. **Click Execute** (lightning bolt icon)
5. **Wait for all statements to complete**

### **Step 5: Verify Import**

1. **Refresh the SCHEMAS panel** (right-click → Refresh All)
2. **Expand** `accex_shipment_db`
3. **Verify tables exist:**
   - ✅ users
   - ✅ customers
   - ✅ shipments
   - ✅ invoices
   - ✅ invoice_items

4. **Verify views exist:**
   - ✅ v_shipment_details
   - ✅ v_invoice_details
   - ✅ v_customer_search

5. **Check sample data:**
   ```sql
   SELECT COUNT(*) FROM customers;
   SELECT COUNT(*) FROM users;
   ```

## 🔧 **Database Configuration**

### **Update Application to Use MySQL**

If you want to use MySQL instead of SQLite, update your `server.js`:

```javascript
// Replace SQLite with MySQL
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'pass',
  database: 'accex_shipment_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});
```

### **Install MySQL Driver**
```bash
npm install mysql2
```

## 📊 **Sample Queries to Test**

### **1. Check All Customers**
```sql
SELECT * FROM customers WHERE is_active = 1 ORDER BY company_name;
```

### **2. Search Customers**
```sql
SELECT * FROM v_customer_search 
WHERE company_name LIKE '%RELIANCE%' OR gstin LIKE '%RELIANCE%'
LIMIT 5;
```

### **3. Check Shipment Statistics**
```sql
SELECT 
    shipment_type,
    COUNT(*) as total_shipments,
    SUM(cbm) as total_cbm
FROM shipments 
WHERE status != 'cancelled'
GROUP BY shipment_type;
```

### **4. Check Invoice Statistics**
```sql
SELECT 
    status,
    COUNT(*) as total_invoices,
    SUM(total_usd) as total_amount_usd
FROM invoices 
WHERE status != 'cancelled'
GROUP BY status;
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **1. Connection Failed**
- **Solution**: Check if MySQL service is running
- **Windows**: Services → MySQL80 → Start
- **Mac/Linux**: `sudo service mysql start`

#### **2. Access Denied**
- **Solution**: Reset MySQL root password
- **Command**: `mysql -u root -p`

#### **3. Import Errors**
- **Solution**: Check SQL file syntax
- **Alternative**: Use Query Editor method
- **Common Error**: "AUTOINCREMENT" syntax error
- **Fix**: The single SQL file is now MySQL compatible

#### **4. Database Not Found**
- **Solution**: Create database first
- **Command**: `CREATE DATABASE accex_shipment_db;`

#### **5. SQL Syntax Error (AUTOINCREMENT)**
- **Error**: `ERROR 1064 (42000): You have an error in your SQL syntax near 'AUTOINCREMENT'`
- **Cause**: Using old SQLite syntax in MySQL
- **Solution**: The single SQL file is now MySQL compatible with `AUTO_INCREMENT`
- **Difference**: SQLite uses `AUTOINCREMENT`, MySQL uses `AUTO_INCREMENT`

### **Useful Commands:**

```sql
-- Show all databases
SHOW DATABASES;

-- Use specific database
USE accex_shipment_db;

-- Show all tables
SHOW TABLES;

-- Show table structure
DESCRIBE customers;

-- Check database size
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'accex_shipment_db'
GROUP BY table_schema;
```

## 📁 **File Structure After Setup**

```
Shipment/
├── public/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   └── image.png
├── server.js
├── accex_shipment_database.sql          ← Single SQL file (MySQL compatible)
├── MYSQL_WORKBENCH_SETUP.md             ← This guide
├── package.json
├── .gitignore
└── README.md
```

## 🎯 **Next Steps**

1. **Import the SQL file** into MySQL Workbench
2. **Test the sample queries** above
3. **Update your application** to use MySQL (optional)
4. **Start developing** with the database

## 📞 **Support**

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify MySQL service is running
3. Ensure correct credentials
4. Check SQL file syntax

---

**✅ Success Indicators:**
- Database `accex_shipment_db` created
- All 5 tables imported successfully
- Sample data visible in tables
- Queries execute without errors

**🎉 You're ready to use MySQL Workbench with ACCEX Shipment Database!**
