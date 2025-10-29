import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiDollarSign, FiBell, FiUser, FiSettings, FiLogOut, FiMenu, FiX, FiArrowLeft } from "react-icons/fi";
import "../styles/shared.css";

function Header() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for changes to localStorage (login/logout from other tabs)
    const syncUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", syncUser);
    // Also update on route change
    syncUser();
    return () => window.removeEventListener("storage", syncUser);
  }, [location]);

  const isLoggedIn = user && (user.loggedIn || user.name);
  const userName = user && (user.name || user.email || "User");
  const isAdmin = user && user.isAdmin;

  const handleLogout = () => {
    // Clear authentication data only
    // DO NOT clear incomeEntries/deductionEntries to preserve user data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Keep financial data for backward compatibility
    // localStorage.removeItem("incomeEntries");     // REMOVED
    // localStorage.removeItem("deductionEntries");  // REMOVED
    setUser(null);
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="app-header">
      <div className="app-header-content">
        <div className="app-header-inner">
          {/* Logo Section */}
          <div className="app-logo-section">
            {/* Back Button */}
            {location.pathname !== '/' && (
              <button 
                onClick={handleBack}
                className="app-back-btn"
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  padding: '8px', 
                  marginRight: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6c5ce7'
                }}
                title="Go back"
              >
                <FiArrowLeft size={20} />
              </button>
            )}
            <Link to="/" className="app-logo-container">
              <FiDollarSign className="app-logo-icon" />
              <span className="app-logo-text">TaxMate</span>
            </Link>
            
            {/* Desktop Navigation */}
            {isLoggedIn && (
              <nav className="app-nav-desktop">
                {isAdmin ? (
                  <>
                    <Link 
                      to="/admin" 
                      className={`app-nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
                    >
                      Admin Panel
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/dashboard" 
                      className={`app-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/profile" 
                      className={`app-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/history" 
                      className={`app-nav-item ${location.pathname === '/history' ? 'active' : ''}`}
                    >
                      History
                    </Link>
                    <Link 
                      to="/user" 
                      className={`app-nav-item ${location.pathname === '/user' ? 'active' : ''}`}
                    >
                      User
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="app-header-actions">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <button className="app-notification-btn" onClick={() => navigate('/notifications')} title="Notifications">
                  <FiBell className="app-notification-icon" />
                </button>

                {/* Profile Dropdown */}
                <div className="app-profile-section">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="app-profile-btn"
                  >
                    <div className="app-profile-avatar">
                      <FiUser className="app-profile-avatar-icon" />
                    </div>
                    <span className="app-profile-name">{userName}</span>
                  </button>
                  
                  {isProfileOpen && (
                    <div className="app-profile-dropdown">
                      <div className="app-profile-dropdown-content">
                        <Link to="/profile" className="app-profile-dropdown-item">
                          <FiUser className="app-profile-dropdown-icon" /> Your Profile
                        </Link>
                        {/* Settings removed as requested */}
                        <button onClick={handleLogout} className="app-profile-dropdown-item">
                          <FiLogOut className="app-profile-dropdown-icon" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="app-auth-buttons">
                <Link to="/login" className="app-btn app-btn-outline">Sign In</Link>
                <Link to="/register" className="app-btn app-btn-primary">Get Started</Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button onClick={toggleMobileMenu} className="app-mobile-menu-btn">
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="app-mobile-menu">
        {isLoggedIn ? (
          <>
            {isAdmin ? (
              <>
                <Link to="/admin" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                  Admin Panel
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                  Dashboard
                </Link>
                <Link to="/profile" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                  Profile
                </Link>
                <Link to="/history" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                  History
                </Link>
                <Link to="/user" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                  User
                </Link>
              </>
            )}
              <button onClick={handleLogout} className="app-mobile-menu-item">
                Sign out
              </button>
          </>
        ) : (
          <>
              <Link to="/" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                Home
              </Link>
              <Link to="/login" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                Sign In
              </Link>
              <Link to="/register" className="app-mobile-menu-item" onClick={closeMobileMenu}>
                Get Started
              </Link>
          </>
        )}
        </div>
      )}
    </header>
  );
}

export default Header;