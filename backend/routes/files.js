import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, authorize, canAccessDepartment } from '../middleware/auth.js';
import File from '../data/files.js';
import User from '../data/users.js';
import fetch from 'node-fetch';
import { sendFileReleasedNotification } from '../utils/emailService.js';

async function createMovement(fileId, movementData, req) {
  // Use the backend's own API to create a movement
  await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/movements/file/${fileId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization || ''
    },
    body: JSON.stringify(movementData)
  });
}

const router = express.Router();

// @desc    Get all files
// @route   GET /api/files
// @access  Private
router.get('/', protect, async (req, res) => {
  console.log('Get all files called by user:', req.user.name);
  try {
    const { department, search, status, priority, type } = req.query;
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { requisitioner: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based scoping: superadmin can see all; admin limited to own dept or assigned; user limited to own files
    if (req.user.role === 'admin') {
      const roleOr = [
        { department: req.user.department },
        { currentHolder: req.user.name },
        { assignedTo: req.user.name }
      ];
      if (query.$or) {
        // combine existing $or (from search) with role $and
        query.$and = [{ $or: query.$or }, { $or: roleOr }];
        delete query.$or;
      } else {
        query.$or = roleOr;
      }
    } else if (req.user.role === 'user') {
      const roleOr = [
        { currentHolder: req.user.name },
        { assignedTo: req.user.name },
        { createdBy: req.user.name },
        { requisitioner: req.user.name }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: roleOr }];
        delete query.$or;
      } else {
        query.$or = roleOr;
      }
    }

    const files = await File.find(query);
    console.log('Get all files - Total files:', files.length);
    if (files.length > 0) {
      console.log('Sample files:', files.slice(0, 3).map(f => ({ 
        code: f.code, 
        title: f.title, 
        createdBy: f.createdBy, 
        requisitioner: f.requisitioner,
        currentHolder: f.currentHolder 
      })));
    } else {
      console.log('No files found in database');
    }
    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get files by department
// @route   GET /api/files/department/:department
// @access  Private
router.get('/department/:department', protect, canAccessDepartment, async (req, res) => {
  try {
    const { department } = req.params;
    const files = await File.find({ department });
    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    console.error('Get department files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single file by ID
// @route   GET /api/files/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single file by code
// @route   GET /api/files/code/:code
// @access  Private
router.get('/code/:code', protect, async (req, res) => {
  try {
    const file = await File.findOne({ code: req.params.code });
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Get file by code error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create new file
// @route   POST /api/files
// @access  Private
router.post('/', protect, [
  body('title').notEmpty().withMessage('Title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('priority').isIn(['Normal', 'Urgent', 'Important', 'Critical']).withMessage('Invalid priority'),
  body('isDigital').isBoolean().withMessage('isDigital must be a boolean')
], async (req, res) => {
  console.log('Create file request received');
  console.log('Request body:', req.body);
  console.log('User:', req.user.name);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    const currentYear = new Date().getFullYear();
    const fileCount = await File.countDocuments({ code: { $regex: `THDC-F-${currentYear}` } }) + 1;
    const fileId = `THDC-F-${currentYear}-${String(fileCount).padStart(4, '0')}`;
    const fileData = {
      ...req.body,
      code: fileId,
      type: req.body.isDigital ? 'Digital' : 'Physical',
      status: 'Created',
      requisitioner: req.user.name,
      currentHolder: req.user.name,
      createdBy: req.user.name,
      createdAt: new Date()
    };
    const newFile = await File.create(fileData);
    // Add initial movement
    await createMovement(newFile.code, {
      user: req.user.name,
      action: 'Created',
      remarks: fileData.remarks || 'File created',
      icon: '📄',
      sentBy: null,
      sentThrough: null,
      recipientName: null
    }, req);
    res.status(201).json({
      success: true,
      data: newFile
    });
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update file
// @route   PUT /api/files/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('priority').optional().isIn(['Normal', 'Urgent', 'Important', 'Critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Created', 'Received', 'On Hold', 'Released', 'Complete']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    const prevStatus = file.status;
    Object.assign(file, req.body);
    await file.save();
    // Add movement if status changed
    if (req.body.status && req.body.status !== prevStatus) {
      await createMovement(file.code, {
        user: req.user.name,
        action: req.body.status,
        remarks: req.body.remarks || `Status changed to ${req.body.status}`,
        icon: req.body.status === 'Received' ? '📥' : req.body.status === 'Released' ? '📤' : req.body.status === 'Complete' ? '✅' : '🕒',
        sentBy: null,
        sentThrough: null,
        recipientName: null
      }, req);
    }
    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    await file.deleteOne();
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Search files
// @route   GET /api/files/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q, department } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    const query = {
      $or: [
        { code: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { requisitioner: { $regex: q, $options: 'i' } }
      ]
    };
    if (department) query.department = department;
    const files = await File.find(query);
    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    console.error('Search files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Release file to user
// @route   PATCH /api/files/:id/release
// @access  Private
router.patch('/:id/release', protect, [
  body('assignedTo').notEmpty().withMessage('Assigned to is required'),
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

    const { assignedTo, remarks } = req.body;
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if user has permission to release this file
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.department !== file.department)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to release files for this department'
      });
    }

    // Update file status and assignment
    file.status = 'Released';
    file.currentHolder = assignedTo;
    file.assignedTo = assignedTo;
    await file.save();

    // Add movement
    try {
      await createMovement(file.code, {
        user: req.user.name,
        action: 'Released',
        remarks: remarks || `File released to ${assignedTo}`,
        icon: '📤',
        sentBy: req.user.name,
        sentThrough: 'Direct Release',
        recipientName: assignedTo
      }, req);
    } catch (movementError) {
      console.error('Error creating movement:', movementError);
      // Don't fail the request if movement creation fails
    }

    // Send email notification to the assigned user
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      try {
        const assignedUser = await User.findOne({ name: assignedTo });
        if (assignedUser) {
          await sendFileReleasedNotification(assignedUser.email, file, {
            assignedTo: assignedTo,
            releasedBy: req.user.name,
            remarks: remarks || `Released to ${assignedTo}`
          });
        } else {
          console.log('Assigned user not found:', assignedTo);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      data: file,
      message: `File released to ${assignedTo}`
    });
  } catch (error) {
    console.error('Release file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get all files for Received Files page (no department restrictions)
// @route   GET /api/files/received/all
// @access  Private (Admin/Superadmin)
router.get('/received/all', protect, async (req, res) => {
  try {
    console.log('Get all files for Received Files called by user:', req.user.name, 'role:', req.user.role);
    
    // Only allow admins and superadmins to see all files
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view all files'
      });
    }

    // Get all files except created ones
    const files = await File.find({ status: { $ne: 'Created' } });
    
    console.log('Get all files for Received Files - Total files:', files.length);
    if (files.length > 0) {
      console.log('Sample files:', files.slice(0, 3).map(f => ({ 
        code: f.code, 
        title: f.title, 
        department: f.department,
        status: f.status,
        currentHolder: f.currentHolder 
      })));
    }
    
    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    console.error('Get all files for Received Files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get files created by user
// @route   GET /api/files/creator/:creatorName
// @access  Private
router.get('/creator/:creatorName', protect, async (req, res) => {
  try {
    const { creatorName } = req.params;
    console.log('Get creator files called for:', creatorName);
    console.log('Request user:', req.user.name, 'role:', req.user.role);
    
    // Check authorization
    if (req.user.name !== creatorName && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      console.log('Authorization failed');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these files'
      });
    }
    
    // If admin, only show files from their department
    let query = {
      $or: [
        { createdBy: creatorName },
        { requisitioner: creatorName }
      ]
    };
    
    if (req.user.role === 'admin' && req.user.name !== creatorName) {
      query.department = req.user.department;
    }
    
    console.log('Query:', JSON.stringify(query));
    const files = await File.find(query);
    console.log('Found files:', files.length);
    console.log('Sample file:', files[0]);
    
    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    console.error('Get creator files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get files by user (for received files)
// @route   GET /api/files/user/:userId
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    let query = {};
    
    // If requesting user's own files
    if (req.user.name === userId || req.user._id.toString() === userId) {
      query.$or = [
        { currentHolder: req.user.name },
        { assignedTo: req.user.name }
      ];
    } else if (req.user.role === 'admin') {
      // Admin can see files in their department
      query.department = req.user.department;
    } else if (req.user.role === 'superadmin') {
      // Superadmin can see all files
    } else {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these files'
      });
    }
    
    if (status) {
      // Handle comma-separated status values
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim());
        query.status = { $in: statusArray };
      } else {
        query.status = status;
      }
    }
    
    const files = await File.find(query);
    
    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 