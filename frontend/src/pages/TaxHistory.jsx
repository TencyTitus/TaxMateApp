import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import { taxRecordAPI } from "../utils/api";

function TaxHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [showAddYear, setShowAddYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadTaxHistory = () => {
    let storedEmail = "";
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      storedEmail = stored?.email || stored?.user?.email || "";
    } catch {}
    setEmail(storedEmail);

    if (!storedEmail) {
      setRecords([]);
      setError("No user logged in. Please log in to view tax history.");
      setLoading(false);
      return;
    }

    axios.get(`http://localhost:5000/api/user/history?email=${encodeURIComponent(storedEmail)}`)
      .then(res => {
        setRecords(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tax history.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTaxHistory();
  }, []);

  const handleSaveTaxRecord = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("❌ Please login to save tax records.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await taxRecordAPI.saveTaxRecord({ year: selectedYear });
      setMessage(`✅ Tax record for ${selectedYear} saved successfully!`);
      setShowAddYear(false);
      
      // Reload tax history
      loadTaxHistory();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error('Error saving tax record:', err);
      setMessage("❌ " + (err.response?.data?.error || "Failed to save tax record."));
    } finally {
      setSaving(false);
    }
  };

  // Generate year options (current year - 10 to current year + 1)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear + 1; year >= currentYear - 10; year--) {
    yearOptions.push(year);
  }

  const totals = useMemo(() => {
    const income = records.reduce((s, r) => s + (r.income || 0), 0);
    const tax = records.reduce((s, r) => s + (r.tax || 0), 0);
    return { income, tax };
  }, [records]);

  // DO NOT fallback to localStorage - it may contain another user's data
  // If backend returns no data, show empty state instead
  useEffect(() => {
    if (loading) return;
    // Only process if we have no records from backend
    const hasValues = records.some(r => (r.income || 0) > 0 || (r.tax || 0) > 0);
    if (records.length > 0 && hasValues) return;
    
    // If no backend data and no token, don't try localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      // User not authenticated, don't show any data
      return;
    }
  }, [loading, records]);

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <main className="page-main">
          <div className="page-content">
            <p>Loading tax history...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Header />
        <main className="page-main">
          <div className="page-content">
            <p style={{color: 'red'}}>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 className="page-title">Tax History</h1>
              <p className="page-subtitle">Year-wise summary of your filings{email ? ` for ${email}` : ''}.</p>
            </div>
            <button 
              onClick={() => setShowAddYear(!showAddYear)}
              className="btn-primary"
              style={{ height: 'fit-content' }}
            >
              {showAddYear ? '❌ Cancel' : '+ Add Year'}
            </button>
          </div>

          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              background: message.includes('✅') ? '#ecfdf5' : '#fee2e2',
              color: message.includes('✅') ? '#059669' : '#dc2626',
              border: `1px solid ${message.includes('✅') ? '#10b981' : '#ef4444'}`
            }}>
              {message}
            </div>
          )}

          {showAddYear && (
            <div style={{
              padding: '1.5rem',
              marginBottom: '1.5rem',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>Create Tax Record for Year</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="year">Select Year</label>
                  <select
                    id="year"
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSaveTaxRecord}
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Tax Record'}
                </button>
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                This will create a tax record for {selectedYear} based on your income and deduction entries for year {selectedYear}.
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="stat-card"><div className="stat-label">Years Recorded</div><div className="stat-value">{records.length}</div></div>
            <div className="stat-card"><div className="stat-label">Total Income</div><div className="stat-value">₹{totals.income.toLocaleString()}</div></div>
            <div className="stat-card"><div className="stat-label">Total Tax</div><div className="stat-value">₹{totals.tax.toLocaleString()}</div></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              Year
            </th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              Income
            </th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              Tax Paid
            </th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{textAlign:'center', color:'#6b7280', padding: '2rem'}}>
                      No tax history found.
                    </td>
                  </tr>
          ) : (
            records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px" }}>
                  {r.year}
                </td>
                      <td style={{ padding: "12px" }}>
                  ₹{r.income?.toLocaleString()}
                </td>
                      <td style={{ padding: "12px" }}>
                  ₹{r.tax?.toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
          </div>
        </div>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default TaxHistory;
