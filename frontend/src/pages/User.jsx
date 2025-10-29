import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./User.css";
import AIAssistant from "../components/AIAssistant";
import { userAPI } from "../utils/api";

function User() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [deductionEntries, setDeductionEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadUserData();
  }, [selectedYear]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user from localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || '{}');
      const token = localStorage.getItem("token");
      setProfile(storedUser);

      if (!storedUser.email || !token) {
        setError("Please login to view your dashboard");
        setLoading(false);
        return;
      }

      // Fetch user profile from backend
      try {
        const profileResponse = await axios.get(`http://localhost:5000/api/user/profile?email=${storedUser.email}`);
        const profileData = profileResponse.data;
        
        // Update profile with backend data
        const updatedProfile = {
          ...storedUser,
          ...profileData,
          pan: profileData.pan || storedUser.pan,
          aadhaar: profileData.aadhaar || storedUser.aadhaar,
          bank: profileData.bank || {},
          contact: profileData.contact || {},
          taxDocs: profileData.taxDocs || []
        };
        
        setProfile(updatedProfile);
        localStorage.setItem("user", JSON.stringify(updatedProfile));
      } catch (profileError) {
        console.warn("Could not fetch profile from backend, using local data");
      }

      // Fetch income entries from authenticated API with year filter
      try {
        const incomeResponse = await userAPI.getIncomeEntries(selectedYear);
        setIncomeEntries(incomeResponse.data.incomeEntries || []);
      } catch (incomeError) {
        console.error("Could not fetch income from API:", incomeError);
        // DO NOT fallback to localStorage - it may contain another user's data
        setIncomeEntries([]);
      }

      // Fetch deduction entries from authenticated API with year filter
      try {
        const deductionResponse = await userAPI.getDeductionEntries(selectedYear);
        setDeductionEntries(deductionResponse.data.deductionEntries || []);
      } catch (deductionError) {
        console.error("Could not fetch deductions from API:", deductionError);
        // DO NOT fallback to localStorage - it may contain another user's data
        setDeductionEntries([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load user data. Please try again.");
      setLoading(false);
      
      // Fallback: clear entries if API fails
      setIncomeEntries([]);
      setDeductionEntries([]);
    }
  };

  const totals = useMemo(() => {
    const income = incomeEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const deductions = deductionEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const taxable = Math.max(0, income - deductions);
    
    // Calculate estimated tax based on Indian tax slabs (example)
    let estimatedTax = 0;
    if (taxable <= 250000) {
      estimatedTax = 0;
    } else if (taxable <= 500000) {
      estimatedTax = (taxable - 250000) * 0.05;
    } else if (taxable <= 1000000) {
      estimatedTax = 250000 * 0.05 + (taxable - 500000) * 0.2;
    } else {
      estimatedTax = 250000 * 0.05 + 500000 * 0.2 + (taxable - 1000000) * 0.3;
    }
    
    return { income, deductions, taxable, estimatedTax };
  }, [incomeEntries, deductionEntries]);

  return (
    <div>
      <Header />
      <main>
        <section className="user-dashboard-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Loading your dashboard...</p>
            </div>
          ) : error && !profile ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'red' }}>{error}</p>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ flex: 1 }}>
                  <h1 className="user-dashboard-title">
                    Welcome {profile?.name ? `back, ${profile.name}` : "to Your TaxMate Dashboard"}
                  </h1>
                  <p className="user-dashboard-desc">
                    <strong>TaxMate</strong> is your all-in-one platform for managing tax-related processes. It simplifies tax calculations, securely stores your financial records, generates comprehensive reports, and helps ensure compliance with tax regulations.
                  </p>
                </div>
                <div style={{ minWidth: '200px' }}>
                  <label className="form-label" htmlFor="userYear" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.875rem' }}>Financial Year</label>
                  <select
                    id="userYear"
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
              </div>

              <div className="user-dashboard-main">
                <aside className="user-dashboard-features">
                  <h3>Account Information</h3>
                  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <p><strong>Email:</strong> {profile?.email || 'Not provided'}</p>
                    {profile?.pan && <p><strong>PAN:</strong> {profile.pan}</p>}
                    {profile?.aadhaar && <p><strong>Aadhaar:</strong> {profile.aadhaar}</p>}
                    {profile?.contact?.phone && <p><strong>Phone:</strong> {profile.contact.phone}</p>}
                  </div>
                  
                  <h3>Key Features</h3>
                  <ul>
                    <li>Easy tax calculations</li>
                    <li>Store and manage your financial records</li>
                    <li>Generate detailed tax and financial reports</li>
                    <li>Track compliance status</li>
                    <li>User-friendly and secure</li>
                  </ul>
                  <div className="actions-bar">
                    <button className="btn btn-primary" onClick={() => navigate('/income')}>Add Income</button>
                    <button className="btn btn-outline" onClick={() => navigate('/deductions')}>Add Deduction</button>
                    <button className="btn btn-outline" onClick={() => navigate('/profile?tab=documents')}>Upload Documents</button>
                  </div>
                </aside>

                <div className="user-dashboard-content">
                  <div className="user-dashboard-section">
                    <h3>Your Financial Summary for FY {selectedYear}-{selectedYear + 1}</h3>
                    {incomeEntries.length + deductionEntries.length === 0 ? (
                      <em>No entries yet. Add income and deductions to see your summary.</em>
                    ) : (
                      <div>
                        <div className="stats-grid">
                          <div className="stat-card">
                            <div className="stat-label">Total Income</div>
                            <div className="stat-value">₹{totals.income.toLocaleString()}</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-label">Total Deductions</div>
                            <div className="stat-value">₹{totals.deductions.toLocaleString()}</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-label">Taxable Income</div>
                            <div className="stat-value">₹{totals.taxable.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        {totals.estimatedTax > 0 && (
                          <div style={{ 
                            marginTop: 'var(--spacing-xl)', 
                            padding: 'var(--spacing-lg)', 
                            background: '#fef3c7', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid #fbbf24'
                          }}>
                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#92400e' }}>
                              <strong>Estimated Tax:</strong> ₹{Math.round(totals.estimatedTax).toLocaleString()}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)', color: '#78350f' }}>
                              This is an approximate calculation based on standard tax slabs.
                            </p>
                          </div>
                        )}
                        
                        <div className="recent-block">
                          <h4>Recent Activity</h4>
                          <ul className="recent-list">
                            {[...incomeEntries.map(e => ({...e, kind: 'Income'})), ...deductionEntries.map(e => ({...e, kind: 'Deduction'}))]
                              .sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
                              .slice(0,5)
                              .map((e, i) => (
                                <li key={i}>
                                  <span className="recent-kind">{e.kind}</span>
                                  <span className="recent-desc">{e.source || e.section}</span>
                                  <span className="recent-amount">₹{Number(e.amount).toLocaleString()}</span>
                                  <span className="recent-date">{new Date(e.createdAt).toLocaleDateString()}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="user-dashboard-section">
                    <h3>Tax Calculation Tools</h3>
                    <div className="links-row">
                      <Link className="btn btn-outline" to="/dashboard">Open Calculator</Link>
                      <Link className="btn btn-outline" to="/history">View Tax Summary</Link>
                    </div>
                  </div>

                  <div className="user-dashboard-section">
                    <h3>Reports & Compliance</h3>
                    <div className="links-row">
                      <Link className="btn btn-outline" to="/profile">Profile & Bank Details</Link>
                      <Link className="btn btn-outline" to="/profile?tab=documents">Your Documents</Link>
                    </div>
                    {profile?.taxDocs && profile.taxDocs.length > 0 && (
                      <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                          You have {profile.taxDocs.length} document(s) uploaded.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default User;
