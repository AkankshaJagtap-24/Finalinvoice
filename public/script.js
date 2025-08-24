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
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });
    }
    
    // Shipment form event listeners
    if (shipmentForm) {
        shipmentForm.addEventListener('submit', handleShipmentSubmit);
        
        // Shipment type change
        const shipmentTypeSelect = document.getElementById('shipment_type');
        if (shipmentTypeSelect) {
            shipmentTypeSelect.addEventListener('change', handleShipmentTypeChange);
        }
        
        // Clear validation on input
        const formInputs = shipmentForm.querySelectorAll('input, select');
        formInputs.forEach(input => {
            input.addEventListener('input', function() {
                clearFieldValidation(this.id);
            });
            
            input.addEventListener('change', function() {
                clearFieldValidation(this.id);
            });
        });
        
        // Test dropdown button
        const testDropdownBtn = document.getElementById('testDropdown');
        if (testDropdownBtn) {
            testDropdownBtn.addEventListener('click', function() {
                console.log('Test dropdown button clicked!');
                const billToSearchResults = document.getElementById('billToSearchResults');
                if (billToSearchResults) {
                    billToSearchResults.classList.remove('hidden');
                    billToSearchResults.innerHTML = `
                        <div class="search-result-item">
                            <div class="company-name">TEST CUSTOMER 1</div>
                            <div class="company-gstin">TEST GSTIN 1</div>
                        </div>
                        <div class="search-result-item">
                            <div class="company-name">TEST CUSTOMER 2</div>
                            <div class="company-gstin">TEST GSTIN 2</div>
                        </div>
                    `;
                    console.log('Test dropdown shown!');
                } else {
                    console.error('billToSearchResults element not found!');
                }
            });
        }
        
        // Test search button
        const testSearchBtn = document.getElementById('testSearch');
        if (testSearchBtn) {
            testSearchBtn.addEventListener('click', function() {
                console.log('Test search button clicked!');
                // Manually trigger a search for "RELIANCE"
                fetch('/api/customers/search?query=RELIANCE')
                    .then(response => {
                        console.log('Test search response status:', response.status);
                        return response.json();
                    })
                    .then(customers => {
                        console.log('Test search found customers:', customers);
                        showCustomerDropdown(customers, 'RELIANCE');
                    })
                    .catch(error => {
                        console.error('Test search error:', error);
                    });
            });
        }
        
        // ODC field change handler
        const odcField = document.getElementById('odc');
        if (odcField) {
            odcField.addEventListener('change', function() {
                const dimensionFields = document.querySelectorAll('.dimension-field');
                if (this.value === 'No') {
                    dimensionFields.forEach(field => {
                        field.classList.add('hidden');
                        // Clear the values when hiding
                        const input = field.querySelector('input');
                        if (input) {
                            input.value = '';
                        }
                    });
                } else {
                    dimensionFields.forEach(field => {
                        field.classList.remove('hidden');
                    });
                }
            });
        }
    }
    
    // Invoice filter
    if (invoiceFilter) {
        invoiceFilter.addEventListener('change', handleInvoiceFilter);
    }
    
    // Close invoice modal
    if (closeInvoiceModal) {
        closeInvoiceModal.addEventListener('click', function() {
            invoiceModal.classList.remove('show');
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === invoiceModal) {
            invoiceModal.classList.remove('show');
        }
    });
}

// Function to clear validation for a specific field
function clearFieldValidation(fieldName) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    // Remove error styling
    field.classList.remove('input-error');
    
    // Remove validation message
    const validationMessage = field.parentNode.querySelector('.validation-message');
    if (validationMessage) {
        validationMessage.remove();
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
        
        if (response.ok && data.success) {
            currentUser = data.user;
            // Store user in localStorage for persistence
            localStorage.setItem('demoUser', JSON.stringify(currentUser));
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
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        // Clear localStorage regardless of API response
        localStorage.removeItem('demoUser');
        currentUser = null;
        showLoginPage();
        showToast('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear localStorage and show login page even if API fails
        localStorage.removeItem('demoUser');
        currentUser = null;
        showLoginPage();
        showToast('Logged out successfully', 'info');
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
    const type = document.getElementById('shipment_type').value;
    const subtypeSelect = document.getElementById('shipment_subtype');
    
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
            console.log('Loaded customers:', customers);
            populateCustomerSelect();
            setupBillToSearch();
            
            // Test customer search immediately
            testCustomerSearch();
            
            // Test dropdown visibility
            testDropdownVisibility();
            
            // Test if elements exist
            testElementsExist();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showToast('Failed to load customers', 'error');
    }
}

// Test function to verify customer search API
async function testCustomerSearch() {
    console.log('Testing customer search API...');
    try {
        const response = await fetch('/api/customers/search?query=RELIANCE');
        console.log('Test API response status:', response.status);
        
        if (response.ok) {
            const customers = await response.json();
            console.log('Test API found customers:', customers);
        } else {
            console.error('Test API failed with status:', response.status);
        }
    } catch (error) {
        console.error('Test API error:', error);
    }
}

// Test function to check dropdown visibility
function testDropdownVisibility() {
    const billToSearch = document.getElementById('billToSearch');
    const billToSearchResults = document.getElementById('billToSearchResults');
    
    console.log('=== DROPDOWN TEST ===');
    console.log('billToSearch element:', billToSearch);
    console.log('billToSearchResults element:', billToSearchResults);
    
    if (billToSearch && billToSearchResults) {
        console.log('Both elements found!');
        console.log('billToSearchResults classes:', billToSearchResults.className);
        console.log('billToSearchResults display:', window.getComputedStyle(billToSearchResults).display);
        
        // Test showing dropdown
        billToSearchResults.classList.remove('hidden');
        console.log('After removing hidden class - display:', window.getComputedStyle(billToSearchResults).display);
        
        // Add test content
        billToSearchResults.innerHTML = '<div class="search-result-item"><div class="company-name">TEST CUSTOMER</div><div class="company-gstin">TEST GSTIN</div></div>';
        
        // Test hiding dropdown
        setTimeout(() => {
            billToSearchResults.classList.add('hidden');
            console.log('After adding hidden class - display:', window.getComputedStyle(billToSearchResults).display);
        }, 3000);
    } else {
        console.error('Elements not found!');
    }
}

// Test function to check if elements exist
function testElementsExist() {
    console.log('=== TESTING ELEMENTS ===');
    
    const billToSearch = document.getElementById('billToSearch');
    const billToSearchResults = document.getElementById('billToSearchResults');
    const testDropdownBtn = document.getElementById('testDropdown');
    
    console.log('billToSearch exists:', !!billToSearch);
    console.log('billToSearchResults exists:', !!billToSearchResults);
    console.log('testDropdownBtn exists:', !!testDropdownBtn);
    
    if (billToSearch && billToSearchResults) {
        console.log('✅ All elements found!');
        
        // Test if we can show/hide dropdown
        billToSearchResults.classList.remove('hidden');
        console.log('Dropdown should be visible now');
        
        // Add test content
        billToSearchResults.innerHTML = '<div class="search-result-item"><div class="company-name">TEST ELEMENT</div><div class="company-gstin">TEST GSTIN</div></div>';
        
        // Force display
        billToSearchResults.style.display = 'block';
        billToSearchResults.style.visibility = 'visible';
        billToSearchResults.style.opacity = '1';
        billToSearchResults.style.zIndex = '9999';
        
        console.log('Test dropdown forced to show');
        
        // Hide after 5 seconds
        setTimeout(() => {
            billToSearchResults.classList.add('hidden');
            billToSearchResults.style.display = 'none';
            console.log('Dropdown hidden');
        }, 5000);
    } else {
        console.error('❌ Elements missing!');
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

function setupBillToSearch() {
    console.log('=== SETTING UP BILL TO SEARCH ===');
    
    const billToSearch = document.getElementById('billToSearch');
    const billToSearchResults = document.getElementById('billToSearchResults');
    
    console.log('billToSearch:', billToSearch);
    console.log('billToSearchResults:', billToSearchResults);
    
    if (!billToSearch || !billToSearchResults) {
        console.error('Elements not found!');
        return;
    }
    
    // Simple input event listener
    billToSearch.oninput = function() {
        const searchTerm = this.value.trim();
        console.log('=== SEARCH INPUT ===');
        console.log('Search term:', searchTerm);
        
        if (searchTerm.length > 0) {
            console.log('Making API call for:', searchTerm);
            // Make API call immediately
            fetch(`/api/customers/search?query=${encodeURIComponent(searchTerm)}`)
                .then(response => {
                    console.log('API response status:', response.status);
                    console.log('API response ok:', response.ok);
                    return response.json();
                })
                .then(customers => {
                    console.log('API response data:', customers);
                    showCustomerDropdown(customers, searchTerm);
                })
                .catch(error => {
                    console.error('API error:', error);
                    showCustomerDropdown([], searchTerm);
                });
        } else {
            console.log('Search term empty, hiding dropdown');
            hideCustomerDropdown();
        }
    };
    
    // Simple click outside to hide
    document.addEventListener('click', function(e) {
        if (!billToSearch.contains(e.target) && !billToSearchResults.contains(e.target)) {
            hideCustomerDropdown();
        }
    });
    
    console.log('Bill to search setup complete');
}

function showCustomerDropdown(customers, searchTerm) {
    const billToSearchResults = document.getElementById('billToSearchResults');
    
    console.log('=== SHOWING CUSTOMER DROPDOWN ===');
    console.log('billToSearchResults element:', billToSearchResults);
    console.log('customers:', customers);
    console.log('searchTerm:', searchTerm);
    
    if (!billToSearchResults) {
        console.error('billToSearchResults element not found!');
        return;
    }
    
    if (!customers || customers.length === 0) {
        console.log('No customers found, showing no results message');
        billToSearchResults.innerHTML = `
            <div class="search-result-item">
                <div class="company-name">No customers found</div>
                <div class="company-gstin">Try a different search term</div>
            </div>
        `;
    } else {
        console.log('Building dropdown for', customers.length, 'customers');
        billToSearchResults.innerHTML = '';
        customers.forEach(customer => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <div class="company-name">${customer.company_name}</div>
                <div class="company-gstin">${customer.gstin || 'No GSTIN'}</div>
            `;
            
            div.onclick = function() {
                selectCustomer(customer);
                hideCustomerDropdown();
            };
            
            billToSearchResults.appendChild(div);
        });
    }
    
    // Remove hidden class
    billToSearchResults.classList.remove('hidden');
    console.log('Hidden class removed');
    console.log('Current classes:', billToSearchResults.className);
    console.log('Computed display:', window.getComputedStyle(billToSearchResults).display);
    console.log('Computed visibility:', window.getComputedStyle(billToSearchResults).visibility);
    console.log('Computed opacity:', window.getComputedStyle(billToSearchResults).opacity);
    console.log('Computed z-index:', window.getComputedStyle(billToSearchResults).zIndex);
    
    // Force display block
    billToSearchResults.style.display = 'block';
    billToSearchResults.style.visibility = 'visible';
    billToSearchResults.style.opacity = '1';
    billToSearchResults.style.zIndex = '9999';
    
    console.log('Dropdown should be visible now with', customers.length, 'customers');
}

function hideCustomerDropdown() {
    const billToSearchResults = document.getElementById('billToSearchResults');
    billToSearchResults.classList.add('hidden');
    console.log('Dropdown hidden');
}

function selectCustomer(customer) {
    const billToSearch = document.getElementById('billToSearch');
    const customerSelect = document.getElementById('customerSelect');
    const customerDetails = document.getElementById('customerDetails');
    const customerGstin = document.getElementById('customerGstin');
    const customerBoe = document.getElementById('customerBoe');
    const customerNewTon = document.getElementById('customerNewTon');
    
    console.log('Customer selected:', customer);
    
    // Update search input
    billToSearch.value = customer.company_name;
    
    // Update hidden select
    customerSelect.value = customer.id;
    
    // Show customer details
    customerDetails.classList.remove('hidden');
    
    // Update customer details fields
    customerGstin.value = customer.gstin || '';
    customerBoe.value = customer.boe || '';
    customerNewTon.value = customer.new_ton || '';
    
    // Clear validation
    clearFieldValidation('customer_id');
    
    // Show success message
    showToast(`Selected: ${customer.company_name}`, 'success');
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
    
    // Clear previous validation messages
    clearValidationMessages();
    
    // Get form data
    const formData = new FormData(shipmentForm);
    const shipmentData = {
        shipment_type: formData.get('shipment_type'),
        shipment_subtype: formData.get('shipment_subtype'),
        asc_number: formData.get('asc_number'),
        sh_number: formData.get('sh_number'),
        ref_number: formData.get('ref_number'),
        customer_id: formData.get('customer_id'),
        cbm: formData.get('cbm'),
        odc: formData.get('odc'),
        length: formData.get('length'),
        breadth: formData.get('breadth'),
        height: formData.get('height'),
        packages: formData.get('packages')
    };
    
    // Validation
    const errors = [];
    
    if (!shipmentData.shipment_type) {
        errors.push({ field: 'shipment_type', message: 'Shipment type is required' });
    }
    
    if (!shipmentData.shipment_subtype) {
        errors.push({ field: 'shipment_subtype', message: 'Shipment subtype is required' });
    }
    
    if (!shipmentData.asc_number || shipmentData.asc_number.trim() === '') {
        errors.push({ field: 'asc_number', message: 'ASC number is required' });
    }
    
    if (!shipmentData.sh_number || shipmentData.sh_number.trim() === '') {
        errors.push({ field: 'sh_number', message: 'SH number is required' });
    }
    
    if (!shipmentData.ref_number || shipmentData.ref_number.trim() === '') {
        errors.push({ field: 'ref_number', message: 'Ref number is required' });
    }
    
    // Check if customer is selected (either through dropdown or search)
    const customerSelect = document.getElementById('customerSelect');
    const billToSearch = document.getElementById('billToSearch');
    
    if (!customerSelect.value && (!billToSearch.value || billToSearch.value.trim() === '')) {
        errors.push({ field: 'customer_id', message: 'Please select a customer' });
    }
    
    if (!shipmentData.cbm || parseFloat(shipmentData.cbm) <= 0) {
        errors.push({ field: 'cbm', message: 'CBM must be greater than 0' });
    }
    
    if (!shipmentData.odc) {
        errors.push({ field: 'odc', message: 'ODC selection is required' });
    }
    
    if (shipmentData.length && parseFloat(shipmentData.length) <= 0) {
        errors.push({ field: 'length', message: 'Length must be greater than 0' });
    }
    
    if (shipmentData.breadth && parseFloat(shipmentData.breadth) <= 0) {
        errors.push({ field: 'breadth', message: 'Breadth must be greater than 0' });
    }
    
    if (shipmentData.height && parseFloat(shipmentData.height) <= 0) {
        errors.push({ field: 'height', message: 'Height must be greater than 0' });
    }
    
    // Validate dimensions only if ODC is Yes
    if (shipmentData.odc === 'Yes') {
        if (!shipmentData.length || parseFloat(shipmentData.length) <= 0) {
            errors.push({ field: 'length', message: 'Length is required when ODC is Yes' });
        }
        if (!shipmentData.breadth || parseFloat(shipmentData.breadth) <= 0) {
            errors.push({ field: 'breadth', message: 'Breadth is required when ODC is Yes' });
        }
        if (!shipmentData.height || parseFloat(shipmentData.height) <= 0) {
            errors.push({ field: 'height', message: 'Height is required when ODC is Yes' });
        }
    }
    
    if (shipmentData.packages && parseInt(shipmentData.packages) <= 0) {
        errors.push({ field: 'packages', message: 'Packages must be greater than 0' });
    }
    
    // Display validation errors
    if (errors.length > 0) {
        errors.forEach(error => {
            showFieldValidation(error.field, error.message);
        });
        showToast('Please fix the validation errors', 'error');
        return;
    }
    
    // If customer was selected via search but not in dropdown, find the customer
    if (!customerSelect.value && billToSearch.value) {
        const searchTerm = billToSearch.value.trim();
        const matchingCustomer = customers.find(customer => 
            customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.gstin === searchTerm
        );
        
        if (matchingCustomer) {
            shipmentData.customer_id = matchingCustomer.id;
        } else {
            showFieldValidation('customer_id', 'Please select a valid customer from the dropdown');
            showToast('Please select a valid customer', 'error');
            return;
        }
    }
    
    // Show loading
    showLoading();
    
    try {
        const response = await fetch('/api/shipments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipmentData),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Shipment created successfully!', 'success');
            
            // Show invoice modal if invoice was created
            if (result.invoice) {
                showInvoiceModal(result.invoice.id);
            }
            
            // Reset form
            shipmentForm.reset();
            document.getElementById('customerDetails').classList.add('hidden');
            document.getElementById('billToSearch').value = '';
            clearValidationMessages();
            
        } else {
            showToast(result.error || 'Failed to create shipment', 'error');
        }
    } catch (error) {
        console.error('Error creating shipment:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Function to clear all validation messages
function clearValidationMessages() {
    const validationMessages = document.querySelectorAll('.validation-message');
    validationMessages.forEach(msg => msg.remove());
    
    // Remove error styling from inputs
    const errorInputs = document.querySelectorAll('.input-error');
    errorInputs.forEach(input => input.classList.remove('input-error'));
}

// Function to show field validation message
function showFieldValidation(fieldName, message) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    // Add error styling to input
    field.classList.add('input-error');
    
    // Remove existing validation message
    const existingMessage = field.parentNode.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create and add validation message
    const validationMessage = document.createElement('div');
    validationMessage.className = 'validation-message';
    validationMessage.textContent = message;
    validationMessage.style.color = '#e53e3e';
    validationMessage.style.fontSize = '12px';
    validationMessage.style.marginTop = '4px';
    validationMessage.style.display = 'flex';
    validationMessage.style.alignItems = 'center';
    validationMessage.style.gap = '4px';
    
    // Add error icon
    validationMessage.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${message}
    `;
    
    field.parentNode.appendChild(validationMessage);
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
                <div class="invoice-number">Created by: ${invoice.created_by_name || 'Admin User'}</div>
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
                        <span>${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN', { 
                            timeZone: 'Asia/Kolkata',
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                        }) : '10-Nov-2023'}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>FX Rate</label>
                        <span>${invoice.fx_rate}</span>
                    </div>
                </div>
                <div class="invoice-amount">
                    <div class="amount-label">Total Amount</div>
                    <div class="amount-value">$${parseFloat(invoice.total_usd || 0).toFixed(2)}</div>
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
                        <div class="accex-logo">
                            <div class="logo-symbol">
                                <div class="logo-triangle"></div>
                                <div class="logo-curve"></div>
                            </div>
                            <div class="logo-text">
                                <div class="logo-main"><span class="logo-acc">ACC</span><span class="logo-ex">EX</span></div>
                                <div class="logo-subtitle">Supply Chain Solutions</div>
                            </div>
                        </div>
                        <div class="company-info">
                            <div class="company-name">ACCEX SUPPLY CHAIN PRIVATE LIMITED</div>
                            <div class="company-subtitle">EKA: ACCEX SUPPLY CHAIN AND WAREHOUSING PRIVATE LIMITED</div>
                            <div class="company-address">181/3, Taluka Panvel, Sai Village, Raigad, Maharashtra - 410206</div>
                            <div class="company-website">www.accexscs.com</div>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="company-details-table">
                            <div class="details-row">
                                <div class="details-label">PAN:</div>
                                <div class="details-value">AAGCK5974J</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">GSTN:</div>
                                <div class="details-value">27AAGCK5974J2ZX</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">CIN:</div>
                                <div class="details-value">U63030MH2017PTC295094</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">DIPP Certificate No.:</div>
                                <div class="details-value">DIPP5903</div>
                            </div>
                            <div class="details-row">
                                <div class="details-label">MSME Udyam Registration No.:</div>
                                <div class="details-value">UDYAM-MH-19-0141947</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="invoice-title">TAX INVOICE</div>
            
                <!-- Invoice Details Table -->
                <div class="invoice-details-table">
                    <div class="details-row">
                        <div class="details-label">Invoice No.:</div>
                        <div class="details-value">${invoice.invoice_number || 'ASC2324MSZFC174'}</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Invoice Date:</div>
                        <div class="details-value">${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN', { 
                            timeZone: 'Asia/Kolkata',
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                        }) : '10-Nov-2023'}</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">PO Reference:</div>
                        <div class="details-value">Contract</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Place of Supply:</div>
                        <div class="details-value">Maharashtra</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">State Code:</div>
                        <div class="details-value">27</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Reverse Charge:</div>
                        <div class="details-value">No</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">SLB Reference #:</div>
                        <div class="details-value">S-202919/REW</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Created By:</div>
                        <div class="details-value">${invoice.created_by_name || 'Admin User'}</div>
                    </div>
                </div>
                
                <!-- Customer Details -->
                <div class="customer-details-section">
                    <div class="customer-info">
                        <div class="section-title">Bill to:</div>
                        <div class="customer-name">${invoice.company_name || 'SCHLUMBERGER ASIA SERVICES LIMITED'}</div>
                        <div class="customer-address">${invoice.address || 'P-21, TTC INDUSTRIAL AREA, THANE BELAPUR ROAD, MIDC MAHAPE, THANE, MAHARASHTRA - 400710, INDIA'}</div>
                        <div class="customer-gstin">GSTN: ${invoice.gstin || '27AADCS1107J1ZK'}</div>
                        <div class="customer-ref">Reference Number: SH_1001684125</div>
                    </div>
                </div>
                
                <!-- Service Details Table -->
                <div class="service-details-section">
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Description of Services</th>
                                <th>UOM</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>CUR</th>
                                <th>AMOUNT</th>
                                <th>FX RATE</th>
                                <th>AMOUNT ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Warehousing & Logistics Services<br>SAC: 996729</td>
                                <td>SER</td>
                                <td>1.00</td>
                                <td>${parseFloat(invoice.subtotal_usd || 97.50).toFixed(2)}</td>
                                <td>USD</td>
                                <td>${parseFloat(invoice.subtotal_usd || 97.50).toFixed(2)}</td>
                                <td>${invoice.fx_rate || 81.90}</td>
                                <td>${parseFloat(invoice.subtotal_usd || 97.50).toFixed(2)}</td>
                            </tr>
                            <tr class="sub-header">
                                <td colspan="8">ASC- 221, BOE #: 2024815</td>
                            </tr>
                            <tr>
                                <td>Agency Charges (Used Equipment)</td>
                                <td>BOE</td>
                                <td>1.00</td>
                                <td>23.00</td>
                                <td>INR</td>
                                <td>23.00</td>
                                <td>81.90</td>
                                <td>0.28</td>
                            </tr>
                            <tr>
                                <td>Outbound Handling at FTWZ</td>
                                <td>PKG</td>
                                <td>2.00</td>
                                <td>45.00</td>
                                <td>USD</td>
                                <td>90.00</td>
                                <td>1.00</td>
                                <td>90.00</td>
                            </tr>
                            <tr>
                                <td>Transportation Charges (FTWZ to Barmer)</td>
                                <td>VEH</td>
                                <td>1.00</td>
                                <td>56.00</td>
                                <td>INR</td>
                                <td>56.00</td>
                                <td>81.90</td>
                                <td>0.68</td>
                            </tr>
                            <tr>
                                <td>LR Charges</td>
                                <td>VEH</td>
                                <td>1.00</td>
                                <td>360.00</td>
                                <td>INR</td>
                                <td>360.00</td>
                                <td>81.90</td>
                                <td>4.40</td>
                            </tr>
                            <tr>
                                <td>CE Certificate</td>
                                <td>BOE</td>
                                <td>1.00</td>
                                <td>56.00</td>
                                <td>INR</td>
                                <td>56.00</td>
                                <td>81.90</td>
                                <td>0.68</td>
                            </tr>
                            <tr>
                                <td>Box Opening & Repacking (As Per Approval)</td>
                                <td>BOX</td>
                                <td>2.00</td>
                                <td>48.00</td>
                                <td>INR</td>
                                <td>96.00</td>
                                <td>81.90</td>
                                <td>1.17</td>
                            </tr>
                            <tr>
                                <td>MHE Charges (*ODC)</td>
                                <td>HST</td>
                                <td>1.00</td>
                                <td>23.00</td>
                                <td>INR</td>
                                <td>23.00</td>
                                <td>81.90</td>
                                <td>0.28</td>
                            </tr>
                            <tr class="tax-row">
                                <td colspan="6">IGST</td>
                                <td>18.00%</td>
                                <td>17.55</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="packing-details">
                        <div class="packing-title">Over Dimension Cargo (ODC) Packing List DIMS:</div>
                        <div class="packing-item">344 x 18 x 30 x 1 | 0.186</div>
                        <div class="packing-item">258 x 38 x 50 x 1 | 0.490</div>
                        <div class="packing-total">TOTAL: 0.676 CBM</div>
                    </div>
                    
                    <div class="fx-note">* FX Rates are basis respective shipment rate</div>
                </div>
                
                <!-- Summary Section -->
                <div class="summary-section">
                    <div class="total-bill">
                        <div class="total-label">Total Bill Value (USD):</div>
                        <div class="total-value">$${parseFloat(invoice.total_usd || 115.05).toFixed(2)}</div>
                    </div>
                    
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>FX Rate</th>
                                <th>HSN / SAC</th>
                                <th>IGST %</th>
                                <th>Taxable ($)</th>
                                <th>Taxable (₹)</th>
                                <th>IGST ($)</th>
                                <th>IGST (₹)</th>
                                <th>Total ($)</th>
                                <th>Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${invoice.fx_rate || 81.90}</td>
                                <td>996729</td>
                                <td>18.00%</td>
                                <td>${parseFloat(invoice.subtotal_usd || 97.50).toFixed(2)}</td>
                                <td>${parseFloat(invoice.subtotal_inr || 7985.00).toFixed(2)}</td>
                                <td>${parseFloat(invoice.igst_amount_usd || 17.55).toFixed(2)}</td>
                                <td>${parseFloat(invoice.igst_amount_inr || 1437.00).toFixed(2)}</td>
                                <td>${parseFloat(invoice.total_usd || 115.05).toFixed(2)}</td>
                                <td>${parseFloat(invoice.total_inr || 9422.00).toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="7">TOTAL</td>
                                <td>${parseFloat(invoice.total_usd || 115.05).toFixed(2)}</td>
                                <td>${parseFloat(invoice.total_inr || 9422.00).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Declaration and Bank Details -->
                <div class="footer-section">
                    <div class="declaration">
                        In case of any discrepancies / queries please send a mail within 2 days of receipt of this invoice to our point of contact nominated for your account and copy billing @accexscs.com
                    </div>
                    
                    <div class="bank-details">
                        <div class="bank-title">Bank Details</div>
                        <div class="bank-info">
                            <div class="bank-row">
                                <span class="bank-label">Bank:</span>
                                <span class="bank-value">ICICI Bank</span>
                            </div>
                            <div class="bank-row">
                                <span class="bank-label">Branch:</span>
                                <span class="bank-value">Powai</span>
                            </div>
                            <div class="bank-row">
                                <span class="bank-label">IFSC:</span>
                                <span class="bank-value">ICIC0000020</span>
                            </div>
                            <div class="bank-row">
                                <span class="bank-label">Account #:</span>
                                <span class="bank-value">002005035489</span>
                            </div>
                        </div>
                        <div class="signatory">
                            <div class="total-amount">Total Amount: $115.05</div>
                            <div class="company-name">For ACCEX SUPPLY CHAIN PRIVATE LIMITED</div>
                            <div class="signature-line">Authorised Signatory</div>
                        </div>
                    </div>
                    
                    <div class="company-footer">
                        <div class="registered-office">
                            <strong>Registered Office:</strong> 109, First Floor, Srishti Plaza, Saki Vihar Road, Powai, Mumbai - 400072
                        </div>
                        <div class="startup-recognition">
                            ACCEX SUPPLY CHAIN AND WAREHOUSING PRIVATE LIMITED is recognised as a "STARTUP" by the Department of Industrial Policy and Promotion (DIPP) of the Government of India.
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="downloadInvoicePDF(${invoice.id})">
                    <i class="fas fa-file-pdf"></i> Download PDF
                </button>
                <button class="btn btn-secondary" onclick="printInvoice()">
                    <i class="fas fa-print"></i> Print Invoice
                </button>
                ${invoice.status === 'draft' ? `
                    <button class="btn btn-success" onclick="finalizeInvoice(${invoice.id})">
                        <i class="fas fa-check"></i> Finalize Invoice
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Show the modal
    invoiceModal.classList.add('show');
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
                
                /* ACCEX Logo Styles for PDF */
                .accex-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: 'Arial', sans-serif;
                    margin-bottom: 15px;
                }
                .logo-symbol {
                    position: relative;
                    width: 40px;
                    height: 40px;
                }
                .logo-triangle {
                    width: 0;
                    height: 0;
                    border-left: 20px solid transparent;
                    border-right: 20px solid transparent;
                    border-bottom: 35px solid #1e40af;
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                .logo-curve {
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border-radius: 50%;
                    position: absolute;
                    bottom: 0;
                    right: 0;
                }
                .logo-text {
                    display: flex;
                    flex-direction: column;
                }
                .logo-main {
                    font-size: 18px;
                    font-weight: bold;
                    color: #1e40af;
                    letter-spacing: 1px;
                }
                .logo-subtitle {
                    font-size: 8px;
                    color: #6b7280;
                    font-weight: normal;
                }
                
                /* Invoice Header Print */
                .invoice-header-print {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #333;
                }
                .header-left {
                    flex: 1;
                }
                .header-right {
                    flex: 1;
                    margin-left: 20px;
                }
                .company-info {
                    margin-top: 10px;
                }
                .company-name {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                    margin-bottom: 3px;
                }
                .company-subtitle {
                    font-size: 10px;
                    color: #666;
                    margin-bottom: 3px;
                }
                .company-address {
                    font-size: 10px;
                    color: #666;
                    margin-bottom: 3px;
                }
                .company-website {
                    font-size: 10px;
                    color: #666;
                }
                .company-details-table {
                    display: grid;
                    grid-template-columns: auto auto;
                    gap: 5px;
                    margin-top: 10px;
                }
                .details-row {
                    display: flex;
                    margin-bottom: 3px;
                }
                .details-label {
                    font-weight: 600;
                    min-width: 120px;
                    padding-right: 10px;
                    font-size: 10px;
                }
                .details-value {
                    flex: 1;
                    font-size: 10px;
                }
                
                /* Invoice Title */
                .invoice-title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-transform: uppercase;
                    color: #000;
                }
                
                /* Invoice Details Table */
                .invoice-details-table {
                    display: grid;
                    grid-template-columns: auto auto;
                    gap: 5px;
                    margin-bottom: 20px;
                    border: 1px solid #000;
                    padding: 10px;
                }
                
                /* Customer Details Section */
                .customer-details-section {
                    margin-bottom: 20px;
                    border: 1px solid #000;
                    padding: 10px;
                }
                .customer-info {
                    margin-bottom: 10px;
                }
                .section-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-size: 12px;
                }
                .customer-name {
                    font-weight: bold;
                    margin-bottom: 3px;
                    font-size: 11px;
                }
                .customer-address {
                    margin-bottom: 3px;
                    font-size: 10px;
                }
                .customer-gstin {
                    margin-bottom: 3px;
                    font-size: 10px;
                }
                .customer-ref {
                    font-size: 10px;
                }
                
                /* Service Details Section */
                .service-details-section {
                    margin-bottom: 20px;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                .invoice-table th, .invoice-table td {
                    border: 1px solid #000;
                    padding: 5px;
                    font-size: 9px;
                    text-align: center;
                }
                .invoice-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .invoice-table .sub-header {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .invoice-table .tax-row {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                
                /* Packing Details */
                .packing-details {
                    margin: 15px 0;
                    padding: 10px;
                    border: 1px solid #000;
                }
                .packing-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-size: 10px;
                }
                .packing-item {
                    margin-bottom: 3px;
                    font-size: 9px;
                }
                .packing-total {
                    font-weight: bold;
                    margin-top: 5px;
                    font-size: 10px;
                }
                .fx-note {
                    font-size: 8px;
                    font-style: italic;
                    margin-top: 5px;
                }
                
                /* Summary Section */
                .summary-section {
                    margin-bottom: 20px;
                }
                .total-bill {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 2px solid #000;
                    font-weight: bold;
                    font-size: 12px;
                }
                .total-label {
                    font-size: 12px;
                }
                .total-value {
                    font-size: 14px;
                }
                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .summary-table th, .summary-table td {
                    border: 1px solid #000;
                    padding: 5px;
                    font-size: 9px;
                    text-align: center;
                }
                .summary-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .summary-table .total-row {
                    font-weight: bold;
                    background-color: #f8f9fa;
                }
                
                /* Footer Section */
                .footer-section {
                    margin-top: 20px;
                }
                .declaration {
                    font-size: 9px;
                    margin: 10px 0;
                    text-align: justify;
                }
                .bank-details {
                    border: 1px solid #000;
                    padding: 10px;
                    margin: 10px 0;
                }
                .bank-title {
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 11px;
                }
                .bank-info {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 5px;
                    margin-bottom: 10px;
                }
                .bank-row {
                    display: flex;
                }
                .bank-label {
                    font-weight: 600;
                    min-width: 80px;
                    font-size: 9px;
                }
                .bank-value {
                    flex: 1;
                    font-size: 9px;
                }
                .signatory {
                    text-align: right;
                    font-weight: bold;
                    margin-top: 10px;
                    font-size: 10px;
                }
                .company-footer {
                    margin-top: 20px;
                }
                .registered-office {
                    font-size: 8px;
                    text-align: center;
                    margin-bottom: 10px;
                }
                .startup-recognition {
                    font-size: 8px;
                    text-align: center;
                    font-style: italic;
                }
                
                /* Hide modal elements in PDF */
                .modal-actions, .modal-header, .modal-close {
                    display: none !important;
                }
                
                @media print {
                    body * {
                        visibility: visible;
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
    // Get the invoice modal content
    const invoiceContent = document.querySelector('.invoice-container');
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Add necessary styles for printing
    printWindow.document.write(`
        <html>
        <head>
            <title>Invoice Print</title>
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
                    background-color: white;
                }
                
                /* ACCEX Logo Styles for Print */
                .accex-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: 'Arial', sans-serif;
                    margin-bottom: 15px;
                }
                .logo-symbol {
                    position: relative;
                    width: 40px;
                    height: 40px;
                }
                .logo-triangle {
                    width: 0;
                    height: 0;
                    border-left: 20px solid transparent;
                    border-right: 20px solid transparent;
                    border-bottom: 35px solid #1e40af;
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                .logo-curve {
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border-radius: 50%;
                    position: absolute;
                    bottom: 0;
                    right: 0;
                }
                .logo-text {
                    display: flex;
                    flex-direction: column;
                }
                .logo-main {
                    font-size: 18px;
                    font-weight: bold;
                    color: #1e40af;
                    letter-spacing: 1px;
                }
                .logo-subtitle {
                    font-size: 8px;
                    color: #6b7280;
                    font-weight: normal;
                }
                
                /* Invoice Header Print */
                .invoice-header-print {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #333;
                }
                .header-left {
                    flex: 1;
                }
                .header-right {
                    flex: 1;
                    margin-left: 20px;
                }
                .company-info {
                    margin-top: 10px;
                }
                .company-name {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                    margin-bottom: 3px;
                }
                .company-subtitle {
                    font-size: 10px;
                    color: #666;
                    margin-bottom: 3px;
                }
                .company-address {
                    font-size: 10px;
                    color: #666;
                    margin-bottom: 3px;
                }
                .company-website {
                    font-size: 10px;
                    color: #666;
                }
                .company-details-table {
                    display: grid;
                    grid-template-columns: auto auto;
                    gap: 5px;
                    margin-top: 10px;
                }
                .details-row {
                    display: flex;
                    margin-bottom: 3px;
                }
                .details-label {
                    font-weight: 600;
                    min-width: 120px;
                    padding-right: 10px;
                    font-size: 10px;
                }
                .details-value {
                    flex: 1;
                    font-size: 10px;
                }
                
                /* Invoice Title */
                .invoice-title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-transform: uppercase;
                    color: #000;
                }
                
                /* Invoice Details Table */
                .invoice-details-table {
                    display: grid;
                    grid-template-columns: auto auto;
                    gap: 5px;
                    margin-bottom: 20px;
                    border: 1px solid #000;
                    padding: 10px;
                }
                
                /* Customer Details Section */
                .customer-details-section {
                    margin-bottom: 20px;
                    border: 1px solid #000;
                    padding: 10px;
                }
                .customer-info {
                    margin-bottom: 10px;
                }
                .section-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-size: 12px;
                }
                .customer-name {
                    font-weight: bold;
                    margin-bottom: 3px;
                    font-size: 11px;
                }
                .customer-address {
                    margin-bottom: 3px;
                    font-size: 10px;
                }
                .customer-gstin {
                    margin-bottom: 3px;
                    font-size: 10px;
                }
                .customer-ref {
                    font-size: 10px;
                }
                
                /* Service Details Section */
                .service-details-section {
                    margin-bottom: 20px;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                .invoice-table th, .invoice-table td {
                    border: 1px solid #000;
                    padding: 5px;
                    font-size: 9px;
                    text-align: center;
                }
                .invoice-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .invoice-table .sub-header {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .invoice-table .tax-row {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                
                /* Packing Details */
                .packing-details {
                    margin: 15px 0;
                    padding: 10px;
                    border: 1px solid #000;
                }
                .packing-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-size: 10px;
                }
                .packing-item {
                    margin-bottom: 3px;
                    font-size: 9px;
                }
                .packing-total {
                    font-weight: bold;
                    margin-top: 5px;
                    font-size: 10px;
                }
                .fx-note {
                    font-size: 8px;
                    font-style: italic;
                    margin-top: 5px;
                }
                
                /* Summary Section */
                .summary-section {
                    margin-bottom: 20px;
                }
                .total-bill {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 2px solid #000;
                    font-weight: bold;
                    font-size: 12px;
                }
                .total-label {
                    font-size: 12px;
                }
                .total-value {
                    font-size: 14px;
                }
                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .summary-table th, .summary-table td {
                    border: 1px solid #000;
                    padding: 5px;
                    font-size: 9px;
                    text-align: center;
                }
                .summary-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .summary-table .total-row {
                    font-weight: bold;
                    background-color: #f8f9fa;
                }
                
                /* Footer Section */
                .footer-section {
                    margin-top: 20px;
                }
                .declaration {
                    font-size: 9px;
                    margin: 10px 0;
                    text-align: justify;
                }
                .bank-details {
                    border: 1px solid #000;
                    padding: 10px;
                    margin: 10px 0;
                }
                .bank-title {
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 11px;
                }
                .bank-info {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 5px;
                    margin-bottom: 10px;
                }
                .bank-row {
                    display: flex;
                }
                .bank-label {
                    font-weight: 600;
                    min-width: 80px;
                    font-size: 9px;
                }
                .bank-value {
                    flex: 1;
                    font-size: 9px;
                }
                .signatory {
                    text-align: right;
                    font-weight: bold;
                    margin-top: 10px;
                    font-size: 10px;
                }
                .company-footer {
                    margin-top: 20px;
                }
                .registered-office {
                    font-size: 8px;
                    text-align: center;
                    margin-bottom: 10px;
                }
                .startup-recognition {
                    font-size: 8px;
                    text-align: center;
                    font-style: italic;
                }
                
                /* Hide modal elements in print */
                .modal-actions, .modal-header, .modal-close {
                    display: none !important;
                }
                
                @media print {
                    body * {
                        visibility: visible;
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

// Dashboard functions
async function loadDashboardData() {
    try {
        // Load shipments
        const shipmentsResponse = await fetch('/api/shipments');
        if (shipmentsResponse.ok) {
            const shipments = await shipmentsResponse.json();
            updateDashboardStats(shipments);
        }
        
        // Load invoices
        const invoicesResponse = await fetch('/api/invoices');
        if (invoicesResponse.ok) {
            const invoices = await invoicesResponse.json();
            updateRecentActivity(invoices);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(shipmentsData) {
    // Check if elements exist before updating them
    if (totalShipments) totalShipments.textContent = shipmentsData.length;
    if (totalInvoices) totalInvoices.textContent = invoices.length;
    
    const totalRevenueUSD = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_usd || 0), 0);
    if (totalRevenue) totalRevenue.textContent = `$${totalRevenueUSD.toFixed(2)}`;
    
    const pendingCount = invoices.filter(invoice => invoice.status === 'draft').length;
    if (pendingInvoices) pendingInvoices.textContent = pendingCount;
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity(invoicesData) {
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
    const recentInvoices = invoicesData.slice(0, 3);
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
window.printInvoice = printInvoice;