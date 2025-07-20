import React from "react";

function TaxHistory() {
  const records = [
    { year: 2024, income: 500000, tax: 25000 },
    { year: 2023, income: 450000, tax: 20000 },
  ];

  return (
    <div className="container">
      <h2>Tax History</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              Year
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              Income
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              Tax Paid
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {r.year}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                ₹{r.income}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                ₹{r.tax}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TaxHistory;
