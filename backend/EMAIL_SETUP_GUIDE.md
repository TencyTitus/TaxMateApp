# Email Setup Guide for OTP Feature

## 🎯 Overview

This guide will help you configure email sending for OTP (One-Time Password) functionality in TaxMate.

---

## 📧 Step-by-Step Setup

### **Step 1: Install Dependencies**

First, install the required packages:

```bash
cd "d:\Taxmate (2)\Taxmate\backend"
npm install nodemailer dotenv
```

---

### **Step 2: Configure Gmail (Recommended)**

#### **Option A: Using Gmail App Password (Most Secure)**

1. **Enable 2-Factor Authentication on your Gmail account**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "App": Choose "Mail"
   - Select "Device": Choose "Other" and enter "TaxMate"
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `xxxx xxxx xxxx xxxx`)

3. **Create `.env` file in backend folder**

Create a file named `.env` in `d:\Taxmate (2)\Taxmate\backend\`:

```env
# MongoDB Configuration
MONGO_URI=mongodb://127.0.0.1:27017/taxmate

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `your-app-password-here` with the 16-character app password (remove spaces)

#### **Option B: Using Gmail with Less Secure Apps (Not Recommended)**

⚠️ **This method is less secure and may not work with all accounts**

1. Enable "Less secure app access":
   - Go to: https://myaccount.google.com/lesssecureapps
   - Turn ON "Allow less secure apps"

2. Create `.env` file:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-password
```

---

### **Step 3: Alternative Email Services**

#### **Outlook/Hotmail**

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
```

#### **Yahoo Mail**

```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-yahoo-app-password
```

#### **Custom SMTP Server**

For custom SMTP servers, modify `backend/config/email.js`:

```javascript
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

Then in `.env`:
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

---

### **Step 4: Test Email Configuration**

1. **Restart your backend server:**
```bash
cd "d:\Taxmate (2)\Taxmate\backend"
node server.js
```

2. **Test the forgot password flow:**
   - Go to: `http://localhost:5173/forgot-password`
   - Enter a registered email
   - Click "Send OTP"
   - **Check your email inbox** for the OTP

3. **Expected output in console:**
```
✅ OTP email sent successfully to user@example.com
Message ID: <unique-message-id>
```

---

## 🔍 Troubleshooting

### **Problem: "Invalid login credentials"**

**Solution:**
- For Gmail: Make sure you're using App Password, not your regular password
- Check that EMAIL_USER and EMAIL_PASSWORD are correct in `.env`
- Verify 2FA is enabled for Gmail

### **Problem: "Authentication failed"**

**Solution:**
- Gmail: Enable "Less secure app access" OR use App Password
- Outlook: Enable SMTP access in account settings
- Yahoo: Generate and use App Password

### **Problem: Email not received**

**Solution:**
- Check spam/junk folder
- Verify email address is correct
- Check server console for error messages
- Ensure `.env` file is in the correct location

### **Problem: "Email credentials not configured"**

**Solution:**
- Make sure `.env` file exists in backend folder
- Verify EMAIL_USER and EMAIL_PASSWORD are set
- Restart the server after creating/modifying `.env`

### **Problem: OTP shows in console instead of email**

**Solution:**
- This is the fallback behavior when email is not configured
- Configure EMAIL_USER and EMAIL_PASSWORD in `.env`
- Restart the server

---

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EMAIL_SERVICE` | Yes | Email service provider | `gmail`, `outlook`, `yahoo` |
| `EMAIL_USER` | Yes | Your email address | `myapp@gmail.com` |
| `EMAIL_PASSWORD` | Yes | Email password or app password | `abcd efgh ijkl mnop` |
| `SMTP_HOST` | Optional | Custom SMTP host | `smtp.example.com` |
| `SMTP_PORT` | Optional | SMTP port | `587`, `465` |
| `SMTP_SECURE` | Optional | Use TLS/SSL | `true`, `false` |

---

## 🎨 Email Templates

The system sends two types of emails:

### **1. OTP Email**
- Subject: "TaxMate - Password Reset OTP"
- Contains: 6-digit OTP code
- Validity: 10 minutes
- Includes security warnings

### **2. Password Reset Confirmation**
- Subject: "TaxMate - Password Reset Successful"
- Sent after successful password reset
- Includes timestamp of change
- Security alert if user didn't make the change

---

## 🔒 Security Best Practices

✅ **Use App Passwords** instead of regular passwords
✅ **Enable 2-Factor Authentication** on your email account
✅ **Never commit `.env` file** to version control
✅ **Keep EMAIL_PASSWORD secure** - don't share it
✅ **Use environment-specific configurations** for dev/prod
✅ **Monitor email sending logs** for suspicious activity

---

## 📊 Production Recommendations

### **For Production Deployment:**

1. **Use Dedicated Email Service**
   - SendGrid (recommended)
   - Amazon SES
   - Mailgun
   - Postmark

2. **Example with SendGrid:**

```bash
npm install @sendgrid/mail
```

```javascript
// In config/email.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: 'noreply@taxmate.com',
    subject: 'TaxMate - Password Reset OTP',
    html: `Your OTP is: ${otp}`
  };
  
  await sgMail.send(msg);
};
```

3. **Add Rate Limiting**
   - Limit OTP requests per email
   - Prevent spam/abuse

4. **Add Email Validation**
   - Verify email addresses before sending
   - Use email verification service

---

## 📧 Quick Setup Checklist

- [ ] Install nodemailer and dotenv
- [ ] Create `.env` file in backend folder
- [ ] Generate Gmail App Password (if using Gmail)
- [ ] Add EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD to `.env`
- [ ] Restart backend server
- [ ] Test forgot password feature
- [ ] Check email inbox for OTP
- [ ] Verify OTP and reset password
- [ ] Test complete flow end-to-end

---

## 🎉 Success!

Once configured, users will receive:

1. **Professional OTP email** with:
   - Branded header
   - Large, clear OTP code
   - Security warnings
   - Expiration time

2. **Confirmation email** after password reset with:
   - Success message
   - Timestamp
   - Security alert

---

## 💡 Tips

- **Development**: The system falls back to console if email is not configured
- **Testing**: Use a test email account for development
- **Gmail**: App Passwords are the recommended method
- **Monitoring**: Check server logs for email delivery status
- **Backup**: Keep console logging as a fallback option

---

**Need Help?**

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify `.env` file configuration
3. Test with a different email service
4. Check email provider's SMTP settings

---

**Last Updated:** 2025-10-25
**Version:** 1.0.0
