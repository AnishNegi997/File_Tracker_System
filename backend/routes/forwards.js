import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import File from '../data/files.js';
import Movement from '../data/movementModel.js';
import Forward from '../data/forwardModel.js';
import User from '../data/users.js';
import Notification from '../data/notificationModel.js';
import { sendFileForwardedNotification, sendFileReleasedNotification, sendFileReceivedNotification } from '../utils/emailService.js';

const router = express.Router();

// Helper function to create notifications
async function createNotification(recipientId, title, message, type, fileCode, forwardId, isUrgent = false, priority = 'normal', icon = '📢') {
  try {
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      console.error('Error creating notification: recipient not found', recipientId);
      return;
    }

    await Notification.create({
      recipientId,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      title,
      message,
      type,
      fileCode,
      forwardId,
      isUrgent,
      priority,
      icon
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// @desc    Get all file forwards
// @route   GET /api/forwards
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, urgent, department } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    if (urgent === 'true') {
      query.isUrgent = true;
    }
    if (department) {
      query.recipientDepartment = department;
    }
    
    const forwards = await Forward.find(query);
    
    res.json({
      success: true,
      count: forwards.length,
      data: forwards
    });
  } catch (error) {
    console.error('Get forwards error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get forwards for a specific file
// @route   GET /api/forwards/file/:fileId
// @access  Private
router.get('/file/:fileId', protect, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Check if file exists
    const file = await File.findOne({ code: fileId });
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    const forwards = await Forward.find({ fileCode: fileId });
    
    res.json({
      success: true,
      count: forwards.length,
      data: forwards
    });
  } catch (error) {
    console.error('Get file forwards error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single forward by ID
// @route   GET /api/forwards/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const forward = await Forward.findById(req.params.id);
    
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }
    
    res.json({
      success: true,
      data: forward
    });
  } catch (error) {
    console.error('Get forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create file forward (automatically goes to department admin first)
// @route   POST /api/forwards
// @access  Private
router.post('/', protect, [
  body('fileCode').notEmpty().withMessage('File code is required'),
  body('recipientDepartment').notEmpty().withMessage('Recipient department is required'),
  body('recipientName').notEmpty().withMessage('Recipient name is required'),
  body('priority').optional().isIn(['Normal', 'Urgent', 'Important', 'Critical']).withMessage('Invalid priority'),
  body('sentThrough').optional().isString().withMessage('Sent through must be a string'),
  body('remarks').optional().isString().withMessage('Remarks must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fileCode, recipientDepartment, recipientName } = req.body;
    
    // Check if file exists
    const file = await File.findOne({ code: fileCode });
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Find department admin for the recipient department
    const departmentAdmin = await User.findOne({ 
      department: recipientDepartment, 
      role: { $in: ['admin', 'superadmin'] } 
    });

    if (!departmentAdmin) {
      return res.status(400).json({
        success: false,
        error: `No admin found for department: ${recipientDepartment}`
      });
    }

    const forwardData = {
      ...req.body,
      sentBy: req.user.name,
      isUrgent: req.body.priority === 'Urgent' || req.body.priority === 'Critical',
      status: 'Pending Admin Review',
      // Store original intended recipient
      originalRecipientName: recipientName,
      originalRecipientDepartment: recipientDepartment,
      // Set admin as initial recipient
      recipientName: departmentAdmin.name,
      recipientDepartment: recipientDepartment
    };

    console.log('Creating forward with data:', forwardData);

    const newForward = await Forward.create(forwardData);
    
    console.log('Forward created successfully:', {
      id: newForward._id,
      fileCode: newForward.fileCode,
      recipientDepartment: newForward.recipientDepartment,
      status: newForward.status
    });
    
    // Add movement to file
    await Movement.create({
      fileCode: fileCode,
      user: req.user.name,
      action: 'Forwarded to Admin',
      remarks: req.body.remarks || `Forwarded to ${recipientDepartment} Admin for review`,
      icon: '📤',
      sentBy: req.user.name,
      sentThrough: req.body.sentThrough,
      recipientName: departmentAdmin.name,
      datetime: new Date()
    });

    // Create notification for department admin
    await createNotification(departmentAdmin._id, 'New Forward Request', `You have a new forward request from ${req.user.name} for file ${fileCode}.`, 'forward', fileCode, newForward._id, newForward.isUrgent, newForward.priority);

    // Send email notification to department admin
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      try {
        await sendFileForwardedNotification(departmentAdmin.email, newForward, file);
        console.log(`Email notification sent to ${departmentAdmin.email} for file ${fileCode}`);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      data: newForward,
      message: `File forwarded to ${recipientDepartment} Admin for review`
    });
  } catch (error) {
    console.error('Create forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Admin approves and distributes file to employee
// @route   PATCH /api/forwards/:id/approve
// @access  Private (Admin only)
router.patch('/:id/approve', protect, [
  body('distributedTo').notEmpty().withMessage('Employee name is required'),
  body('adminRemarks').optional().isString().withMessage('Admin remarks must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { distributedTo, adminRemarks } = req.body;
    const forward = await Forward.findById(req.params.id);
    
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }

    // Check if user is admin of the department
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.department !== forward.recipientDepartment)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to approve forwards for this department'
      });
    }

    // Check if forward is pending admin review
    if (forward.status !== 'Pending Admin Review') {
      return res.status(400).json({
        success: false,
        error: 'Forward is not pending admin review'
      });
    }

    const updateData = {
      status: 'Distributed to Employee',
      adminApprovedBy: req.user.name,
      adminApprovalDate: new Date(),
      adminRemarks: adminRemarks || `Approved and distributed to ${distributedTo}`,
      distributedTo: distributedTo,
      distributionDate: new Date()
    };

    const updatedForward = await Forward.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Update the file to show it's now assigned to the employee
    const file = await File.findOne({ code: forward.fileCode });
    if (file) {
      file.currentHolder = distributedTo;
      file.status = 'Released'; // File is now in employee's possession
      file.department = forward.recipientDepartment; // Update department to match forward
      await file.save();
    }

    // Add movement to file
    await Movement.create({
      fileCode: forward.fileCode,
      user: req.user.name,
      action: 'Admin Approved & Distributed',
      remarks: `Admin ${req.user.name} approved and distributed to ${distributedTo}`,
      icon: '✅',
      sentBy: req.user.name,
      sentThrough: 'Admin Distribution',
      recipientName: distributedTo,
      datetime: new Date()
    });

    // Create notification for the employee who received the file
    const employee = await User.findOne({ name: distributedTo, department: forward.recipientDepartment });
    if (employee) {
      await createNotification(
        employee._id,
        'File Distributed to You',
        `Admin ${req.user.name} has distributed file ${forward.fileCode} to you.`,
        'forward_status',
        forward.fileCode,
        forward._id,
        forward.isUrgent,
        forward.priority,
        '📋'
      );

      // Send email notification to employee
      if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        try {
          await sendFileReleasedNotification(employee.email, file, {
            assignedTo: distributedTo,
            releasedBy: req.user.name,
            remarks: adminRemarks || `Approved and distributed to ${distributedTo}`
          });
          console.log(`Email notification sent to ${employee.email} for file ${forward.fileCode}`);
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
        }
      }
    }

    // Create notification for the original sender
    const sender = await User.findOne({ name: forward.sentBy });
    if (sender) {
      await createNotification(
        sender._id,
        'Forward Approved & Distributed',
        `Your forward request for file ${forward.fileCode} has been approved and distributed to ${distributedTo}.`,
        'forward_status',
        forward.fileCode,
        forward._id,
        forward.isUrgent,
        forward.priority,
        '✅'
      );
    }

    res.json({
      success: true,
      data: updatedForward,
      message: `File approved and distributed to ${distributedTo}`
    });
  } catch (error) {
    console.error('Admin approve forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Admin rejects a forward
// @route   PATCH /api/forwards/:id/reject
// @access  Private (Admin only)
router.patch('/:id/reject', protect, [
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { rejectionReason } = req.body;
    const forward = await Forward.findById(req.params.id);
    
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }

    // Check if user is admin of the department
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.department !== forward.recipientDepartment)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reject forwards for this department'
      });
    }

    // Check if forward is pending admin review
    if (forward.status !== 'Pending Admin Review') {
      return res.status(400).json({
        success: false,
        error: 'Forward is not pending admin review'
      });
    }

    const updateData = {
      status: 'Rejected',
      adminApprovedBy: req.user.name,
      adminApprovalDate: new Date(),
      adminRemarks: `Rejected: ${rejectionReason}`
    };

    const updatedForward = await Forward.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Add movement to file
    await Movement.create({
      fileCode: forward.fileCode,
      user: req.user.name,
      action: 'Admin Rejected',
      remarks: `Admin ${req.user.name} rejected: ${rejectionReason}`,
      icon: '❌',
      sentBy: req.user.name,
      sentThrough: 'Admin Review',
      recipientName: forward.sentBy, // Return to sender
      datetime: new Date()
    });

    // Create notification for the original sender about rejection
    const sender = await User.findOne({ name: forward.sentBy });
    if (sender) {
      await createNotification(
        sender._id,
        'Forward Rejected',
        `Your forward request for file ${forward.fileCode} has been rejected by ${req.user.name}. Reason: ${rejectionReason}`,
        'forward_status',
        forward.fileCode,
        forward._id,
        forward.isUrgent,
        forward.priority,
        '❌'
      );
    }

    res.json({
      success: true,
      data: updatedForward,
      message: 'Forward rejected successfully'
    });
  } catch (error) {
    console.error('Admin reject forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get forwards pending admin review for a department
// @route   GET /api/forwards/pending-admin/:department
// @access  Private (Admin of that department)
router.get('/pending-admin/:department', protect, async (req, res) => {
  try {
    const { department } = req.params;
    
    // Check if user is admin of the department
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.department !== department)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view pending forwards for this department'
      });
    }

    const pendingForwards = await Forward.find({
      recipientDepartment: department,
      status: 'Pending Admin Review'
    }).sort({ sentAt: -1 });

    res.json({
      success: true,
      count: pendingForwards.length,
      data: pendingForwards
    });
  } catch (error) {
    console.error('Get pending admin forwards error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get all forwards for admin's department
// @route   GET /api/forwards/admin/:department
// @access  Private (Admin of that department)
router.get('/admin/:department', protect, async (req, res) => {
  try {
    const { department } = req.params;
    const { status, urgent, page = 1, limit = 20 } = req.query;
    
    console.log('Admin forwards requested for department:', department);
    console.log('Requesting user:', req.user.name, 'Role:', req.user.role, 'Department:', req.user.department);
    
    // Check if user is admin of the department
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.department !== department)) {
      console.log('Access denied for user:', req.user.name);
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view forwards for this department'
      });
    }

    let query = { recipientDepartment: department };
    
    if (status) {
      query.status = status;
    }
    if (urgent === 'true') {
      query.isUrgent = true;
    }

    console.log('Query for forwards:', query);

    const skip = (page - 1) * limit;
    
    const forwards = await Forward.find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found forwards:', forwards.length);
    if (forwards.length > 0) {
      console.log('Sample forwards:', forwards.slice(0, 3).map(f => ({
        fileCode: f.fileCode,
        recipientDepartment: f.recipientDepartment,
        status: f.status,
        sentBy: f.sentBy
      })));
    }

    const total = await Forward.countDocuments(query);

    res.json({
      success: true,
      count: forwards.length,
      data: forwards,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin forwards error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update file forward
// @route   PUT /api/forwards/:id
// @access  Private
router.put('/:id', protect, [
  body('recipientDepartment').optional().notEmpty().withMessage('Recipient department cannot be empty'),
  body('recipientName').optional().notEmpty().withMessage('Recipient name cannot be empty'),
  body('priority').optional().isIn(['Normal', 'Urgent', 'Important', 'Critical']).withMessage('Invalid priority'),
  body('sentThrough').optional().isString().withMessage('Sent through must be a string'),
  body('remarks').optional().isString().withMessage('Remarks must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const forward = await Forward.findById(req.params.id);
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }

    const updateData = {
      ...req.body,
      isUrgent: req.body.priority === 'Urgent' || req.body.priority === 'Critical'
    };

    const updatedForward = await Forward.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({
      success: true,
      data: updatedForward
    });
  } catch (error) {
    console.error('Update forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update forward status
// @route   PATCH /api/forwards/:id/status
// @access  Private
router.patch('/:id/status', protect, [
  body('status').isIn(['Pending Admin Review', 'Admin Approved', 'Distributed to Employee', 'In Transit', 'Received', 'Completed', 'Rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status } = req.body;
    const forward = await Forward.findById(req.params.id);
    
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }

    const updateData = { status };
    
    // Set timestamps based on status
    if (status === 'Received') {
      updateData.receivedAt = new Date();
    } else if (status === 'Completed') {
      updateData.completedAt = new Date();
    }

    const updatedForward = await Forward.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({
      success: true,
      data: updatedForward
    });
  } catch (error) {
    console.error('Update forward status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete file forward
// @route   DELETE /api/forwards/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const forward = await Forward.findById(req.params.id);
    
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }

    await Forward.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Forward deleted successfully'
    });
  } catch (error) {
    console.error('Delete forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get urgent forwards
// @route   GET /api/forwards/urgent
// @access  Private
router.get('/urgent', protect, async (req, res) => {
  try {
    const urgentForwards = await Forward.find({ isUrgent: true });
    
    res.json({
      success: true,
      count: urgentForwards.length,
      data: urgentForwards
    });
  } catch (error) {
    console.error('Get urgent forwards error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get forwards by status
// @route   GET /api/forwards/status/:status
// @access  Private
router.get('/status/:status', protect, async (req, res) => {
  try {
    const { status } = req.params;
    const statusForwards = await Forward.find({ status });
    
    res.json({
      success: true,
      count: statusForwards.length,
      data: statusForwards
    });
  } catch (error) {
    console.error('Get forwards by status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Employee marks distributed file as received
// @route   PATCH /api/forwards/:id/receive
// @access  Private
router.patch('/:id/receive', protect, async (req, res) => {
  try {
    const forward = await Forward.findById(req.params.id);
    
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }

    // Check if user is the one who should receive the file
    if (forward.distributedTo !== req.user.name) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to receive this file'
      });
    }

    // Check if forward is distributed to employee
    if (forward.status !== 'Distributed to Employee') {
      return res.status(400).json({
        success: false,
        error: 'File is not ready to be received'
      });
    }

    const updateData = {
      status: 'Received',
      receivedAt: new Date()
    };

    const updatedForward = await Forward.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Update the file status to "Received"
    const file = await File.findOne({ code: forward.fileCode });
    if (file) {
      file.status = 'Received';
      file.currentHolder = req.user.name;
      file.assignedTo = req.user.name;
      await file.save();
    }

    // Add movement to file
    await Movement.create({
      fileCode: forward.fileCode,
      user: req.user.name,
      action: 'File Received',
      remarks: `File received by ${req.user.name}`,
      icon: '📥',
      sentBy: 'System',
      sentThrough: 'Direct',
      recipientName: req.user.name,
      datetime: new Date()
    });

    // Create notification for the admin who distributed the file
    if (forward.adminApprovedBy) {
      const admin = await User.findOne({ name: forward.adminApprovedBy });
      if (admin) {
        await createNotification(
          admin._id,
          'File Received by Employee',
          `File ${forward.fileCode} has been received by ${req.user.name}.`,
          'forward_status',
          forward.fileCode,
          forward._id,
          forward.isUrgent,
          forward.priority,
          '📥'
        );

        // Send email notification to admin
        if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
          try {
            await sendFileReceivedNotification(admin.email, updatedForward, file);
            console.log(`Email notification sent to ${admin.email} for file ${forward.fileCode}`);
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
          }
        }
      }
    }

    res.json({
      success: true,
      data: updatedForward,
      message: 'File marked as received successfully'
    });
  } catch (error) {
    console.error('Receive forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Employee marks file as completed
// @route   PATCH /api/forwards/:id/complete
// @access  Private
router.patch('/:id/complete', protect, [
  body('completionRemarks').optional().isString().withMessage('Completion remarks must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { completionRemarks } = req.body;
    const forward = await Forward.findById(req.params.id);
    
    if (!forward) {
      return res.status(404).json({
        success: false,
        error: 'Forward not found'
      });
    }

    // Check if user is the one who should complete the file
    if (forward.distributedTo !== req.user.name) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to complete this file'
      });
    }

    // Check if forward is received
    if (forward.status !== 'Received') {
      return res.status(400).json({
        success: false,
        error: 'File must be received before it can be completed'
      });
    }

    const updateData = {
      status: 'Completed',
      completedAt: new Date()
    };

    const updatedForward = await Forward.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Add movement to file
    await Movement.create({
      fileCode: forward.fileCode,
      user: req.user.name,
      action: 'File Completed',
      remarks: completionRemarks || `File completed by ${req.user.name}`,
      icon: '✅',
      sentBy: req.user.name,
      sentThrough: 'Direct',
      recipientName: req.user.name,
      datetime: new Date()
    });

    // Create notification for the admin who distributed the file
    if (forward.adminApprovedBy) {
      const admin = await User.findOne({ name: forward.adminApprovedBy });
      if (admin) {
        await createNotification(
          admin._id,
          'File Completed by Employee',
          `File ${forward.fileCode} has been completed by ${req.user.name}.`,
          'forward_status',
          forward.fileCode,
          forward._id,
          forward.isUrgent,
          forward.priority,
          '✅'
        );
      }
    }

    // Create notification for the original sender
    const sender = await User.findOne({ name: forward.sentBy });
    if (sender) {
      await createNotification(
        sender._id,
        'Forward Completed',
        `Your forward request for file ${forward.fileCode} has been completed by ${req.user.name}.`,
        'forward_status',
        forward.fileCode,
        forward._id,
        forward.isUrgent,
        forward.priority,
        '✅'
      );
    }

    res.json({
      success: true,
      data: updatedForward,
      message: 'File marked as completed successfully'
    });
  } catch (error) {
    console.error('Complete forward error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get forwards statistics for admin's department
// @route   GET /api/forwards/stats/:department
// @access  Private (Admin of that department)
router.get('/stats/:department', protect, async (req, res) => {
  try {
    const { department } = req.params;
    
    // Check if user is admin of the department
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.department !== department)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view stats for this department'
      });
    }

    const allForwards = await Forward.find({ recipientDepartment: department });
    
    const stats = {
      totalForwards: allForwards.length,
      pendingAdminReview: allForwards.filter(f => f.status === 'Pending Admin Review').length,
      adminApproved: allForwards.filter(f => f.status === 'Admin Approved').length,
      distributedToEmployee: allForwards.filter(f => f.status === 'Distributed to Employee').length,
      received: allForwards.filter(f => f.status === 'Received').length,
      completed: allForwards.filter(f => f.status === 'Completed').length,
      rejected: allForwards.filter(f => f.status === 'Rejected').length,
      urgentForwards: allForwards.filter(f => f.isUrgent).length,
      // Time-based stats
      todayForwards: allForwards.filter(f => {
        const today = new Date().toISOString().split('T')[0];
        return f.sentAt && f.sentAt.toISOString().split('T')[0] === today;
      }).length,
      thisWeekForwards: allForwards.filter(f => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return f.sentAt && f.sentAt >= weekAgo;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get forwards stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 