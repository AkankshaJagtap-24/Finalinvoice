class InvoiceGenerator {
  constructor() {
    this.exchangeRate = 83.5 // Fixed INR to USD rate for demo
    this.customers = {
      "acme-corp": {
        name: "Acme Corporation",
        billTo: "Acme Corporation\n123 Business Street\nNew York, NY 10001\nUnited States",
        shipTo: "Acme Corporation\n123 Business Street\nNew York, NY 10001\nUnited States",
      },
      "tech-solutions": {
        name: "Tech Solutions Ltd",
        billTo: "Tech Solutions Ltd\n456 Tech Avenue\nSan Francisco, CA 94105\nUnited States",
        shipTo: "Tech Solutions Ltd\n456 Tech Avenue\nSan Francisco, CA 94105\nUnited States",
      },
      "global-inc": {
        name: "Global Inc",
        billTo: "Global Inc\n789 Global Plaza\nLondon, EC1A 1BB\nUnited Kingdom",
        shipTo: "Global Inc\n789 Global Plaza\nLondon, EC1A 1BB\nUnited Kingdom",
      },
    }

    this.items = {
      "warehousing-logistics": {
        name: "Warehousing & Logistics Services",
        description: "SAC: 996729",
        uom: "SER",
        rate: 82.2,
        currency: "INR",
        taxRate: 18,
        hsn: "996729",
      },
      "agency-charges": {
        name: "Agency Charges",
        description: "Port Analysis/FTW",
        uom: "VEH",
        rate: 82.2,
        currency: "INR",
        taxRate: 18,
        hsn: "996729",
      },
      transportation: {
        name: "Inbound Transportation",
        description: "Gram Weight",
        uom: "TON",
        rate: 100.0,
        currency: "USD",
        taxRate: 18,
        hsn: "996729",
      },
      "handling-charges": {
        name: "Inbound Handling at FTW2",
        description: "Loading/Unloading Charge",
        uom: "LCL",
        rate: 82.2,
        currency: "INR",
        taxRate: 18,
        hsn: "996729",
      },
    }

    this.init()
  }

  init() {
    this.setCurrentDate()
    this.bindEvents()
    this.addInitialLineItem()
    this.calculateTotals()
  }

  setCurrentDate() {
    const today = new Date()
    const invoiceDate = today.toISOString().split("T")[0]
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    document.getElementById("invoiceDate").value = invoiceDate
    document.getElementById("dueDate").value = dueDate
  }

  bindEvents() {
    // Customer selection
    document.getElementById("customerSelect").addEventListener("change", (e) => {
      this.updateCustomerInfo(e.target.value)
    })

    // Add item dropdown
    document.querySelectorAll("[data-item]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault()
        this.addLineItem(e.target.dataset.item)
      })
    })

    // Discount and adjustment changes
    document.getElementById("discountValue").addEventListener("input", () => this.calculateTotals())
    document.getElementById("discountUnit").addEventListener("change", () => this.calculateTotals())
    document.getElementById("adjustment").addEventListener("input", () => this.calculateTotals())

    // Currency change
    document.getElementById("currency").addEventListener("change", () => this.calculateTotals())
  }

  updateCustomerInfo(customerId) {
    const customer = this.customers[customerId]
    const billToElement = document.getElementById("billToAddress")
    const shipToElement = document.getElementById("shipToAddress")

    if (customer) {
      billToElement.textContent = customer.billTo
      shipToElement.textContent = customer.shipTo
    } else {
      billToElement.innerHTML = '<span class="text-muted">—</span>'
      shipToElement.innerHTML = '<span class="text-muted">—</span>'
    }
  }

  addInitialLineItem() {
    this.addLineItem("warehousing-logistics")
  }

  addLineItem(itemKey = null) {
    const tbody = document.getElementById("lineItemsBody")
    const row = document.createElement("tr")
    const item = itemKey ? this.items[itemKey] : null

    row.innerHTML = `
        <td>
            <input type="text" class="form-control item-name" value="${item ? item.name : ""}" placeholder="Service description">
            <small class="text-muted d-block">${item ? item.description : ""}</small>
        </td>
        <td>
            <select class="form-select item-uom">
                <option value="SER" ${item && item.uom === "SER" ? "selected" : ""}>SER</option>
                <option value="VEH" ${item && item.uom === "VEH" ? "selected" : ""}>VEH</option>
                <option value="TON" ${item && item.uom === "TON" ? "selected" : ""}>TON</option>
                <option value="LCL" ${item && item.uom === "LCL" ? "selected" : ""}>LCL</option>
                <option value="HST" ${item && item.uom === "HST" ? "selected" : ""}>HST</option>
            </select>
        </td>
        <td>
            <input type="number" class="form-control item-quantity" value="1" min="0" step="0.01">
        </td>
        <td>
            <input type="number" class="form-control item-rate" value="${item ? item.rate : 0}" min="0" step="0.01">
        </td>
        <td>
            <select class="form-select item-currency">
                <option value="INR" ${item && item.currency === "INR" ? "selected" : ""}>INR</option>
                <option value="USD" ${item && item.currency === "USD" ? "selected" : ""}>USD</option>
            </select>
        </td>
        <td>
            <span class="item-amount">0.00</span>
        </td>
        <td>
            <span class="fx-rate">1.00</span>
        </td>
        <td>
            <select class="form-select item-tax">
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18" ${item && item.taxRate === 18 ? "selected" : ""}>18%</option>
                <option value="28">28%</option>
            </select>
        </td>
        <td>
            <span class="item-amount-inr">₹0.00</span>
        </td>
        <td>
            <button type="button" class="remove-item-btn" onclick="this.closest('tr').remove(); invoiceGen.calculateTotals();">
                <i class="bi bi-x"></i>
            </button>
        </td>
    `

    tbody.appendChild(row)

    // Bind events for the new row
    const inputs = row.querySelectorAll(".item-quantity, .item-rate, .item-currency, .item-tax")
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        this.calculateLineAmount(row)
        this.calculateTotals()
      })
      input.addEventListener("change", () => {
        this.calculateLineAmount(row)
        this.calculateTotals()
      })
    })

    this.calculateLineAmount(row)
    this.calculateTotals()
  }

  calculateLineAmount(row) {
    const quantity = Number.parseFloat(row.querySelector(".item-quantity").value) || 0
    const rate = Number.parseFloat(row.querySelector(".item-rate").value) || 0
    const taxRate = Number.parseFloat(row.querySelector(".item-tax").value) || 0
    const currency = row.querySelector(".item-currency").value

    const subtotal = quantity * rate
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    // Calculate FX rate and INR amount
    const fxRate = currency === "USD" ? this.exchangeRate : 1
    const totalINR = currency === "USD" ? total * fxRate : total

    // Update display
    const currencySymbol = currency === "USD" ? "$" : "₹"

    row.querySelector(".item-amount").textContent = `${currencySymbol}${total.toFixed(2)}`
    row.querySelector(".fx-rate").textContent = fxRate.toFixed(2)
    row.querySelector(".item-amount-inr").textContent = `₹${totalINR.toFixed(2)}`
  }

  calculateTotals() {
    const rows = document.querySelectorAll("#lineItemsBody tr")
    let subtotal = 0

    // Calculate subtotal in INR
    rows.forEach((row) => {
      const quantity = Number.parseFloat(row.querySelector(".item-quantity").value) || 0
      const rate = Number.parseFloat(row.querySelector(".item-rate").value) || 0
      const taxRate = Number.parseFloat(row.querySelector(".item-tax").value) || 0
      const currency = row.querySelector(".item-currency").value

      const lineSubtotal = quantity * rate
      const taxAmount = lineSubtotal * (taxRate / 100)
      const lineTotal = lineSubtotal + taxAmount

      // Convert to INR if needed
      const fxRate = currency === "USD" ? this.exchangeRate : 1
      const lineTotalINR = currency === "USD" ? lineTotal * fxRate : lineTotal

      subtotal += lineTotalINR
    })

    // Apply discount
    const discountValue = Number.parseFloat(document.getElementById("discountValue").value) || 0
    const discountUnit = document.getElementById("discountUnit").value
    let discountAmount = 0

    if (discountUnit === "%") {
      discountAmount = subtotal * (discountValue / 100)
    } else {
      discountAmount = discountValue
    }

    // Apply adjustment
    const adjustment = Number.parseFloat(document.getElementById("adjustment").value) || 0

    // Calculate final total
    const total = subtotal - discountAmount + adjustment

    // Update display
    document.getElementById("subTotal").textContent = `₹${subtotal.toFixed(2)}`
    document.getElementById("totalAmount").textContent = `₹${total.toFixed(2)}`

    // Convert to USD
    const totalUSD = total / this.exchangeRate
    document.getElementById("totalAmountUSD").textContent = `$${totalUSD.toFixed(2)}`
  }

  generatePreview() {
    const previewSection = document.getElementById("invoicePreview")
    const previewContent = document.getElementById("invoicePreviewContent")

    // Collect form data
    const companyName = document.getElementById("companyName").value
    const companyAddress = document.getElementById("companyAddress").value
    const companyPAN = document.getElementById("companyPAN").value
    const companyGSTIN = document.getElementById("companyGSTIN").value
    const stateCode = document.getElementById("stateCode").value

    const customerSelect = document.getElementById("customerSelect")
    const selectedCustomer = this.customers[customerSelect.value]

    const invoiceNumber = document.getElementById("invoiceNumber").value
    const invoiceDate = document.getElementById("invoiceDate").value
    const dueDate = document.getElementById("dueDate").value

    // Generate line items HTML
    let lineItemsHTML = ""
    let subtotal = 0

    document.querySelectorAll("#lineItemsBody tr").forEach((row, index) => {
      const description = row.querySelector(".item-name").value
      const qty = Number.parseFloat(row.querySelector(".item-quantity").value) || 0
      const rate = Number.parseFloat(row.querySelector(".item-rate").value) || 0
      const uom = row.querySelector(".item-uom") ? row.querySelector(".item-uom").value : "SER"
      const currency = row.querySelector(".item-currency") ? row.querySelector(".item-currency").value : "INR"
      const amount = qty * rate
      const fxRate = currency === "USD" ? this.exchangeRate : 1
      const amountINR = currency === "USD" ? amount * fxRate : amount

      subtotal += amountINR

      lineItemsHTML += `
      <tr>
        <td>${description}</td>
        <td>${uom}</td>
        <td style="text-align: center;">${qty}</td>
        <td class="amount-col">${rate.toFixed(2)}</td>
        <td style="text-align: center;">${currency}</td>
        <td class="amount-col">${amount.toFixed(2)}</td>
        <td style="text-align: center;">${fxRate.toFixed(2)}</td>
        <td class="amount-col">${amountINR.toFixed(2)}</td>
      </tr>
    `
    })

    // Calculate totals
    const taxAmount = subtotal * 0.18 // 18% GST
    const total = subtotal + taxAmount

    // Generate invoice HTML
    const invoiceHTML = `
    <div class="invoice-template">
      <div class="invoice-header-section">
        <div>
          <div class="company-logo">ACCEX</div>
          <div class="company-tagline">Supply Chain Solutions</div>
        </div>
        <div class="company-details">
          <strong>${companyName}</strong><br>
          PAN: ${companyPAN}<br>
          GSTN: ${companyGSTIN}<br>
          ${companyAddress.replace(/\n/g, "<br>")}<br>
          State Code: ${stateCode}
        </div>
      </div>
      
      <div class="invoice-title">TAX INVOICE</div>
      
      <div class="invoice-info-section">
        <div class="customer-details">
          <h6>Customer Details:</h6>
          <strong>${selectedCustomer ? selectedCustomer.name : "Select Customer"}</strong><br>
          Address: ${selectedCustomer ? selectedCustomer.billTo.replace(/\n/g, "<br>") : ""}
          <br><br>
          GSTN: <strong>27AADCS1107J2K</strong>
        </div>
        <div class="invoice-details">
          <strong>Invoice No.:</strong> ${invoiceNumber}<br>
          <strong>Invoice Date:</strong> ${new Date(invoiceDate).toLocaleDateString("en-IN")}<br>
          <strong>PO Reference:</strong> Contract<br>
          <strong>Place of Supply:</strong> <strong>Maharashtra</strong><br>
          <strong>State Code:</strong> ${stateCode}<br>
          <strong>Reverse Charge:</strong> No<br><br>
          <strong>SLD Reference #:</strong> ACX-INV-2-J3
        </div>
      </div>
      
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
          ${lineItemsHTML}
          <tr style="border-top: 2px solid #333;">
            <td colspan="7" style="text-align: right; font-weight: bold;">TOTAL</td>
            <td class="amount-col" style="font-weight: bold;">₹${subtotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="totals-section-preview">
        <div class="total-row">
          <span>Taxable Value:</span>
          <span>₹${subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>IGST @ 18.00%:</span>
          <span>₹${taxAmount.toFixed(2)}</span>
        </div>
        <div class="total-row final-total">
          <span>Total Bill Value (INR):</span>
          <span>₹${total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="bank-details-section">
        <div>
          <h6>Our Bank Details for payment:</h6>
          <strong>Bank:</strong> ICICI Bank<br>
          <strong>Branch:</strong> Powai<br>
          <strong>IFSC:</strong> ICIC0000020<br>
          <strong>Account #:</strong> 002005035463
        </div>
        <div class="signature-section">
          <strong>For ${companyName}</strong><br><br><br>
          <strong>Authorised Signatory</strong>
        </div>
      </div>
      
      <div class="footer-section">
        <strong>Registered Office:</strong> 103, First Floor, Srishti Plaza, Saki Vihar Road, Powai, Mumbai – 400072<br>
        <small>CIN AND WAREHOUSING PRIVATE LIMITED is registered under "STARTUP" by the Department of Industrial Policy and Promotion (DIPP) of the Government of India.</small>
      </div>
    </div>
  `

    previewContent.innerHTML = invoiceHTML
    previewSection.style.display = "block"
    previewSection.scrollIntoView({ behavior: "smooth" })
  }

  togglePreview() {
    const previewSection = document.getElementById("invoicePreview")
    previewSection.style.display = previewSection.style.display === "none" ? "block" : "none"
  }
}

// Initialize the invoice generator
const invoiceGen = new InvoiceGenerator()

// Form submission handler
document.getElementById("invoiceForm").addEventListener("submit", (e) => {
  e.preventDefault()

  // Collect form data
  const formData = {
    customer: document.getElementById("customerSelect").value,
    invoiceNumber: document.getElementById("invoiceNumber").value,
    invoiceDate: document.getElementById("invoiceDate").value,
    dueDate: document.getElementById("dueDate").value,
    currency: document.getElementById("currency").value,
    lineItems: [],
    totals: {
      subtotal: document.getElementById("subTotal").textContent,
      total: document.getElementById("totalAmount").textContent,
    },
  }

  // Collect line items
  document.querySelectorAll("#lineItemsBody tr").forEach((row) => {
    formData.lineItems.push({
      name: row.querySelector(".item-name").value,
      description: row.querySelector(".item-description").value,
      quantity: row.querySelector(".item-quantity").value,
      rate: row.querySelector(".item-rate").value,
      tax: row.querySelector(".item-tax").value,
      amount: row.querySelector(".item-amount").textContent,
    })
  })

  // Show success message
  alert("Invoice saved successfully!\n\nInvoice Number: " + formData.invoiceNumber)
  console.log("Invoice Data:", formData)
})
