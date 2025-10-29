# 🚀 Quick Start - Email OTP Setup

## ⚡ Fast Track (5 Minutes)

### 1️⃣ Install Packages
```bash
cd "d:\Taxmate (2)\Taxmate\backend"
npm install
```

### 2️⃣ Configure Gmail App Password

**Go to:** https://myaccount.google.com/apppasswords

1. Enable 2-Step Verification first
2. Create new App Password for "Mail"
3. Copy the 16-character password

### 3️⃣ Update `.env` File

Open `d:\Taxmate (2)\Taxmate\backend\.env` and update:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### 4️⃣ Start Server
```bash
node server.js
```

### 5️⃣ Test It!

1. Go to: `http://localhost:5173/forgot-password`
2. Enter your email
3. Click "Send OTP"
4. **Check your email inbox!** 📧

---

## ✅ What You Get

### Beautiful Email Template:
- Professional branded header
- Large, clear OTP code
- Security warnings
- 10-minute expiration notice

### Two Email Types:
1. **OTP Email** - When requesting password reset
2. **Confirmation Email** - After successful reset

---

## 🔥 Email Preview

**Subject:** TaxMate - Password Reset OTP

```
┌────────────────────────────────┐
│  🔐 Password Reset Request     │
│  ────────────────────────────  │
│                                │
│  Your One-Time Password        │
│                                │
│        1 2 3 4 5 6            │
│                                │
│  Valid for 10 minutes          │
│                                │
│  ⚠️ Security Note:             │
│  • Never share this OTP        │
│  • Expires in 10 minutes       │
│  • Don't reply to this email   │
└────────────────────────────────┘
```

---

## 🎯 Email Providers Supported

| Provider | Service Name | Setup Time |
|----------|--------------|------------|
| Gmail | `gmail` | 2 mins ⭐ Recommended |
| Outlook | `outlook` | 2 mins |
| Yahoo | `yahoo` | 3 mins |
| Custom SMTP | Configure manually | 5 mins |

---

## ⚠️ Troubleshooting

**No email received?**
- ✓ Check spam folder
- ✓ Verify EMAIL_USER is correct
- ✓ Use App Password (not regular password)
- ✓ Check console for errors

**"Invalid credentials" error?**
- ✓ Use Gmail App Password, not account password
- ✓ Enable 2FA on Gmail
- ✓ Remove spaces from App Password

**Still showing in console?**
- ✓ Check `.env` file exists
- ✓ Restart the server after changing `.env`
- ✓ Verify EMAIL_USER and EMAIL_PASSWORD are set

---

## 📝 Example `.env` Configuration

### Gmail (Recommended):
```env
EMAIL_SERVICE=gmail
EMAIL_USER=taxmate.app@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Outlook:
```env
EMAIL_SERVICE=outlook
EMAIL_USER=taxmate@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo:
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=taxmate@yahoo.com
EMAIL_PASSWORD=your-app-password
```

---

## 🎨 Features

✅ Professional HTML email template
✅ Automatic fallback to console (if email fails)
✅ Two confirmation emails (OTP + Reset Success)
✅ Security warnings included
✅ Mobile-responsive design
✅ Clear OTP display with large fonts
✅ Branded colors matching TaxMate

---

## 🔒 Security Features

✅ OTP expires in 10 minutes
✅ App Password instead of account password
✅ Security warnings in email
✅ Password reset confirmation email
✅ Console logging for monitoring
✅ Email sending error handling

---

## 📊 Console Messages

**When email sent successfully:**
```
✅ OTP email sent successfully to user@example.com
Message ID: <abc123@mail.gmail.com>
```

**When email fails (fallback):**
```
=================================
Email failed - OTP for user@example.com: 123456
=================================
```

---

## 💡 Pro Tips

1. **Use Gmail** - Easiest and most reliable
2. **Test with your own email** first
3. **Check spam folder** if email not in inbox
4. **App Password** is required for Gmail (not regular password)
5. **Restart server** after changing `.env`

---

## 🎯 Success Checklist

- [ ] `nodemailer` and `dotenv` installed
- [ ] `.env` file created with credentials
- [ ] Gmail App Password generated
- [ ] Server restarted
- [ ] Tested forgot password flow
- [ ] Received OTP email ✉️
- [ ] Received confirmation email ✉️

---

**Ready? Start with Step 1!** 🚀

For detailed instructions, see: `EMAIL_SETUP_GUIDE.md`
