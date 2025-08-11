# ACCEX Supply Chain Solutions - Shipment & Invoice Manager

A professional web application for managing shipments and generating invoices seamlessly. Built with Node.js, Express, SQLite, and modern web technologies.

## Features

- **Secure Authentication**: Login/signup system with session management
- **Shipment Management**: Create and manage inbound/outbound shipments
- **Invoice Generation**: Automatic invoice generation with tax calculations
- **Customer Management**: Search customers by company name or GSTIN
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

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User authentication and profiles
- **customers**: Customer information with GSTIN, BOE, etc.
- **shipments**: Shipment details and tracking
- **invoices**: Invoice headers and metadata
- **invoice_items**: Individual line items with calculations

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

### Shipments
- `GET /api/shipments` - Get all shipments
- `POST /api/shipments` - Create new shipment
- `GET /api/shipments/:id` - Get specific shipment

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get specific invoice
- `POST /api/invoices/:id/finalize` - Finalize draft invoice

## Enhanced Features

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
├── database_schema.sql     # Database schema
├── package.json            # Dependencies
├── .gitignore             # Git ignore rules
└── README.md              # This file
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