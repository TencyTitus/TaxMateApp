import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear authentication data only
    // DO NOT clear incomeEntries/deductionEntries to preserve user data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Keep financial data for backward compatibility
    // localStorage.removeItem("incomeEntries");     // REMOVED
    // localStorage.removeItem("deductionEntries");  // REMOVED
    navigate("/");
  }, [navigate]);

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="page-content">
          <h1 className="page-title">Logging you out...</h1>
          <p>Please wait while we securely log you out.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Logout;
