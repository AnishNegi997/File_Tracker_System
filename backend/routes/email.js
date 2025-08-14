import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { testEmailConnection, sendEmail } from '../utils/emailService.js';

const router = express.Router();

// @desc    Test email connection
// @route   GET /api/email/test-connection
// @access  Private (Admin only)
router.get('/test-connection', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const isConnected = await testEmailConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Email server connection successful',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          notificationsEnabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email server connection failed',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          notificationsEnabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
        }
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      error: 'Email test failed',
      details: error.message
    });
  }
});

// @desc    Send test email
// @route   POST /api/email/test
// @access  Private (Admin only)
router.post('/test', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { to, template, data } = req.body;
    
    if (!to || !template) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email and template are required'
      });
    }

    const result = await sendEmail(to, template, data || {});
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Test email failed',
      details: error.message
    });
  }
});

export default router;
