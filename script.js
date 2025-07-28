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
      "transportation": {
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

    // Try to restore saved form data first
    this.restoreFormData()

    // If no saved data, add initial line item
    if (document.querySelectorAll("#lineItemsBody tr").length === 0) {
      this.addInitialLineItem()
    }

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

    // SAC, ASC, BOE input updates
    const sacInput = document.getElementById("sacInput")
    const ascInput = document.getElementById("ascInput")
    const boeInput = document.getElementById("boeInput")
    if (sacInput && document.getElementById("sacValue")) {
      sacInput.addEventListener("input", (e) => {
        document.getElementById("sacValue").textContent = e.target.value
      })
    }
    if (ascInput && document.getElementById("ascValue")) {
      ascInput.addEventListener("input", (e) => {
        document.getElementById("ascValue").textContent = e.target.value
      })
    }
    if (boeInput && document.getElementById("boeValue")) {
      boeInput.addEventListener("input", (e) => {
        document.getElementById("boeValue").textContent = e.target.value
      })
    }
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
            <input type="number" class="form-control fx-rate" value="${item && item.currency === "USD" ? this.exchangeRate : 1}" min="0" step="0.01">
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
    const inputs = row.querySelectorAll(".item-quantity, .item-rate, .item-currency, .item-tax, .fx-rate")
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
    const fxRate = Number.parseFloat(row.querySelector(".fx-rate").value) || 1

    const subtotal = quantity * rate
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    // Calculate INR amount
    const totalINR = currency === "USD" ? total * fxRate : total

    // Update display
    const currencySymbol = currency === "USD" ? "$" : "₹"

    row.querySelector(".item-amount").textContent = `${currencySymbol}${total.toFixed(2)}`
    row.querySelector(".item-amount-inr").textContent = `₹${totalINR.toFixed(2)}`
  }

  calculateTotals() {
    const rows = document.querySelectorAll("#lineItemsBody tr");
    let subtotal = 0;

    // Calculate subtotal in INR
    rows.forEach((row) => {
      const quantityInput = row.querySelector(".item-quantity");
      if (!quantityInput) return; // Skip rows without item-quantity

      const quantity = Number.parseFloat(quantityInput.value) || 0;
      const rate = Number.parseFloat(row.querySelector(".item-rate").value) || 0;
      const taxRate = Number.parseFloat(row.querySelector(".item-tax").value) || 0;
      const currency = row.querySelector(".item-currency").value;
      const fxRate = Number.parseFloat(row.querySelector(".fx-rate").value) || 1;

      const lineSubtotal = quantity * rate;
      const taxAmount = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + taxAmount;

      // Convert to INR if needed
      const lineTotalINR = currency === "USD" ? lineTotal * fxRate : lineTotal;

      subtotal += lineTotalINR;
    });

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

  generateInvoice() {
    // Store current form data before generating invoice
    this.saveFormData()

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

    // Generate line items HTML
    let lineItemsHTML = ""
    let subtotalINR = 0
    let subtotalUSD = 0

    document.querySelectorAll("#lineItemsBody tr").forEach((row, index) => {
      const nameInput = row.querySelector(".item-name");
      if (!nameInput) return; // Only process product rows

      const description = nameInput.value
      const qty = Number.parseFloat(row.querySelector(".item-quantity").value) || 0
      const rate = Number.parseFloat(row.querySelector(".item-rate").value) || 0
      const uom = row.querySelector(".item-uom").value
      const currency = row.querySelector(".item-currency").value
      const amount = qty * rate
      const fxRate = currency === "USD" ? this.exchangeRate : 1
      const amountINR = currency === "USD" ? amount * fxRate : amount

      if (currency === "USD") {
        subtotalUSD += amount
      } else {
        subtotalINR += amount
      }

      lineItemsHTML += `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${description} </td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${uom}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${qty}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${rate.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${currency}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${amount.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${fxRate.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${amountINR.toFixed(2)}</td>
      </tr>
    `
    })

    // Calculate totals
    const totalTaxableINR = subtotalINR + subtotalUSD * this.exchangeRate
    const igstAmount = totalTaxableINR * 0.18
    const finalTotal = totalTaxableINR + igstAmount

    // Create the invoice HTML
    const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tax Invoice - ${invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
        .invoice-container { max-width: 800px; margin: 0 auto; }
        .header-section { border: 2px solid #000; padding: 10px; margin-bottom: 10px; }
        .company-logo { float: left; width: 100px; }
        .company-details { float: right; text-align: right; }
        .clear { clear: both; }
        .invoice-title { text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0; }
        .customer-section { border: 1px solid #000; padding: 10px; margin-bottom: 10px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 4px; font-size: 10px; }
        .invoice-table th { background: #f0f0f0; text-align: center; font-weight: bold; }
        .totals-section { margin: 20px 0; }
        .tax-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .tax-table th, .tax-table td { border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center; }
        .bank-section { border: 1px solid #000; padding: 10px; margin-top: 20px; }
        .signature-section { text-align: right; margin-top: 30px; }
        .footer-text { font-size: 8px; margin-top: 20px; }
        .amount-words { font-size: 9px; margin: 10px 0; }
        .back-button { 
          background: #4285f4; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 4px; 
          cursor: pointer; 
          margin-bottom: 20px;
          font-size: 12px;
        }
        .back-button:hover {
          background: #3367d6;
        }
        .action-buttons {
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          border-top: 2px solid #000;
        }
        .print-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin: 0 10px;
          font-size: 12px;
        }
        .print-button:hover {
          background: #218838;
        }
      </style>
    </head>
    <body>
      <div class="action-buttons">
        <button class="back-button" onclick="goBackToForm()">← Back to Form</button>
        <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
      </div>
      
      <div class="invoice-container">
        
        <!-- Header Section -->
        <div class="header-section">
          <div class="company-logo">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OifiM3QjvjOScNqwioq9tiUobDoi5F.png" alt="ACCEX Logo" style="width: 80px;">
          </div>
          <div class="company-details">
            <strong>${companyName}</strong><br>
            PAN: ${companyPAN}<br>
            GSTN: ${companyGSTIN}<br>
            CIN: U63030MH2017PTC295034<br>
            DIPP Certificate No.: DIPP5303<br>
            MSME Udyam Registration No.: UDYAM-MH-19-0041547
          </div>
          <div class="clear"></div>
        </div>

        <!-- Invoice Title -->
        <div class="invoice-title">TAX INVOICE</div>

        <!-- Customer Details -->
        <div class="customer-section">
          <div style="float: left; width: 50%;">
            <strong>Customer Details:</strong><br>
            <strong>${selectedCustomer ? selectedCustomer.name : "SCHLUMBERGER ASIA SERVICES LIMITED"}</strong><br>
            Address: P-21, TTC INDUSTRIAL AREA,<br>
            THANE BELAPUR ROAD, MIDC MAHAPE,<br>
            THANE, MAHARASHTRA - 400710 INDIA<br><br>
            GSTN: <strong>27AADCS1107J2K</strong>
          </div>
          <div style="float: right; width: 45%; text-align: right;">
            Invoice No.: <strong>${invoiceNumber}</strong><br>
            Invoice Date: <strong>${new Date(invoiceDate).toLocaleDateString("en-GB")}</strong><br>
            PO Reference: <strong>Contract</strong><br>
            Place of Supply: <strong>Maharashtra</strong><br>
            State Code: <strong>${stateCode}</strong><br>
            Reverse Charge: <strong>No</strong><br><br>
            SLD Reference #: <strong>ACX-INV-2-J3</strong>
          </div>
          <div class="clear"></div>
        </div>

        <!-- Line Items Table -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th rowspan="2" style="width: 25%;">Description of Services</th>
              <th rowspan="2" style="width: 8%;">UOM</th>
              <th colspan="6" style="background: #e0e0e0;">QUANTITY, RATE, AMOUNT & TAX</th>
            </tr>
            <tr>
              <th style="width: 8%;">Qty</th>
              <th style="width: 12%;">Rate</th>
              <th style="width: 8%;">Currency</th>
              <th style="width: 12%;">Amount</th>
              <th style="width: 8%;">FX Rate</th>
              <th style="width: 12%;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHTML}
          </tbody>
        </table>

        <!-- Tax Summary -->
        <div style="margin: 20px 0;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">
            Total Bill Value (USD): $${(finalTotal / this.exchangeRate).toFixed(2)}
          </div>
          <div style="margin-bottom: 10px;"><strong>Summary:</strong></div>
          <table class="tax-table" style="width: 100%;">
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
                <td>${this.exchangeRate.toFixed(2)}</td>
                <td>996729</td>
                <td>18.00%</td>
                <td>${subtotalUSD.toFixed(2)}</td>
                <td>${subtotalINR.toFixed(2)}</td>
                <td>${(subtotalUSD * 0.18).toFixed(2)}</td>
                <td>${(subtotalINR * 0.18).toFixed(2)}</td>
                <td>${(subtotalUSD * 1.18).toFixed(2)}</td>
                <td>${(subtotalINR * 1.18).toFixed(2)}</td>
              </tr>
              <tr>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr style="font-weight: bold;">
                <td>TOTAL</td>
                <td>-</td>
                <td>-</td>
                <td>${subtotalUSD.toFixed(2)}</td>
                <td>${subtotalINR.toFixed(2)}</td>
                <td>${(subtotalUSD * 0.18).toFixed(2)}</td>
                <td>${(subtotalINR * 0.18).toFixed(2)}</td>
                <td>${(subtotalUSD * 1.18).toFixed(2)}</td>
                <td>${(subtotalINR * 1.18).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Amount in Words -->
        <div class="amount-words">
          <strong>Amount in Words:</strong> ${this.numberToWords(finalTotal)} Rupees Only
        </div>

        <!-- Bank Details -->
        <div class="bank-section">
          <strong>Bank Details:</strong><br>
          Bank Name: HDFC Bank<br>
          Account No.: 50200012345678<br>
          IFSC Code: HDFC0001234<br>
          Branch: Mumbai Main Branch
        </div>

        <!-- Signature -->
        <div class="signature-section">
          <br><br>
          <strong>For ${companyName}</strong><br><br><br>
          Authorized Signatory
        </div>

        <!-- Footer -->
        <div class="footer-text" style="text-align: center; margin-top: 30px;">
          This is a computer generated invoice and does not require physical signature.
        </div>

      </div>

      <script>
        function goBackToForm() {
          // Reload the original page
          window.location.reload();
        }
      </script>
    </body>
    </html>
  `

    // Navigate to invoice in same window
    document.open()
    document.write(invoiceHTML)
    document.close()
  }

  // Add method to save form data
  saveFormData() {
    const formData = {
      companyName: document.getElementById("companyName").value,
      companyAddress: document.getElementById("companyAddress").value,
      companyPAN: document.getElementById("companyPAN").value,
      companyGSTIN: document.getElementById("companyGSTIN").value,
      stateCode: document.getElementById("stateCode").value,
      customerSelect: document.getElementById("customerSelect").value,
      invoiceNumber: document.getElementById("invoiceNumber").value,
      invoiceDate: document.getElementById("invoiceDate").value,
      dueDate: document.getElementById("dueDate").value,
      discountValue: document.getElementById("discountValue").value,
      discountUnit: document.getElementById("discountUnit").value,
      adjustment: document.getElementById("adjustment").value,
      currency: document.getElementById("currency").value,
      lineItems: [],
    }

    // Save line items
    document.querySelectorAll("#lineItemsBody tr").forEach((row) => {
      const nameInput = row.querySelector(".item-name");
      if (!nameInput) return; // Only process product rows

      const lineItem = {
        name: nameInput.value,
        uom: row.querySelector(".item-uom").value,
        quantity: row.querySelector(".item-quantity").value,
        rate: row.querySelector(".item-rate").value,
        currency: row.querySelector(".item-currency").value,
        tax: row.querySelector(".item-tax").value,
        fxRate: row.querySelector(".fx-rate").value,
      }
      formData.lineItems.push(lineItem)
    })

    localStorage.setItem("invoiceFormData", JSON.stringify(formData))
  }

  // Add method to restore form data
  restoreFormData() {
    const savedData = localStorage.getItem("invoiceFormData")
    if (savedData) {
      const formData = JSON.parse(savedData)

      // Restore basic form fields
      document.getElementById("companyName").value = formData.companyName || ""
      document.getElementById("companyAddress").value = formData.companyAddress || ""
      document.getElementById("companyPAN").value = formData.companyPAN || ""
      document.getElementById("companyGSTIN").value = formData.companyGSTIN || ""
      document.getElementById("stateCode").value = formData.stateCode || ""
      document.getElementById("customerSelect").value = formData.customerSelect || ""
      document.getElementById("invoiceNumber").value = formData.invoiceNumber || ""
      document.getElementById("invoiceDate").value = formData.invoiceDate || ""
      document.getElementById("dueDate").value = formData.dueDate || ""
      document.getElementById("discountValue").value = formData.discountValue || ""
      document.getElementById("discountUnit").value = formData.discountUnit || ""
      document.getElementById("adjustment").value = formData.adjustment || ""
      document.getElementById("currency").value = formData.currency || ""

      // Update customer info
      this.updateCustomerInfo(formData.customerSelect)

      // Clear existing line items
      document.getElementById("lineItemsBody").innerHTML = ""

      // Restore line items
      if (formData.lineItems && formData.lineItems.length > 0) {
        formData.lineItems.forEach((item) => {
          this.addLineItemFromData(item)
        })
      } else {
        this.addInitialLineItem()
      }

      this.calculateTotals()

      // Clear saved data
      localStorage.removeItem("invoiceFormData")
    }
  }

  // Add method to create line item from saved data
  addLineItemFromData(itemData) {
    const tbody = document.getElementById("lineItemsBody")
    const row = document.createElement("tr")

    row.innerHTML = `
      <td>
          <input type="text" class="form-control item-name" value="${itemData.name || ""}" placeholder="Service description">
        
      </td>
      <td>
          <select class="form-select item-uom">
              <option value="SER" ${itemData.uom === "SER" ? "selected" : ""}>SER</option>
              <option value="VEH" ${itemData.uom === "VEH" ? "selected" : ""}>VEH</option>
              <option value="TON" ${itemData.uom === "TON" ? "selected" : ""}>TON</option>
              <option value="LCL" ${itemData.uom === "LCL" ? "selected" : ""}>LCL</option>
              <option value="HST" ${itemData.uom === "HST" ? "selected" : ""}>HST</option>
          </select>
      </td>
      <td>
          <input type="number" class="form-control item-quantity" value="${itemData.quantity || 1}" min="0" step="0.01">
      </td>
      <td>
          <input type="number" class="form-control item-rate" value="${itemData.rate || 0}" min="0" step="0.01">
      </td>
      <td>
          <select class="form-select item-currency">
              <option value="INR" ${itemData.currency === "INR" ? "selected" : ""}>INR</option>
              <option value="USD" ${itemData.currency === "USD" ? "selected" : ""}>USD</option>
          </select>
      </td>
      <td>
          <span class="item-amount">0.00</span>
      </td>
      <td>
          <input type="number" class="form-control fx-rate" value="${itemData.fxRate || 1}" min="0" step="0.01">
      </td>
      <td>
          <select class="form-select item-tax">
              <option value="0" ${itemData.tax === "0" ? "selected" : ""}>0%</option>
              <option value="5" ${itemData.tax === "5" ? "selected" : ""}>5%</option>
              <option value="12" ${itemData.tax === "12" ? "selected" : ""}>12%</option>
              <option value="18" ${itemData.tax === "18" ? "selected" : ""}>18%</option>
              <option value="28" ${itemData.tax === "28" ? "selected" : ""}>28%</option>
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
    const inputs = row.querySelectorAll(".item-quantity, .item-rate, .item-currency, .item-tax, .fx-rate")
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
  }

  numberToWords(num) {
    // Simple number to words conversion for demo
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    if (num === 0) return "Zero"

    const integerPart = Math.floor(num)

    if (integerPart < 10) return ones[integerPart]
    if (integerPart < 20) return teens[integerPart - 10]
    if (integerPart < 100)
      return tens[Math.floor(integerPart / 10)] + (integerPart % 10 ? " " + ones[integerPart % 10] : "")
    if (integerPart < 1000)
      return (
        ones[Math.floor(integerPart / 100)] +
        " Hundred" +
        (integerPart % 100 ? " " + this.numberToWords(integerPart % 100) : "")
      )

    return "Amount exceeds conversion limit"
  }

  togglePreview() {
    const preview = document.getElementById("invoicePreview")
    if (preview.style.display === "none") {
      preview.style.display = "block"
      this.updatePreview()
    } else {
      preview.style.display = "none"
    }
  }

  updatePreview() {
    // Implementation for preview update
    console.log("Preview updated")
  }
}

// Initialize the invoice generator
const invoiceGen = new InvoiceGenerator()
