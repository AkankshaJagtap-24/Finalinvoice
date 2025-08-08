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
    loginForm.addEventListener('submit', handleLogin);
    
    // Signup form
    signupForm.addEventListener('submit', handleSignup);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Shipment form
    shipmentForm.addEventListener('submit', handleShipmentSubmit);
    
    // Shipment type change
    shipmentType.addEventListener('change', handleShipmentTypeChange);
    
    // Customer selection
    customerSelect.addEventListener('change', handleCustomerChange);
    
    // Invoice filter
    invoiceFilter.addEventListener('change', handleInvoiceFilter);
    
    // Modal close
    closeInvoiceModal.addEventListener('click', closeModal);
    
    // Close modal on outside click
    invoiceModal.addEventListener('click', function(e) {
        if (e.target === invoiceModal) {
            closeModal();
        }
    });
}

// Authentication functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
        } else {
            showLoginPage();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
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
        await fetch('/api/logout', { method: 'POST' });
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
    // No need to load dashboard data for the simplified dashboard
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
    userName.textContent = currentUser.name;
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
    
    // Handle ODC field change
    document.getElementById('odc').addEventListener('change', function() {
        const dimensionFields = document.querySelectorAll('.dimension-field');
        if (this.value === 'No') {
            dimensionFields.forEach(field => field.classList.add('hidden'));
        } else {
            dimensionFields.forEach(field => field.classList.remove('hidden'));
        }
    });
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
    
    // Update customer details fields
    customerGstin.value = customer.gstin || '';
    customerBoe.value = customer.boe || '';
    customerNewTon.value = customer.new_ton || '';
}

function handleCustomerChange() {
    const customerId = customerSelect.value;
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
                <div class="invoice-date">${invoice.invoice_date}</div>
            </div>
            <div class="invoice-body">
                <div class="invoice-details">
                    <div class="invoice-detail">
                        <label>Customer</label>
                        <span>${invoice.company_name || 'N/A'}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Status</label>
                        <span>${invoice.status}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>FX Rate</label>
                        <span>${invoice.fx_rate}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Place of Supply</label>
                        <span>${invoice.place_of_supply}</span>
                    </div>
                </div>
                <div class="invoice-amount">
                    <div class="amount-label">Total Amount (USD)</div>
                    <div class="amount-value">$${parseFloat(invoice.total_amount_usd).toFixed(2)}</div>
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-sm btn-info" onclick="showInvoiceModal(${invoice.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${invoice.status === 'draft' ? `
                        <button class="btn btn-sm btn-success" onclick="finalizeInvoice(${invoice.id})">
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
            
            // Setup download PDF button for finalized invoices
            const downloadPdfBtn = document.querySelector('.btn-success[onclick="downloadInvoicePDF(' + invoiceId + ')"]');
            if (downloadPdfBtn && data.invoice.status === 'finalized') {
                downloadPdfBtn.style.display = 'inline-block';
            }
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
        <div class="invoice-print">
            <!-- Company Header -->
            <div class="invoice-header-print">
                <div class="company-name">ACCEX SUPPLY CHAIN PRIVATE LIMITED</div>
                <div class="company-address">181/3, Taluka Panvel, Sai Village, igad, Maharashtra - 410206</div>
                <div class="company-address">Website: www.accexscs.com</div>
                <div class="invoice-title">TAX INVOICE</div>
            </div>
            
            <!-- Invoice Details -->
            <div class="invoice-details-print">
                <div class="invoice-info">
                    <div class="invoice-info-row">
                        <span class="invoice-info-label">Invoice No.:</span>
                        <span>${invoice.invoice_no}</span>
                    </div>
                    <div class="invoice-info-row">
                        <span class="invoice-info-label">Invoice Date:</span>
                        <span>${invoice.invoice_date}</span>
                    </div>
                    <div class="invoice-info-row">
                        <span class="invoice-info-label">Place of Supply:</span>
                        <span>${invoice.place_of_supply}</span>
                    </div>
                </div>
                <div class="invoice-info">
                    <div class="invoice-info-row">
                        <span class="invoice-info-label">GSTIN of Recipient:</span>
                        <span>${invoice.gstin_recipient || 'N/A'}</span>
                    </div>
                    <div class="invoice-info-row">
                        <span class="invoice-info-label">State:</span>
                        <span>${invoice.state}</span>
                    </div>
                    <div class="invoice-info-row">
                        <span class="invoice-info-label">State Code:</span>
                        <span>${invoice.state_code}</span>
                    </div>
                </div>
            </div>
            
            <!-- Bill To Section -->
            <div class="bill-to-section">
                <h3>Bill To / Ship To</h3>
                <div class="bill-to-content">
                    <div class="bill-to-item">
                        <strong>Bill To Party:</strong>
                        <span>${invoice.company_name || 'N/A'}</span>
                        <span>${invoice.contact_person || ''}</span>
                        <span>${invoice.address || ''}</span>
                        <span>GSTIN: ${invoice.gstin || 'N/A'}</span>
                    </div>
                    <div class="bill-to-item">
                        <strong>Ship To Party:</strong>
                        <span>${invoice.company_name || 'N/A'}</span>
                        <span>${invoice.contact_person || ''}</span>
                        <span>${invoice.address || ''}</span>
                        <span>GSTIN: ${invoice.gstin || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Service Details Table -->
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Sl No</th>
                        <th>Description of Service</th>
                        <th>UOM</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Currency</th>
                        <th>Amount</th>
                        <th>FX Rate</th>
                        <th>Amount ($)</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.description}</td>
                            <td>${item.uom}</td>
                            <td>${item.quantity}</td>
                            <td>${parseFloat(item.rate).toFixed(2)}</td>
                            <td>${item.currency}</td>
                            <td>${parseFloat(item.amount).toFixed(2)}</td>
                            <td>${parseFloat(item.fx_rate).toFixed(2)}</td>
                            <td>$${parseFloat(item.amount_usd).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Tax Summary -->
            <div class="invoice-summary">
                <div class="tax-summary">
                    <h3>Tax Summary</h3>
                    <table class="tax-table">
                        <thead>
                            <tr>
                                <th>FX Rate</th>
                                <th>HSN/SAC</th>
                                <th>IGST %</th>
                                <th>Taxable ($)</th>
                                <th>Taxable (₹)</th>
                                <th>IGST ($)</th>
                                <th>IGST (₹)</th>
                                <th>Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${parseFloat(item.fx_rate).toFixed(2)}</td>
                                    <td>${item.hsn_sac}</td>
                                    <td>${parseFloat(item.igst_percent).toFixed(2)}%</td>
                                    <td>$${parseFloat(item.taxable_amount_usd).toFixed(2)}</td>
                                    <td>₹${parseFloat(item.taxable_amount_inr).toFixed(2)}</td>
                                    <td>$${parseFloat(item.igst_usd).toFixed(2)}</td>
                                    <td>₹${parseFloat(item.igst_inr).toFixed(2)}</td>
                                    <td>₹${(parseFloat(item.taxable_amount_inr) + parseFloat(item.igst_inr)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Totals -->
            <div class="total-section">
                <div class="total-row">
                    <span>Total Bill Value (USD):</span>
                    <span>$${parseFloat(invoice.total_amount_usd).toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Total Bill Value (INR):</span>
                    <span>₹${parseFloat(invoice.total_amount_inr).toFixed(2)}</span>
                </div>
                <div class="total-row total-final">
                    <span>Total Invoice Amount (INR):</span>
                    <span>₹${parseFloat(invoice.total_amount_inr).toFixed(2)}</span>
                </div>
            </div>
            
            <!-- Declaration -->
            <div class="declaration">
                <p><strong>Declaration:</strong> We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.</p>
            </div>
            
            <!-- Signature -->
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <span>Authorized Signatory</span>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <span>For ACCEX Supply Chain Private Limited</span>
                </div>
            </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px; text-align: center;">
            ${invoice.status === 'draft' ? `
                <button class="btn btn-primary" onclick="finalizeInvoice(${invoice.id})">
                    <i class="fas fa-check"></i> Finalize Invoice
                </button>
            ` : `
                <button class="btn btn-success" onclick="downloadInvoicePDF(${invoice.id})">
                    <i class="fas fa-file-pdf"></i> Download PDF
                </button>
            `}
            <button class="btn btn-secondary" onclick="window.print()">
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
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 30px;
                    border: 1px solid #e2e8f0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                }
                th {
                    background-color: #f7fafc;
                    font-weight: 600;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .company-details, .invoice-details {
                    margin-bottom: 20px;
                }
                .total-section {
                    margin-top: 30px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                }
                .total-final {
                    font-weight: bold;
                    font-size: 1.1em;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                .signature-section {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                }
                .signature-line {
                    width: 200px;
                    border-top: 1px solid #000;
                    margin-bottom: 5px;
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
    totalShipments.textContent = shipments.length;
    totalInvoices.textContent = invoices.length;
    
    const totalRevenueUSD = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount_usd || 0), 0);
    totalRevenue.textContent = `$${totalRevenueUSD.toFixed(2)}`;
    
    const pendingCount = invoices.filter(invoice => invoice.status === 'draft').length;
    pendingInvoices.textContent = pendingCount;
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const recentItems = [];
    
    // Add recent shipments
    const recentShipments = shipments.slice(0, 3);
    recentShipments.forEach(shipment => {
        recentItems.push({
            icon: 'fas fa-ship',
            text: `New shipment created: ${shipment.shipment_type} - ${shipment.shipment_subtype}`
        });
    });
    
    // Add recent invoices
    const recentInvoices = invoices.slice(0, 3);
    recentInvoices.forEach(invoice => {
        recentItems.push({
            icon: 'fas fa-file-invoice',
            text: `Invoice ${invoice.invoice_no} ${invoice.status === 'finalized' ? 'finalized' : 'created'}`
        });
    });
    
    // Sort by date and take latest 5
    recentItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    const displayItems = recentItems.slice(0, 5);
    
    if (displayItems.length === 0) {
        recentActivity.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <span>No recent activity</span>
            </div>
        `;
    } else {
        recentActivity.innerHTML = displayItems.map(item => `
            <div class="activity-item">
                <i class="${item.icon}"></i>
                <span>${item.text}</span>
            </div>
        `).join('');
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
        <div class="toast-header">
            <span class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
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
        }
        .modal-actions {
            display: none !important;
        }
    }
`;

// Add print styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = printStyles;
document.head.appendChild(styleSheet);