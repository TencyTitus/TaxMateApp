import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiPhone, FiHome, FiUpload, FiDownload, FiSave } from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import "../styles/profile.css";

function Profile() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    pan: "",
    aadhaar: "",
    bank: { accountNumber: "", ifsc: "", bankName: "", branch: "" },
    contact: { phone: "", address: "" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [taxDocs, setTaxDocs] = useState([]);
  const [docForm, setDocForm] = useState({ docType: "Salary Slip", file: null });
  const [docMsg, setDocMsg] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReportYear, setSelectedReportYear] = useState(new Date().getFullYear());
  
  const docTypes = ["Salary Slip", "Form 16", "Investment Proof", "Other"];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let storedEmail = undefined;
        try {
          const stored = JSON.parse(localStorage.getItem('user'));
          storedEmail = stored?.email || stored?.user?.email;
        } catch {}

        // If no email is present (not logged in), don't fetch seeded/fallback data
        if (!storedEmail) {
          setUser(null);
          setForm(prev => ({ ...prev, email: '' }));
          setTaxDocs([]);
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/user/profile?email=${encodeURIComponent(storedEmail)}`
        );
        setUser(response.data);
        setForm({
          name: response.data.name || "",
          email: response.data.email || storedEmail,
          pan: response.data.pan || "",
          aadhaar: response.data.aadhaar || "",
          bank: response.data.bank || { accountNumber: "", ifsc: "", bankName: "", branch: "" },
          contact: response.data.contact || { phone: "", address: "" }
        });
        setTaxDocs(response.data.taxDocs || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile. Please try again later.");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Open a specific tab via ?tab=documents
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'documents' || tab === 'profile') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format and validate on change
    let formattedValue = value;
    
    // PAN formatting (auto uppercase)
    if (name === 'pan') {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    }
    
    // Aadhaar formatting (only digits, max 12)
    if (name === 'aadhaar') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 12);
      // Auto-format with spaces (XXXX XXXX XXXX)
      if (formattedValue.length > 4 && formattedValue.length <= 8) {
        formattedValue = formattedValue.slice(0, 4) + ' ' + formattedValue.slice(4);
      } else if (formattedValue.length > 8) {
        formattedValue = formattedValue.slice(0, 4) + ' ' + formattedValue.slice(4, 8) + ' ' + formattedValue.slice(8);
      }
    }
    
    // Phone number formatting (only digits, max 10)
    if (name === 'contact.phone') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 10);
    }
    
    // Bank account formatting (only digits)
    if (name === 'bank.accountNumber') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 18);
    }
    
    // IFSC formatting (auto uppercase, alphanumeric only)
    if (name === 'bank.ifsc') {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 11);
    }
    
    // Pincode formatting (only digits, max 6)
    if (name === 'contact.pincode') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 6);
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: formattedValue }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: formattedValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validation
    const validationErrors = [];

    // Name validation
    if (form.name && form.name.trim().length < 2) {
      validationErrors.push("Name must be at least 2 characters");
    }
    if (form.name && !/^[a-zA-Z\s]+$/.test(form.name)) {
      validationErrors.push("Name can only contain letters and spaces");
    }

    // PAN validation (exact format: ABCDE1234F)
    if (form.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(form.pan)) {
        validationErrors.push("PAN must be in format: ABCDE1234F (5 letters, 4 numbers, 1 letter)");
      }
    }

    // Aadhaar validation (exactly 12 digits)
    if (form.aadhaar) {
      const aadhaarClean = form.aadhaar.replace(/\s/g, ''); // Remove spaces
      if (!/^\d{12}$/.test(aadhaarClean)) {
        validationErrors.push("Aadhaar number must be exactly 12 digits");
      }
    }

    // Phone validation
    if (form.contact.phone) {
      const phoneClean = form.contact.phone.replace(/[^0-9]/g, '');
      if (!/^\d{10}$/.test(phoneClean)) {
        validationErrors.push("Phone number must be exactly 10 digits");
      } else if (!/^[6-9]/.test(phoneClean)) {
        validationErrors.push("Phone number must start with 6, 7, 8, or 9");
      }
    }

    // Bank Account Number validation (9-18 digits)
    if (form.bank.accountNumber) {
      const accClean = form.bank.accountNumber.replace(/[^0-9]/g, '');
      if (!/^\d{9,18}$/.test(accClean)) {
        validationErrors.push("Bank account number must be 9-18 digits");
      }
    }

    // IFSC Code validation (exact format: ABCD0123456)
    if (form.bank.ifsc) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(form.bank.ifsc.toUpperCase())) {
        validationErrors.push("IFSC code must be in format: ABCD0123456 (4 letters, 0, 6 alphanumeric)");
      }
    }

    // Pincode validation (exactly 6 digits)
    if (form.contact.pincode) {
      if (!/^\d{6}$/.test(form.contact.pincode)) {
        validationErrors.push("Pincode must be exactly 6 digits");
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }
    
    try {
      const response = await axios.put("http://localhost:5000/api/user/profile", form);
      setUser(response.data);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.error || "Failed to update profile. Please try again.");
    }
  };

  const handleDocChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setDocForm(prev => ({ ...prev, file: files && files[0] ? files[0] : null }));
    } else {
      setDocForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    setDocMsg("");
    if (!docForm.file) {
      setDocMsg("Please select a file to upload");
      return;
    }

    try {
      const data = new FormData();
      data.append('email', form.email);
      data.append('docType', docForm.docType);
      data.append('file', docForm.file);
      const response = await axios.post("http://localhost:5000/api/user/tax-docs", data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTaxDocs(prev => [...prev, response.data]);
      setDocForm({ docType: "Salary Slip", file: null });
      setDocMsg("✅ Document uploaded successfully!");
      
      // Auto-generate report after successful upload
      setTimeout(() => {
        setDocMsg("✅ Document uploaded! You can now generate your tax report.");
      }, 1000);
      
      setTimeout(() => setDocMsg(""), 5000);
    } catch (err) {
      console.error("Error uploading document:", err);
      setDocMsg(err.response?.data?.error || "Failed to upload document");
    }
  };

  const generateTaxReport = async () => {
    setGeneratingReport(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setDocMsg("❌ Please login to generate report.");
        setGeneratingReport(false);
        return;
      }

      // Fetch user's complete profile
      const profileResponse = await axios.get('http://localhost:5000/api/user/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = profileResponse.data;
      
      console.log('📊 User data for report:', userData);
      
      // Filter entries by selected year
      const year = parseInt(selectedReportYear);
      const incomeEntries = (userData.incomeEntries || []).filter(
        e => (e.year || new Date(e.createdAt).getFullYear()) === year
      );
      const deductionEntries = (userData.deductionEntries || []).filter(
        e => (e.year || new Date(e.createdAt).getFullYear()) === year
      );
      
      console.log(`💰 Income entries for ${year}:`, incomeEntries);
      console.log(`📉 Deduction entries for ${year}:`, deductionEntries);
      
      // Calculate totals
      const totalIncome = incomeEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
      const totalDeductions = deductionEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
      
      console.log('✅ Total Income:', totalIncome);
      console.log('✅ Total Deductions:', totalDeductions);
      
      // Tax calculation
      const calculateTax = (taxable, slabs) => {
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
      
      const oldRegimeTaxable = Math.max(0, totalIncome - totalDeductions);
      const oldRegimeTax = calculateTax(oldRegimeTaxable, [[250000, 0], [250000, 0.05], [500000, 0.2]]);
      const newRegimeTax = calculateTax(totalIncome, [[300000, 0], [300000, 0.05], [300000, 0.1], [300000, 0.15], [300000, 0.2]]);
      
      // Generate HTML report
      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Tax Report ${selectedReportYear}-${parseInt(selectedReportYear) + 1} - ${userData.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4f46e5; font-size: 32px; margin-bottom: 10px; }
    .header .subtitle { color: #6b7280; font-size: 14px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-item { padding: 12px; background: #f9fafb; border-radius: 6px; }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
    .amount { text-align: right; font-weight: 600; }
    .total-row { background: #ecfdf5; font-weight: 600; }
    .total-row td { border-top: 2px solid #10b981; color: #065f46; }
    .highlight-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 6px; }
    .highlight-box .title { font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 10px; }
    .highlight-box .value { font-size: 28px; font-weight: 700; color: #1e40af; }
    .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; }
    .documents-list { list-style: none; }
    .documents-list li { padding: 10px; background: #f9fafb; margin: 8px 0; border-radius: 4px; border-left: 3px solid #6366f1; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
    .tax-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .tax-card { padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; }
    .tax-card.recommended { border-color: #10b981; background: #ecfdf5; }
    .tax-card h3 { font-size: 18px; margin-bottom: 10px; }
    .tax-card .tax-amount { font-size: 32px; font-weight: 700; color: #1f2937; margin: 10px 0; }
    .badge { display: inline-block; padding: 4px 12px; background: #10b981; color: white; border-radius: 12px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Tax Assessment Report</h1>
      <div class="subtitle">Financial Year ${selectedReportYear}-${parseInt(selectedReportYear) + 1}</div>
      <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>

    <div class="section">
      <div class="section-title">Personal Information</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Name</div><div class="info-value">${userData.name}</div></div>
        <div class="info-item"><div class="info-label">Email</div><div class="info-value">${userData.email}</div></div>
        <div class="info-item"><div class="info-label">PAN</div><div class="info-value">${userData.pan || 'Not Provided'}</div></div>
        <div class="info-item"><div class="info-label">Phone</div><div class="info-value">${userData.contact?.phone || 'Not Provided'}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Income Summary</div>
      <table>
        <thead>
          <tr><th>Source</th><th class="amount">Amount (₹)</th></tr>
        </thead>
        <tbody>
          ${incomeEntries.length > 0 ? incomeEntries.map(entry => 
            `<tr><td>${entry.source || 'Unknown'}</td><td class="amount">₹${(Number(entry.amount) || 0).toLocaleString('en-IN')}</td></tr>`
          ).join('') : '<tr><td colspan="2" class="empty-state">No income entries found for year ${selectedReportYear}. Please add income in the Dashboard.</td></tr>'}
          ${incomeEntries.length > 0 ? `<tr class="total-row"><td><strong>Total Income</strong></td><td class="amount"><strong>₹${totalIncome.toLocaleString('en-IN')}</strong></td></tr>` : ''}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Deductions Claimed</div>
      <table>
        <thead>
          <tr><th>Section</th><th class="amount">Amount (₹)</th></tr>
        </thead>
        <tbody>
          ${deductionEntries.length > 0 ? deductionEntries.map(entry => 
            `<tr><td>Section ${entry.section || 'Unknown'}</td><td class="amount">₹${(Number(entry.amount) || 0).toLocaleString('en-IN')}</td></tr>`
          ).join('') : '<tr><td colspan="2" class="empty-state">No deduction entries found for year ${selectedReportYear}. Please add deductions in the Dashboard.</td></tr>'}
          ${deductionEntries.length > 0 ? `<tr class="total-row"><td><strong>Total Deductions</strong></td><td class="amount"><strong>₹${totalDeductions.toLocaleString('en-IN')}</strong></td></tr>` : ''}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Tax Regime Comparison</div>
      <div class="tax-comparison">
        <div class="tax-card ${oldRegimeTax <= newRegimeTax ? 'recommended' : ''}">
          <h3>Old Tax Regime ${oldRegimeTax <= newRegimeTax ? '<span class="badge">RECOMMENDED</span>' : ''}</h3>
          <div>Taxable Income: <strong>₹${oldRegimeTaxable.toLocaleString('en-IN')}</strong></div>
          <div class="tax-amount">₹${oldRegimeTax.toLocaleString('en-IN')}</div>
          <div style="font-size: 12px; color: #6b7280;">With deductions applied</div>
        </div>
        <div class="tax-card ${newRegimeTax < oldRegimeTax ? 'recommended' : ''}">
          <h3>New Tax Regime ${newRegimeTax < oldRegimeTax ? '<span class="badge">RECOMMENDED</span>' : ''}</h3>
          <div>Taxable Income: <strong>₹${totalIncome.toLocaleString('en-IN')}</strong></div>
          <div class="tax-amount">₹${newRegimeTax.toLocaleString('en-IN')}</div>
          <div style="font-size: 12px; color: #6b7280;">Without deductions</div>
        </div>
      </div>
    </div>

    <div class="highlight-box">
      <div class="title">💰 Recommended Tax Liability</div>
      <div class="value">₹${Math.min(oldRegimeTax, newRegimeTax).toLocaleString('en-IN')}</div>
      <div style="margin-top: 10px; font-size: 14px; color: #1e40af;">
        ${oldRegimeTax <= newRegimeTax ? 'Choose Old Tax Regime' : 'Choose New Tax Regime'} to save ₹${Math.abs(oldRegimeTax - newRegimeTax).toLocaleString('en-IN')}
      </div>
    </div>

    ${totalDeductions < 150000 && totalIncome > 500000 ? `
    <div class="recommendation">
      <strong>⚠️ Tax Saving Opportunity:</strong> You can claim up to ₹${(150000 - totalDeductions).toLocaleString('en-IN')} more under Section 80C to reduce your tax liability.
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Documents Uploaded</div>
      <ul class="documents-list">
        ${taxDocs.length > 0 ? taxDocs.map(doc => 
          `<li><strong>${doc.docType}</strong> - ${doc.fileName} <span style="color: #6b7280; font-size: 12px;">(Uploaded: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'})</span></li>`
        ).join('') : '<li>No documents uploaded yet</li>'}
      </ul>
    </div>

    <div class="footer">
      <p><strong>TaxMate</strong> - Your Trusted Tax Assistant</p>
      <p>This is a computer-generated report. Please consult a tax professional for official filing.</p>
      <p>Generated for ${userData.email} on ${new Date().toLocaleString('en-IN')}</p>
    </div>
  </div>
</body>
</html>
      `;
      
      // Create and download the report
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TaxMate_Report_${selectedReportYear}_${userData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDocMsg("✅ Tax report generated and downloaded successfully!");
      setTimeout(() => setDocMsg(""), 3000);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setDocMsg("❌ Failed to generate report. Please try again.");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-container">
        <div className="profile-main">
          <div className="error-message">
            <div className="error-message-content">
              <div>
                <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
              <div>
                <p className="error-text">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="profile-container">
          <header className="profile-header">
        <div className="profile-header-content">
          <div className="profile-header-inner">
            <div className="profile-logo-section">
              <div className="profile-logo-container">
                <FiUser className="profile-icon" />
                <span className="profile-title">TaxMate Profile</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-main">
        <div className="profile-tabs">
          <nav className="profile-tabs-nav">
            <button
              className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile Information
            </button>
            <button
              className={`profile-tab ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              Tax Documents
            </button>
          </nav>
        </div>

        {success && (
          <div className="success-message">
            <div className="success-message-content">
              <div>
                <svg className="success-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="success-text">{success}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h3 className="profile-section-title">Profile Information</h3>
              <p className="profile-section-subtitle">Personal and contact details</p>
            </div>
            <div className="profile-section-content">
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-grid">
                  <div className="form-field-half">
                    <label htmlFor="name" className="form-label">
                      Full Name <span className="required-asterisk">*</span>
                    </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                      required
                        value={form.name}
                        onChange={handleChange}
                      className="form-input"
                      />
                  </div>

                  <div className="form-field-half">
                    <label htmlFor="email" className="form-label">
                      Email address <span className="required-asterisk">*</span>
                    </label>
                      <input
                      type="email"
                      name="email"
                        id="email"
                      required
                        value={form.email}
                        onChange={handleChange}
                        disabled
                      className="form-input"
                      />
                  </div>

                  <div className="form-field-half">
                    <label htmlFor="pan" className="form-label">
                      PAN Number
                    </label>
                      <input
                        type="text"
                        name="pan"
                        id="pan"
                        value={form.pan}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                      className="form-input"
                      maxLength="10"
                      style={{ textTransform: 'uppercase' }}
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>Format: 5 letters + 4 digits + 1 letter</small>
                  </div>

                  <div className="form-field-half">
                    <label htmlFor="aadhaar" className="form-label">
                      Aadhaar Number
                    </label>
                      <input
                        type="text"
                        name="aadhaar"
                        id="aadhaar"
                        value={form.aadhaar}
                        onChange={handleChange}
                        placeholder="1234 5678 9012"
                      className="form-input"
                      maxLength="14"
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>12 digits (auto-formatted with spaces)</small>
                  </div>

                  <div className="form-field-full">
                    <h4 className="section-subtitle">Contact Information</h4>
                  </div>

                  <div className="form-field-full">
                    <label htmlFor="contact.phone" className="form-label">
                      Phone Number
                    </label>
                      <input
                      type="tel"
                        name="contact.phone"
                        id="contact.phone"
                        value={form.contact.phone}
                        onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="form-input"
                      maxLength="10"
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>10 digits only</small>
                  </div>

                  <div className="form-field-full">
                    <label htmlFor="contact.address" className="form-label">
                      Address
                    </label>
                      <textarea
                      name="contact.address"
                        id="contact.address"
                      rows="3"
                        value={form.contact.address}
                        onChange={handleChange}
                      placeholder="Enter your complete address"
                      className="form-textarea"
                      />
                  </div>

                  <div className="form-field-full">
                    <h4 className="section-subtitle">Bank Account Details</h4>
                  </div>

                  <div className="form-field-full">
                    <label htmlFor="bank.bankName" className="form-label">
                      Bank Name
                    </label>
                      <input
                        type="text"
                        name="bank.bankName"
                        id="bank.bankName"
                        value={form.bank.bankName}
                        onChange={handleChange}
                      placeholder="State Bank of India"
                      className="form-input"
                      />
                  </div>

                  <div className="form-field-half">
                    <label htmlFor="bank.accountNumber" className="form-label">
                      Account Number
                    </label>
                      <input
                        type="text"
                        name="bank.accountNumber"
                        id="bank.accountNumber"
                        value={form.bank.accountNumber}
                        onChange={handleChange}
                      placeholder="1234567890123456"
                      className="form-input"
                      maxLength="18"
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>9-18 digits only</small>
                  </div>

                  <div className="form-field-half">
                    <label htmlFor="bank.ifsc" className="form-label">
                      IFSC Code
                    </label>
                      <input
                        type="text"
                        name="bank.ifsc"
                        id="bank.ifsc"
                        value={form.bank.ifsc}
                        onChange={handleChange}
                      placeholder="SBIN0001234"
                      className="form-input"
                      maxLength="11"
                      style={{ textTransform: 'uppercase' }}
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px' }}>Format: 4 letters + 0 + 6 alphanumeric</small>
                  </div>

                  <div className="form-field-full">
                    <label htmlFor="bank.branch" className="form-label">
                      Branch Name
                    </label>
                      <input
                        type="text"
                        name="bank.branch"
                        id="bank.branch"
                        value={form.bank.branch}
                        onChange={handleChange}
                      placeholder="Main Branch"
                      className="form-input"
                      />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <FiSave className="btn-icon" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h3 className="profile-section-title">Tax Documents</h3>
              <p className="profile-section-subtitle">Manage your tax-related documents</p>
            </div>
            
            <div className="profile-section-content">
              <div className="upload-section">
                <h4 className="section-subtitle">Upload New Document</h4>
                <form onSubmit={handleDocSubmit} className="upload-form" encType="multipart/form-data">
                  <div className="form-field-half">
                    <label htmlFor="docType" className="form-label">
                          Document Type
                        </label>
                        <select
                      name="docType"
                          id="docType"
                          value={docForm.docType}
                          onChange={handleDocChange}
                      className="form-select"
                    >
                      {docTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                  <div className="form-field-half">
                    <label htmlFor="file" className="form-label">
                          Choose File (PDF, DOC/DOCX, PNG, JPG, GIF)
                        </label>
                    <input
                      type="file"
                      name="file"
                      id="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={handleDocChange}
                      className="file-input"
                    />
                  </div>

                  <div className="form-field-half" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="file-upload-btn">
                      <FiUpload className="btn-icon" />
                      Upload
                    </button>
                  </div>
                  </form>

                {docMsg && (
                  <div className={docMsg.includes("success") ? "success-message" : "error-message"}>
                    <p className={docMsg.includes("success") ? "success-text" : "error-text"}>{docMsg}</p>
                  </div>
                )}
                </div>

              <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e40af', marginBottom: '1rem' }}>📄 Generate Tax Report</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#1e40af' }}>
                  Create a comprehensive tax report with your income, deductions, and tax calculations for a specific year.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="reportYear" style={{ color: '#1e40af', marginBottom: '0.5rem', display: 'block' }}>Select Financial Year</label>
                    <select
                      id="reportYear"
                      className="form-select"
                      value={selectedReportYear}
                      onChange={(e) => setSelectedReportYear(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}-{year + 1}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <button 
                    onClick={generateTaxReport}
                    disabled={generatingReport}
                    className="btn-primary"
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {generatingReport ? 'Generating...' : '📥 Download Report'}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="section-subtitle">Uploaded Documents</h4>
                <table className="documents-table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Document Type</th>
                      <th className="table-header-cell">File Name</th>
                      <th className="table-header-cell">Upload Date</th>
                      <th className="table-header-cell table-header-cell-right">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="table-body">
                      {taxDocs.length > 0 ? (
                        taxDocs.map((doc, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell table-cell-primary">{doc.docType}</td>
                          <td className="table-cell table-cell-secondary">{doc.fileName}</td>
                          <td className="table-cell table-cell-secondary">{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '—'}</td>
                          <td className="table-cell table-cell-right">
                              {doc.fileUrl ? (
                              <a href={doc.fileUrl} download className="download-link">
                                <FiDownload className="download-icon" />
                                </a>
                              ) : (
                              <span className="disabled-icon">
                                <FiDownload className="download-icon" />
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                        <td colSpan="4" className="table-cell no-documents">
                          No documents uploaded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        )}
            </div>
          </div>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default Profile;
