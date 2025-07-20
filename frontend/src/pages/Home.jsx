import React, { useState } from "react";

function Home() {
  const [income, setIncome] = useState("");
  const [tax, setTax] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/calculate-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income: parseFloat(income) }),
      });

      if (!res.ok) throw new Error("Failed to fetch tax");

      const data = await res.json();
      setTax(data.tax);
    } catch (error) {
      console.error("Error:", error);
      setTax("Error calculating tax");
    }
  };

  return (
    <div className="container">
      <h1>Welcome to TaxMate</h1>
      <form onSubmit={handleSubmit}>
        <label>Enter Your Income:</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="Eg: 500000"
          required
        />
        <button type="submit">Calculate Tax</button>
      </form>

      {tax !== null && (
        <p>
          {typeof tax === "number" ? `Your calculated tax is ₹${tax}` : tax}
        </p>
      )}
    </div>
  );
}

export default Home;
