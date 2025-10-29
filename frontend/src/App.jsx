import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TaxHistory from "./pages/TaxHistory";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import User from "./pages/User";
import Logout from "./pages/Logout";
import AddIncome from "./pages/AddIncome";
import AddDeduction from "./pages/AddDeduction";
import Payment from "./pages/Payment";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<TaxHistory />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/user" element={<User />} />
        <Route path="/income" element={<AddIncome />} />
        <Route path="/deductions" element={<AddDeduction />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
