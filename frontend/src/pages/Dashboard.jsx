import React from "react";

function Dashboard() {
  return (
    <div className="container">
      <h2>Dashboard</h2>
      <p>Welcome back! Here's a quick overview of your tax activity.</p>
      <ul>
        <li>✔️ Income submitted: ₹5,00,000</li>
        <li>✔️ Tax paid: ₹25,000</li>
        <li>✔️ Last updated: July 6, 2025</li>
      </ul>
    </div>
  );
}

export default Dashboard;
