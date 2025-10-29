import React from "react";
import { Link } from "react-router-dom";
import "../styles/shared.css";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="app-footer-grid">
          <div className="app-footer-section">
            <h3 className="app-footer-title">Help</h3>
            <ul className="app-footer-list">
              <li><Link to="/faq" className="app-footer-link">FAQs</Link></li>
              <li><Link to="/support" className="app-footer-link">Contact Support</Link></li>
              <li><Link to="/tutorials" className="app-footer-link">Video Tutorials</Link></li>
              <li><Link to="/guides" className="app-footer-link">Tax Guides</Link></li>
            </ul>
          </div>
          
          <div className="app-footer-section">
            <h3 className="app-footer-title">Legal</h3>
            <ul className="app-footer-list">
              <li><Link to="/privacy" className="app-footer-link">Privacy Policy</Link></li>
              <li><Link to="/terms" className="app-footer-link">Terms of Use</Link></li>
              <li><Link to="/refund" className="app-footer-link">Refund Policy</Link></li>
              <li><Link to="/security" className="app-footer-link">Security</Link></li>
            </ul>
          </div>
          
          <div className="app-footer-section">
            <h3 className="app-footer-title">Company</h3>
            <ul className="app-footer-list">
              <li><Link to="/about" className="app-footer-link">About Us</Link></li>
              <li><Link to="/careers" className="app-footer-link">Careers</Link></li>
              <li><Link to="/blog" className="app-footer-link">Blog</Link></li>
              <li><Link to="/press" className="app-footer-link">Press</Link></li>
            </ul>
          </div>
          
          <div className="app-footer-section">
            <h3 className="app-footer-title">Connect</h3>
            <div className="app-footer-social">
              <a href="#" className="app-footer-social-link" aria-label="Facebook">
                <svg className="app-footer-social-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="app-footer-social-link" aria-label="Twitter">
                <svg className="app-footer-social-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="app-footer-social-link" aria-label="LinkedIn">
                <svg className="app-footer-social-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="app-footer-social-link" aria-label="Instagram">
                <svg className="app-footer-social-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.316-1.296C4.165 14.81 3.662 13.659 3.662 12.362c0-1.297.503-2.448 1.471-3.316.968-.868 2.119-1.371 3.316-1.371s2.448.503 3.316 1.371c.868.868 1.371 2.019 1.371 3.316 0 1.297-.503 2.448-1.371 3.33-.868.881-2.019 1.296-3.316 1.296zm7.072-9.404h-2.963V6.049h2.963v1.535zm0 2.49c-.503-2.019-2.119-3.635-4.138-4.138v2.963c1.297.503 2.284 1.49 2.787 2.787h1.351v-1.612z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <div className="app-footer-newsletter">
              <h4 className="app-footer-newsletter-title">Stay Updated</h4>
              <p className="app-footer-newsletter-text">Get tax tips and updates</p>
              <div className="app-footer-newsletter-form">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="app-footer-newsletter-input"
                />
                <button className="app-footer-newsletter-btn">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="app-footer-bottom">
          <div className="app-footer-copyright">
            <p className="app-footer-copyright-text">
              &copy; {new Date().getFullYear()} TaxMate. All rights reserved.
            </p>
          </div>
          <div className="app-footer-links-bottom">
            <Link to="/sitemap" className="app-footer-link-bottom">Sitemap</Link>
            <Link to="/accessibility" className="app-footer-link-bottom">Accessibility</Link>
            <Link to="/cookies" className="app-footer-link-bottom">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;