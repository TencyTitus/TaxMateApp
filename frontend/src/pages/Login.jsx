import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import { migrateLocalStorageToDatabase } from "../utils/migrateLocalStorageData";
import "../styles/login.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", form);

      if (res.status === 200) {
        // Save JWT token and user data to localStorage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user || { loggedIn: true }));
        
        // Attempt to migrate any existing localStorage data to MongoDB
        // This ensures users don't lose their data
        try {
          const migrationResult = await migrateLocalStorageToDatabase();
          if (migrationResult.success && migrationResult.incomeCount > 0 || migrationResult.deductionCount > 0) {
            console.log('✅ Data migration successful:', migrationResult.message);
          }
        } catch (migrationErr) {
          // Don't block login if migration fails
          console.error('Migration failed, but login succeeded:', migrationErr);
        }
        
        // Redirect based on user role
        if (res.data.user?.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/user");
        }
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        // Server responded with error status
        setError(err.response.data.error || err.response.data.message || "Login failed");
      } else if (err.request) {
        // Request was made but no response received
        setError("Unable to connect to server. Please check if the server is running.");
      } else {
        // Something else happened
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
    <div className="login-container">
      <div className="login-box">
        <h2>Login to TaxMate</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '12px' }}>
            <Link 
              to="/forgot-password" 
              style={{ 
                fontSize: '0.875rem', 
                color: '#6c5ce7', 
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Forgot Password?
            </Link>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">Login</button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link 
            to="/register" 
            style={{ 
              color: '#6c5ce7', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
        </div>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default Login;
