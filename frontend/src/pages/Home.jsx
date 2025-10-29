import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiDollarSign, FiFileText, FiShield, FiCheckCircle, FiArrowRight, FiMenu, FiX, FiStar, FiUsers, FiClock, FiTrendingUp } from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import "../styles/home.css";

function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && (user.loggedIn || user.name)) {
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error("Error checking user status:", e);
    }
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const features = [
    {
      icon: <FiDollarSign className="feature-icon-svg" />,
      title: "Smart Tax Calculations",
      description: "Advanced algorithms ensure accurate tax calculations with real-time updates and deduction optimization.",
      link: "/dashboard",
      highlight: "AI-Powered"
    },
    {
      icon: <FiFileText className="feature-icon-svg" />,
      title: "Digital Document Hub",
      description: "Cloud-based document management with OCR scanning and automatic categorization.",
      link: "/documents",
      highlight: "Cloud Storage"
    },
    {
      icon: <FiShield className="feature-icon-svg" />,
      title: "Enterprise Security",
      description: "Military-grade encryption, multi-factor authentication, and compliance with all data protection laws.",
      link: "/security",
      highlight: "Bank-Level"
    },
    {
      icon: <FiCheckCircle className="feature-icon-svg" />,
      title: "24/7 Expert Support",
      description: "Round-the-clock assistance from certified tax professionals and AI-powered chat support.",
      link: "/support",
      highlight: "Always Available"
    },
    {
      icon: <FiTrendingUp className="feature-icon-svg" />,
      title: "Tax Optimization",
      description: "Maximize your refunds with intelligent deduction suggestions and tax planning tools.",
      link: "/optimization",
      highlight: "Max Refunds"
    },
    {
      icon: <FiClock className="feature-icon-svg" />,
      title: "Lightning Fast",
      description: "Complete your tax filing in under 15 minutes with our streamlined process.",
      link: "/fast-filing",
      highlight: "15 Min Filing"
    }
  ];

  const featureDetails = [
    {
      heading: "Smart Tax Calculations",
      bullets: [
        "Auto-calculates income from multiple sources (salary, business, investments)",
        "Real-time slab updates and surcharge/cess computation",
        "Detects common mistakes and missing entries before you file",
        "Side-by-side Old vs New Regime comparison to reduce liability"
      ]
    },
    {
      heading: "Digital Document Hub",
      bullets: [
        "Securely upload Form 16, 26AS, AIS/TIS, rent receipts, and proofs",
        "OCR reads key values automatically to pre-fill your return",
        "Smart folders and tags keep everything organized",
        "Download all proofs as a single ZIP for future reference"
      ]
    },
    {
      heading: "Enterprise Security",
      bullets: [
        "AES‑256 encryption at rest and TLS 1.3 in transit",
        "2‑factor authentication and device-based session protection",
        "Regular third‑party security audits and SOC‑2 controls",
        "Granular consent for data access and export"
      ]
    },
    {
      heading: "24/7 Expert Support",
      bullets: [
        "Chat with certified tax professionals any time",
        "Screen-share walkthroughs for complex scenarios",
        "AI assistant drafts responses and explanations",
        "Priority support during peak filing periods"
      ]
    },
    {
      heading: "Tax Optimization",
      bullets: [
        "Personalized deduction suggestions across 80C/80D/HRA/Section 24(b)",
        "Capital gains indexation and set-off recommendations",
        "Advance tax and TDS mismatch alerts",
        "Actionable tips to plan next year’s taxes better"
      ]
    },
    {
      heading: "Lightning Fast",
      bullets: [
        "Guided step-by-step flow finishes filing in under 15 minutes",
        "Auto-imports data where available to save time",
        "One-click e-verification with supported methods",
        "Clean, mobile-friendly interface for filing on the go"
      ]
    }
  ];

  const stats = [
    { value: "50,000+", label: "Happy Users", icon: <FiUsers /> },
    { value: "99.2%", label: "Accuracy Rate", icon: <FiCheckCircle /> },
    { value: "24/7", label: "Expert Support", icon: <FiClock /> },
    { value: "4.9/5", label: "User Rating", icon: <FiStar /> }
  ];

  const testimonials = [
    {
      quote: "TaxMate transformed my tax filing experience completely. The AI-powered suggestions helped me discover deductions I never knew existed, saving me ₹25,000 this year!",
      author: "Sarah Johnson",
      role: "Freelance Designer",
      rating: 5,
      savings: "₹25,000"
    },
    {
      quote: "As a small business owner, TaxMate's document management and automated calculations are game-changers. What used to take weeks now takes just hours.",
      author: "Michael Chen",
      role: "Small Business Owner",
      rating: 5,
      savings: "200+ Hours"
    },
    {
      quote: "The expert support team is incredible. They guided me through complex tax scenarios with patience and expertise. Highly recommended!",
      author: "Priya Sharma",
      role: "IT Professional",
      rating: 5,
      savings: "Peace of Mind"
    }
  ];

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div>
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🚀 New: AI-Powered Tax Optimization</span>
              </div>
          <h1 className="hero-title">
            Transform Your Tax Filing with 
            <span className="hero-highlight"> Smart Technology</span>
          </h1>
          <p className="hero-subtitle">
            Join 50,000+ users who save time and maximize refunds with our intelligent tax platform. 
            Get accurate calculations, expert guidance, and lightning-fast filing.
          </p>
          <div className="hero-features">
            <div className="hero-feature">
              <FiCheckCircle className="hero-feature-icon" />
              <span>15-minute filing</span>
            </div>
            <div className="hero-feature">
              <FiCheckCircle className="hero-feature-icon" />
              <span>Maximum refunds</span>
            </div>
            <div className="hero-feature">
              <FiCheckCircle className="hero-feature-icon" />
              <span>Expert support</span>
          </div>
          </div>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Start Filing Now
              <FiArrowRight className="btn-icon-right" />
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Sign In
            </Link>
          </div>
          <div className="hero-trust">
            <p>Trusted by professionals nationwide • 99.2% accuracy rate</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <h2 className="stats-title">Trusted by Thousands</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          <h2 className="section-title">Why Choose TaxMate?</h2>
          <p className="section-subtitle">Powerful features designed to make tax filing effortless and accurate</p>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
                <div className="feature-header">
              <div className="feature-icon">{feature.icon}</div>
                  <span className="feature-badge">{feature.highlight}</span>
                </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <button
                className="feature-link"
                onClick={() => setActiveFeatureIndex(index)}
                aria-label={`Learn more about ${feature.title}`}
              >
                Learn more <FiArrowRight className="feature-arrow" />
              </button>
            </div>
          ))}
          </div>
        </div>
      </section>

      {activeFeatureIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="feature-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveFeatureIndex(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setActiveFeatureIndex(null);
          }}
          tabIndex={-1}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
        >
          <div
            className="feature-modal"
            style={{
              background: '#fff', borderRadius: 12, maxWidth: 720, width: '92%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0 }}>{featureDetails[activeFeatureIndex].heading}</h2>
              <button
                onClick={() => setActiveFeatureIndex(null)}
                aria-label="Close details"
                style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <ul style={{ marginTop: 16, paddingLeft: 18, lineHeight: 1.7 }}>
              {featureDetails[activeFeatureIndex].bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="testimonials-wrapper">
          <h2 className="section-title">Success Stories from Real Users</h2>
          <p className="section-subtitle">See how TaxMate has transformed tax filing for thousands of users</p>
        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="star-filled" />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.quote}"</p>
                <div className="testimonial-footer">
                  <div className="testimonial-author">
                    <strong>{testimonial.author}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                  <div className="testimonial-savings">
                    <span className="savings-badge">Saved: {testimonial.savings}</span>
                  </div>
                </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Tax Experience?</h2>
            <p className="cta-description">
              Join 50,000+ smart taxpayers who save time and maximize refunds with TaxMate. 
              Start your journey to stress-free tax filing today.
            </p>
            <div className="cta-features">
              <div className="cta-feature">
                <FiCheckCircle className="cta-feature-icon" />
                <span>Free to start</span>
              </div>
              <div className="cta-feature">
                <FiCheckCircle className="cta-feature-icon" />
                <span>No hidden fees</span>
            </div>
              <div className="cta-feature">
                <FiCheckCircle className="cta-feature-icon" />
                <span>Expert support included</span>
            </div>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                Start Filing for Free
                <FiArrowRight className="btn-icon-right" />
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
            <p className="cta-guarantee">
              💯 30-day money-back guarantee • No risk, maximum refunds
            </p>
          </div>
        </div>
      </section>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default Home;
