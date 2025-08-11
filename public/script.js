// Global variables
let currentUser = null;
let customers = [];
let shipments = [];
let invoices = [];

// DOM elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');
const userName = document.getElementById('userName');
const loadingSpinner = document.getElementById('loadingSpinner');

// Page elements
const dashboardPage = document.getElementById('dashboardPage');
const addShipmentPage = document.getElementById('addShipmentPage');
const viewInvoicesPage = document.getElementById('viewInvoicesPage');

// Form elements
const shipmentForm = document.getElementById('shipmentForm');
const shipmentType = document.getElementById('shipmentType');
const shipmentSubtype = document.getElementById('shipmentSubtype');
const customerSelect = document.getElementById('customerSelect');
const customerDetails = document.getElementById('customerDetails');
const customerGstin = document.getElementById('customerGstin');
const customerBoe = document.getElementById('customerBoe');
const customerNewTon = document.getElementById('customerNewTon');

// Invoice elements
const invoicesList = document.getElementById('invoicesList');
const invoiceFilter = document.getElementById('invoiceFilter');
const invoiceModal = document.getElementById('invoiceModal');
const invoiceModalBody = document.getElementById('invoiceModalBody');
const closeInvoiceModal = document.getElementById('closeInvoiceModal');

// Dashboard elements
const totalShipments = document.getElementById('totalShipments');
const totalInvoices = document.getElementById('totalInvoices');
const totalRevenue = document.getElementById('totalRevenue');
const pendingInvoices = document.getElementById('pendingInvoices');
const recentActivity = document.getElementById('recentActivity');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Event listeners
    setupEventListeners();
    
    // Load initial data
    if (currentUser) {
        loadDashboardData();
    }
}

function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Signup and Login buttons
    const signupButtons = document.querySelectorAll('.signup-btn');
    signupButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (loginForm.classList.contains('hidden')) {
                showLoginForm();
            } else {
                showSignupForm();
            }
        });
    });
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('expanded');
        });
    }
    
    // Shipment form
    if (shipmentForm) {
        shipmentForm.addEventListener('submit', handleShipmentSubmit);
    }
    
    // Shipment type change
    if (shipmentType) {
        shipmentType.addEventListener('change', handleShipmentTypeChange);
    }
    
    // ODC field change
    const odcField = document.getElementById('odc');
    if (odcField) {
        odcField.addEventListener('change', function() {
            const dimensionFields = document.querySelectorAll('.dimension-field');
            if (this.value === 'No') {
                dimensionFields.forEach(field => field.classList.add('hidden'));
            } else {
                dimensionFields.forEach(field => field.classList.remove('hidden'));
            }
        });
    }
    
    // Customer selection
    if (customerSelect) {
        customerSelect.addEventListener('change', handleCustomerChange);
    }
    
    // Invoice filter
    if (invoiceFilter) {
        invoiceFilter.addEventListener('change', handleInvoiceFilter);
    }
    
    // Modal close
    if (closeInvoiceModal) {
        closeInvoiceModal.addEventListener('click', closeModal);
    }
    
    // Close modal on outside click
    if (invoiceModal) {
        invoiceModal.addEventListener('click', function(e) {
            if (e.target === invoiceModal) {
                closeModal();
            }
        });
    }
}

// Authentication functions
async function checkAuthStatus() {
    // Demo mode - check if user is stored in localStorage
    const storedUser = localStorage.getItem('demoUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showDashboard();
    } else {
        showLoginPage();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    
    showLoading();
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast('Login successful!', 'success');
            showDashboard();
            loadDashboardData();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(signupForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    // Validate password length
    if (password.length < 4) {
        showToast('Password must be at least 4 characters long', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast(data.message || 'Account created successfully!', 'success');
            showDashboard();
            loadDashboardData();
        } else {
            showToast(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Signup failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function showSignupForm() {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
}

function showLoginForm() {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
}

async function handleLogout() {
    try {
        await fetch('/api/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        currentUser = null;
        showLoginPage();
        showToast('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Navigation functions
function handleNavigation(e) {
    const page = e.currentTarget.dataset.page;
    
    if (page) {
        navItems.forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        switch (page) {
            case 'dashboard':
                showDashboardPage();
                break;
            case 'addShipment':
                showAddShipmentPage();
                break;
            case 'viewInvoices':
                showViewInvoicesPage();
                break;
        }
    }
}

function showDashboardPage() {
    hideAllPages();
    dashboardPage.classList.remove('hidden');
    pageTitle.textContent = 'Dashboard';
    loadDashboardData();
}

function showAddShipmentPage() {
    hideAllPages();
    addShipmentPage.classList.remove('hidden');
    pageTitle.textContent = 'Add Shipment';
    loadCustomers();
}

function showViewInvoicesPage() {
    hideAllPages();
    viewInvoicesPage.classList.remove('hidden');
    pageTitle.textContent = 'View Invoices';
    loadInvoices();
}

function hideAllPages() {
    dashboardPage.classList.add('hidden');
    addShipmentPage.classList.add('hidden');
    viewInvoicesPage.classList.add('hidden');
}

function showDashboard() {
    loginPage.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userName.textContent = currentUser ? currentUser.name : 'User';
    showDashboardPage();
}

function showLoginPage() {
    dashboard.classList.add('hidden');
    loginPage.classList.remove('hidden');
}

// Shipment form functions
function handleShipmentTypeChange() {
    const type = shipmentType.value;
    const subtypeSelect = shipmentSubtype;
    
    // Clear and disable subtype
    subtypeSelect.innerHTML = '<option value="">Select Shipment Type First</option>';
    subtypeSelect.disabled = true;
    
    if (type) {
        subtypeSelect.disabled = false;
        
        if (type === 'Inbound') {
            subtypeSelect.innerHTML = `
                <option value="">Select Subtype</option>
                <option value="FC to FTWZ BOE">FC to FTWZ BOE</option>
                <option value="DTA to FTWZ">DTA to FTWZ</option>
            `;
        } else if (type === 'Outbound') {
            subtypeSelect.innerHTML = `
                <option value="">Select Subtype</option>
                <option value="FTWZ to DTA">FTWZ to DTA</option>
                <option value="FTWZ to FC">FTWZ to FC</option>
                <option value="Intra SEZ">Intra SEZ</option>
            `;
        }
    }
}

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        if (response.ok) {
            customers = await response.json();
            populateCustomerSelect();
            setupGstinSearch();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showToast('Failed to load customers', 'error');
    }
}

function populateCustomerSelect() {
    customerSelect.innerHTML = '<option value="">Select Customer</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.company_name;
        customerSelect.appendChild(option);
    });
}

function setupGstinSearch() {
    const gstinSearch = document.getElementById('gstinSearch');
    const gstinSearchResults = document.getElementById('gstinSearchResults');
    
    if (!gstinSearch || !gstinSearchResults) return;
    
    gstinSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm.length < 2) {
            gstinSearchResults.classList.remove('show');
            return;
        }
        
        const filteredCustomers = customers.filter(customer => 
            customer.company_name.toLowerCase().includes(searchTerm) || 
            (customer.gstin && customer.gstin.toLowerCase().includes(searchTerm))
        );
        
        if (filteredCustomers.length > 0) {
            gstinSearchResults.innerHTML = '';
            filteredCustomers.forEach(customer => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <div class="company-name">${customer.company_name}</div>
                    <div class="company-gstin">${customer.gstin || 'No GSTIN'}</div>
                `;
                resultItem.addEventListener('click', () => {
                    selectCustomerFromSearch(customer);
                    gstinSearchResults.classList.remove('show');
                    gstinSearch.value = '';
                });
                gstinSearchResults.appendChild(resultItem);
            });
            gstinSearchResults.classList.add('show');
        } else {
            gstinSearchResults.innerHTML = '<div class="search-result-item">No matching companies found</div>';
            gstinSearchResults.classList.add('show');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!gstinSearch.contains(e.target) && !gstinSearchResults.contains(e.target)) {
            gstinSearchResults.classList.remove('show');
        }
    });
}

function selectCustomerFromSearch(customer) {
    // Update customer select dropdown
    customerSelect.value = customer.id;
    
    // Show customer details section
    customerDetails.classList.remove('hidden');
    
    // Update customer details fields
    customerGstin.value = customer.gstin || '';
    customerBoe.value = customer.boe || '';
    customerNewTon.value = customer.new_ton || '';
}

function handleCustomerChange() {
    const customerId = customerSelect.value;
    
    if (customerId) {
        // Show customer details section
        customerDetails.classList.remove('hidden');
        
        const customer = customers.find(c => c.id == customerId);
        
        if (customer) {
            customerGstin.value = customer.gstin || '';
            customerBoe.value = customer.boe || '';
            customerNewTon.value = customer.new_ton || '';
        } else {
            customerGstin.value = '';
            customerBoe.value = '';
            customerNewTon.value = '';
        }
    } else {
        // Hide customer details section
        customerDetails.classList.add('hidden');
    }
}

async function handleShipmentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(shipmentForm);
    const shipmentData = {
        shipment_type: formData.get('shipmentType'),
        shipment_subtype: formData.get('shipmentSubtype'),
        asc: formData.get('asc'),
        sh: formData.get('sh'),
        ref: formData.get('ref'),
        customer_id: formData.get('customer_id'),
        cbm: parseFloat(formData.get('cbm')),
        odc: formData.get('odc'),
        length: parseFloat(formData.get('length')) || null,
        breadth: parseFloat(formData.get('breadth')) || null,
        height: parseFloat(formData.get('height')) || null,
        packages: parseInt(formData.get('packages')) || null
    };
    
    showLoading();
    
    try {
        const response = await fetch('/api/shipments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipmentData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Shipment created and draft invoice generated successfully!', 'success');
            shipmentForm.reset();
            customerDetails.classList.add('hidden');
            handleShipmentTypeChange();
            
            // Add to recent activity
            addRecentActivity('created', `New shipment created: ${shipmentData.shipment_type} - ${shipmentData.shipment_subtype}`);
            
            // Show the generated invoice
            if (data.invoiceId) {
                showInvoiceModal(data.invoiceId);
            }
        } else {
            showToast(data.error || 'Failed to create shipment', 'error');
        }
    } catch (error) {
        console.error('Shipment creation error:', error);
        showToast('Failed to create shipment. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Invoice functions
async function loadInvoices() {
    try {
        const response = await fetch('/api/invoices');
        if (response.ok) {
            invoices = await response.json();
            displayInvoices();
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
        showToast('Failed to load invoices', 'error');
    }
}

function displayInvoices() {
    const filter = invoiceFilter.value;
    let filteredInvoices = invoices;
    
    if (filter !== 'all') {
        filteredInvoices = invoices.filter(invoice => invoice.status === filter);
    }
    
    if (filteredInvoices.length === 0) {
        invoicesList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-file-invoice"></i>
                <p>No invoices found</p>
            </div>
        `;
        return;
    }
    
    invoicesList.innerHTML = filteredInvoices.map(invoice => `
        <div class="invoice-card">
            <div class="invoice-header">
                <div class="invoice-number">${invoice.invoice_no}</div>
                <div class="invoice-status ${invoice.status}">${invoice.status}</div>
            </div>
            <div class="invoice-body">
                <div class="invoice-details">
                    <div class="invoice-detail">
                        <label>Customer</label>
                        <span>${invoice.company_name || 'N/A'}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Date</label>
                        <span>${invoice.invoice_date}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>FX Rate</label>
                        <span>${invoice.fx_rate}</span>
                    </div>
                </div>
                <div class="invoice-amount">
                    <div class="amount-label">Total Amount</div>
                    <div class="amount-value">$${parseFloat(invoice.total_amount_usd).toFixed(2)}</div>
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-primary" onclick="showInvoiceModal(${invoice.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${invoice.status === 'draft' ? `
                        <button class="btn btn-success" onclick="finalizeInvoice(${invoice.id})">
                            <i class="fas fa-check"></i> Finalize
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function handleInvoiceFilter() {
    displayInvoices();
}

async function showInvoiceModal(invoiceId) {
    showLoading();
    
    try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        if (response.ok) {
            const data = await response.json();
            displayInvoiceModal(data);
            invoiceModal.classList.add('show');
        } else {
            showToast('Failed to load invoice details', 'error');
        }
    } catch (error) {
        console.error('Error loading invoice:', error);
        showToast('Failed to load invoice details', 'error');
    } finally {
        hideLoading();
    }
}

function displayInvoiceModal(data) {
    const { invoice, items } = data;
    
    invoiceModalBody.innerHTML = `
        <div class="invoice-container">
            <div class="invoice-print">
                <!-- Company Header with Logo -->
                <div class="invoice-header-print">
                    <div class="header-left">
                        <img src="/images/accex-logo.png" alt="ACCEX Logo" class="company-logo-img">
                    </div>
                    <div class="header-right">
                        <div class="company-name">ACCEX SUPPLY CHAIN PRIVATE LIMITED</div>
                        <div class="company-details-row">FLAT NO.07 FOURTH FLOOR, SHRI MANGAL COMPLEX</div>
                        <div class="company-details-row">1887/2, Taluka Parvati, Sai Village</div>
                        <div class="company-details-row">Pimpri, Maharashtra - 411058</div>
                        
                        <div class="company-details-table">
                            <div class="details-row">
                                <div class="details-label">PAN:</div>
                                <div class="details-value">AAGCX9774J</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">GSTIN:</div>
                                <div class="details-value">27AAGCX9774J2ZA</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">CIN:</div>
                                <div class="details-value">U63090MH2017PTC290994</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">IEC Certificate No.:</div>
                                <div class="details-value">AAGCX9774J</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">MSME (Udyam Registration No.):</div>
                                <div class="details-value">UDYAM-MH-33-0142947</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="invoice-title">TAX INVOICE</div>
            
                <!-- Customer and Invoice Details -->
                <div class="invoice-details-section">
                    <div class="customer-details">
                        <div class="section-title">Customer Details:</div>
                        <div class="details-row">
                            <div class="details-label">Bill to:</div>
                            <div class="details-value">${invoice.company_name || 'DHARMASHAKTI ASIA SERVICES LIMITED'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Address:</div>
                            <div class="details-value">${invoice.address || 'FLAT NO. 1, BUILDING NO. 1, PRIME RESIDENCY ROAD, HIDC VASHI, NAVI MUMBAI - 400705 INDIA'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">GSTIN:</div>
                            <div class="details-value">${invoice.gstin || '27AABCD1234E1ZB'}</div>
                        </div>
                    </div>
                    <div class="invoice-details">
                        <div class="section-title">Invoice Details:</div>
                        <div class="details-row">
                            <div class="details-label">Invoice No.:</div>
                            <div class="details-value">${invoice.invoice_no || 'ACC22Q4M22C274'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Invoice Date:</div>
                            <div class="details-value">${invoice.invoice_date || '01-Nov-2023'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">PO Number:</div>
                            <div class="details-value">${invoice.po_number || 'PO-123456'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Place of Supply:</div>
                            <div class="details-value">${invoice.place_of_supply || 'Maharashtra'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">State Code:</div>
                            <div class="details-value">${invoice.state_code || '27'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Reverse Charge:</div>
                            <div class="details-value">${invoice.reverse_charge || 'No'}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">E-Reference #:</div>
                            <div class="details-value">${invoice.e_reference || 'E-00291NEW'}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Service Details Table -->
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Description of Services</th>
                            <th>UOM</th>
                            <th>QUANTITY</th>
                            <th>RATE</th>
                            <th>CUR</th>
                            <th>AMOUNT</th>
                            <th>FX RATE</th>
                            <th>AMOUNT (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Warehousing & Logistics Services<br>AWB - 99672P</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td>AMC 221</td>
                            <td>BOE #</td>
                            <td>2058415</td>
                            <td>-</td>
                            <td>INR</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td>Agency Charges</td>
                            <td>BOE</td>
                            <td>1.00</td>
                            <td>-</td>
                            <td>INR</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td>Outbound Handling at FTWZ</td>
                            <td>PKG</td>
                            <td>2.00</td>
                            <td>-</td>
                            <td>USD</td>
                            <td>-</td>
                            <td>-</td>
                            <td>1.00</td>
                        </tr>
                        <tr>
                            <td>Transportation Charges</td>
                            <td>VEH</td>
                            <td>1.00</td>
                            <td>-</td>
                            <td>INR</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td>Documentation Charges</td>
                            <td>DOC</td>
                            <td>1.00</td>
                            <td>-</td>
                            <td>INR</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td>CFS Certificate</td>
                            <td>BOE</td>
                            <td>1.00</td>
                            <td>-</td>
                            <td>INR</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td>Misc. Handling & Reporting</td>
                            <td>BOE</td>
                            <td>1.00</td>
                            <td>-</td>
                            <td>INR</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td>Bank Charges - OOC</td>
                            <td>BOE</td>
                            <td>1.00</td>
                            <td>-</td>
                            <td>INR</td>
                            <td>-</td>
                            <td>-</td>
                            <td>81.90</td>
                        </tr>
                        <tr>
                            <td colspan="7" class="text-right">* Over Dimension Cargo (ODC)</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td colspan="7" class="text-right">Packing List (DOC)</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td colspan="7" class="text-right">GST on Int'l</td>
                            <td>0.00</td>
                        </tr>
                        <tr>
                            <td colspan="7" class="text-right">GST on Int'l</td>
                            <td>0.00</td>
                        </tr>
                        <tr>
                            <td colspan="7" class="text-right">TOTAL</td>
                            <td>0.00 USD</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="gst-note">* All Rates are being considered without GST</div>
                
                <div class="total-value-section">
                    <div>Total Bill Value (USD)</div>
                    <div>INR${parseFloat(invoice.total_amount_inr || 0).toFixed(2)}</div>
                </div>
                
                <div class="tax-summary-section">
                    <table class="tax-table">
                        <thead>
                            <tr>
                                <th>FX Rate</th>
                                <th>HSN / SAC</th>
                                <th>IGST %</th>
                                <th>Taxable (₹)</th>
                                <th>Taxable ($)</th>
                                <th>IGST (₹)</th>
                                <th>IGST ($)</th>
                                <th>Total (₹)</th>
                                <th>Total ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>81.90</td>
                                <td>996729</td>
                                <td>18.00%</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr class="total-row">
                                <td>TOTAL</td>
                                <td></td>
                                <td></td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="invoice-footer">
                    <div class="declaration">
                        <p>In words of Zero rupees only / custom please do not treat it as paid until 3 days of receipt of this invoice to your account and keep billing of invoice submitted for your account and keep billing.</p>
                    </div>
                    
                    <div class="bank-details">
                        <div class="section-title">Our Bank Details for payment:</div>
                        <div class="bank-info">
                            <div class="bank-row">
                                <div class="bank-label">Bank:</div>
                                <div class="bank-value">ICICI Bank</div>
                            </div>
                            <div class="bank-row">
                                <div class="bank-label">Branch:</div>
                                <div class="bank-value">Andheri</div>
                            </div>
                            <div class="bank-row">
                                <div class="bank-label">A/c No.:</div>
                                <div class="bank-value">000000000000</div>
                            </div>
                            <div class="bank-row">
                                <div class="bank-label">Account Name:</div>
                                <div class="bank-value">ACCEX SUPPLY CHAIN PRIVATE LIMITED</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <div>Authorized Signature</div>
                        </div>
                    </div>
                    
                    <div class="registered-office">
                        Registered Office: 503, First Floor, Satellite Plaza, Saki Vihar Road, Powai, Mumbai - 400072
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal-actions">
            ${invoice.status === 'draft' ? `
                <button class="btn btn-success" onclick="finalizeInvoice(${invoice.id})">
                    <i class="fas fa-check"></i> Finalize Invoice
                </button>
            ` : `
                <button class="btn btn-primary" onclick="downloadInvoicePDF(${invoice.id})">
                    <i class="fas fa-file-pdf"></i> Download PDF
                </button>
            `}
            <button class="btn btn-secondary" onclick="printInvoice()">
                <i class="fas fa-print"></i> Print Invoice
            </button>
        </div>
    `;
}

function downloadInvoicePDF(invoiceId) {
    // Get the invoice modal content
    const invoiceContent = document.querySelector('.invoice-container');
    
    // Create a new window for the PDF
    const printWindow = window.open('', '_blank');
    
    // Add necessary styles for PDF
    printWindow.document.write(`
        <html>
        <head>
            <title>Invoice PDF</title>
            <style>
                @page {
                    size: A4;
                    margin: 0;
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: white;
                    font-size: 12px;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    background-color: white;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                    border: 1px solid #000;
                }
                th {
                    background-color: #f7fafc;
                    font-weight: 600;
                    text-align: center;
                }
                .invoice-header-print {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    border: 2px solid #000;
                    padding: 10px;
                }
                .header-left {
                    width: 100px;
                }
                .company-logo-img {
                    max-width: 100px;
                    height: auto;
                }
                .header-right {
                    flex: 1;
                    padding-left: 20px;
                }
                .company-name {
                    font-size: 16px;
                    font-weight: 700;
                    color: #000;
                    margin-bottom: 5px;
                }
                .company-details-row {
                    font-size: 12px;
                    margin-bottom: 3px;
                }
                .company-details-table {
                    display: grid;
                    grid-template-columns: auto auto;
                    gap: 5px;
                    margin-top: 5px;
                }
                .details-row {
                    display: flex;
                    margin-bottom: 3px;
                }
                .details-label {
                    font-weight: 600;
                    min-width: 120px;
                    padding-right: 10px;
                }
                .details-value {
                    flex: 1;
                }
                .invoice-title {
                    text-align: center;
                    font-size: 16px;
                    font-weight: 700;
                    margin: 20px 0;
                    text-transform: uppercase;
                }
                .invoice-details-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    border: 1px solid #000;
                    padding: 10px;
                }
                .customer-details, .invoice-details {
                    flex: 1;
                }
                .section-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .invoice-table th, .invoice-table td {
                    border: 1px solid #000;
                    padding: 5px;
                    font-size: 11px;
                }
                .invoice-table th {
                    background-color: #f0f0f0;
                    text-align: center;
                }
                .text-right {
                    text-align: right;
                    font-weight: bold;
                }
                .gst-note {
                    font-size: 10px;
                    margin: 5px 0;
                    text-align: right;
                    font-style: italic;
                }
                .total-value-section {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    font-weight: bold;
                    border: 1px solid #000;
                    padding: 5px 10px;
                }
                .tax-summary-section {
                    margin: 20px 0;
                }
                .tax-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .tax-table th, .tax-table td {
                    border: 1px solid #000;
                    padding: 5px;
                    text-align: center;
                    font-size: 11px;
                }
                .tax-table .total-row {
                    font-weight: bold;
                }
                .invoice-footer {
                    margin-top: 20px;
                }
                .declaration {
                    font-size: 10px;
                    margin: 10px 0;
                }
                .bank-details {
                    border: 1px solid #000;
                    padding: 10px;
                    margin: 10px 0;
                }
                .bank-info {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 5px;
                }
                .bank-row {
                    display: flex;
                }
                .bank-label {
                    font-weight: 600;
                    min-width: 80px;
                }
                .signature-section {
                    margin-top: 30px;
                    display: flex;
                    justify-content: flex-end;
                }
                .signature-box {
                    text-align: center;
                }
                .signature-line {
                    width: 200px;
                    border-top: 1px solid #000;
                    margin-bottom: 5px;
                }
                .registered-office {
                    font-size: 9px;
                    text-align: center;
                    margin-top: 20px;
                }
                .modal-actions {
                    display: none;
                }
                @media print {
                    body * {
                        visibility: visible;
                    }
                    .modal-actions, .modal-header, .modal-close {
                        display: none !important;
                    }
                    .invoice-container {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0;
                    }
                    .invoice-print {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${invoiceContent.outerHTML}
        </body>
        </html>
    `);
    
    // Print and close the window after loading
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
        // printWindow.close(); // Uncomment to auto-close after print dialog
    };
}

async function finalizeInvoice(invoiceId) {
    if (!confirm('Are you sure you want to finalize this invoice? This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`/api/invoices/${invoiceId}/finalize`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Invoice finalized successfully!', 'success');
            closeModal();
            loadInvoices();
            loadDashboardData();
            
            // Add to recent activity
            addRecentActivity('finalized', `Invoice ${data.invoice_no} finalized`);
        } else {
            showToast(data.error || 'Failed to finalize invoice', 'error');
        }
    } catch (error) {
        console.error('Error finalizing invoice:', error);
        showToast('Failed to finalize invoice', 'error');
    } finally {
        hideLoading();
    }
}

function closeModal() {
    invoiceModal.classList.remove('show');
}

// Function to print the current invoice
function printInvoice() {
    // Apply print-specific styles
    document.body.classList.add('printing');
    
    // Print the document
    window.print();
    
    // Remove print-specific styles after printing
    setTimeout(() => {
        document.body.classList.remove('printing');
    }, 1000);
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const [shipmentsResponse, invoicesResponse] = await Promise.all([
            fetch('/api/shipments'),
            fetch('/api/invoices')
        ]);
        
        if (shipmentsResponse.ok && invoicesResponse.ok) {
            shipments = await shipmentsResponse.json();
            invoices = await invoicesResponse.json();
            updateDashboardStats();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats() {
    // Check if elements exist before updating them
    if (totalShipments) totalShipments.textContent = shipments.length;
    if (totalInvoices) totalInvoices.textContent = invoices.length;
    
    const totalRevenueUSD = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount_usd || 0), 0);
    if (totalRevenue) totalRevenue.textContent = `$${totalRevenueUSD.toFixed(2)}`;
    
    const pendingCount = invoices.filter(invoice => invoice.status === 'draft').length;
    if (pendingInvoices) pendingInvoices.textContent = pendingCount;
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    // Check if recentActivity element exists
    if (!recentActivity) return;
    
    const recentItems = [];
    
    // Add recent shipments
    const recentShipments = shipments.slice(0, 3);
    recentShipments.forEach(shipment => {
        recentItems.push({
            icon: 'created',
            text: `New shipment created: ${shipment.shipment_type} - ${shipment.shipment_subtype}`,
            time: 'Today'
        });
    });
    
    // Add recent invoices
    const recentInvoices = invoices.slice(0, 3);
    recentInvoices.forEach(invoice => {
        recentItems.push({
            icon: invoice.status === 'finalized' ? 'finalized' : 'created',
            text: `Invoice ${invoice.invoice_no} ${invoice.status === 'finalized' ? 'finalized' : 'created'}`,
            time: 'Today'
        });
    });
    
    // Sort by date and take latest 5
    const displayItems = recentItems.slice(0, 5);
    
    if (displayItems.length === 0) {
        recentActivity.innerHTML = `
            <li class="activity-item">
                <div class="activity-icon info">
                    <i class="fas fa-info"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">No recent activity</div>
                    <div class="activity-time">Just now</div>
                </div>
            </li>
        `;
    } else {
        recentActivity.innerHTML = displayItems.map(item => `
            <li class="activity-item">
                <div class="activity-icon ${item.icon}">
                    <i class="fas ${getIconClass(item.icon)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${item.text}</div>
                    <div class="activity-time">${item.time}</div>
                </div>
            </li>
        `).join('');
    }
}

function getIconClass(type) {
    switch(type) {
        case 'created': return 'fa-plus';
        case 'finalized': return 'fa-check';
        case 'info': return 'fa-info';
        default: return 'fa-circle';
    }
}

function addRecentActivity(type, text) {
    if (!recentActivity) return;
    
    const newItem = document.createElement('li');
    newItem.className = 'activity-item';
    newItem.innerHTML = `
        <div class="activity-icon ${type}">
            <i class="fas ${getIconClass(type)}"></i>
        </div>
        <div class="activity-content">
            <div class="activity-text">${text}</div>
            <div class="activity-time">Just now</div>
        </div>
    `;
    
    // Add to the beginning of the list
    recentActivity.insertBefore(newItem, recentActivity.firstChild);
    
    // Remove excess items
    while (recentActivity.children.length > 5) {
        recentActivity.removeChild(recentActivity.lastChild);
    }
}

// Utility functions
function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${getToastIcon(type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${capitalizeFirstLetter(type)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': 
        default: return 'fa-info-circle';
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Print styles for invoice
const printStyles = `
    @media print {
        body * {
            visibility: hidden;
        }
        .invoice-print, .invoice-print * {
            visibility: visible;
        }
        .invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
        }
        .modal-actions, .modal-header, .modal-close {
            display: none !important;
        }
        .invoice-container {
            border: none !important;
            box-shadow: none !important;
        }
    }
    
    body.printing * {
        visibility: hidden;
    }
    
    body.printing .invoice-print, 
    body.printing .invoice-print * {
        visibility: visible;
    }
    
    body.printing .invoice-print {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
    }
    
    body.printing .modal-actions, 
    body.printing .modal-header, 
    body.printing .modal-close {
        display: none !important;
    }
    
    body.printing .invoice-container {
        border: none !important;
        box-shadow: none !important;
    }
`;

// Add print styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = printStyles;
document.head.appendChild(styleSheet);

// Make functions available globally
window.showInvoiceModal = showInvoiceModal;
window.finalizeInvoice = finalizeInvoice;
window.downloadInvoicePDF = downloadInvoicePDF;
window.printInvoice = printInvoice;