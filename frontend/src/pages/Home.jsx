import React from "react";
import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">
      <div className="hero-section">
        <img
          src="/images/banner.jpg"
          alt="TaxMate Banner"
          className="hero-image"
        />
        <div className="hero-text">
          <h1>Welcome to TaxMate</h1>
          <p>Your personal income tax companion</p>
          <a href="#features" className="scroll-down-btn">
            Explore Features ↓
          </a>
        </div>
      </div>

      <div id="features" className="features-section">
        <h2>What You Can Do</h2>
        <div className="features-grid">
          <div className="feature-card">
            <img src="/images/calculate.png" alt="Calculate" />
            <h3>Calculate Tax</h3>
            <p>Enter your income and calculate your tax instantly.</p>
            <Link to="/dashboard" className="feature-link">
              Try Now →
            </Link>
          </div>

          <div className="feature-card">
            <img src="/images/history.png" alt="History" />
            <h3>View Tax History</h3>
            <p>Track your past calculations in one place.</p>
            <Link to="/history" className="feature-link">
              Check History →
            </Link>
          </div>

          <div className="feature-card">
            <img src="/images/profile.png" alt="Profile" />
            <h3>Manage Profile</h3>
            <p>Update your account information securely.</p>
            <Link to="/profile" className="feature-link">
              Edit Profile →
            </Link>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to get started?</h2>
        <Link to="/register" className="cta-button">
          Create an Account
        </Link>
      </div>
    </div>
  );
}

export default Home;
