const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email credentials not configured. Using console fallback.');
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();
  
  // Fallback to console if email not configured
  if (!transporter) {
    console.log(`\n=================================`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`⚠️  Email not configured - showing in console`);
    console.log(`=================================\n`);
    return { success: true, fallback: true };
  }

  try {
    const mailOptions = {
      from: `"TaxMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'TaxMate - Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .header {
              background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 40px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .otp-box {
              background: #f3f4f6;
              border: 2px dashed #6c5ce7;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #6c5ce7;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your TaxMate account. Use the OTP below to proceed:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Your One-Time Password</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; color: #6b7280; font-size: 12px;">Valid for 10 minutes</p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Note:</strong>
                <ul style="margin: 10px 0;">
                  <li>This OTP will expire in <strong>10 minutes</strong></li>
                  <li>Never share this OTP with anyone</li>
                  <li>TaxMate will never ask for your OTP via phone or email</li>
                </ul>
              </div>

              <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The TaxMate Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} TaxMate. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    
    // Fallback to console if email fails
    console.log(`\n=================================`);
    console.log(`Email failed - OTP for ${email}: ${otp}`);
    console.log(`=================================\n`);
    
    throw new Error('Failed to send OTP email. Please try again.');
  }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (email, userName) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`✅ Password reset confirmation for ${email} (email not configured)`);
    return { success: true, fallback: true };
  }

  try {
    const mailOptions = {
      from: `"TaxMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'TaxMate - Password Reset Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 40px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .success-box {
              background: #ecfdf5;
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Password Reset Successful</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'User'},</p>
              
              <div class="success-box">
                <h2 style="color: #10b981; margin: 0;">🎉 Your password has been reset successfully!</h2>
              </div>

              <p>Your TaxMate account password was changed on <strong>${new Date().toLocaleString()}</strong>.</p>

              <p>You can now login with your new password.</p>

              <div class="warning">
                <strong>⚠️ Didn't make this change?</strong>
                <p style="margin: 10px 0;">If you didn't request this password reset, please contact our support team immediately at <strong>support@taxmate.com</strong> to secure your account.</p>
              </div>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The TaxMate Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} TaxMate. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset confirmation sent to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    // Don't throw error for confirmation emails
    return { success: false };
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetConfirmation
};
