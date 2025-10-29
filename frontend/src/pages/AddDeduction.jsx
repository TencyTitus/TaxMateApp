import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import { userAPI } from "../utils/api";

function AddDeduction() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ section: "80C", amount: "", year: new Date().getFullYear() });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [deductionEntries, setDeductionEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ section: "", amount: "" });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    const isAuth = !!(token && user);
    setIsAuthenticated(isAuth);
    
    if (!isAuth) {
      setMsg("⚠️ Please login to add deduction entries.");
      setLoadingEntries(false);
    }
  }, []);

  // Load deduction entries
  const loadDeductionEntries = async () => {
    try {
      setLoadingEntries(true);
      const response = await userAPI.getDeductionEntries();
      setDeductionEntries(response.data.deductionEntries || []);
    } catch (err) {
      console.error('Failed to load deduction entries:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDeductionEntries();
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication before submitting
    const token = localStorage.getItem("token");
    if (!token) {
      setMsg("❌ Please login to add deduction entries.");
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setLoading(true);
    setMsg("");
    
    try {
      const amount = Number(form.amount);
      
      // Comprehensive validation
      if (!form.amount || form.amount.trim() === '') {
        setMsg("❌ Please enter an amount.");
        setLoading(false);
        return;
      }
      
      if (isNaN(amount) || amount <= 0) {
        setMsg("❌ Please enter a valid positive amount.");
        setLoading(false);
        return;
      }
      
      if (amount < 1) {
        setMsg("❌ Amount must be at least ₹1.");
        setLoading(false);
        return;
      }
      
      if (amount > 99999999) {
        setMsg("❌ Amount cannot exceed ₹9,99,99,999.");
        setLoading(false);
        return;
      }
      
      // Check for decimal places (max 2)
      if (amount.toString().includes('.') && amount.toString().split('.')[1].length > 2) {
        setMsg("❌ Amount can have maximum 2 decimal places.");
        setLoading(false);
        return;
      }
      
      // Section-specific validation
      if (form.section === '80C' && amount > 150000) {
        setMsg("⚠️ Section 80C deduction limit is ₹1,50,000. Amount will be capped.");
      }
      if (form.section === '80D' && amount > 100000) {
        setMsg("⚠️ Section 80D deduction limit is ₹1,00,000. Amount will be capped.");
      }
      
      const entry = { section: form.section, amount: amount, year: Number(form.year) };
      
      // Save to backend via authenticated API
      const response = await userAPI.addDeductionEntry(entry);
      console.log('Deduction added successfully:', response.data);
      setMsg("✅ Deduction saved to your account successfully!");
      setForm({ section: "80C", amount: "", year: new Date().getFullYear() });
      
      // Reload entries to show the new one
      loadDeductionEntries();
      
      // Clear message after 3 seconds
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Failed to save deduction:", err);
      
      // Better error messages
      if (err.response?.status === 401 || err.response?.status === 403) {
        setMsg("❌ Session expired. Please login again.");
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.data?.error) {
        setMsg(`❌ ${err.response.data.error}`);
      } else {
        setMsg("❌ Failed to save. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    const entry = deductionEntries[index];
    setEditingIndex(index);
    setEditForm({ section: entry.section, amount: entry.amount.toString() });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ section: "", amount: "" });
  };

  const handleUpdateSubmit = async (index) => {
    try {
      const entry = { section: editForm.section, amount: Number(editForm.amount) };
      
      if (!entry.amount || entry.amount <= 0) {
        setMsg("❌ Please enter a valid amount.");
        return;
      }
      
      await userAPI.updateDeductionEntry(index, entry);
      setMsg("✅ Deduction updated successfully!");
      setEditingIndex(null);
      setEditForm({ section: "", amount: "" });
      loadDeductionEntries();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error('Failed to update deduction:', err);
      setMsg("❌ Failed to update. Please try again.");
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this deduction entry?')) {
      return;
    }
    
    try {
      await userAPI.deleteDeductionEntry(index);
      setMsg("✅ Deduction deleted successfully!");
      loadDeductionEntries();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error('Failed to delete deduction:', err);
      setMsg("❌ Failed to delete. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="page-content">
          <h1 className="page-title">Add Deduction</h1>
          
          {!isAuthenticated && msg && (
            <div style={{
              padding: '1rem',
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#92400e'
            }}>
              ⚠️ Please <a href="/login" style={{ color: '#6c5ce7', fontWeight: 600 }}>login</a> to add deduction entries.
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
            <div className="form-field-full">
              <label className="form-label" htmlFor="year">Financial Year</label>
              <select id="year" name="year" className="form-select" value={form.year} onChange={handleChange}>
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
            <div className="form-field-full">
              <label className="form-label" htmlFor="section">Section</label>
              <select id="section" name="section" className="form-select" value={form.section} onChange={handleChange}>
                <option>80C</option>
                <option>80D</option>
                <option>HRA</option>
                <option>Section 24(b)</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-field-full">
              <label className="form-label" htmlFor="amount">Amount (₹)</label>
              <input id="amount" name="amount" type="number" className="form-input" value={form.amount} onChange={handleChange} required min="0" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Deduction"}
            </button>
          </form>
          {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

          {/* Deduction Entries List */}
          <div style={{ marginTop: '2rem' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your Deduction Entries</h2>
            
            {loadingEntries ? (
              <p style={{ color: '#6b7280' }}>Loading your deduction entries...</p>
            ) : deductionEntries.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                <p style={{ color: '#6b7280' }}>No deduction entries yet. Add your first deduction above!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>#</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Section</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount (₹)</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date Added</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductionEntries.map((entry, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px' }}>{index + 1}</td>
                        <td style={{ padding: '12px' }}>
                          {editingIndex === index ? (
                            <select
                              value={editForm.section}
                              onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                              className="form-select"
                              style={{ minWidth: '150px' }}
                            >
                              <option>80C</option>
                              <option>80D</option>
                              <option>HRA</option>
                              <option>Section 24(b)</option>
                              <option>Other</option>
                            </select>
                          ) : (
                            entry.section
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {editingIndex === index ? (
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              className="form-input"
                              style={{ width: '150px' }}
                              min="0"
                            />
                          ) : (
                            `₹${entry.amount.toLocaleString()}`
                          )}
                        </td>
                        <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {editingIndex === index ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleUpdateSubmit(index)}
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                ✔️ Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                ❌ Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEdit(index)}
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDelete(index)}
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '14px', borderColor: '#dc2626', color: '#dc2626' }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#0c4a6e', fontWeight: '600' }}>
                    Total Deductions: ₹{deductionEntries.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}
                  </p>
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

export default AddDeduction;


