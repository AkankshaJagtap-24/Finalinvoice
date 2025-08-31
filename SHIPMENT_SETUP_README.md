# Shipment Setup Page

## Overview
The Shipment Setup page provides a comprehensive interface for configuring shipment parameters based on the SLB billing structure requirements from Chennai and Mumbai operations.

## Features

### 1. Warehouse / Location Selection
- **Chennai FTWZ** - Chennai Free Trade Warehousing Zone
- **Mumbai FTWZ** - Mumbai Free Trade Warehousing Zone

### 2. Shipment Type Configuration
Comprehensive shipment type options including:
- **LCL (SEA)** - Less than Container Load via Sea
- **LCL (AIR)** - Less than Container Load via Air
- **FCL – TEU (20ft)** - Full Container Load 20ft
- **FCL – FEU (40ft)** - Full Container Load 40ft
- **Road (per vehicle)** - Road transportation per vehicle
- **Loose Cargo (<30kg)** - Small packages under 30kg
- **Pallet (>30kg)** - Palletized cargo over 30kg
- **ODC Cargo** - Over Dimensional Cargo with special handling
- **Chemicals – Dangerous Goods (DG)** - Hazardous chemical shipments
- **Chemicals – Non-DG** - Non-hazardous chemical shipments
- **New Fixed Asset (FA)** - New equipment and machinery
- **Machinery & Spares (M&S)** - Machinery parts and spares
- **Old & Used** - Second-hand equipment and machinery

### 3. Service / Activity Type Selection
Primary and additional services including:
- **Customs Clearance** - Inbound/Outbound customs processing
- **SEZ Operations** - Intra SEZ unit transfers
- **Certification** - CE certification services
- **Documentation** - BOE documentation per shipment
- **Container Operations** - Scanning, stuffing, de-stuffing
- **Transportation** - Port to FTWZ movements
- **Local Distribution** - Arshiya routes in Mumbai
- **Handling Services** - Loading, unloading, pallet handling
- **Specialized Equipment** - MHE, roller gang operations
- **Storage Services** - Various storage options and conditions
- **Additional Charges** - LR, detention, gate-in charges

### 4. Route Configuration (Conditional)
Routes are shown based on selected services:

#### Chennai Routes:
- FC → FTWZ
- DTA → FTWZ
- FTWZ → DTA
- FTWZ → FC
- SEZ ↔ FTWZ
- Chennai Port → FTWZ
- FTWZ → Chennai Port

#### Mumbai Routes:
- Arshiya → JNPT / Nhava Sheva
- Arshiya → Panvel
- Arshiya → Nerul / Mhape
- Arshiya → Barmer
- Arshiya → Ahmedabad / Mehsana
- Arshiya → Kakinada
- Arshiya → Visakhapatnam SEZ

### 5. Vehicle / Equipment Selection (Conditional)
Equipment options shown based on shipment type:
- **Trailers**: 20ft, 40ft, Low Bed
- **Cranes**: 12MT, 14MT
- **Forklifts**: 3MT, 5MT Hydra
- **Specialized**: Roller Gang

### 6. Additional Details
- Quantity and weight specifications
- Dimensions (Length × Width × Height)
- Special handling instructions

## Smart Form Behavior

### Conditional Field Display
- **Route Section**: Automatically appears when transportation-related services are selected
- **Equipment Section**: Shows when shipment types require specific equipment

### Validation
- Required field validation for essential parameters
- Conditional validation based on service selections
- Form submission with comprehensive data collection

## Technical Implementation

### File Structure
- `public/shipment-setup.html` - Main shipment setup page
- Integrated with existing navigation system
- Responsive design for mobile and desktop

### Navigation Integration
- Added to main sidebar navigation
- Accessible from dashboard via "Shipment Setup" menu item
- Opens in new tab for detailed configuration

### Styling
- Modern, responsive design
- Consistent with existing application theme
- Professional color scheme and typography
- Interactive hover effects and transitions

## Usage

1. **Access**: Navigate to "Shipment Setup" from the main dashboard
2. **Configure**: Select warehouse, shipment type, and services
3. **Customize**: Add routes and equipment as needed
4. **Submit**: Complete the form to create shipment configuration

## Future Enhancements

- Integration with backend API for data persistence
- Real-time pricing calculations
- Document upload capabilities
- Multi-language support
- Advanced validation rules
- Integration with existing invoice system

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile devices
- Progressive enhancement for older browsers
