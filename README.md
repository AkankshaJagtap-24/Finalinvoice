# ACCEX Supply Chain Solutions - Shipment & Invoice Manager

A professional web application for managing shipments and generating invoices seamlessly. Built with Node.js, Express, SQLite, and modern web technologies.

## Features

- **Secure Authentication**: Login/signup system with session management
- **Shipment Management**: Create and manage inbound/outbound shipments
- **Invoice Generation**: Automatic invoice generation with tax calculations
- **Customer Management**: Search customers by company name or GSTIN with validation
- **Dashboard**: Real-time statistics and recent activity tracking
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: bcryptjs, express-session
- **Database**: SQLite with comprehensive schema
- **Styling**: Custom CSS with modern design

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Shipment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - Use the default credentials: `admin@123.com` / `admin`

## Database Setup

### Using the SQL File

The project includes a comprehensive SQL file (`accex_shipment_database.sql`) that contains:

- Complete database schema
- Sample data with real GSTIN numbers
- Indexes for performance optimization
- Views for common queries
- Triggers for data integrity
- Validation constraints

### MySQL Workbench Integration

#### Step 1: Install MySQL Workbench
1. Download MySQL Workbench from [MySQL Downloads](https://dev.mysql.com/downloads/workbench/)
2. Install and launch MySQL Workbench

#### Step 2: Create a New Connection
1. Click the "+" icon next to "MySQL Connections"
2. Configure the connection:
   - **Connection Name**: ACCEX Shipment DB
   - **Hostname**: localhost
   - **Port**: 3306
   - **Username**: your_mysql_username
   - **Password**: your_mysql_password
3. Click "Test Connection" to verify
4. Click "OK" to save

#### Step 3: Create Database
1. Connect to your MySQL server
2. Create a new database:
   ```sql
   CREATE DATABASE accex_shipment_db;
   USE accex_shipment_db;
   ```

#### Step 4: Import SQL File
1. Go to **Server** → **Data Import**
2. Select **Import from Self-Contained File**
3. Browse and select `accex_shipment_database.sql`
4. Select **Default Target Schema**: accex_shipment_db
5. Click **Start Import**

#### Step 5: Verify Import
1. Refresh the SCHEMAS panel
2. Expand `accex_shipment_db`
3. Verify all tables are created:
   - users
   - customers
   - shipments
   - invoices
   - invoice_items

### Alternative: SQLite Browser

For SQLite database management:

1. **Download SQLite Browser**: [DB Browser for SQLite](https://sqlitebrowser.org/)
2. **Open the database**: Open `shipment_invoice.db`
3. **Execute SQL**: Use the "Execute SQL" tab to run queries
4. **Import SQL file**: Copy and paste the contents of `accex_shipment_database.sql`

### Database Schema Overview

#### Tables Structure

**Users Table**
- Authentication and user management
- Role-based access control
- Session tracking

**Customers Table**
- Company information with GSTIN validation
- Contact details and addresses
- Soft delete functionality

**Shipments Table**
- Shipment tracking with validation
- Foreign key relationships
- Status management

**Invoices Table**
- Invoice management with calculations
- Tax calculations (IGST)
- Currency conversion

**Invoice Items Table**
- Line item details
- Rate calculations
- Tax breakdown

#### Views

- `v_shipment_details`: Shipment information with customer details
- `v_invoice_details`: Invoice information with customer and shipment details
- `v_customer_search`: Optimized view for customer search

#### Triggers

- Automatic timestamp updates
- Data validation
- Referential integrity

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `GET /api/auth/status` - Check authentication status
- `POST /api/logout` - User logout

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/search?query=...` - Search customers by name or GSTIN
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (soft delete)

### Shipments
- `GET /api/shipments` - Get all shipments
- `POST /api/shipments` - Create new shipment
- `GET /api/shipments/:id` - Get specific shipment

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get specific invoice
- `POST /api/invoices/:id/finalize` - Finalize draft invoice

## Enhanced Features

### Customer Management
- **Add New Customers**: Form with validation for GSTIN, email, phone
- **Search Functionality**: Search by company name or GSTIN number
- **Validation Rules**:
  - Company name: Required, minimum 2 characters
  - GSTIN: Valid Indian GSTIN format
  - Email: Valid email format
  - Phone: Valid phone number format
- **Soft Delete**: Customers with shipments cannot be deleted

### Bill-to Search
- Search customers by company name or GSTIN number
- Real-time dropdown suggestions
- Keyboard navigation support
- Auto-population of customer details

### Demo Mode
- Works without database connection for demonstration
- Hardcoded credentials: `admin@123.com` / `admin`
- Sample data for testing

## File Structure

```
Shipment/
├── public/
│   ├── index.html          # Main application page
│   ├── script.js           # Frontend JavaScript
│   ├── styles.css          # Application styles
│   ├── image.png           # Company logo
│   └── assets/             # Additional assets
├── server.js               # Express server
├── accex_shipment_database.sql  # Complete database schema
├── package.json            # Dependencies
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Database Queries

### Sample Queries for Reference

**Get all active customers**
```sql
SELECT * FROM customers WHERE is_active = 1 ORDER BY company_name;
```

**Search customers by company name or GSTIN**
```sql
SELECT * FROM v_customer_search 
WHERE company_name LIKE '%search_term%' OR gstin LIKE '%search_term%'
ORDER BY 
    CASE 
        WHEN company_name LIKE '%search_term%' THEN 1
        WHEN gstin LIKE '%search_term%' THEN 2
        ELSE 3
    END,
    company_name
LIMIT 10;
```

**Get shipment statistics**
```sql
SELECT 
    shipment_type,
    COUNT(*) as total_shipments,
    SUM(cbm) as total_cbm,
    AVG(cbm) as avg_cbm
FROM shipments 
WHERE status != 'cancelled'
GROUP BY shipment_type;
```

**Get invoice statistics**
```sql
SELECT 
    status,
    COUNT(*) as total_invoices,
    SUM(total_usd) as total_amount_usd,
    SUM(total_inr) as total_amount_inr
FROM invoices 
WHERE status != 'cancelled'
GROUP BY status;
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Reset
To reset the database with fresh data:
```bash
rm shipment_invoice.db
npm start
```

### Database Maintenance
```sql
-- Check database integrity
PRAGMA integrity_check;

-- Optimize database
VACUUM;

-- Analyze tables for better query performance
ANALYZE;
```

## Deployment

### Local Deployment
1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Access at: `http://localhost:3000`

### Production Deployment
1. Set environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for ACCEX Supply Chain Solutions.

## Support

For support and questions, please contact the development team.

---

**Default Login Credentials:**
- Email: `admin@123.com`
- Password: `admin`

**Note:** The application includes demo mode functionality that works without a database connection for demonstration purposes.

**Database File:** Use `accex_shipment_database.sql` for complete database setup with sample data and validation rules. 