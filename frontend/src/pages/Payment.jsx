import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import { userAPI, paymentAPI } from "../utils/api";

function Payment() {
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "credit",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [loadingTax, setLoadingTax] = useState(true);
  const [currentYear] = useState(new Date().getFullYear());
  const [processingStage, setProcessingStage] = useState(""); // '', 'validating', 'processing', 'complete'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [detectedCardType, setDetectedCardType] = useState("");
  const [existingPayments, setExistingPayments] = useState([]);
  const [hasAlreadyPaid, setHasAlreadyPaid] = useState(false);

  // Detect card type from card number
  const detectCardType = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    if (/^35/.test(cleaned)) return 'JCB';
    if (/^(6304|6706|6709|6771)/.test(cleaned)) return 'RuPay';
    return '';
  };

  // Fetch tax calculation for current year on mount
  useEffect(() => {
    const fetchTaxData = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoadingTax(false);
        return;
      }

      try {
        // Fetch existing payments for current year
        const paymentsRes = await paymentAPI.getPayments();
        const allPayments = paymentsRes.data.payments || [];
        const currentYearPayments = allPayments.filter(p => p.taxYear === currentYear);
        
        setExistingPayments(currentYearPayments);
        
        // Check if already paid for current year
        const totalPaidAmount = currentYearPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
        console.log(`Payment - Existing payments for ${currentYear}:`, currentYearPayments);
        console.log(`Payment - Total already paid for ${currentYear}: ₹${totalPaidAmount}`);
        
        // Fetch income and deduction entries for current year only
        const [incomeRes, deductionRes] = await Promise.all([
          userAPI.getIncomeEntries(currentYear),
          userAPI.getDeductionEntries(currentYear)
        ]);

        const incomeEntries = incomeRes.data.incomeEntries || [];
        const deductionEntries = deductionRes.data.deductionEntries || [];
        
        console.log(`Payment - Income entries for ${currentYear}:`, incomeEntries);
        console.log(`Payment - Deduction entries for ${currentYear}:`, deductionEntries);

        // Calculate totals
        const totalIncome = incomeEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const totalDeductions = deductionEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Tax calculation function
        const computeSlabTax = (taxable, slabs) => {
          let tax = 0;
          let remaining = taxable;
          for (const [limit, rate] of slabs) {
            const chunk = Math.min(remaining, limit);
            if (chunk <= 0) break;
            tax += chunk * rate;
            remaining -= chunk;
          }
          if (remaining > 0) tax += remaining * slabs[slabs.length - 1][1];
          return Math.max(0, Math.round(tax));
        };

        // Calculate tax for old regime (with deductions)
        const oldRegimeTaxable = Math.max(0, totalIncome - totalDeductions);
        const oldRegimeTax = computeSlabTax(oldRegimeTaxable, [[250000, 0], [250000, 0.05], [500000, 0.2]]);

        // Calculate tax for new regime (without deductions)
        const newRegimeTaxable = Math.max(0, totalIncome);
        const newRegimeTax = computeSlabTax(newRegimeTaxable, [[300000, 0], [300000, 0.05], [300000, 0.1], [300000, 0.15], [300000, 0.2]]);

        // Determine best regime
        const recommendedTax = Math.min(oldRegimeTax, newRegimeTax);
        const recommendedRegime = oldRegimeTax <= newRegimeTax ? 'Old Regime' : 'New Regime';
        
        // Calculate remaining amount to pay
        const remainingToPay = Math.max(0, recommendedTax - totalPaidAmount);
        const alreadyPaid = totalPaidAmount >= recommendedTax && recommendedTax > 0;
        
        setHasAlreadyPaid(alreadyPaid);

        setTaxData({
          totalIncome,
          totalDeductions,
          oldRegimeTax,
          newRegimeTax,
          recommendedTax,
          recommendedRegime,
          year: currentYear,
          totalPaidAmount,
          remainingToPay,
          alreadyPaid
        });

        // Pre-fill amount with remaining tax (not already paid amount)
        if (remainingToPay > 0) {
          setForm(prev => ({ ...prev, amount: remainingToPay.toString() }));
        } else {
          setForm(prev => ({ ...prev, amount: "" }));
        }

      } catch (err) {
        console.error('Failed to fetch tax data:', err);
      } finally {
        setLoadingTax(false);
      }
    };

    fetchTaxData();
  }, [currentYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Amount formatting (numbers and decimal only)
    if (name === 'amount') {
      formattedValue = value.replace(/[^0-9.]/g, '');
      // Allow only one decimal point
      const parts = formattedValue.split('.');
      if (parts.length > 2) {
        formattedValue = parts[0] + '.' + parts.slice(1).join('');
      }
      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        formattedValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    // Card number formatting (digits only, with spaces every 4 digits)
    if (name === 'cardNumber') {
      const digitsOnly = value.replace(/[^0-9]/g, '').substring(0, 16);
      const groups = digitsOnly.match(/.{1,4}/g);
      formattedValue = groups ? groups.join(' ') : digitsOnly;
      
      // Detect card type
      setDetectedCardType(detectCardType(formattedValue));
    }
    
    // Expiry date formatting (MM/YY)
    if (name === 'expiryDate') {
      const digitsOnly = value.replace(/[^0-9]/g, '').substring(0, 4);
      if (digitsOnly.length >= 2) {
        formattedValue = digitsOnly.substring(0, 2) + '/' + digitsOnly.substring(2);
      } else {
        formattedValue = digitsOnly;
      }
    }
    
    // CVV formatting (digits only, max 4)
    if (name === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }
    
    // Name on card (letters and spaces only)
    if (name === 'nameOnCard') {
      formattedValue = value.replace(/[^a-zA-Z\s]/g, '').substring(0, 50);
    }
    
    // Phone number (digits only, max 10)
    if (name === 'phone') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 10);
    }
    
    setForm(prev => ({ ...prev, [name]: formattedValue }));
  };

  const generateReceipt = () => {
    // Get user name from localStorage
    let userName = "User";
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      userName = stored?.name || stored?.user?.name || "User";
    } catch {}

    // Map payment method codes to display names
    const paymentMethodNames = {
      'credit': 'Credit Card',
      'debit': 'Debit Card',
      'netbanking': 'Net Banking',
      'upi': 'UPI'
    };

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .receipt-title { font-size: 20px; margin: 10px 0; }
          .receipt-details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; color: #4f46e5; border-top: 2px solid #4f46e5; padding-top: 10px; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TaxMate</div>
          <div class="receipt-title">Payment Receipt</div>
        </div>
        
        <div class="receipt-details">
          <div class="detail-row">
            <span class="detail-label">Customer Name:</span>
            <span>${userName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span>${receiptData.transactionId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span>${new Date().toLocaleTimeString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span>${paymentMethodNames[receiptData.method] || receiptData.method}</span>
          </div>
          ${receiptData.cardNumber && receiptData.cardNumber.length >= 4 ? `
          <div class="detail-row">
            <span class="detail-label">Card Number:</span>
            <span>**** **** **** ${receiptData.cardNumber.slice(-4)}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span>${receiptData.email || 'Not provided'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span>${receiptData.phone || 'Not provided'}</span>
          </div>
          <div class="detail-row total">
            <span>Total Amount Paid:</span>
            <span>₹${Number(receiptData.amount).toLocaleString()}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for using TaxMate!</p>
          <p>This is a computer-generated receipt.</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TaxMate_Receipt_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check terms agreement
    if (!agreedToTerms) {
      setMessage("❌ Please accept the terms and conditions to proceed.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setProcessingStage("validating");

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("Please login to make a payment.");
      setLoading(false);
      setProcessingStage("");
      return;
    }

    // Comprehensive validation
    const validationErrors = [];

    // Amount validation
    const amount = Number(form.amount);
    if (!form.amount || form.amount.trim() === '') {
      validationErrors.push("Amount is required");
    } else if (isNaN(amount) || amount <= 0) {
      validationErrors.push("Please enter a valid positive amount");
    } else if (amount < 1) {
      validationErrors.push("Minimum payment amount is ₹1");
    } else if (amount > 99999999) {
      validationErrors.push("Amount cannot exceed ₹9,99,99,999");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      validationErrors.push("Valid email is required");
    }

    // Phone validation
    const phoneClean = form.phone.replace(/[^0-9]/g, '');
    if (!phoneClean || !/^\d{10}$/.test(phoneClean)) {
      validationErrors.push("Phone number must be exactly 10 digits");
    } else if (!/^[6-9]/.test(phoneClean)) {
      validationErrors.push("Phone number must start with 6, 7, 8, or 9");
    }

    // Card validation for credit/debit
    if (form.paymentMethod === "credit" || form.paymentMethod === "debit") {
      // Card number validation (13-19 digits)
      const cardClean = form.cardNumber.replace(/[^0-9]/g, '');
      if (!cardClean || cardClean.length < 13 || cardClean.length > 19) {
        validationErrors.push("Card number must be 13-19 digits");
      }

      // Expiry date validation (MM/YY format)
      if (!form.expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiryDate)) {
        validationErrors.push("Expiry date must be in MM/YY format");
      } else {
        const [month, year] = form.expiryDate.split('/');
        const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        if (expiry < now) {
          validationErrors.push("Card has expired");
        }
      }

      // CVV validation (3-4 digits)
      if (!form.cvv || !/^\d{3,4}$/.test(form.cvv)) {
        validationErrors.push("CVV must be 3-4 digits");
      }

      // Name on card validation
      if (!form.nameOnCard || form.nameOnCard.trim().length < 2) {
        validationErrors.push("Name on card is required");
      } else if (!/^[a-zA-Z\s]+$/.test(form.nameOnCard)) {
        validationErrors.push("Name on card can only contain letters");
      }
    }

    if (validationErrors.length > 0) {
      setMessage("❌ " + validationErrors.join(". ") + ".");
      setLoading(false);
      setProcessingStage("");
      return;
    }

    try {
      // Simulate payment gateway processing (realistic delays)
      setProcessingStage("validating");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Validate payment details
      
      setProcessingStage("processing");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Process payment
      
      // Prepare payment data
      const paymentData = {
        amount: form.amount,
        paymentMethod: form.paymentMethod,
        email: form.email,
        phone: form.phone,
        nameOnCard: form.nameOnCard,
        cardNumber: form.cardNumber,
        taxYear: currentYear,
        description: `Tax payment for FY ${currentYear}-${currentYear + 1}`
      };

      // Save payment to database
      const response = await paymentAPI.createPayment(paymentData);
      
      setProcessingStage("complete");
      await new Promise(resolve => setTimeout(resolve, 800)); // Show success animation
      
      // Store receipt data
      const savedPayment = response.data.payment;
      const receiptInfo = {
        transactionId: savedPayment.transactionId,
        amount: savedPayment.amount,
        method: savedPayment.paymentMethod,
        date: new Date(savedPayment.createdAt).toLocaleString(),
        cardNumber: form.cardNumber,
        email: savedPayment.email,
        phone: savedPayment.phone,
        nameOnCard: savedPayment.nameOnCard
      };

      setMessage("✅ Payment processed successfully! Your transaction is complete.");
      setReceiptData(receiptInfo);
      
      // Reset form
      setForm({
        amount: "",
        paymentMethod: "credit",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        nameOnCard: "",
        email: "",
        phone: ""
      });
      setAgreedToTerms(false);
      
    } catch (error) {
      console.error('Payment error:', error);
      setMessage("❌ Payment failed: " + (error.response?.data?.error || "Unable to process payment. Please try again."));
      setProcessingStage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="page-content">
          <h1 className="page-title">Make Payment</h1>
          <p className="page-subtitle">Pay your tax liability for Financial Year {currentYear}-{currentYear + 1}</p>

          {/* Tax Summary Section */}
          {loadingTax ? (
            <div className="user-dashboard-section">
              <p style={{ color: '#6b7280' }}>Loading your tax details for {currentYear}-{currentYear + 1}...</p>
            </div>
          ) : taxData ? (
            <div className="user-dashboard-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Tax Liability Summary - FY {currentYear}-{currentYear + 1}</h3>
                <span style={{ 
                  padding: '4px 12px', 
                  background: taxData.alreadyPaid ? '#dcfce7' : '#dbeafe', 
                  color: taxData.alreadyPaid ? '#166534' : '#1e40af', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  fontWeight: '600' 
                }}>
                  {taxData.alreadyPaid ? '✅ Paid' : 'Current Year'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div className="stat-card">
                  <div className="stat-label">Total Income</div>
                  <div className="stat-value">₹{taxData.totalIncome.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Deductions</div>
                  <div className="stat-value">₹{taxData.totalDeductions.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Old Regime Tax</div>
                  <div className="stat-value">₹{taxData.oldRegimeTax.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">New Regime Tax</div>
                  <div className="stat-value">₹{taxData.newRegimeTax.toLocaleString()}</div>
                </div>
                {taxData.totalPaidAmount > 0 && (
                  <div className="stat-card" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
                    <div className="stat-label" style={{ color: '#166534' }}>Already Paid</div>
                    <div className="stat-value" style={{ color: '#166534' }}>₹{taxData.totalPaidAmount.toLocaleString()}</div>
                  </div>
                )}
              </div>
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                background: taxData.alreadyPaid ? '#dcfce7' : '#f0f9ff', 
                border: `1px solid ${taxData.alreadyPaid ? '#86efac' : '#0ea5e9'}`, 
                borderRadius: '8px' 
              }}>
                {taxData.alreadyPaid ? (
                  <>
                    <p style={{ margin: 0, color: '#166534', fontWeight: '600', fontSize: '16px' }}>
                      ✅ Payment Complete for FY {currentYear}-{currentYear + 1}
                    </p>
                    <p style={{ margin: '8px 0 0 0', color: '#15803d', fontSize: '14px' }}>
                      You have already paid ₹{taxData.totalPaidAmount.toLocaleString()} for this financial year. 
                      Your tax obligation is fulfilled.
                    </p>
                    {existingPayments.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #86efac' }}>
                        <p style={{ margin: '0 0 8px 0', color: '#166534', fontWeight: '600', fontSize: '14px' }}>Payment History:</p>
                        {existingPayments.map((payment, idx) => (
                          <div key={idx} style={{ fontSize: '13px', color: '#15803d', marginBottom: '4px' }}>
                            • {new Date(payment.createdAt).toLocaleDateString()} - ₹{payment.amount.toLocaleString()} (ID: {payment.transactionId})
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, color: '#0c4a6e', fontWeight: '600', fontSize: '16px' }}>
                      💡 Recommended Payment for FY {currentYear}-{currentYear + 1}
                    </p>
                    <p style={{ margin: '8px 0 0 0', color: '#0c4a6e', fontSize: '18px', fontWeight: '700' }}>
                      ₹{taxData.remainingToPay.toLocaleString()} using {taxData.recommendedRegime}
                    </p>
                    {taxData.totalPaidAmount > 0 && (
                      <p style={{ margin: '8px 0 0 0', color: '#0c4a6e', fontSize: '14px' }}>
                        You have already paid ₹{taxData.totalPaidAmount.toLocaleString()}. Remaining balance: ₹{taxData.remainingToPay.toLocaleString()}
                      </p>
                    )}
                    {taxData.remainingToPay === 0 && taxData.recommendedTax > 0 ? (
                      <p style={{ margin: '8px 0 0 0', color: '#059669', fontSize: '14px', fontWeight: '600' }}>
                        🎉 All payments completed! No further payment required.
                      </p>
                    ) : taxData.recommendedTax === 0 ? (
                      <p style={{ margin: '8px 0 0 0', color: '#059669', fontSize: '14px', fontWeight: '600' }}>
                        🎉 Great news! You don't owe any tax for {currentYear}-{currentYear + 1}.
                      </p>
                    ) : (
                      <p style={{ margin: '8px 0 0 0', color: '#0c4a6e', fontSize: '14px' }}>
                        This amount is calculated based on your income and deductions for {currentYear}-{currentYear + 1}.
                      </p>
                    )}
                  </>
                )}
              </div>
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '8px' 
              }}>
                <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                  ℹ️ <strong>Note:</strong> This payment is for the current financial year ({currentYear}-{currentYear + 1}). 
                  To view or pay taxes for other years, please check your Tax History.
                </p>
              </div>
            </div>
          ) : (
            <div className="user-dashboard-section">
              <div style={{ 
                padding: '16px', 
                background: '#fee2e2', 
                border: '1px solid #dc2626', 
                borderRadius: '8px' 
              }}>
                <p style={{ margin: 0, color: '#dc2626', fontWeight: '600' }}>No tax data available</p>
                <p style={{ margin: '8px 0 0 0', color: '#7f1d1d', fontSize: '14px' }}>
                  Please login and add your income/deduction entries for {currentYear}-{currentYear + 1} to calculate tax liability.
                </p>
              </div>
            </div>
          )}

          {/* Only show payment form if not already paid and has remaining amount */}
          {!hasAlreadyPaid && taxData && taxData.remainingToPay > 0 && (
          <div className="user-dashboard-section">
            <h3 style={{ marginBottom: '1rem' }}>🔒 Secure Payment Gateway</h3>
            <form onSubmit={handleSubmit} className="profile-form">
              {/* Payment Summary Box */}
              {form.amount && Number(form.amount) > 0 && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Amount to Pay</div>
                  <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
                    ₹{Number(form.amount).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    Tax Payment for FY {currentYear}-{currentYear + 1}
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="form-field-full">
                  <label htmlFor="amount" className="form-label">
                    Amount (₹) <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="amount"
                    id="amount"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter amount"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>Min: ₹1, Max: ₹9,99,99,999 (up to 2 decimal places)</small>
                </div>

                <div className="form-field-full">
                  <label htmlFor="paymentMethod" className="form-label">
                    Payment Method <span className="required-asterisk">*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '8px' }}>
                    {[
                      { value: 'credit', label: 'Credit Card', icon: '💳' },
                      { value: 'debit', label: 'Debit Card', icon: '💳' },
                      { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
                      { value: 'upi', label: 'UPI', icon: '📱' }
                    ].map(method => (
                      <label
                        key={method.value}
                        style={{
                          padding: '12px',
                          border: `2px solid ${form.paymentMethod === method.value ? '#4f46e5' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: form.paymentMethod === method.value ? '#eff6ff' : 'white',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={form.paymentMethod === method.value}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: '20px' }}>{method.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: form.paymentMethod === method.value ? '600' : '400' }}>
                          {method.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {form.paymentMethod === "credit" || form.paymentMethod === "debit" ? (
                  <>
                    <div className="form-field-full">
                      <label htmlFor="cardNumber" className="form-label">
                        Card Number <span className="required-asterisk">*</span>
                        {detectedCardType && (
                          <span style={{ marginLeft: '8px', color: '#059669', fontSize: '14px', fontWeight: '600' }}>
                            {detectedCardType}
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        id="cardNumber"
                        value={form.cardNumber}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>13-16 digits (auto-formatted with spaces)</small>
                    </div>

                    <div className="form-field-half">
                      <label htmlFor="expiryDate" className="form-label">
                        Expiry Date <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        id="expiryDate"
                        value={form.expiryDate}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>Format: MM/YY</small>
                    </div>

                    <div className="form-field-half">
                      <label htmlFor="cvv" className="form-label">
                        CVV <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        id="cvv"
                        value={form.cvv}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="123"
                        maxLength="4"
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>3-4 digits on back of card</small>
                    </div>

                    <div className="form-field-full">
                      <label htmlFor="nameOnCard" className="form-label">
                        Name on Card <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="nameOnCard"
                        id="nameOnCard"
                        value={form.nameOnCard}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="John Doe"
                        maxLength="50"
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>Name as shown on card (letters only)</small>
                    </div>
                  </>
                ) : null}

                <div className="form-field-half">
                  <label htmlFor="email" className="form-label">
                    Email <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="your@email.com"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>Receipt will be sent to this email</small>
                </div>

                <div className="form-field-half">
                  <label htmlFor="phone" className="form-label">
                    Phone Number <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="9876543210"
                    maxLength="10"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>10 digits, starting with 6-9</small>
                </div>
              </div>

               {/* Processing Stages */}
               {processingStage && (
                 <div style={{
                   marginTop: '1.5rem',
                   padding: '1.5rem',
                   background: '#f0f9ff',
                   border: '2px solid #0ea5e9',
                   borderRadius: '8px'
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <div style={{
                       width: '40px',
                       height: '40px',
                       borderRadius: '50%',
                       border: '3px solid #0ea5e9',
                       borderTopColor: 'transparent',
                       animation: 'spin 1s linear infinite'
                     }}></div>
                     <div>
                       <h4 style={{ margin: 0, color: '#0c4a6e', fontSize: '16px', fontWeight: '600' }}>
                         {processingStage === 'validating' && '🔒 Validating Payment Details...'}
                         {processingStage === 'processing' && '💳 Processing Payment...'}
                         {processingStage === 'complete' && '✅ Payment Successful!'}
                       </h4>
                       <p style={{ margin: '4px 0 0 0', color: '#0c4a6e', fontSize: '14px' }}>
                         {processingStage === 'validating' && 'Verifying your payment information'}
                         {processingStage === 'processing' && 'Securely processing your transaction'}
                         {processingStage === 'complete' && 'Your payment has been completed'}
                       </p>
                     </div>
                   </div>
                   <style>{`
                     @keyframes spin {
                       0% { transform: rotate(0deg); }
                       100% { transform: rotate(360deg); }
                     }
                   `}</style>
                 </div>
               )}

               {message && (
                 <div className={message.includes("success") ? "success-message" : "error-message"}>
                   <p className={message.includes("success") ? "success-text" : "error-text"}>{message}</p>
                   {message.includes("success") && receiptData && (
                     <div style={{ marginTop: '16px' }}>
                       <button 
                         type="button"
                         onClick={generateReceipt}
                         className="btn-outline"
                         style={{ marginRight: '8px' }}
                       >
                         📄 Download Receipt
                       </button>
                       <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                         Transaction ID: {receiptData.transactionId}
                       </div>
                     </div>
                   )}
                 </div>
               )}

              {/* Terms and Conditions */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                    I agree to the <a href="#" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Terms and Conditions</a> and 
                    authorize TaxMate to process this payment. I understand that this transaction is for tax payment purposes and is non-refundable.
                  </span>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading || !form.amount || Number(form.amount) <= 0 || !agreedToTerms}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    background: loading || !agreedToTerms ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    cursor: loading || !agreedToTerms ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Processing Payment...
                    </span>
                  ) : (
                    <span>🔒 Pay ₹{form.amount ? Number(form.amount).toLocaleString('en-IN') : "0"} Securely</span>
                  )}
                </button>
                {!agreedToTerms && (
                  <p style={{ marginTop: '12px', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>
                    Please accept the terms and conditions to proceed
                  </p>
                )}
                {taxData && taxData.recommendedTax === 0 && (
                  <p style={{ marginTop: '12px', color: '#059669', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                    ✅ No payment required - You have zero tax liability for FY {currentYear}-{currentYear + 1}!
                  </p>
                )}
              </div>
            </form>
          </div>
          )}

          {/* Security section - always show */}
          <div className="user-dashboard-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔒</span> Payment Security & Trust
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '1rem' }}>
              <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔐</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '16px' }}>SSL Encrypted</h4>
                <p style={{ margin: 0, color: '#15803d', fontSize: '14px' }}>All transactions are secured with 256-bit SSL encryption</p>
              </div>
              <div style={{ padding: '16px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '16px' }}>PCI DSS Compliant</h4>
                <p style={{ margin: 0, color: '#1e3a8a', fontSize: '14px' }}>Payment Card Industry Data Security Standard certified</p>
              </div>
              <div style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '16px' }}>No Card Storage</h4>
                <p style={{ margin: 0, color: '#78350f', fontSize: '14px' }}>Your card details are never stored on our servers</p>
              </div>
              <div style={{ padding: '16px', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#5b21b6', fontSize: '16px' }}>Instant Confirmation</h4>
                <p style={{ margin: 0, color: '#6b21a8', fontSize: '14px' }}>Email receipt sent immediately after payment</p>
              </div>
            </div>
            <div style={{ marginTop: '1rem', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>👁️ Privacy Notice:</strong> We respect your privacy. Your payment information is processed through a secure payment gateway. 
                We do not store your complete card details. For support, contact us at support@taxmate.com
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default Payment;
