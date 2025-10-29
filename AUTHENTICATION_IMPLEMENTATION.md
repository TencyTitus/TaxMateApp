# Authentication & User-Specific Data Implementation

## Overview
This document describes the JWT-based authentication system implemented to ensure tax optimization values and regime recommendations are displayed only for the currently logged-in user.

## Key Features

### 1. **JWT Authentication**
- Secure token-based authentication using `jsonwebtoken` package
- Tokens expire in 7 days for security
- Automatic token refresh on API requests
- Token stored in localStorage on client-side

### 2. **User-Specific Data Storage**
Income and deduction entries are now stored in MongoDB under each user's profile:

```javascript
// User Model Schema
{
  incomeEntries: [
    { source: String, amount: Number, createdAt: Date }
  ],
  deductionEntries: [
    { section: String, amount: Number, createdAt: Date }
  ]
}
```

### 3. **Authenticated API Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/income-entries` | Fetch user's income entries | ✅ |
| POST | `/api/user/income-entries` | Add income entry | ✅ |
| GET | `/api/user/deduction-entries` | Fetch user's deduction entries | ✅ |
| POST | `/api/user/deduction-entries` | Add deduction entry | ✅ |
| GET | `/api/user/tax-optimization` | Get tax regime comparison & recommendation | ✅ |

## Implementation Details

### Backend Changes

#### 1. **Middleware** (`backend/middleware/auth.js`)
- `authenticateToken()` - Verifies JWT tokens on protected routes
- `generateToken()` - Creates JWT tokens on successful login
- Handles token expiration and invalid tokens

#### 2. **Updated Routes** (`backend/routes/auth.js`)
```javascript
// Login now returns JWT token
router.post("/login", async (req, res) => {
  // ... validation
  const token = generateToken(user);
  res.json({
    message: "Login successful",
    token,
    user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
  });
});
```

#### 3. **User Data Routes** (`backend/routes/user.js`)
All income/deduction endpoints use `authenticateToken` middleware:
```javascript
router.get("/income-entries", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ incomeEntries: user.incomeEntries || [] });
});
```

### Frontend Changes

#### 1. **API Utility** (`frontend/src/utils/api.js`)
Centralized API client with automatic token injection:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### 2. **AI Assistant** (`frontend/src/components/AIAssistant.jsx`)
- Fetches authenticated user's optimization data from backend
- Displays personalized tax regime recommendations
- Shows login prompt for unauthenticated users
- Falls back to localStorage for backward compatibility

Key Features:
- ✅ Displays user-specific income and deduction totals
- ✅ Calculates tax liability for both Old and New regimes
- ✅ Provides personalized regime recommendation
- ✅ Shows potential savings amount
- ✅ Requires authentication to view personal data

#### 3. **Add Income/Deduction Pages**
Updated to save data to backend:
```javascript
// Saves to authenticated user's account
await userAPI.addIncomeEntry({ source, amount });

// Fallback to localStorage if not authenticated
localStorage.setItem("incomeEntries", JSON.stringify(entries));
```

## Security Features

### 1. **Token Validation**
- All protected routes verify JWT token validity
- Expired or invalid tokens return 401/403 errors
- Auto-redirect to login on authentication failure

### 2. **User Isolation**
- Income/deduction entries are tied to user ID from JWT
- Each user can only access their own data
- Backend validates user ID from token on every request

### 3. **Data Privacy**
- Tax calculations use only the authenticated user's data
- No cross-user data leakage
- Recommendations are personalized per user

## Usage Flow

### 1. **User Login**
```
User enters credentials → Backend validates → JWT token generated → Token stored in localStorage
```

### 2. **Adding Income/Deductions**
```
User adds entry → Frontend sends to API with JWT token → Backend validates token → 
Entry saved to user's profile in MongoDB → Success response
```

### 3. **Viewing Tax Optimization**
```
User opens AI Assistant → Frontend requests optimization data with JWT token → 
Backend calculates from user's entries → Returns personalized recommendation → 
AI Assistant displays user-specific data
```

## Migration from localStorage

The system maintains **backward compatibility** with localStorage:

1. **For Authenticated Users**: Data is fetched from MongoDB via API
2. **For Non-Authenticated Users**: Data is read from localStorage
3. **Gradual Migration**: Existing localStorage data can be manually migrated by:
   - Logging in
   - Re-entering income/deduction entries
   - Old localStorage data serves as fallback if API fails

## Testing Guide

### 1. **Test Authentication**
```bash
# Start backend
cd backend
npm start

# Start frontend
cd frontend
npm run dev
```

### 2. **Test User-Specific Data**
1. Register a new user or login with existing credentials
2. Add income entries (e.g., Salary: ₹800,000)
3. Add deduction entries (e.g., 80C: ₹150,000)
4. Open AI Assistant → Click "Optimization" tab
5. Verify your specific data is displayed
6. Logout and login with different user
7. Verify data is different for each user

### 3. **Verify Security**
1. Open DevTools → Application → localStorage
2. Copy the JWT token
3. Delete token from localStorage
4. Try to access optimization data
5. Should see "Please login" message

## Environment Variables

Add to `backend/.env` (optional):
```env
JWT_SECRET=your_super_secret_key_here_change_in_production
MONGO_URI=mongodb://127.0.0.1:27017/taxmate
```

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism for better security
2. **Session Management**: Track active sessions and allow logout from all devices
3. **Data Export**: Allow users to export their tax data
4. **Multi-Year Support**: Store historical data by financial year
5. **Real-Time Sync**: WebSocket integration for real-time data updates

## Troubleshooting

### Token Expired Error
- Token expires after 7 days
- User needs to login again
- Consider implementing refresh tokens

### API Returns 401
- Check if token exists in localStorage
- Verify backend is running
- Check MongoDB connection

### Data Not Updating
- Clear browser cache
- Check Network tab for API responses
- Verify backend logs for errors

---

## Summary

The implementation ensures:
- ✅ Only authenticated users can view their tax optimization data
- ✅ Each user sees only their own income/deduction entries
- ✅ Tax regime recommendations are personalized
- ✅ Data is securely stored in MongoDB tied to user ID
- ✅ JWT tokens ensure secure API access
- ✅ Backward compatibility with localStorage maintained
