import React, { useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import "../styles/register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // loading state

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let tempErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      tempErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      tempErrors.fullName = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
      tempErrors.fullName = "Name can only contain letters and spaces";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Invalid email format (e.g., user@example.com)";
    }

    // Mobile number validation (exactly 10 digits)
    if (!formData.mobile.trim()) {
      tempErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      tempErrors.mobile = "Mobile number must be exactly 10 digits";
    } else if (!/^[6-9]/.test(formData.mobile)) {
      tempErrors.mobile = "Mobile number must start with 6, 7, 8, or 9";
    }

    // Date of Birth validation
    if (!formData.dob) {
      tempErrors.dob = "Date of Birth is required";
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (dob > today) {
        tempErrors.dob = "Date of Birth cannot be in the future";
      } else if (age < 18 || (age === 18 && monthDiff < 0)) {
        tempErrors.dob = "You must be at least 18 years old";
      } else if (age > 100) {
        tempErrors.dob = "Please enter a valid date of birth";
      }
    }

    // Password validation
    if (!formData.password) {
      tempErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      tempErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      tempErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      tempErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      tempErrors.password = "Password must contain at least one number";
    } else if (!/(?=.*[@$!%*?&#])/.test(formData.password)) {
      tempErrors.password = "Password must contain at least one special character (@$!%*?&#)";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Trim inputs before sending
    const trimmedData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      mobile: formData.mobile.trim(),
      dob: formData.dob,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/register",
        trimmedData
      );
      alert(res.data.message || "Registration successful!");
      // Optional: redirect to login page
      // window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="register-container">
      <div className="register-box">
        <h2>Create Your Account</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
          />
          {errors.fullName && <p className="error">{errors.fullName}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="error">{errors.email}</p>}

          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={formData.mobile}
            onChange={handleChange}
          />
          {errors.mobile && <p className="error">{errors.mobile}</p>}

          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
          {errors.dob && <p className="error">{errors.dob}</p>}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <p className="error">{errors.password}</p>}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p className="error">{errors.confirmPassword}</p>
          )}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
        </div>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
};

export default Register;
