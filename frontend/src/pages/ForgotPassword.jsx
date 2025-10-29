import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import "../styles/login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Reset password
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/forgot-password", { email });
      
      if (res.status === 200) {
        setSuccess("OTP sent to your email. Please check your inbox.");
        setStep(2);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      if (err.response) {
        setError(err.response.data.error || "Failed to send OTP. Please try again.");
      } else if (err.request) {
        setError("Unable to connect to server. Please check if the server is running.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/verify-otp", { email, otp });
      
      if (res.status === 200) {
        setSuccess("OTP verified successfully. Please enter your new password.");
        setStep(3);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      if (err.response) {
        setError(err.response.data.error || "Invalid or expired OTP. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/reset-password", {
        email,
        otp,
        newPassword
      });
      
      if (res.status === 200) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.response) {
        setError(err.response.data.error || "Failed to reset password. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/forgot-password", { email });
      
      if (res.status === 200) {
        setSuccess("New OTP sent to your email.");
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="login-container">
          <div className="login-box">
            <h2>Forgot Password</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', textAlign: 'center' }}>
              {step === 1 && "Enter your email address to receive an OTP"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Create a new password for your account"}
            </p>

            {/* Step 1: Enter Email */}
            {step === 1 && (
              <form className="login-form" onSubmit={handleRequestOTP}>
                <div>
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {step === 2 && (
              <form className="login-form" onSubmit={handleVerifyOTP}>
                <div>
                  <label>Enter OTP</label>
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6c5ce7',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 3 && (
              <form className="login-form" onSubmit={handleResetPassword}>
                <div>
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            {/* Back to Login Link */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Remember your password?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#6c5ce7', 
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Back to Login
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

export default ForgotPassword;
