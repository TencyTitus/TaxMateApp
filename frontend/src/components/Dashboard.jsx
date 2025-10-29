import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiHome, FiDollarSign, FiFileText, FiBarChart2, FiCreditCard, FiHelpCircle, FiBell, FiUser, FiSettings, FiLogOut, FiUpload, FiPlusCircle, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import AIAssistant from './AIAssistant';
import { userAPI } from '../utils/api';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [taxDocs, setTaxDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [deductionEntries, setDeductionEntries] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Load real user profile + documents
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to use stored user email if available; fall back to email used in Profile.jsx
        let storedUserEmail = undefined;
        try {
          const stored = JSON.parse(localStorage.getItem('user'));
          storedUserEmail = stored?.email || stored?.user?.email;
        } catch {}

        const fallbackEmail = 'tencytitus1@gmail.com';
        const email = encodeURIComponent(storedUserEmail || fallbackEmail);
        const res = await axios.get(`http://localhost:5000/api/user/profile?email=${email}`);
        setProfile(res.data || null);
        setTaxDocs(res.data?.taxDocs || []);
        setLoading(false);
      } catch (e) {
        console.error('Failed to load dashboard data', e);
        setError('Could not load your dashboard data.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load user's income/deduction entries from authenticated API ONLY
  useEffect(() => {
    const loadEntries = async () => {
      const token = localStorage.getItem('token');
      
      console.log(`Dashboard - Loading financial entries for year ${selectedYear}...`);
      
      if (token) {
        // Fetch from authenticated API with year filter
        try {
          const [incomeRes, deductionRes] = await Promise.all([
            userAPI.getIncomeEntries(selectedYear),
            userAPI.getDeductionEntries(selectedYear)
          ]);
          
          const income = incomeRes.data.incomeEntries || [];
          const deductions = deductionRes.data.deductionEntries || [];
          
          console.log(`Dashboard - Income entries loaded for ${selectedYear}:`, income.length, income);
          console.log(`Dashboard - Deduction entries loaded for ${selectedYear}:`, deductions.length, deductions);
          
          setIncomeEntries(income);
          setDeductionEntries(deductions);
        } catch (err) {
          console.error('Failed to load entries from API:', err);
          // DO NOT fallback to localStorage - it may contain another user's data
          // Set empty arrays to show clean state
          setIncomeEntries([]);
          setDeductionEntries([]);
          setError('Failed to load your financial data. Please try refreshing the page.');
        }
      } else {
        // No token - user not authenticated, show empty data
        setIncomeEntries([]);
        setDeductionEntries([]);
        setError('Please login to view your dashboard.');
      }
    };
    
    loadEntries();
    
    // Also reload when window regains focus (e.g., navigating back)
    const handleFocus = () => {
      console.log('Dashboard - Window focused, reloading data...');
      loadEntries();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedYear]); // Re-run when selectedYear changes

  // Derived totals from user-provided entries
  const totals = useMemo(() => {
    const income = incomeEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const deductions = deductionEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const taxable = Math.max(0, income - deductions);
    
    console.log('Dashboard - Calculated totals:', { income, deductions, taxable });
    console.log('Dashboard - Income entries:', incomeEntries);
    console.log('Dashboard - Deduction entries:', deductionEntries);
    
    return { income, deductions, taxable };
  }, [incomeEntries, deductionEntries]);

  // Simple tax calculator (aligned with AI assistant)
  const calculateTax = (oldRegimeInputs, newRegimeInputs) => {
    console.log('calculateTax called with:', { oldRegimeInputs, newRegimeInputs });
    
    const computeSlabTax = (taxable, slabs) => {
      let tax = 0; let remaining = taxable;
      for (const [limit, rate] of slabs) {
        const chunk = Math.min(remaining, limit);
        if (chunk <= 0) break;
        tax += chunk * rate; remaining -= chunk;
      }
      if (remaining > 0) tax += remaining * slabs[slabs.length - 1][1];
      return Math.max(0, Math.round(tax));
    };
    
    const oldTaxable = Math.max(0, (oldRegimeInputs.income || 0) - (oldRegimeInputs.deductions || 0));
    const newTaxable = Math.max(0, (newRegimeInputs.income || 0));
    const oldTax = computeSlabTax(oldTaxable, [[250000,0],[250000,0.05],[500000,0.2]]);
    const newTax = computeSlabTax(newTaxable, [[300000,0],[300000,0.05],[300000,0.1],[300000,0.15],[300000,0.2]]);
    
    const result = { old: { taxable: oldTaxable, tax: oldTax }, newer: { taxable: newTaxable, tax: newTax } };
    console.log('calculateTax result:', result);
    
    return result;
  };

  const comparison = useMemo(() => {
    const result = calculateTax(
      { income: totals.income, deductions: totals.deductions }, 
      { income: totals.income }
    );
    
    console.log('Dashboard - Tax comparison:', {
      oldRegime: result.old,
      newRegime: result.newer,
      totals: totals
    });
    
    return result;
  }, [totals]);

  const user = {
    name: profile?.name || 'User',
    email: profile?.email || '',
    filingProgress: Math.min(100, (taxDocs.length > 0 ? 40 : 10) + (profile?.pan ? 20 : 0) + (profile?.bank?.accountNumber ? 20 : 0) + (profile?.contact?.address ? 20 : 0)),
    income: totals.income,
    deductions: totals.deductions,
    taxLiability: comparison.newer.tax, // default display; detailed comparison below
    regime: comparison.old.tax <= comparison.newer.tax ? 'Old' : 'New',
    savings: Math.abs(comparison.old.tax - comparison.newer.tax),
  };

  // Group income by source/category
  const incomeData = useMemo(() => {
    const map = new Map();
    incomeEntries.forEach((e) => {
      const key = e.source || e.category || 'Income';
      const prev = map.get(key) || 0;
      map.set(key, prev + (Number(e.amount) || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [incomeEntries]);

  const deductionData = useMemo(() => {
    const map = new Map();
    deductionEntries.forEach((e) => {
      const key = e.section || e.category || 'Deduction';
      const prev = map.get(key) || 0;
      map.set(key, prev + (Number(e.amount) || 0));
    });
    return Array.from(map.entries()).map(([name, used]) => ({ name, used }));
  }, [deductionEntries]);

  const regimeComparison = useMemo(() => ([
    { name: 'Old Regime', value: comparison.old.tax },
    { name: 'New Regime', value: comparison.newer.tax },
  ]), [comparison]);

  const documents = taxDocs.length
    ? taxDocs.map(d => ({
        name: `${d.docType} • ${d.fileName}`,
        status: 'uploaded',
        date: d.uploadDate ? new Date(d.uploadDate).toLocaleDateString() : '—'
      }))
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-alert">
            <div className="dashboard-alert-content">
              <div className="dashboard-alert-text">
                <p className="dashboard-alert-message">Loading your dashboard…</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />

      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h1 className="dashboard-welcome-title">Welcome back, {user.name}!</h1>
              <p className="dashboard-welcome-subtitle">Here's your tax filing progress for financial year {selectedYear}-{selectedYear + 1}.</p>
            </div>
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" htmlFor="dashboardYear" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.875rem' }}>Financial Year</label>
              <select
                id="dashboardYear"
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
          <div className="dashboard-progress-container">
            <div className="dashboard-progress-bar">
              <div 
                className="dashboard-progress-fill" 
                style={{ width: `${user.filingProgress}%` }}
              ></div>
            </div>
            <p className="dashboard-progress-text">{user.filingProgress}% Complete</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-actions-grid">
          <button
            className="dashboard-action-card"
            onClick={() => navigate('/income')}
          >
            <div className="dashboard-action-icon"><FiPlusCircle /></div>
            <span className="dashboard-action-label">Add Income</span>
          </button>
          <button
            className="dashboard-action-card"
            onClick={() => navigate('/deductions')}
          >
            <div className="dashboard-action-icon"><FiFileText /></div>
            <span className="dashboard-action-label">Add Deductions</span>
          </button>
          <button
            className="dashboard-action-card"
            onClick={() => navigate('/profile?tab=documents')}
          >
            <div className="dashboard-action-icon"><FiUpload /></div>
            <span className="dashboard-action-label">Upload Documents</span>
          </button>
          <button
            className="dashboard-action-card"
            onClick={() => navigate('/history')}
          >
            <div className="dashboard-action-icon"><FiBarChart2 /></div>
            <span className="dashboard-action-label">Tax Summary</span>
          </button>
            <button
              className="dashboard-action-card"
            onClick={() => navigate('/payment')}
            >
            <div className="dashboard-action-icon"><FiCreditCard /></div>
            <span className="dashboard-action-label">Make Payment</span>
            </button>
        </div>

        {/* Alerts */}
        <div className="dashboard-alert">
          <div className="dashboard-alert-content">
            <div className="dashboard-alert-icon-container">
              <FiAlertCircle className="dashboard-alert-icon" />
            </div>
            <div className="dashboard-alert-text">
              {error ? (
                <p className="dashboard-alert-message">{error}</p>
              ) : (
              <p className="dashboard-alert-message">
                  {documents.length > 0
                    ? `You have ${documents.length} document${documents.length > 1 ? 's' : ''} uploaded.`
                    : 'No documents uploaded yet — add your Form 16, investments, and more.'}
              </p>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-charts-grid">
          {/* Income Sources */}
          <div className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Income Sources</h3>
            <div className="dashboard-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deductions */}
          <div className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Deductions</h3>
            <div className="dashboard-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deductionData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="used" fill="#8884d8" name="Amount (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regime Comparison */}
          <div className="dashboard-chart-card">
            <h3 className="dashboard-chart-title">Tax Regime Comparison</h3>
            <div className="dashboard-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regimeComparison}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Tax Amount (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="dashboard-recommendation">
              <p className="dashboard-recommendation-text">
                <span className="dashboard-recommendation-label">Recommendation:</span> The <span className="dashboard-recommendation-value">{user.regime} Regime</span> saves you ₹{user.savings.toLocaleString()} this year.
              </p>
            </div>
          </div>
        </div>

        {/* Tax Summary */}
        <div className="dashboard-summary-card">
          <h3 className="dashboard-summary-title">Tax Filing Summary</h3>
          <div className="dashboard-summary-grid">
            {[
              { label: 'Total Income', value: `₹${user.income.toLocaleString()}` },
              { label: 'Total Deductions', value: `₹${user.deductions.toLocaleString()}` },
              { label: 'Taxable Income', value: `₹${(Math.max(0, user.income - user.deductions)).toLocaleString()}` },
              { label: 'Tax Liability', value: `₹${user.taxLiability.toLocaleString()}` },
            ].map((item, index) => (
              <div key={index} className="dashboard-summary-item">
                <p className="dashboard-summary-item-label">{item.label}</p>
                <p className="dashboard-summary-item-value">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="dashboard-documents-card">
          <div className="dashboard-documents-header">
            <h3 className="dashboard-documents-title">Documents</h3>
          </div>
          <div className="dashboard-documents-content">
            {documents.length > 0 ? (
            <ul className="dashboard-documents-list">
              {documents.map((doc, index) => (
                <li key={index}>
                  <div className="dashboard-document-item">
                    <div className="dashboard-document-info">
                      <FiFile className="dashboard-document-icon" />
                      <div className="dashboard-document-details">
                        <p className="dashboard-document-name">{doc.name}</p>
                        <p className="dashboard-document-date">Uploaded on {doc.date}</p>
                      </div>
                    </div>
                    <div>
                        <span className="dashboard-document-status uploaded">
                          <FiCheckCircle className="dashboard-document-status-icon" /> Uploaded
                        </span>
                      </div>
                  </div>
                </li>
              ))}
            </ul>
            ) : (
              <div className="dashboard-alert" style={{ marginTop: 12 }}>
                <div className="dashboard-alert-content">
                  <div className="dashboard-alert-text">
                    <p className="dashboard-alert-message">No documents uploaded yet.</p>
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
};

export default Dashboard;