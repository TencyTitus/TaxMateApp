import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIAssistant from '../components/AIAssistant';
import { 
  FiUsers, 
  FiDollarSign, 
  FiFileText, 
  FiTrendingUp, 
  FiSearch,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiDownload,
  FiFilter
} from 'react-icons/fi';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalReturns: 0,
    pendingReviews: 0,
    growthRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.isAdmin) {
      // Redirect non-admin users
      navigate('/user');
    }
  }, [navigate]);

  // Load admin data
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      console.log('🔄 Loading admin data...');
      
      // Fetch all users from backend
      const usersResponse = await axios.get('http://localhost:5000/users');
      const allUsers = usersResponse.data.users || [];
      console.log('✅ Users loaded:', allUsers.length);
      
      // Fetch all payments to calculate revenue
      let allPayments = [];
      try {
        const paymentsResponse = await axios.get('http://localhost:5000/api/admin/all-payments');
        allPayments = paymentsResponse.data.payments || [];
        console.log('✅ Payments loaded:', allPayments.length);
      } catch (err) {
        console.warn('⚠️ Payments endpoint not available:', err.message);
      }

      // Fetch all tax records to calculate filed returns
      let allTaxRecords = [];
      try {
        const taxRecordsResponse = await axios.get('http://localhost:5000/api/admin/all-tax-records');
        allTaxRecords = taxRecordsResponse.data.records || [];
        console.log('✅ Tax records loaded:', allTaxRecords.length);
      } catch (err) {
        console.warn('⚠️ Tax records endpoint not available:', err.message);
      }
      
      // Transform user data to include calculated fields
      const transformedUsers = allUsers.map(user => {
        // Calculate payments for this user
        const userPayments = allPayments.filter(p => p.userId === user._id);
        const userRevenue = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Calculate tax returns for this user
        const userTaxRecords = allTaxRecords.filter(r => r.userId === user._id);
        const userTaxReturns = userTaxRecords.filter(r => r.status === 'filed' || r.status === 'paid').length;
        
        // Calculate total income and deductions
        const totalIncome = (user.incomeEntries || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalDeductions = (user.deductionEntries || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin || false,
          status: user.status || 'active',
          taxReturns: userTaxReturns,
          revenue: userRevenue,
          joinedDate: user.createdAt || new Date().toISOString(),
          // Personal Details
          pan: user.pan,
          aadhaar: user.aadhaar,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          occupation: user.occupation,
          // Contact Details
          contact: user.contact || {},
          // Bank Details
          bank: user.bank || {},
          // Tax Documents
          taxDocs: user.taxDocs || [],
          // Income and Deductions
          incomeEntries: user.incomeEntries || [],
          deductionEntries: user.deductionEntries || [],
          totalIncome,
          totalDeductions,
          // Preferences
          preferences: user.preferences || {},
          // Timestamps
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      });
      
      setUsers(transformedUsers);
      console.log('✅ Transformed users:', transformedUsers.length);

      // Calculate statistics
      const totalUsers = transformedUsers.length;
      const totalRevenue = transformedUsers.reduce((sum, user) => sum + (user.revenue || 0), 0);
      const totalReturns = transformedUsers.reduce((sum, user) => sum + (user.taxReturns || 0), 0);
      
      // Calculate pending reviews (users with status 'pending')
      const pendingReviews = transformedUsers.filter(u => u.status === 'pending').length;
      
      // Calculate growth rate (compare with last month - would need historical data)
      const growthRate = 12.5; // This would be calculated from historical data

      setStats({
        totalUsers,
        totalRevenue,
        totalReturns,
        pendingReviews,
        growthRate
      });

      // Build recent activities from real data
      const activities = [];

      // Add recent user registrations (last 5 users)
      const recentUsers = allUsers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      recentUsers.forEach(user => {
        activities.push({
          type: 'user',
          icon: 'users',
          text: `New user registration: ${user.name}`,
          time: new Date(user.createdAt),
          color: { bg: '#eef2ff', fg: '#4f46e5' }
        });
      });

      // Add pending user accounts (need admin approval)
      const pendingUsers = allUsers
        .filter(u => u.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      pendingUsers.forEach(user => {
        activities.push({
          type: 'pending',
          icon: 'alert',
          text: `Pending approval: ${user.name} needs account activation`,
          time: new Date(user.createdAt),
          color: { bg: '#fef3c7', fg: '#f59e0b' },
          priority: 'high'
        });
      });

      // Add suspended users (admin action needed)
      const suspendedUsers = allUsers
        .filter(u => u.status === 'suspended')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 3);
      
      suspendedUsers.forEach(user => {
        activities.push({
          type: 'suspended',
          icon: 'alert',
          text: `Suspended account: ${user.name} - Review required`,
          time: new Date(user.updatedAt || user.createdAt),
          color: { bg: '#fee2e2', fg: '#ef4444' },
          priority: 'high'
        });
      });

      // Add recent tax returns (filed/paid)
      const recentTaxReturns = allTaxRecords
        .filter(r => r.status === 'filed' || r.status === 'paid')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5);
      
      recentTaxReturns.forEach(record => {
        const user = allUsers.find(u => u._id === record.userId);
        activities.push({
          type: 'tax',
          icon: 'check',
          text: `Tax return ${record.status}: ${user?.name || 'User'} (${record.year})`,
          time: new Date(record.updatedAt || record.createdAt),
          color: { bg: '#ecfdf5', fg: '#10b981' }
        });
      });

      // Add draft tax returns (user needs help)
      const draftTaxReturns = allTaxRecords
        .filter(r => r.status === 'draft')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      draftTaxReturns.forEach(record => {
        const user = allUsers.find(u => u._id === record.userId);
        activities.push({
          type: 'draft',
          icon: 'file',
          text: `Incomplete tax return: ${user?.name || 'User'} (${record.year}) - May need assistance`,
          time: new Date(record.createdAt),
          color: { bg: '#fef3c7', fg: '#f59e0b' }
        });
      });

      // Add recent payments
      const recentPayments = allPayments
        .filter(p => p.status === 'completed')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      recentPayments.forEach(payment => {
        const user = allUsers.find(u => u._id === payment.userId);
        activities.push({
          type: 'payment',
          icon: 'dollar',
          text: `Payment received: ₹${payment.amount.toLocaleString()} from ${user?.name || 'User'}`,
          time: new Date(payment.createdAt),
          color: { bg: '#ecfdf5', fg: '#10b981' }
        });
      });

      // Add failed payments (need follow-up)
      const failedPayments = allPayments
        .filter(p => p.status === 'failed')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      failedPayments.forEach(payment => {
        const user = allUsers.find(u => u._id === payment.userId);
        activities.push({
          type: 'error',
          icon: 'x',
          text: `Payment failed: ${user?.name || 'User'} (₹${payment.amount.toLocaleString()}) - Follow-up needed`,
          time: new Date(payment.createdAt),
          color: { bg: '#fee2e2', fg: '#ef4444' },
          priority: 'medium'
        });
      });

      // Add pending payments (awaiting processing)
      const pendingPayments = allPayments
        .filter(p => p.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      pendingPayments.forEach(payment => {
        const user = allUsers.find(u => u._id === payment.userId);
        activities.push({
          type: 'pending_payment',
          icon: 'alert',
          text: `Pending payment: ₹${payment.amount.toLocaleString()} from ${user?.name || 'User'} - Verify transaction`,
          time: new Date(payment.createdAt),
          color: { bg: '#fef3c7', fg: '#f59e0b' },
          priority: 'high'
        });
      });

      // Add users with high income but no deductions (optimization opportunity)
      const highIncomeUsers = transformedUsers
        .filter(u => {
          const userObj = allUsers.find(user => user._id === u.id);
          const totalIncome = (userObj?.incomeEntries || []).reduce((sum, e) => sum + e.amount, 0);
          const totalDeductions = (userObj?.deductionEntries || []).reduce((sum, e) => sum + e.amount, 0);
          return totalIncome > 500000 && totalDeductions === 0;
        })
        .slice(0, 2);
      
      highIncomeUsers.forEach(user => {
        activities.push({
          type: 'optimization',
          icon: 'trending',
          text: `Tax optimization opportunity: ${user.name} - Suggest deductions`,
          time: new Date(user.joinedDate),
          color: { bg: '#ede9fe', fg: '#7c3aed' },
          priority: 'low'
        });
      });

      // Add inactive users (no activity in 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const inactiveUsers = allUsers
        .filter(u => {
          const lastLogin = u.lastLogin ? new Date(u.lastLogin) : new Date(u.createdAt);
          return lastLogin < thirtyDaysAgo && u.status === 'active';
        })
        .slice(0, 2);
      
      inactiveUsers.forEach(user => {
        activities.push({
          type: 'inactive',
          icon: 'alert',
          text: `Inactive user: ${user.name} - Consider re-engagement email`,
          time: new Date(user.lastLogin || user.createdAt),
          color: { bg: '#fef3c7', fg: '#f59e0b' },
          priority: 'low'
        });
      });

      // Add system alerts (users without complete profiles)
      const incompleteProfiles = allUsers
        .filter(user => !user.pan || !user.aadhaar || !user.bank?.accountNumber)
        .slice(0, 2);
      
      incompleteProfiles.forEach(user => {
        const missingField = !user.pan ? 'PAN' : !user.aadhaar ? 'Aadhaar' : 'bank details';
        activities.push({
          type: 'incomplete',
          icon: 'alert',
          text: `Incomplete profile: ${user.name} - Missing ${missingField}`,
          time: new Date(user.updatedAt || user.createdAt),
          color: { bg: '#fef3c7', fg: '#f59e0b' },
          priority: 'medium'
        });
      });

      // Sort all activities by time (most recent first) and take top 15
      const sortedActivities = activities
        .sort((a, b) => b.time - a.time)
        .slice(0, 15);

      setRecentActivities(sortedActivities);
      console.log('✅ Activities loaded:', sortedActivities.length);

    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show user-friendly error
      alert(`Failed to load admin data: ${error.message}

Please ensure:
1. Backend server is running (npm start in backend folder)
2. MongoDB is running
3. Check browser console for details`);
      
      // Fallback to empty data if API fails
      setUsers([]);
      setStats({ totalUsers: 0, totalRevenue: 0, totalReturns: 0, pendingReviews: 0, growthRate: 0 });
      setRecentActivities([]);
    }
  };



  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5000/users/${userId}`);
        // Reload data after deletion
        loadAdminData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/users/${userId}/status`, { status: newStatus });
      
      // Update local state immediately
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      );
      setUsers(updatedUsers);
      
      // Update selected user if modal is open
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;
    
    try {
      // Update the user status
      await handleUpdateUserStatus(selectedUser.id, selectedUser.status);
      setShowUserModal(false);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error saving user changes:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Tax Returns', 'Revenue', 'Joined Date'],
      ...filteredUsers.map(u => [
        u.name,
        u.email,
        u.status,
        u.taxReturns || 0,
        u.revenue || 0,
        new Date(u.joinedDate).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxmate-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <Header />
      <main className="admin-container">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage users, monitor system, and view analytics</p>
          </div>
          <button onClick={exportToCSV} className="btn btn-primary">
            <FiDownload /> Export Data
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <FiUsers size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Users</p>
              <h3 className="admin-stat-value">{stats.totalUsers.toLocaleString()}</h3>
              <p className="admin-stat-trend positive">
                <FiTrendingUp size={14} /> +{stats.growthRate}% this month
              </p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <FiDollarSign size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Revenue</p>
              <h3 className="admin-stat-value">₹{stats.totalRevenue.toLocaleString()}</h3>
              <p className="admin-stat-trend positive">
                <FiTrendingUp size={14} /> +8.2% this month
              </p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>
              <FiFileText size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Tax Returns Filed</p>
              <h3 className="admin-stat-value">{stats.totalReturns.toLocaleString()}</h3>
              <p className="admin-stat-trend positive">
                <FiTrendingUp size={14} /> +15.3% this month
              </p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
              <FiAlertCircle size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Pending Reviews</p>
              <h3 className="admin-stat-value">{stats.pendingReviews || 0}</h3>
              <p className="admin-stat-trend negative">
                <FiAlertCircle size={14} /> {stats.pendingReviews > 0 ? 'Needs attention' : 'All clear'}
              </p>
            </div>
          </div>
        </div>

        {/* Users Management Section */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">User Management</h2>
            <div className="admin-controls">
              <div className="admin-search-box">
                <FiSearch className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="admin-search-input"
                />
              </div>
              <div className="admin-filter-box">
                <FiFilter className="admin-filter-icon" />
                <select 
                  value={filterStatus} 
                  onChange={handleFilterChange}
                  className="admin-filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Tax Returns</th>
                  <th>Revenue</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No users found. Try adjusting your search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="admin-user-name">{user.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`admin-status-badge ${user.status || 'active'}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td>{user.taxReturns || 0}</td>
                      <td>₹{(user.revenue || 0).toLocaleString()}</td>
                      <td>{new Date(user.joinedDate || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-action-buttons">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="admin-action-btn"
                            title="View Details"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="admin-action-btn admin-action-delete"
                            title="Delete User"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="admin-section">
          <h2 className="admin-section-title">Recent Activity</h2>
          <div className="admin-activity-list">
            {recentActivities.length === 0 ? (
              <div className="admin-activity-item">
                <div className="admin-activity-content">
                  <p className="admin-activity-text" style={{ color: '#6b7280', textAlign: 'center', width: '100%' }}>
                    No recent activity to display
                  </p>
                </div>
              </div>
            ) : (
              recentActivities.map((activity, index) => {
                // Helper function to get icon component
                const getIcon = (iconType) => {
                  switch(iconType) {
                    case 'users': return <FiUsers size={16} />;
                    case 'check': return <FiCheck size={16} />;
                    case 'file': return <FiFileText size={16} />;
                    case 'dollar': return <FiDollarSign size={16} />;
                    case 'x': return <FiX size={16} />;
                    case 'alert': return <FiAlertCircle size={16} />;
                    case 'trending': return <FiTrendingUp size={16} />;
                    default: return <FiFileText size={16} />;
                  }
                };

                // Helper function to format time ago
                const getTimeAgo = (date) => {
                  const now = new Date();
                  const diff = Math.floor((now - date) / 1000); // seconds
                  
                  if (diff < 60) return 'Just now';
                  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
                  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
                  return date.toLocaleDateString();
                };

                return (
                  <div key={index} className="admin-activity-item">
                    <div 
                      className="admin-activity-icon" 
                      style={{ 
                        backgroundColor: activity.color.bg, 
                        color: activity.color.fg 
                      }}
                    >
                      {getIcon(activity.icon)}
                    </div>
                    <div className="admin-activity-content">
                      <p className="admin-activity-text">{activity.text}</p>
                      <p className="admin-activity-time">{getTimeAgo(activity.time)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>User Details - {selectedUser.name}</h3>
              <button onClick={() => setShowUserModal(false)} className="admin-modal-close">
                <FiX size={20} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Basic Information */}
              <h4 style={{ marginTop: '0', marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Basic Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="admin-modal-field">
                  <label>Name</label>
                  <p>{selectedUser.name || 'N/A'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Status</label>
                  <select
                    value={selectedUser.status || 'active'}
                    onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                    className="admin-modal-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="admin-modal-field">
                  <label>Account Type</label>
                  <p>{selectedUser.isAdmin ? 'Admin' : 'User'}</p>
                </div>
              </div>

              {/* Personal Details */}
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Personal Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="admin-modal-field">
                  <label>PAN</label>
                  <p>{selectedUser.pan || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Aadhaar</label>
                  <p>{selectedUser.aadhaar || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Date of Birth</label>
                  <p>{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Gender</label>
                  <p>{selectedUser.gender || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Occupation</label>
                  <p>{selectedUser.occupation || 'Not provided'}</p>
                </div>
              </div>

              {/* Contact Details */}
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Contact Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="admin-modal-field">
                  <label>Phone</label>
                  <p>{selectedUser.contact?.phone || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>City</label>
                  <p>{selectedUser.contact?.city || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <p>{selectedUser.contact?.address || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>State</label>
                  <p>{selectedUser.contact?.state || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Pincode</label>
                  <p>{selectedUser.contact?.pincode || 'Not provided'}</p>
                </div>
              </div>

              {/* Bank Details */}
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Bank Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="admin-modal-field">
                  <label>Account Number</label>
                  <p>{selectedUser.bank?.accountNumber || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>IFSC Code</label>
                  <p>{selectedUser.bank?.ifsc || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Bank Name</label>
                  <p>{selectedUser.bank?.bankName || 'Not provided'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Branch</label>
                  <p>{selectedUser.bank?.branch || 'Not provided'}</p>
                </div>
              </div>

              {/* Tax Information */}
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Tax Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="admin-modal-field">
                  <label>Tax Returns Filed</label>
                  <p>{selectedUser.taxReturns || 0}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Total Revenue</label>
                  <p>₹{(selectedUser.revenue || 0).toLocaleString()}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Total Income</label>
                  <p>₹{(selectedUser.totalIncome || 0).toLocaleString()}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Total Deductions</label>
                  <p>₹{(selectedUser.totalDeductions || 0).toLocaleString()}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Tax Regime</label>
                  <p>{selectedUser.preferences?.taxRegime || 'Not set'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Documents Uploaded</label>
                  <p>{selectedUser.taxDocs?.length || 0}</p>
                </div>
              </div>

              {/* Income Entries */}
              {selectedUser.incomeEntries && selectedUser.incomeEntries.length > 0 && (
                <>
                  <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                    Income Entries (Total: {selectedUser.incomeEntries.length})
                  </h4>
                  <div style={{ marginBottom: '25px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Source</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Amount</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Year</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.incomeEntries
                          .sort((a, b) => {
                            const yearA = a.year || new Date(a.createdAt).getFullYear();
                            const yearB = b.year || new Date(b.createdAt).getFullYear();
                            return yearB - yearA; // Sort by year descending
                          })
                          .map((entry, idx) => (
                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                              <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>{entry.source}</td>
                              <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontWeight: '500', color: '#10b981' }}>₹{entry.amount?.toLocaleString()}</td>
                              <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ 
                                  backgroundColor: '#dbeafe', 
                                  color: '#1e40af', 
                                  padding: '4px 12px', 
                                  borderRadius: '12px', 
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {entry.year || new Date(entry.createdAt).getFullYear()}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Deduction Entries */}
              {selectedUser.deductionEntries && selectedUser.deductionEntries.length > 0 && (
                <>
                  <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                    Deduction Entries (Total: {selectedUser.deductionEntries.length})
                  </h4>
                  <div style={{ marginBottom: '25px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Section</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Amount</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Year</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.deductionEntries
                          .sort((a, b) => {
                            const yearA = a.year || new Date(a.createdAt).getFullYear();
                            const yearB = b.year || new Date(b.createdAt).getFullYear();
                            return yearB - yearA; // Sort by year descending
                          })
                          .map((entry, idx) => (
                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                              <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>{entry.section}</td>
                              <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontWeight: '500', color: '#f59e0b' }}>₹{entry.amount?.toLocaleString()}</td>
                              <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ 
                                  backgroundColor: '#fef3c7', 
                                  color: '#92400e', 
                                  padding: '4px 12px', 
                                  borderRadius: '12px', 
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {entry.year || new Date(entry.createdAt).getFullYear()}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Preferences */}
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Preferences</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="admin-modal-field">
                  <label>Email Notifications</label>
                  <p>{selectedUser.preferences?.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>SMS Notifications</label>
                  <p>{selectedUser.preferences?.smsNotifications ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              {/* Account Activity */}
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Account Activity</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="admin-modal-field">
                  <label>Joined Date</label>
                  <p>{new Date(selectedUser.createdAt || selectedUser.joinedDate || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Last Login</label>
                  <p>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Last Updated</label>
                  <p>{selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowUserModal(false)} className="btn btn-outline">
                Close
              </button>
              <button onClick={handleSaveUserChanges} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <AIAssistant />
    </div>
  );
}

export default AdminDashboard;
