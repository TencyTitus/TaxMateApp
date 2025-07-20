import React from "react";

function Profile() {
  const user = {
    name: "Tency Titus",
    email: "tency@example.com",
    registeredOn: "January 10, 2025",
  };

  return (
    <div className="container">
      <h2>My Profile</h2>
      <p>
        <strong>Name:</strong> {user.name}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Registered On:</strong> {user.registeredOn}
      </p>
    </div>
  );
}

export default Profile;
