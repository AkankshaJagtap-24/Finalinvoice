# ACCEX Shipment & Invoice Management System
## Visual Database Schema Documentation

---

## 📊 **DATABASE: `accex_shipment_db`**

### 🔗 **Table Relationships Overview**
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    USERS    │◄─────►│  SHIPMENTS  │◄─────►│  CUSTOMERS  │
│             │       │             │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
       │                       │                     │
       │                       ▼                     │
       │              ┌─────────────┐                │
       └─────────────►│   INVOICES  │◄───────────────┘
                      │             │
                      └─────────────┘
                              │
                              ▼
                     ┌─────────────┐
                     │INVOICE_ITEMS│
                     │             │
                     └─────────────┘
```

---

## 🗂️ **TABLE STRUCTURES**

### **1. USERS TABLE**
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | `int` | NO | PRI | `auto_increment` | Primary Key |
| `name` | `varchar(255)` | NO | | | User full name |
| `email` | `varchar(255)` | NO | UNI | | Unique email address |
| `password` | `varchar(255)` | NO | | | Bcrypt hashed password |
| `role` | `enum('admin','user','manager')` | NO | | `user` | User access level |
| `is_active` | `tinyint(1)` | NO | | `1` | Account status |
| `last_login` | `datetime` | YES | | `NULL` | Last login timestamp |
| `created_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | Record creation |
| `updated_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | AUTO UPDATE |

**🔑 Constraints:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`email`)
- NOT NULL: `name`, `email`, `password`

---

### **2. CUSTOMERS TABLE**
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | `int` | NO | PRI | `auto_increment` | Primary Key |
| `company_name` | `varchar(255)` | NO | | | Company legal name |
| `gstin` | `varchar(15)` | YES | UNI | `NULL` | GST Identification Number |
| `boe` | `varchar(50)` | YES | | `NULL` | Bill of Entry reference |
| `new_ton` | `varchar(50)` | YES | | `NULL` | New TON reference |
| `address` | `text` | YES | | `NULL` | Complete address |
| `contact_person` | `varchar(255)` | YES | | `NULL` | Primary contact name |
| `phone` | `varchar(20)` | YES | | `NULL` | Contact number |
| `email` | `varchar(255)` | YES | | `NULL` | Company email |
| `state_code` | `varchar(10)` | YES | | `NULL` | State code for GST |
| `state_name` | `varchar(100)` | YES | | `NULL` | State name |
| `country` | `varchar(100)` | NO | | `India` | Country name |
| `is_active` | `tinyint(1)` | NO | | `1` | Customer status |
| `created_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | Record creation |
| `updated_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | AUTO UPDATE |

**🔑 Constraints:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`gstin`)
- NOT NULL: `company_name`

---

### **3. SHIPMENTS TABLE**
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | `int` | NO | PRI | `auto_increment` | Primary Key |
| `shipment_type` | `enum('Inbound','Outbound')` | NO | | | Direction of shipment |
| `shipment_subtype` | `varchar(100)` | NO | | | Type of shipment (FC to FTWZ, DTA to FTWZ, Temp removal, Inter SEZ, Intra, FTWZ To FC, FTWZ To DTA) |
| `asc_number` | `varchar(100)` | YES | | `NULL` | ASC reference number |
| `sh_number` | `varchar(100)` | YES | | `NULL` | Shipment number |
| `ref_number` | `varchar(100)` | YES | | `NULL` | Customer reference |
| `customer_id` | `int` | NO | FK | | Customer foreign key |
| `cbm` | `decimal(10,2)` | NO | | | Cubic meter volume |
| `odc` | `enum('Yes','No')` | NO | | `No` | Over Dimensional Cargo |
| `length` | `decimal(10,2)` | YES | | `NULL` | Length in meters |
| `breadth` | `decimal(10,2)` | YES | | `NULL` | Breadth in meters |
| `height` | `decimal(10,2)` | YES | | `NULL` | Height in meters |
| `packages` | `int` | YES | | `NULL` | Number of packages |
| `weight` | `decimal(10,2)` | YES | | `NULL` | Weight in tons |
| `cargo_type` | `enum('Fixed assets','Chemicals','Spares')` | NO | | | Type of cargo being shipped |
| `haz_selection` | `enum('Yes','No')` | NO | | `No` | Hazardous cargo selection |
| `old_new_selection` | `enum('Old','New')` | NO | | `New` | Old or new cargo selection |
| `status` | `enum('draft','in_progress','completed','cancelled')` | NO | | `draft` | Shipment status |
| `notes` | `text` | YES | | `NULL` | Additional notes |
| `created_by` | `int` | NO | FK | | User who created |
| `created_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | Record creation |
| `updated_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | AUTO UPDATE |

**🔑 Constraints:**
- PRIMARY KEY (`id`)
- FOREIGN KEY (`customer_id`) → `customers(id)`
- FOREIGN KEY (`created_by`) → `users(id)`
- NOT NULL: `shipment_type`, `shipment_subtype`, `customer_id`, `cbm`, `cargo_type`, `haz_selection`, `old_new_selection`, `created_by`

---

### **4. INVOICES TABLE**
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | `int` | NO | PRI | `auto_increment` | Primary Key |
| `invoice_number` | `varchar(50)` | NO | UNI | | Unique invoice number |
| `shipment_id` | `int` | NO | FK | | Shipment reference |
| `customer_id` | `int` | NO | FK | | Customer reference |
| `invoice_date` | `date` | NO | | | Invoice issue date |
| `due_date` | `date` | NO | | | Payment due date |
| `place_of_supply` | `varchar(255)` | NO | | | GST place of supply |
| `gstin_recipient` | `varchar(15)` | YES | | `NULL` | Recipient GSTIN |
| `state` | `varchar(100)` | NO | | | State name |
| `state_code` | `varchar(10)` | NO | | | State code for GST |
| `po_reference` | `varchar(100)` | YES | | `NULL` | Purchase order ref |
| `slb_reference` | `varchar(100)` | YES | | `NULL` | SLB reference number |
| `reverse_charge` | `enum('Yes','No')` | NO | | `No` | Reverse charge applicable |
| `subtotal_usd` | `decimal(15,2)` | NO | | `0.00` | Subtotal in USD |
| `subtotal_inr` | `decimal(15,2)` | NO | | `0.00` | Subtotal in INR |
| `igst_amount_usd` | `decimal(15,2)` | NO | | `0.00` | IGST amount in USD |
| `igst_amount_inr` | `decimal(15,2)` | NO | | `0.00` | IGST amount in INR |
| `total_usd` | `decimal(15,2)` | NO | | `0.00` | Total amount in USD |
| `total_inr` | `decimal(15,2)` | NO | | `0.00` | Total amount in INR |
| `fx_rate` | `decimal(10,2)` | NO | | `81.90` | Foreign exchange rate |
| `status` | `enum('draft','finalized','cancelled')` | NO | | `draft` | Invoice status |
| `notes` | `text` | YES | | `NULL` | Additional notes |
| `created_by` | `int` | NO | FK | | User who created |
| `created_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | Record creation |
| `updated_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | AUTO UPDATE |

**🔑 Constraints:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`invoice_number`)
- FOREIGN KEY (`shipment_id`) → `shipments(id)`
- FOREIGN KEY (`customer_id`) → `customers(id)`
- FOREIGN KEY (`created_by`) → `users(id)`
- NOT NULL: `invoice_number`, `shipment_id`, `customer_id`, `invoice_date`, `due_date`, `place_of_supply`, `state`, `state_code`, `created_by`

---

### **5. INVOICE_ITEMS TABLE**
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | `int` | NO | PRI | `auto_increment` | Primary Key |
| `invoice_id` | `int` | NO | FK | | Invoice reference |
| `description` | `text` | NO | | | Service/item description |
| `uom` | `varchar(50)` | NO | | | Unit of measurement |
| `quantity` | `decimal(10,2)` | NO | | | Quantity/hours |
| `rate` | `decimal(15,2)` | NO | | | Rate per unit |
| `currency` | `enum('USD','INR')` | NO | | | Rate currency |
| `fx_rate` | `decimal(10,2)` | NO | | `81.90` | FX rate used |
| `amount_usd` | `decimal(15,2)` | NO | | `0.00` | Line amount in USD |
| `amount_inr` | `decimal(15,2)` | NO | | `0.00` | Line amount in INR |
| `hsn_sac` | `varchar(20)` | YES | | `NULL` | HSN/SAC code |
| `igst_percent` | `decimal(5,2)` | NO | | `18.00` | IGST percentage |
| `igst_amount_usd` | `decimal(15,2)` | NO | | `0.00` | IGST in USD |
| `igst_amount_inr` | `decimal(15,2)` | NO | | `0.00` | IGST in INR |
| `created_at` | `timestamp` | NO | | `CURRENT_TIMESTAMP` | Record creation |

**🔑 Constraints:**
- PRIMARY KEY (`id`)
- FOREIGN KEY (`invoice_id`) → `invoices(id)` ON DELETE CASCADE
- NOT NULL: `invoice_id`, `description`, `uom`, `quantity`, `rate`, `currency`

---

## 🔐 **STORED PROCEDURES**

### **Available Upsert Procedures:**
- `sp_upsert_customer()` - Insert/Update customer records
- `sp_upsert_shipment()` - Insert/Update shipment records  
- `sp_upsert_invoice()` - Insert/Update invoice records
- `sp_upsert_invoice_item()` - Insert/Update invoice item records

---

## 📈 **INDEXES & PERFORMANCE**

### **Primary Indexes:**
- All tables have `AUTO_INCREMENT` primary keys
- Unique constraints on critical fields (email, GSTIN, invoice_number)
- Foreign key indexes for relationship optimization

### **Search Optimization:**
- Customer search by company name and GSTIN
- Invoice filtering by status and date ranges
- Shipment tracking by reference numbers

---

## 🔄 **DATA FLOW**

### **Typical Workflow:**
```
1. Customer Record Created/Updated
   ↓
2. Shipment Created (links to Customer + User)
   ↓
3. Invoice Auto-Generated (links to Shipment + Customer)
   ↓
4. Invoice Items Created (service line items)
   ↓
5. Invoice Finalized (status: draft → finalized)
```

---

## 💰 **BUSINESS FEATURES**

### **GST Compliance:**
- IGST calculations (18% default)
- State-wise GST handling
- GSTIN validation and tracking
- HSN/SAC code support

### **Multi-Currency:**
- USD/INR dual currency support
- Configurable FX rates
- Automatic currency conversion
- Real-time amount calculations

### **Audit Trail:**
- Complete user tracking (`created_by`)
- Timestamp tracking (`created_at`, `updated_at`)
- Status workflow management
- Change history preservation

---

*This visual schema documentation provides a comprehensive view of the ACCEX database structure, similar to MySQL Workbench's table view but specifically tailored for business presentation and technical reference.*
