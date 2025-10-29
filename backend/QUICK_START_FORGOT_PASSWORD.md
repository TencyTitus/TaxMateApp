# Quick Start - Forgot Password Feature

## 🚀 How to Test (Development Mode)

### 1. **Start the Backend Server**
```bash
cd "d:\Taxmate (2)\Taxmate\backend"
node server.js
```

### 2. **Start the Frontend**
```bash
cd "d:\Taxmate (2)\Taxmate\frontend"
npm run dev
```

### 3. **Test the Flow**

#### Step 1: Go to Login Page
- Navigate to: `http://localhost:5173/login`
- Click on **"Forgot Password?"** link

#### Step 2: Request OTP
- Enter a registered email address
- Click **"Send OTP"**
- Check your **backend terminal** for the OTP

**Example Console Output:**
```
=================================
OTP for user@example.com: 847392
Expires at: 12/25/2024, 10:45:00 AM
=================================
```

#### Step 3: Verify OTP
- Copy the 6-digit OTP from the console
- Paste it in the OTP field
- Click **"Verify OTP"**

#### Step 4: Reset Password
- Enter your new password
- Confirm your new password
- Click **"Reset Password"**
- You'll be redirected to login automatically

#### Step 5: Login with New Password
- Use your email and NEW password to login
- Success! ✅

---

## 📝 Quick Reference

### **Routes**
| URL | Description |
|-----|-------------|
| `/login` | Login page with "Forgot Password?" link |
| `/forgot-password` | Password reset page |

### **API Endpoints**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/forgot-password` | Request OTP |
| POST | `/verify-otp` | Verify OTP |
| POST | `/reset-password` | Reset password |

### **Features**
✅ OTP expires in 10 minutes
✅ Resend OTP option available
✅ Password must be at least 6 characters
✅ Passwords must match
✅ User must exist in database
✅ OTP shown in console (development only)

---

## ⚠️ Important Notes

1. **OTPs are displayed in the backend console** (for development testing)
2. **OTPs expire after 10 minutes** - request a new one if expired
3. **The user must be registered** before resetting password
4. **In production**, integrate email service to send OTPs

---

## 🔧 Troubleshooting

**Can't see OTP?**
→ Check the backend terminal (not browser console)

**"User not found" error?**
→ Register the user first via `/register`

**OTP expired?**
→ Click "Resend OTP" to get a new one

**Can't login after reset?**
→ Make sure you're using the NEW password

---

## 📧 Email Integration (Production)

To send OTPs via email instead of console:

1. Install nodemailer:
   ```bash
   npm install nodemailer
   ```

2. Configure email settings in `.env`

3. Update `backend/routes/auth.js` to send emails

See `FORGOT_PASSWORD_SETUP.md` for detailed instructions.

---

**That's it! The forgot password feature is ready to use!** 🎉
