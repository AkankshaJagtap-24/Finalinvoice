# ACCEX Supply Chain Solutions - Shipment & Invoice Management System

A professional, responsive web application for managing shipments and generating invoices seamlessly. Built with Node.js, Express, SQLite, and modern frontend technologies.

## Features

### 🔐 Authentication
- Secure login system with email and password
- Session-based authentication
- Default admin credentials provided

### 📊 Dashboard
- Overview of total shipments, invoices, and revenue
- Recent activity tracking
- Real-time statistics

### 📦 Shipment Management
- **Add Shipment** functionality with comprehensive form
- **Shipment Types**: Inbound and Outbound
- **Inbound Subtypes**: FC to FTWZ BOE, DTA to FTWZ
- **Outbound Subtypes**: FTWZ to DTA, FTWZ to FC, Intra SEZ
- Customer selection with auto-populated fields (GSTIN, BOE, New Ton)
- Dimensions tracking (Length, Breadth, Height, Packages)
- CBM and ODC management

### 🧾 Invoice Generation
- **Automatic draft invoice creation** upon shipment submission
- **Professional invoice layout** following Goldcrest Logistics format
- **Tax calculations** with IGST and currency conversion
- **Invoice finalization** process
- **Print-ready** invoice format

### 📋 Invoice Management
- View all invoices with filtering options
- Draft and finalized invoice status
- Detailed invoice preview in modal
- Invoice finalization workflow

### 🎨 User Interface
- **Modern, responsive design**
- **Professional color scheme**
- **Intuitive navigation** with sidebar
- **Toast notifications** for user feedback
- **Loading states** and error handling

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **moment.js** - Date handling

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with Flexbox and Grid
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Step 1: Clone or Download
```bash
# If using git
git clone <repository-url>
cd shipment-invoice-manager

# Or download and extract the files
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Step 4: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

### Step 5: Login
Use the default credentials:
- **Email**: admin@accexscs.com
- **Password**: admin123

## Database Structure

The application uses SQLite with the following tables:

### Users
- User authentication and management

### Customers
- Customer information (company name, contact, address, GSTIN, BOE, New Ton)

### Shipments
- Shipment details (type, subtype, dimensions, customer, etc.)

### Invoices
- Invoice headers (number, date, amounts, status)

### Invoice Items
- Line items with tax calculations and currency conversion

## Usage Guide

### 1. Dashboard
- View overview statistics
- Monitor recent activity
- Quick access to main functions

### 2. Adding a Shipment
1. Navigate to "Add Shipment"
2. Select shipment type (Inbound/Outbound)
3. Choose appropriate subtype
4. Fill in shipment details (ASC, SH, Ref)
5. Select customer from dropdown
6. Enter dimensions and other details
7. Submit to create shipment and generate draft invoice

### 3. Managing Invoices
1. Go to "View Invoices"
2. Filter by status (All/Draft/Finalized)
3. Click on invoice to view details
4. Review draft invoices
5. Finalize when ready
6. Print invoices as needed

### 4. Invoice Workflow
1. **Draft Creation**: Automatic when shipment is created
2. **Review**: View in modal with full details
3. **Finalization**: Convert draft to finalized invoice
4. **Print**: Generate print-ready version

## Invoice Format

The application generates professional invoices with:

### Header Section
- Company details (ACCEX Supply Chain Private Limited)
- Contact information and address
- "TAX INVOICE" title

### Invoice Details
- Invoice number and date
- Place of supply and recipient GSTIN
- State and state code

### Bill To / Ship To
- Customer information
- Contact person and address
- GSTIN details

### Service Details Table
- Line items with descriptions
- Quantities, rates, and amounts
- Currency conversion with FX rates

### Tax Summary
- HSN/SAC codes
- IGST calculations
- Taxable amounts in USD and INR

### Totals
- Total bill values in both currencies
- Final invoice amount

### Declaration & Signature
- Legal declaration
- Authorized signatory section

## Configuration

### Environment Variables
The application can be configured using environment variables:

```bash
PORT=3000                    # Server port (default: 3000)
SESSION_SECRET=your-secret   # Session secret key
```

### Database
The SQLite database (`shipment_invoice.db`) is automatically created on first run with:
- Default admin user
- Sample customers
- Sample shipment and invoice for demonstration

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID

### Shipments
- `GET /api/shipments` - Get all shipments
- `POST /api/shipments` - Create new shipment

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices/:id/finalize` - Finalize invoice

## Customization

### Adding New Shipment Types
1. Update the shipment type options in `script.js`
2. Modify the subtype logic in `handleShipmentTypeChange()`

### Modifying Invoice Layout
1. Edit the invoice template in `displayInvoiceModal()`
2. Update CSS styles in `styles.css`

### Adding New Fields
1. Update database schema in `server.js`
2. Modify form in `index.html`
3. Update API endpoints and frontend logic

## Security Features

- **Password hashing** with bcrypt
- **Session management** with express-session
- **Input validation** and sanitization
- **SQL injection protection** with parameterized queries
- **CSRF protection** (can be enhanced)

## Performance Optimizations

- **Static file serving** for CSS/JS
- **Database indexing** on frequently queried fields
- **Efficient queries** with JOINs
- **Client-side caching** for better UX

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in server.js or use different port
   PORT=3001 npm start
   ```

2. **Database errors**
   ```bash
   # Delete shipment_invoice.db and restart
   rm shipment_invoice.db
   npm start
   ```

3. **Dependencies issues**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs
Check the console output for error messages and debugging information.

## Future Enhancements

- PDF generation for invoices
- Email functionality
- Advanced reporting and analytics
- Multi-user roles and permissions
- API rate limiting
- Database backup functionality
- Mobile app development
- Integration with accounting software

## License

This project is licensed under the MIT License.

## Support

For support or questions, please refer to the documentation or create an issue in the repository.

---

**ACCEX Supply Chain Private Limited**  
181/3, Taluka Panvel, Sai Village, igad, Maharashtra - 410206  
Website: www.accexscs.com 