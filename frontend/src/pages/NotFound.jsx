import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";

function NotFound() {
  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="page-content" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h1 className="page-title" style={{ fontSize: '4rem', color: '#6b7280' }}>404</h1>
          <h2 style={{ fontSize: '1.5rem', color: '#374151', marginBottom: '1rem' }}>Page Not Found</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/" 
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#4f46e5', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '0.375rem',
                fontWeight: '500'
              }}
            >
              Go Home
            </Link>
            <Link 
              to="/dashboard" 
              style={{ 
                padding: '0.75rem 1.5rem', 
                border: '1px solid #d1d5db', 
                color: '#374151', 
                textDecoration: 'none', 
                borderRadius: '0.375rem',
                fontWeight: '500'
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default NotFound;
