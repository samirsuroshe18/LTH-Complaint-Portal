import { createTransport } from 'nodemailer';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';

async function mailSender(email, emailType, password = "NA", userId="") {
  try {
    let subject, htmlContent;
    // Create hashed token 
    const hashedToken = await bcrypt.hash(userId.toString(), 10);

    if (emailType === "VERIFY_TECHNICIAN") {
      subject = "Welcome! Your Technician Account Credentials";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Platform!</h2>
          <p>Your technician account has been created successfully. Here are your login credentials:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password || 'Not provided'}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> Please keep your credentials secure and do not share them with anyone.
          </p>
        </div>
      `;
    } else if (emailType === "VERIFY_SECTOR_ADMIN") {
      subject = "Welcome! Your Sector Admin Account Credentials";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
              🔧 Sector Admin Access
            </h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0; font-size: 22px;">
              Congratulations! Your Sector Admin Account is Ready
            </h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              You have been granted Sector Administrator privileges on our platform. As a Sector Admin, you will have enhanced access to manage your designated sector operations.
            </p>
            
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #764ba2;">
              <h3 style="margin-top: 0; color: #ffffff; font-size: 18px;">
                🔑 Your Admin Credentials
              </h3>
              <div style="background-color: rgba(255,255,255,0.95); padding: 15px; border-radius: 5px; margin-top: 15px;">
                <p style="margin: 8px 0; color: #333;"><strong>📧 Email:</strong> ${email}</p>
                <p style="margin: 8px 0; color: #333;"><strong>🔐 Password:</strong> <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password || 'Not provided'}</code></p>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #856404; margin-top: 0; display: flex; align-items: center;">
                ⚠️ Security Guidelines
              </h4>
              <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
                <li>Change your password after first login</li>
                <li>Never share your admin credentials</li>
                <li>Use secure networks for administrative tasks</li>
              </ul>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #0c5460; margin-top: 0;">
                🎯 Your Admin Responsibilities
              </h4>
              <p style="color: #0c5460; margin: 10px 0;">
                • Oversee sector operations and technician activities<br>
                • Manage resource allocation within your sector<br>
                • Ensure compliance with organizational standards
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px; margin: 5px 0;">
                Need assistance? Contact our support team
              </p>
              <p style="color: #888; font-size: 12px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `;
    }else if (emailType === "RESET") {
      await User.findByIdAndUpdate(userId, { forgotPasswordToken: hashedToken, forgotPasswordTokenExpiry: Date.now() + (1000 * 60 * 10) });
      subject = "Reset your password";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password. Click the button below to proceed.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.PROD_API_URL}/api/v1/verify/reset-password?token=${hashedToken}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
        </div>
      `;
    }

    // Create a Transporter to send emails
    let transporter = createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      }
    });

    // Send emails to users
    let mailResponse = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: subject,
      html: htmlContent
    });

    return mailResponse;
  } catch (error) {
    console.log(error.message);
  }
};

export default mailSender;