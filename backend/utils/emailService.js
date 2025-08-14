import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const enableDebug = process.env.EMAIL_DEBUG === 'true';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  },
  logger: enableDebug,
  debug: enableDebug
};

// Create transporter with robust fallbacks
let transporter;
if (process.env.EMAIL_MODE === 'test') {
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      logger: enableDebug,
      debug: enableDebug
    });
    console.log('Using Ethereal test SMTP. Login:', testAccount.user);
  } catch (err) {
    console.error('Ethereal account creation failed, falling back to JSON transport:', err.message);
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
} else if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
  // No real SMTP configured: use JSON transport to avoid crashes
  console.warn('SMTP not configured. Using JSON transport (emails will not be delivered).');
  transporter = nodemailer.createTransport({ jsonTransport: true });
} else {
  transporter = nodemailer.createTransport(emailConfig);
}

// Email templates
const emailTemplates = {
  fileForwarded: (data) => ({
    subject: `📤 File Forwarded: ${data.fileCode} - ${data.fileTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📤 File Forwarded</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 15px;">File Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">File Code:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Title:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Priority:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                <span style="background: ${data.priority === 'Urgent' ? '#ff4444' : '#007bff'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${data.priority}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Department:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.department}</td>
            </tr>
            ${data.deadline ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Deadline:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #ff4444; font-weight: bold;">
                ${new Date(data.deadline).toLocaleDateString()} ${new Date(data.deadline).toLocaleTimeString()}
              </td>
            </tr>
            ` : ''}
          </table>
          
          <h3 style="color: #333; margin-bottom: 10px;">Forward Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Sent By:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.sentBy}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Sent To:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.recipientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Sent Through:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.sentThrough}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Sent At:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(data.sentAt).toLocaleString()}</td>
            </tr>
          </table>
          
          ${data.remarks ? `
          <h3 style="color: #333; margin-bottom: 10px;">Remarks</h3>
          <div style="background: #fff; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
            <p style="margin: 0; font-style: italic;">"${data.remarks}"</p>
          </div>
          ` : ''}
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #2d5a2d;">
              <strong>Action Required:</strong> Please review this file and take necessary action. 
              You can access the file tracking system to view full details and update the status.
            </p>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">This is an automated notification from the File Tracking System.</p>
          <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  fileReceived: (data) => ({
    subject: `📥 File Received: ${data.fileCode} - ${data.fileTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📥 File Received</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 15px;">File Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">File Code:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Title:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Received By:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.receivedBy}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Received At:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(data.receivedAt).toLocaleString()}</td>
            </tr>
          </table>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #2d5a2d;">
              <strong>Status Updated:</strong> The file has been successfully received and is now in your possession.
              You can access the file tracking system to view full details and take further action.
            </p>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">This is an automated notification from the File Tracking System.</p>
          <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  fileCompleted: (data) => ({
    subject: `✅ File Completed: ${data.fileCode} - ${data.fileTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ File Completed</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 15px;">File Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">File Code:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Title:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Completed By:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.completedBy}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Completed At:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(data.completedAt).toLocaleString()}</td>
            </tr>
          </table>
          
          ${data.completionRemarks ? `
          <h3 style="color: #333; margin-bottom: 10px;">Completion Remarks</h3>
          <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px;">
            <p style="margin: 0; font-style: italic;">"${data.completionRemarks}"</p>
          </div>
          ` : ''}
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #2d5a2d;">
              <strong>Task Completed:</strong> The file has been successfully completed and processed.
              You can access the file tracking system to view the complete history and details.
            </p>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">This is an automated notification from the File Tracking System.</p>
          <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  fileReleased: (data) => ({
    subject: `📤 File Released: ${data.fileCode} - ${data.fileTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📤 File Released</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 15px;">File Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">File Code:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Title:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.fileTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Released To:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.releasedTo}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Released By:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.releasedBy}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Released At:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(data.releasedAt).toLocaleString()}</td>
            </tr>
          </table>
          
          ${data.remarks ? `
          <h3 style="color: #333; margin-bottom: 10px;">Release Remarks</h3>
          <div style="background: #fff; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
            <p style="margin: 0; font-style: italic;">"${data.remarks}"</p>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #1565c0;">
              <strong>File Available:</strong> The file has been released to you and is now available in your "Received Files" section.
              Please review and take necessary action.
            </p>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">This is an automated notification from the File Tracking System.</p>
          <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
      </div>
    `
  })
};

// Email sending function
export const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"File Tracking System" <${(emailConfig.auth && emailConfig.auth.user) || 'no-reply@example.com'}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    if (enableDebug && info && info.response) {
      console.log('SMTP provider response:', info.response);
    }
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
      console.log('Email preview URL:', previewUrl);
    }
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Specific notification functions
export const sendFileForwardedNotification = async (recipientEmail, forwardData, fileData) => {
  const emailData = {
    fileCode: fileData.code,
    fileTitle: fileData.title,
    priority: forwardData.priority,
    department: fileData.department,
    deadline: fileData.deadline,
    sentBy: forwardData.sentBy,
    recipientName: forwardData.recipientName,
    sentThrough: forwardData.sentThrough,
    sentAt: forwardData.sentAt,
    remarks: forwardData.remarks
  };

  return await sendEmail(recipientEmail, 'fileForwarded', emailData);
};

export const sendFileReceivedNotification = async (recipientEmail, forwardData, fileData) => {
  const emailData = {
    fileCode: fileData.code,
    fileTitle: fileData.title,
    receivedBy: forwardData.distributedTo,
    receivedAt: new Date()
  };

  return await sendEmail(recipientEmail, 'fileReceived', emailData);
};

export const sendFileCompletedNotification = async (recipientEmail, forwardData, fileData, completionRemarks) => {
  const emailData = {
    fileCode: fileData.code,
    fileTitle: fileData.title,
    completedBy: forwardData.distributedTo,
    completedAt: new Date(),
    completionRemarks: completionRemarks
  };

  return await sendEmail(recipientEmail, 'fileCompleted', emailData);
};

export const sendFileReleasedNotification = async (recipientEmail, fileData, releaseData) => {
  const emailData = {
    fileCode: fileData.code,
    fileTitle: fileData.title,
    releasedTo: releaseData.assignedTo,
    releasedBy: releaseData.releasedBy,
    releasedAt: new Date(),
    remarks: releaseData.remarks
  };

  return await sendEmail(recipientEmail, 'fileReleased', emailData);
};

// Test email function
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email server connection verified successfully');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};

export default {
  sendEmail,
  sendFileForwardedNotification,
  sendFileReceivedNotification,
  sendFileCompletedNotification,
  sendFileReleasedNotification,
  testEmailConnection
};
